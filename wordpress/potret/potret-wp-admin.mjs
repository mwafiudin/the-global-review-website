/**
 * Memotret layar wp-admin untuk docs/panduan-redaksi.md.
 *
 * Panduan redaksi seluruhnya berbicara tentang layar — "kotak di sisi
 * kanan", "Terbitkan → Visibilitas → Sunting" — sementara pembacanya tidak
 * hafal peta wp-admin. Gambar menutup jarak itu. Yang dipotret dijadikan
 * skrip, bukan pekerjaan tangan, supaya bisa diulang persis setelah inti
 * WordPress naik versi dan tampilannya bergeser.
 *
 * Kata sandi wp-admin tidak pernah disentuh skrip ini. Sekali di awal:
 *
 *   node wordpress/potret/potret-wp-admin.mjs --login
 *
 * membuka peramban kasatmata di halaman login; Anda yang mengetik, skrip
 * menunggu dasbor muncul lalu menyimpan sesinya ke .sesi.json (di-gitignore).
 * Jalan berikutnya tinggal:
 *
 *   node wordpress/potret/potret-wp-admin.mjs
 *   node wordpress/potret/potret-wp-admin.mjs --hanya=sorotan-judul
 *   node wordpress/potret/potret-wp-admin.mjs --jajak=123
 *   node wordpress/potret/potret-wp-admin.mjs --uji-terbit
 *
 * --uji-terbit membuat SATU tulisan uji di produksi, memancing peringatan
 * merah "Sorotan Judul wajib", lalu menghapusnya permanen. Tanpa flag itu,
 * skrip ini tidak pernah menulis apa pun ke WordPress.
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { AKAR_API, AGEN_HTTP } from "../rest/wp.mjs";
import { LAYAR, LAYAR_MENULIS } from "./layar.mjs";

const DI_SINI = dirname(fileURLToPath(import.meta.url));
const AKAR = join(DI_SINI, "..", "..");
const KELUARAN = join(AKAR, "docs", "gambar");
const SESI = join(DI_SINI, ".sesi.json");

/** Asal situs diturunkan dari WP_API_URL: …/wp-json → …/wp-admin/ */
const ASAL = AKAR_API.replace(/\/wp-json\/?$/, "");
const ADMIN = `${ASAL}/wp-admin/`;

/** Lebar tetap supaya potongan gambar tidak bergeser antar-jalan. */
const VIEWPORT = { width: 1440, height: 900 };

/** Host membatasi burst; jeda antar-halaman menghindari 503. */
const JEDA_MS = 700;

const argv = process.argv.slice(2);
const flag = (nama) => argv.includes(`--${nama}`);
const opsi = (nama) => {
  const cocok = argv.find((a) => a.startsWith(`--${nama}=`));
  return cocok ? cocok.slice(nama.length + 3) : null;
};

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── Pemuatan Playwright ─────────────────────────────────────────────── */

async function muatPlaywright() {
  try {
    return await import("playwright");
  } catch {
    // Sengaja tidak masuk devDependencies: paket ini mengunduh browser saat
    // postinstall, sedangkan CI menjalankan npm ci pada tiap push. Alat yang
    // dipakai beberapa kali setahun tidak layak dibebankan ke sana.
    throw new Error(
      "Playwright belum terpasang. Jalankan sekali:\n" +
        "  npm install --no-save playwright\n" +
        "  npx playwright install chromium"
    );
  }
}

/* ── Sesi login ──────────────────────────────────────────────────────── */

