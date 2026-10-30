import "server-only";

/**
 * Klien REST API WordPress (wp/v2) — satu-satunya tempat yang bicara HTTP
 * ke theglobal-review.com. Seluruh pemanggil menerima data mentah bertipe
 * WpPost/WpCategory/WpUser; pemetaan ke bentuk FE ada di map.ts.
 */

/** WAF host menolak User-Agent curl/*; pakai UA deskriptif sendiri. */
const USER_AGENT = "TGR-Frontend/1.0 (Next.js; +https://theglobal-review.com)";

const TIMEOUT_MS = 15000;

/**
 * Host membatasi burst: render satu halaman bisa menembakkan belasan
 * request serentak dan berbuah 503/timeout. Semafor kecil menjaga paling
 * banyak N request WP berjalan bersamaan; sisanya antre.
 */
const MAX_CONCURRENT = 4;
/**
 * Batas menunggu slot. Tanpa batas, saat WP lambat atau tak terjangkau
 * antrean menumpuk sampai Railway memutus permintaan di detik ke-300
 * (insiden 29 Okt 2026: p90 298 dtk). Halaman galat lebih baik daripada
 * layar kosong lima menit.
 */
const ANTRE_MAKS_MS = 10000;
let activeRequests = 0;
const requestQueue: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const masuk = () => {
      clearTimeout(batas);
      resolve();
    };
    const batas = setTimeout(() => {
      const i = requestQueue.indexOf(masuk);
      if (i >= 0) requestQueue.splice(i, 1);
      reject(new Error(`Menunggu antrean WordPress lebih dari ${ANTRE_MAKS_MS / 1000} dtk`));
    }, ANTRE_MAKS_MS);
    requestQueue.push(masuk);
  });
}

function releaseSlot(): void {
  const next = requestQueue.shift();
  if (next) next();
  else activeRequests--;
}

/**
 * Pemutus (circuit breaker). Galat transport — WP tidak menjawab sama sekali:
 * connect timeout, koneksi ditolak, DNS — berarti host tak terjangkau, bukan
 * satu endpoint yang lambat. Firewall host pernah men-DROP IP egress Railway
 * berjam-jam (23 dan 29 Okt 2026), dan selama itu setiap panggilan butuh
 * 10 dtk hanya untuk gagal. Setelah satu gelombang penuh slot gagal tanpa
 * satu jawaban pun, panggilan berikutnya langsung ditolak selama jeda:
 * data basi di cache tetap tersaji (revalidasi latar gagal cepat), halaman
 * dingin mendapat halaman galat seketika, dan host tidak dihujani SYN.
 * Lewat jeda, satu permintaan uji dilepas; begitu ada jawaban, tertutup lagi.
 */
const PEMUTUS_AMBANG = MAX_CONCURRENT;
const PEMUTUS_JEDA_MS = 30000;
let galatBeruntun = 0;
let terbukaSampai = 0;
let ujiBerjalan = false;

function izinPemutus(): "lewat" | "uji" | "tolak" {
  if (galatBeruntun < PEMUTUS_AMBANG) return "lewat";
  if (Date.now() < terbukaSampai || ujiBerjalan) return "tolak";
  ujiBerjalan = true;
  return "uji";
}

function catatTerjangkau(): void {
  if (galatBeruntun >= PEMUTUS_AMBANG) {
    console.warn("[wp] WordPress terjangkau lagi, pemutus tertutup");
  }
  galatBeruntun = 0;
}

function catatTakTerjangkau(): void {
  galatBeruntun++;
  if (galatBeruntun < PEMUTUS_AMBANG) return;
  if (Date.now() >= terbukaSampai) {
    console.error(
      `[wp] pemutus terbuka ${PEMUTUS_JEDA_MS / 1000} dtk setelah ${galatBeruntun} galat transport beruntun`
    );
  }
  terbukaSampai = Date.now() + PEMUTUS_JEDA_MS;
}

function galatPemutus(url: string): Error {
  return new Error(
    `WP tidak terjangkau, pemutus terbuka (${galatBeruntun} galat transport beruntun): ${url}`
  );
}

