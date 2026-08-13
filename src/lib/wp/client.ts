import "server-only";

/**
 * Klien REST API WordPress (wp/v2) — satu-satunya tempat yang bicara HTTP
 * ke theglobal-review.com. Seluruh pemanggil menerima data mentah bertipe
 * WpPost/WpCategory/WpUser; pemetaan ke bentuk FE ada di map.ts.
 */

/** WAF host menolak User-Agent curl/*; pakai UA deskriptif sendiri. */
const USER_AGENT = "TGR-Frontend/1.0 (Next.js; +https://the-global-review-website.vercel.app)";

const TIMEOUT_MS = 15000;

/**
 * Host membatasi burst: render satu halaman bisa menembakkan belasan
 * request serentak dan berbuah 503/timeout. Semafor kecil menjaga paling
 * banyak N request WP berjalan bersamaan; sisanya antre.
 */
const MAX_CONCURRENT = 4;
let activeRequests = 0;
const requestQueue: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return;
  }
  await new Promise<void>((resolve) => requestQueue.push(resolve));
}

function releaseSlot(): void {
  const next = requestQueue.shift();
  if (next) next();
  else activeRequests--;
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

function apiBase(): string {
  const base = process.env.WP_API_URL;
  if (!base) {
    throw new Error(
      "WP_API_URL belum diatur. Salin .env.example ke .env.local (lokal) " +
        "atau tambahkan di Vercel → Settings → Environment Variables."
    );
  }
  return base.replace(/\/+$/, "");
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
  return new Error(`Gagal menghubungi WordPress (${url}): ${detail}`);
}

async function request(path: string, opts: WpFetchOptions): Promise<Response> {
  const url = buildUrl(path, opts.query);
  const timeoutMs = opts.timeoutMs ?? TIMEOUT_MS;
  let lastError: Error | undefined;

  await acquireSlot();
  try {
    // Satu kali ulang untuk galat jaringan / 5xx; 4xx langsung dianggap final.
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(timeoutMs),
          next: { revalidate: opts.revalidate, tags: opts.tags },
        });
        if (res.ok || res.status < 500) return res;
        lastError = new Error(`WP menjawab ${res.status} untuk ${url}`);
      } catch (err) {
        lastError = toError(err, url);
      }
    }
  } finally {
    releaseSlot();
  }
  throw lastError ?? new Error(`Gagal menghubungi WordPress: ${url}`);
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
  const url = buildUrl(path, opts.query);
  const timeoutMs = opts.timeoutMs ?? TIMEOUT_MS;
  let lastError: Error | undefined;

  await acquireSlot();
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(timeoutMs),
          cache: "no-store",
        });
        if (res.ok || res.status < 500) return res;
        lastError = new Error(`WP menjawab ${res.status} untuk ${url}`);
      } catch (err) {
        lastError = toError(err, url);
      }
    }
  } finally {
    releaseSlot();
  }
  throw lastError ?? new Error(`Gagal menghubungi WordPress: ${url}`);
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