async function simpanSesi(chromium) {
  let browser;
  try {
    browser = await chromium.launch({ headless: false });
  } catch (galat) {
    // Proses yang dijalankan dari sesi agen (Claude Code) tidak punya desktop
    // session, jadi peluncuran kasatmata mati dengan "spawn UNKNOWN" yang
    // tidak menjelaskan apa pun. Headless tetap jalan — hanya langkah login
    // ini yang butuh jendela sungguhan.
    if (/spawn UNKNOWN|Target page.*closed|Failed to launch/i.test(galat.message)) {
      throw new Error(
        "Tidak bisa membuka jendela peramban dari sesi ini.\n\n" +
          "Langkah login harus dijalankan di terminal Anda sendiri (PowerShell\n" +
          "atau terminal VSCode), dari folder repo:\n\n" +
          "  npm run potret -- --login\n\n" +
          "Setelah sesi tersimpan, sisa pemotretan berjalan headless dan boleh\n" +
          "dijalankan dari mana saja."
      );
    }
    throw galat;
  }
  const ctx = await browser.newContext({ viewport: VIEWPORT, userAgent: AGEN_HTTP });
  const page = await ctx.newPage();
  await page.goto(`${ASAL}/wp-login.php`, { waitUntil: "domcontentloaded" });

  console.log("\nSilakan login di jendela peramban yang terbuka.");
  console.log("Skrip menunggu sampai dasbor wp-admin muncul (maksimal 5 menit).\n");

  // Menunggu bilah admin, bukan URL: alur login bisa lewat 2FA atau
  // pengalihan, dan bilah itu satu-satunya penanda bahwa sesi sudah jadi.
  await page.waitForSelector("#wpadminbar", { timeout: 5 * 60 * 1000 });
  await ctx.storageState({ path: SESI });
  await browser.close();
  console.log(`Sesi tersimpan di ${SESI} (sudah di-gitignore).`);
}

/* ── Penunjuk bernomor ───────────────────────────────────────────────── */

/**
 * Lingkaran merah bernomor ditempel langsung di halaman sebelum dipotret.
 * Menggambarnya di sini, bukan menyusun ulang gambar sesudahnya, membuat
 * seluruh pekerjaan selesai dengan satu jepretan dan tanpa pustaka
 * pengolah gambar sama sekali.
 */
async function tempelPenunjuk(page, penunjuk) {
  await page.evaluate((daftar) => {
    const gaya = document.createElement("style");
    gaya.textContent = `
      .tgr-penunjuk {
        position: absolute; z-index: 99999;
        width: 26px; height: 26px; border-radius: 50%;
        background: #b3261e; color: #fff;
        font: 700 15px/26px -apple-system, "Segoe UI", sans-serif;
        text-align: center; box-shadow: 0 0 0 3px rgba(255,255,255,.95);
      }`;
    document.head.appendChild(gaya);
    for (const { sel, nomor } of daftar) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const tanda = document.createElement("div");
      tanda.className = "tgr-penunjuk";
      tanda.textContent = String(nomor);
      tanda.style.left = `${r.left + window.scrollX - 13}px`;
      tanda.style.top = `${r.top + window.scrollY - 13}px`;
      document.body.appendChild(tanda);
    }
  }, penunjuk);
}

/** Ganti isi elemen dengan teks contoh — data pribadi tidak pernah dipotret. */
async function samarkan(page, samar) {
  const terganti = await page.evaluate((daftar) => {
    let n = 0;
    for (const { sel, teks } of daftar) {
      for (const el of document.querySelectorAll(sel)) {
        // Judul di daftar berupa tautan; teksnya diganti, tautannya dibiarkan
        // supaya barisnya tetap terlihat sebagaimana aslinya.
        const sasaran = el.querySelector("a.row-title") || el;
        sasaran.textContent = teks;
        n++;
      }
    }
    return n;
  }, samar);
  return terganti;
}

/* ── Tulisan uji sekali pakai ────────────────────────────────────────── */

async function buatPosUji(page) {
  const judul = "Uji gerbang sorotan — hapus saja";
  await page.goto(`${ADMIN}post-new.php`, { waitUntil: "domcontentloaded" });
  await page.fill("#title", judul);
  await page.click("#save-post");
  await page.waitForSelector("#post_ID", { state: "attached" });
  const id = await page.getAttribute("#post_ID", "value");
  console.log(`  tulisan uji dibuat: id ${id}`);
  return id;
}

async function hapusPosUji(page, id) {
  await page.goto(`${ADMIN}edit.php?post_status=draft`, { waitUntil: "domcontentloaded" });
  // Lewat layar sampah, bukan REST: sesi ini punya cookie, bukan
  // Application Password, dan menghapus lewat UI meninggalkan jejak yang
  // sama seperti bila dikerjakan tangan.
  await page.goto(`${ADMIN}post.php?post=${id}&action=trash&_wpnonce=${await nonceHapus(page, id)}`, {
    waitUntil: "domcontentloaded",
  });
  console.log(`  tulisan uji ${id} dibuang ke Tong Sampah — hapus permanen dari sana bila sudah puas.`);
}