export interface WpRendered {
  rendered: string;
}

export interface WpMedia {
  source_url?: string;
  alt_text?: string;
  media_details?: {
    sizes?: Record<string, { source_url: string }>;
  };
}

export interface WpTerm {
  id: number;
  slug: string;
  name: string;
  taxonomy: string;
}

export interface WpPost {
  id: number;
  slug: string;
  /** Waktu situs (Asia/Jakarta), format "2026-08-13T08:59:16". */
  date: string;
  sticky?: boolean;
  author: number;
  title: WpRendered;
  excerpt?: WpRendered;
  content?: WpRendered;
  /** tgr_sorotan baru terisi setelah mu-plugin tgr-headless.php terpasang. */
  meta?: { tgr_sorotan?: string; [key: string]: unknown };
  /** ID attachment & term — dipakai mode daftar (tanpa _embed yang berat). */
  featured_media?: number;
  categories?: number[];
  /**
   * URL gambar unggulan yang dihitung sisi PHP (mu-plugin ≥3.3) — tetap
   * terisi walau lampirannya tersembunyi dari REST anonim (induknya pos
   * non-publik, kelas 401 rest_forbidden). Hanya hadir bila diminta lewat
   * _fields; null bila pos tak bergambar.
   */
  tgr_gambar?: string | null;
  _embedded?: {
    "wp:featuredmedia"?: WpMedia[];
    /** Indeks 0 = taksonomi category, 1 = post_tag. */
    "wp:term"?: WpTerm[][];
  };
}

/** Bentuk ringkas /media?_fields=id,source_url,media_details.sizes.large… */
export interface WpMediaLite {
  id: number;
  source_url?: string;
  media_details?: { sizes?: { large?: { source_url?: string } } };
}

export interface WpCategory {
  id: number;
  slug: string;
  name: string;
  parent: number;
  count: number;
}

export interface WpUser {
  id: number;
  slug: string;
  name: string;
}

export interface WpFetchOptions {
  query?: Record<string, string | number | boolean | undefined>;
  /** Jendela ISR (detik) untuk fetch ini. */
  revalidate: number;
  /** Tag cache untuk revalidasi on-demand (webhook /api/revalidate). */
  tags: string[];
  timeoutMs?: number;
}

/**
 * Akar REST WordPress tanpa garis miring ujung, atau null bila belum diatur.
 * Juga dipakai rute tgr/v1 (vote/contact/subscribe) — sebelumnya mereka
 * menginterpolasi env mentah, dan nilai berujung "/" mematikan ketiga
 * endpoint tulis (404 //tgr/v1/…) sementara jalur baca tetap hidup.
 */
export function wpApiBase(): string | null {
  const base = process.env.WP_API_URL;
  return base ? base.replace(/\/+$/, "") : null;
}

function apiBase(): string {
  const base = wpApiBase();
  if (!base) {
    throw new Error(
      "WP_API_URL belum diatur. Salin .env.example ke .env.local (lokal) " +
        "atau tambahkan di variabel service Railway (docs/hosting-railway.md)."
    );
  }
  return base;
}

function buildUrl(path: string, query?: WpFetchOptions["query"]): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return `${apiBase()}/wp/v2${path}${qs ? `?${qs}` : ""}`;
}

/** Jeda sebelum mengulang; ulang seketika justru memperparah rate-limit host. */
const RETRY_DELAY_MS = 700;

/**
 * Selalu lempar Error polos yang baru. DOMException (mis. TimeoutError dari
 * AbortSignal) punya properti message read-only — bila dilempar apa adanya,
 * lapisan cache Next tersandung "Cannot set property message" dan galat
 * aslinya tertutupi.
 */
function toError(err: unknown, url: string): Error {
  if (err instanceof DOMException && err.name === "TimeoutError") {
    return new Error(`WP tidak menjawab dalam batas waktu: ${url}`);
  }
  const detail = err instanceof Error ? err.message : String(err);
  return new Error(`Gagal menghubungi WordPress (${url}): ${detail}${kodeSebab(err)}`);
}

/**
 * undici hanya bilang "fetch failed"; sebab sebenarnya ada di err.cause.
 * Kodenya yang membedakan IP egress diblok firewall host (connect timeout,
 * SYN tak dibalas) dari WP yang menolak atau DNS yang gagal — insiden
 * 23 Okt 2026 sempat terbaca sebagai "WP lambat" karena kode ini tak tercatat.
 */
export function kodeSebab(err: unknown): string {
  const cause = err instanceof Error ? (err.cause as { code?: unknown; message?: unknown } | undefined) : undefined;
  if (!cause) return "";
  const kode = typeof cause.code === "string" ? cause.code : undefined;
  const pesan = typeof cause.message === "string" ? cause.message : undefined;
  const isi = kode ?? pesan;
  return isi ? ` [${isi}]` : "";
}

/**
 * Timeout tidak diulang: 10–20 dtk menunggu sudah habis, dan ulangan hanya
 * menggandakannya sambil tetap memegang slot. Ulangan disisakan untuk galat
 * cepat (koneksi diputus, 503 burst) yang memang sering lolos di percobaan
 * kedua.
 */
function galatTimeout(err: unknown): boolean {
  if (err instanceof DOMException && err.name === "TimeoutError") return true;
  const kode = err instanceof Error ? (err.cause as { code?: unknown } | undefined)?.code : undefined;
  return kode === "UND_ERR_CONNECT_TIMEOUT" || kode === "UND_ERR_HEADERS_TIMEOUT";
}

async function kirim(url: string, timeoutMs: number, init: RequestInit): Promise<Response> {
  const izin = izinPemutus();
  if (izin === "tolak") throw galatPemutus(url);
  let lastError: Error | undefined;
  let dapatSlot = false;

  try {
    await acquireSlot();
    dapatSlot = true;
    // Satu kali ulang untuk galat jaringan / 5xx; 4xx langsung dianggap final.
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      // Pemutus bisa terbuka selama permintaan ini mengantre atau menunggu ulang.
      if (izin === "lewat" && galatBeruntun >= PEMUTUS_AMBANG) throw galatPemutus(url);
      try {
        const res = await fetch(url, {
          ...init,
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(timeoutMs),
        });
        catatTerjangkau();
        if (res.ok || res.status < 500) return res;
        lastError = new Error(`WP menjawab ${res.status} untuk ${url}`);
      } catch (err) {
        catatTakTerjangkau();
        lastError = toError(err, url);
        if (izin === "uji" || galatTimeout(err)) break;
      }
    }
  } finally {
    if (dapatSlot) releaseSlot();
    if (izin === "uji") ujiBerjalan = false;
  }
  throw lastError ?? new Error(`Gagal menghubungi WordPress: ${url}`);
}

async function request(path: string, opts: WpFetchOptions): Promise<Response> {
  return kirim(buildUrl(path, opts.query), opts.timeoutMs ?? TIMEOUT_MS, {
    next: { revalidate: opts.revalidate, tags: opts.tags },
  });
}

/** GET wp/v2; melempar Error pada galat transport/HTTP agar tidak meracuni cache. */
export async function wpFetch<T>(path: string, opts: WpFetchOptions): Promise<T> {
  const res = await request(path, opts);
  if (!res.ok) throw new Error(`WP menjawab ${res.status} untuk ${path}`);
  return (await res.json()) as T;
}

/** Seperti wpFetch, plus total koleksi dari header X-WP-Total. */
export async function wpFetchWithTotal<T>(
  path: string,
  opts: WpFetchOptions
): Promise<{ data: T; total: number }> {
  const res = await request(path, opts);
  if (!res.ok) throw new Error(`WP menjawab ${res.status} untuk ${path}`);
  const total = Number(res.headers.get("x-wp-total") ?? 0);
  return { data: (await res.json()) as T, total };
}

/* ── Varian tanpa cache fetch ──────────────────────────────────────────
   Respons daftar 100 post bisa 4–8 MB — melewati batas 2 MB per item
   data-cache Next, sehingga tidak akan pernah ter-cache. Pemanggil
   membungkusnya dengan unstable_cache dan menyimpan HASIL PEMETAAN yang
   ringan (Article tanpa body), bukan respons mentahnya. */