async function nonceHapus(page, id) {
  await page.goto(`${ADMIN}post.php?post=${id}&action=edit`, { waitUntil: "domcontentloaded" });
  const href = await page.getAttribute("#delete-action a", "href");
  const cocok = href && href.match(/_wpnonce=([^&]+)/);
  if (!cocok) throw new Error("Tidak menemukan nonce hapus untuk tulisan uji.");
  return cocok[1];
}

/* ── Konteks: id contoh yang dipakai beberapa layar ──────────────────── */

async function susunKonteks() {
  const ambil = async (path) => {
    const res = await fetch(`${AKAR_API}${path}`, { headers: { "User-Agent": AGEN_HTTP } });
    if (!res.ok) throw new Error(`REST ${path} → ${res.status}`);
    return res.json();
  };

  // Contoh tulisan dipilih deterministik — tulisan tayang ber-ID terkecil
  // yang sudah punya sorotan — supaya dua kali jalan menghasilkan gambar
  // yang sama persis.
  const posts = await ambil("/wp/v2/posts?per_page=100&orderby=id&order=asc&_fields=id,meta");
  const pos = posts.find((p) => String(p.meta?.tgr_sorotan || "").trim())?.id ?? posts[0]?.id;
  if (!pos) throw new Error("Tidak menemukan satu pun tulisan tayang untuk dijadikan contoh.");

  const orangs = await ambil("/wp/v2/orang?per_page=1&orderby=id&order=asc&_fields=id");
  const orang = orangs[0]?.id;
  if (!orang) throw new Error("Belum ada entri Pengurus & Redaksi untuk dipotret.");

  return {
    pos,
    orang,
    laman: 574, // "Tentang The Global Review" — slug-nya tertukar, ID yang dipegang
    jajak: opsi("jajak"),
    posUji: null,
  };
}

/* ── Potret satu layar ───────────────────────────────────────────────── */

async function potret(page, layar, ctx) {
  await page.goto(ADMIN + layar.url(ctx), { waitUntil: "domcontentloaded" });
  await page.waitForSelector(layar.tunggu, { timeout: 20000 });

  for (const aksi of layar.aksi ?? []) {
    if (aksi.endsWith("::kosongkan")) {
      await page.fill(aksi.replace("::kosongkan", ""), "");
      continue;
    }
    await page.click(aksi);
  }
  if (layar.aksi?.length) await page.waitForLoadState("domcontentloaded");
  if (layar.rapikan) await page.addStyleTag({ content: layar.rapikan });
  if (layar.samar?.length) {
    const n = await samarkan(page, layar.samar);
    if (!n) throw new Error(`Selector penyamaran tidak menemukan apa pun di "${layar.nama}" — potret dibatalkan demi keamanan data.`);
  }
  if (layar.penunjuk?.length) await tempelPenunjuk(page, layar.penunjuk);

  const berkas = join(KELUARAN, `wp-${layar.nama}.png`);
  const sasaran = layar.potong ? page.locator(layar.potong).first() : page;
  if (layar.potong) await sasaran.scrollIntoViewIfNeeded();
  await sasaran.screenshot({ path: berkas, animations: "disabled" });
  return berkas;
}

/* ── Jalan utama ─────────────────────────────────────────────────────── */

/* ── Pemeriksa tautan gambar ─────────────────────────────────────────── */

/**
 * Menyandingkan gambar yang ditautkan panduan dengan berkas yang benar-benar
 * ada. Dua arah, karena dua-duanya luput dari mata: tautan ke berkas yang
 * belum dipotret, dan PNG yatim yang tak lagi dirujuk siapa pun.
 */