export interface WpFreshOptions {
  query?: WpFetchOptions["query"];
  timeoutMs?: number;
}

async function requestFresh(path: string, opts: WpFreshOptions): Promise<Response> {
  return kirim(buildUrl(path, opts.query), opts.timeoutMs ?? TIMEOUT_MS, {
    cache: "no-store",
  });
}

export async function wpFetchFresh<T>(
  path: string,
  opts: WpFreshOptions = {}
): Promise<T> {
  const res = await requestFresh(path, opts);
  if (!res.ok) throw new Error(`WP menjawab ${res.status} untuk ${path}`);
  return (await res.json()) as T;
}

export async function wpFetchFreshWithTotal<T>(
  path: string,
  opts: WpFreshOptions = {}
): Promise<{ data: T; total: number }> {
  const res = await requestFresh(path, opts);
  if (!res.ok) throw new Error(`WP menjawab ${res.status} untuk ${path}`);
  const total = Number(res.headers.get("x-wp-total") ?? 0);
  return { data: (await res.json()) as T, total };
}

/** Batas keras WordPress untuk per_page pada endpoint koleksi. */
export const WP_MAX_PER_PAGE = 100;

/**
 * Seluruh isi sebuah koleksi, halaman demi halaman. Tanpa ini, permintaan
 * ber-per_page 100 terpotong DIAM-DIAM di item ke-101 — konten yang tayang
 * normal di wp-admin sekadar lenyap dari situs. Berhenti pada halaman
 * pertama yang tidak penuh; maxPages hanya rem darurat agar salah paham
 * parameter tidak berubah jadi permintaan tak berujung ke host yang
 * membatasi burst (500 item jauh di atas skala Podcast/Galeri/Poll).
 */
export async function wpFetchAllFresh<T>(
  path: string,
  opts: WpFreshOptions & { maxPages?: number } = {}
): Promise<T[]> {
  const { maxPages = 5, query, ...rest } = opts;
  const all: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const batch = await wpFetchFresh<T[]>(path, {
      ...rest,
      query: { ...query, per_page: WP_MAX_PER_PAGE, page },
    });
    all.push(...batch);
    if (batch.length < WP_MAX_PER_PAGE) break;
  }
  return all;
}

/**
 * Ambil banyak item sekaligus lewat ?include=, dipotong per 100 ID karena
 * include tetap tunduk pada per_page — 108 ID dalam satu permintaan hanya
 * mengembalikan 100 item, tanpa galat.
 */
export async function wpFetchByIdsFresh<T>(
  path: string,
  ids: number[],
  opts: WpFreshOptions = {}
): Promise<T[]> {
  const unik = [...new Set(ids)].filter((id) => id > 0);
  if (unik.length === 0) return [];

  const potongan: number[][] = [];
  for (let i = 0; i < unik.length; i += WP_MAX_PER_PAGE) {
    potongan.push(unik.slice(i, i + WP_MAX_PER_PAGE));
  }
  // Berurutan, bukan paralel: semafor host hanya punya 4 slot dan
  // pemanggilnya kerap sudah mengantre permintaan lain.
  const hasil: T[] = [];
  for (const bagian of potongan) {
    hasil.push(
      ...(await wpFetchFresh<T[]>(path, {
        ...opts,
        query: {
          ...opts.query,
          include: bagian.join(","),
          per_page: WP_MAX_PER_PAGE,
        },
      }))
    );
  }
  return hasil;
}

/**
 * Dedup in-flight: unstable_cache tidak menyatukan dua pembangunan kunci
 * yang sama yang berjalan bersamaan (mis. byCategory + adjacentArticles
 * pada render yang sama saat cache dingin, atau generateMetadata yang
 * berjalan paralel dengan komponen halaman sejak streaming metadata).
 */
const inflight = new Map<string, Promise<unknown>>();
export function dedup<T>(key: string, run: () => Promise<T>): Promise<T> {
  const hit = inflight.get(key);
  if (hit) return hit as Promise<T>;
  const p = run().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