async function periksaGambar() {
  const panduan = join(AKAR, "docs", "panduan-redaksi.md");
  const isi = await readFile(panduan, "utf8");
  const ditautkan = [...isi.matchAll(/!\[[^\]]*\]\(gambar\/([^)]+)\)/g)].map((m) => m[1]);

  let ada = [];
  try {
    const { readdir } = await import("node:fs/promises");
    ada = (await readdir(KELUARAN)).filter((f) => f.endsWith(".png"));
  } catch {
    /* folder belum ada */
  }

  const hilang = [...new Set(ditautkan)].filter((f) => !ada.includes(f)).sort();
  const yatim = ada.filter((f) => !ditautkan.includes(f)).sort();

  console.log(`Ditautkan panduan : ${new Set(ditautkan).size}`);
  console.log(`Ada di docs/gambar: ${ada.length}`);
  for (const f of hilang) console.log(`  belum dipotret : gambar/${f}`);
  for (const f of yatim) console.log(`  yatim          : gambar/${f}`);

  if (hilang.length) {
    console.log("\nJalankan `npm run potret` untuk mengisi yang belum ada.");
  }
  return hilang.length === 0 && yatim.length === 0;
}

async function utama() {
  if (flag("periksa")) {
    const bersih = await periksaGambar();
    process.exitCode = bersih ? 0 : 1;
    return;
  }

  const { chromium } = await muatPlaywright();

  if (flag("login")) {
    await simpanSesi(chromium);
    return;
  }
  if (!existsSync(SESI)) {
    throw new Error(
      "Belum ada sesi login. Jalankan sekali:\n" +
        "  node wordpress/potret/potret-wp-admin.mjs --login"
    );
  }

  await mkdir(KELUARAN, { recursive: true });
  const ctx = await susunKonteks();
  const hanya = opsi("hanya");
  const ujiTerbit = flag("uji-terbit");

  const antre = LAYAR.filter((l) => {
    if (hanya) return l.nama === hanya;
    if (l.perlu === "uji-terbit") return ujiTerbit;
    if (l.perlu === "jajak") return Boolean(ctx.jajak);
    return true;
  });

  const dilewati = LAYAR.filter((l) => !antre.includes(l));
  const browser = await chromium.launch();
  const konteks = await browser.newContext({
    storageState: SESI,
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    userAgent: AGEN_HTTP,
  });
  const page = await konteks.newPage();

  // Sesi kedaluwarsa hanya ketahuan saat halaman pertama dibuka; memeriksanya
  // di depan jauh lebih murah daripada 18 jepretan halaman login.
  await page.goto(ADMIN, { waitUntil: "domcontentloaded" });
  if (!(await page.locator("#wpadminbar").count())) {
    await browser.close();
    throw new Error("Sesi tersimpan sudah kedaluwarsa. Jalankan ulang dengan --login.");
  }

  if (ujiTerbit) {
    ctx.posUji = await buatPosUji(page);
  }

  const jadi = [];
  for (const layar of antre) {
    try {
      const berkas = await potret(page, layar, ctx);
      jadi.push(layar.nama);
      console.log(`✓ ${layar.nama.padEnd(32)} ${layar.keterangan}`);
      if (LAYAR_MENULIS.has(layar.nama)) console.log("   (layar ini menyentuh tulisan uji)");
      void berkas;
    } catch (galat) {
      console.error(`✗ ${layar.nama.padEnd(32)} ${galat.message}`);
    }
    await tidur(JEDA_MS);
  }

  if (ctx.posUji) await hapusPosUji(page, ctx.posUji);
  await browser.close();

  console.log(`\n${jadi.length}/${antre.length} gambar tersimpan di docs/gambar/`);
  for (const l of dilewati) {
    console.log(`- dilewati: ${l.nama} (butuh --${l.perlu})`);
  }
  await tulisManifes(jadi);
}

/**
 * Manifes dipakai pemeriksa tautan di docs: gambar yatim dan tautan yang
 * menunjuk berkas tak ada sama-sama luput dari mata saat menyunting markdown.
 */
async function tulisManifes(nama) {
  const berkas = join(KELUARAN, "manifes.json");
  let lama = [];
  try {
    lama = JSON.parse(await readFile(berkas, "utf8")).gambar ?? [];
  } catch {
    /* belum ada manifes */
  }
  const gabung = [...new Set([...lama, ...nama.map((n) => `wp-${n}.png`)])].sort();
  await writeFile(berkas, JSON.stringify({ gambar: gabung }, null, 2) + "\n");
}

utama().catch((galat) => {
  console.error(`\n${galat.message}\n`);
  process.exit(1);
});
