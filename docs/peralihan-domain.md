# Peralihan domain ke situs baru

Runbook untuk memindahkan `theglobal-review.com` dari WordPress ke situs
Next.js di Vercel. Ditulis untuk dijalankan berurutan dalam satu duduk;
tiap tahap punya cara memastikan hasilnya sebelum lanjut, dan cara mundur
bila gagal.

---

## Status eksekusi — CUTOVER SELESAI 24 Agustus 2026

`theglobal-review.com` kini dilayani Vercel (A `@` → `216.198.79.1`,
`www` → CNAME `8db593f322ae9cff.vercel-dns-017.com`, keduanya primary
apex + www ber-308 ke apex). WordPress hidup di
`cms.theglobal-review.com`. Terverifikasi saat cutover: SSL terbit,
beranda + artikel + gambar + sitemap tayang di domain utama, REST cms
sehat, MX/mail/cms tak tersentuh. URL lama ber-garis-miring (`/slug/`)
di-308 sekali ke bentuk kanonis `/slug` oleh Next.js — by design.
TTL record baru 3600 (niat 300 tidak sempat terpasang) — rollback
propagasi ±1 jam. Sisa rapikan: blok indeks di cms, sitemap ke GSC,
pantau Usage Vercel (masih Hobby).

Riwayat: gladi 19 Agustus berhenti di ambang DNS, lalu dilanjutkan dan
dituntaskan 24 Agustus. Catatan gladi di bawah dipertahankan sebagai
konteks.

Persiapan yang dirampungkan saat gladi:

- **MX diperbaiki**: `mail.theglobal-review.com` kini A record sendiri
  dan MX menunjuk ke sana — email kebal terhadap perubahan apex.
  (Sebelumnya MX menunjuk ke apex; mengubah A record akan mematikan
  seluruh email masuk. Ranjau ini tidak tercatat di runbook awal.)
- **`cms.theglobal-review.com` sudah ada** (shared docroot, tercakup
  sertifikat wildcard host).
- **`WP_API_URL` di Vercel sudah menunjuk `cms`** dan situs vercel.app
  terverifikasi membaca artikel + gambar lewat alamat itu — REST WP
  tetap menjawab di hostname cms meski `WP_HOME` masih apex, karena
  canonical redirect hanya berlaku untuk permintaan template.
- Dua baris `WP_HOME`/`WP_SITEURL` di `wp-config.php` **ada tapi
  di-comment (`//`)** — tahap 2 tinggal menghapus komentarnya.
- `mu-plugins/tgr-alih-sementara.php.off` nonaktif (di-rename); beranda
  lama tidak dialihkan ke mana pun.

**Checklist hari-H** (± 1 jam, jam sepi):

1. Hapus `//` pada dua baris `WP_HOME`/`WP_SITEURL` di `wp-config.php`,
   lalu wp-admin (di `cms.`) → Permalink → Simpan. *(tahap 4 di bawah
   sudah beres — lewati bagian kode & env-nya)*
2. Pemilik akun Vercel: Settings → Domains → Add `theglobal-review.com`
   + `www.theglobal-review.com`; catat record yang diminta.
3. cPanel → Zone Editor: ubah A `@` dan CNAME `www` persis sesuai nilai
   dari Vercel. **Jangan sentuh** record `cms`, `mail`, MX, dan NS.
4. Verifikasi: domain utama tayang situs baru, artikel + gambar hidup,
   `cms.` tetap WordPress, kirim-terima email masih jalan.
5. Rapikan per tahap 5: cms dihalangi indeks, sitemap ke Search Console.

---

## 1. Kenapa bukan sekadar redirect

Godaan pertama adalah memasang redirect di cPanel: `theglobal-review.com`
dan turunannya diarahkan ke `the-global-review-website.vercel.app`. Tiga
alasan mengapa itu justru merusak.

**Domain lama bukan cuma situs lama — ia sumber datanya.** Situs baru
membaca `https://theglobal-review.com/wp-json` setiap kali menyegarkan
halaman. Wild Card Redirect ikut menangkap `/wp-json/`, `/wp-admin/`,
dan `/wp-content/uploads/`. Hasilnya berantai: situs baru kehilangan
seluruh artikel, redaksi tak bisa masuk wp-admin, dan semua gambar mati.

**301 ke `*.vercel.app` menyerahkan reputasi 5.683 URL ke alamat pinjaman.**
Domain `vercel.app` ada di Public Suffix List — Google memperlakukannya
sebagai situs milik pihak lain, bukan cabang dari domain kita. Peringkat
yang dibangun sejak 2008 dipindahkan ke alamat yang justru akan dibuang
saat peralihan sebenarnya. Redirect permanen juga disimpan peramban
nyaris selamanya, jadi pengunjung lama bisa tetap terlempar ke
`vercel.app` lama setelah domainnya dibereskan.

**Dan redirect itu tidak diperlukan.** Situs baru sudah memakai pola URL
yang sama persis dengan permalink WordPress (`/{slug}/`) — itulah alasan
route `/artikel/{slug}` dulu dipindahkan ke akar. Begitu domainnya
menunjuk ke Vercel, setiap URL yang sudah terindeks langsung dilayani
situs baru **tanpa satu pun aturan redirect**.

Jadi yang dikerjakan bukan "redirect ke Vercel", melainkan "pindahkan
domainnya ke Vercel, dan pindahkan WordPress ke subdomain".

Tujuan akhir:

| Alamat | Dilayani | Untuk siapa |
|---|---|---|
| `theglobal-review.com` | Vercel (situs baru) | pembaca |
| `cms.theglobal-review.com` | WordPress | redaksi + sumber data situs baru |

---

## 2. Prasyarat

Jangan mulai sebelum kelimanya beres.

1. **Project Vercel berada di akun yang dikendalikan klien.** Sekarang
   project ini ada di akun pribadi rekan. Mengarahkan domain klien ke
   akun pribadi orang lain berarti domain utama bergantung pada akun yang
   tidak dipegang klien. Pindahkan project-nya lebih dulu
   (Vercel → Project → Settings → Transfer).
2. **Paket Vercel.** Secara teknis custom domain jalan di paket Hobby,
   tapi Hobby dilarang untuk penggunaan komersial menurut ketentuan
   Vercel, dan kuotanya (bandwidth ±100 GB/bulan + batas transformasi
   gambar `next/image`) bisa jebol oleh satu kunjungan bot perayap ke
   ribuan artikel. **Keputusan Agustus 2026: jalan dulu di Hobby** dengan
   syarat: catat baseline di Project → Usage sebelum hari-H, pantau
   harian di minggu pertama, upgrade Pro begitu mendekati batas atau
   Vercel menegur. Bila kuota transformasi gambar yang jebol lebih dulu,
   tuas daruratnya di kode: sajikan ukuran gambar buatan WordPress
   (`unoptimized` pada `next/image`) — perubahan kecil, bisa dipasang
   cepat.
3. **Akses pengelola DNS.** Diperiksa Agustus 2026: nameserver menunjuk
   `ns1/ns2.webiihost.net`, jadi seluruh record dikelola di **cPanel →
   Zone Editor** — bukan di panel registrar.
4. **Backup penuh** basis data + `wp-content` lewat cPanel Backup Wizard.
5. **Google Search Console** aktif untuk domain ini, supaya dampaknya
   terpantau harian, bukan ditebak.

---

## 2b. Tahap 0 — selamatkan email (WAJIB sebelum DNS disentuh)

Temuan pemeriksaan DNS otoritatif (Agustus 2026) yang tidak tercakup
runbook versi awal — dua record email menunjuk ke **apex domain**:

| Record | Nilai sekarang | Nasib bila apex → Vercel |
|---|---|---|
| `@` MX 0 | `theglobal-review.com` | email masuk dikirim ke Vercel yang tidak punya mail server — **hilang, bukan bounce** |
| `mail` CNAME | `theglobal-review.com` | IMAP/SMTP klien email redaksi putus |

Email `@theglobal-review.com` aktif dipakai redaksi, jadi keduanya wajib
dilepas dari apex **sebelum** tahap 4. Di cPanel → Zone Editor:

1. Ubah `mail.theglobal-review.com` dari CNAME menjadi **A →
   `172.236.131.177`** (IP server hosting).
2. Ubah MX `theglobal-review.com` dari tujuan `theglobal-review.com`
   menjadi **`mail.theglobal-review.com`** (priority tetap 0).

Setelah itu email hidup di jalurnya sendiri dan kebal terhadap perubahan
apa pun pada record apex. Boleh dikerjakan jauh-jauh hari.

**Pastikan:** `Resolve-DnsName theglobal-review.com -Type MX` menjawab
`mail.theglobal-review.com`; kirim + terima satu email uji dari luar.
Klien email redaksi tidak perlu diubah.

**Yang sudah aman tanpa disentuh:** `ftp`/`webmail`/`cpanel`/
`autodiscover` (A langsung ke IP) dan SPF (menyebut IP eksplisit).
TTL zona 1440 detik — rollback terpropagasi ±24 menit, tidak perlu
menurunkan TTL lagi.

**Catatan keamanan email (bukan blocker):** domain ini belum punya
record DMARC, dan SPF-nya memakai `+a +mx` yang maknanya bergeser
pasca-cutover (`a` = IP Vercel). Layak dirapikan setelah peralihan:
tambah DMARC `p=none` dulu untuk memantau, dan ganti `+a +mx` dengan
IP/include eksplisit.

---

## 3. Tahap 1 — WordPress mendapat rumah barunya

**cPanel → Domains → Create A Domain**

- Domain: `cms.theglobal-review.com`
- Document Root: **samakan dengan domain utama** (`/home/theglob/
  public_html`). Di UI cPanel host ini bentuknya centang
  **"Share document root … with theglobal-review.com" — BIARKAN
  TERCENTANG** (diverifikasi Agustus 2026): tercentang = folder yang
  sama, WordPress hanya diberi nama kedua. Menghilangkan centang justru
  membuat folder baru yang kosong. Peringatan "this setting is
  permanent" tidak apa-apa — entri domainnya selalu bisa dihapus dan
  dibuat ulang tanpa menyentuh WordPress.

Tunggu AutoSSL menerbitkan sertifikat (biasanya beberapa menit).

**Pastikan:** `https://cms.theglobal-review.com/` terbuka tanpa peringatan
sertifikat.

Belum ada yang berubah bagi pembaca sampai titik ini.

---

## 4. Tahap 2 — WordPress pindah alamat resmi

Mulai di sini ada jendela waktu yang terlihat pembaca, jadi kerjakan
tahap 2–4 berurutan tanpa jeda panjang, di jam sepi.

**cPanel → File Manager → `wp-config.php`**, sisipkan tepat di atas baris
`/* That's all, stop editing! */`:

```php
define( 'WP_HOME', 'https://cms.theglobal-review.com' );
define( 'WP_SITEURL', 'https://cms.theglobal-review.com' );
```

Lewat `wp-config.php`, bukan lewat Pengaturan → Umum: kalau ada yang
meleset, memulihkannya cukup menghapus dua baris itu — sementara nilai
yang terlanjur tersimpan di basis data hanya bisa dibetulkan lewat
phpMyAdmin, dan situsnya sudah tidak bisa diakses saat itu.

Lalu **Pengaturan → Permalink → Simpan Perubahan** (flush rewrite).

Masih di sesi File Manager yang sama, **hapus/rename
`wp-content/mu-plugins/tgr-alih-sementara.php`** — tugas alihan
sementara selesai di sini, dan bila dibiarkan ia ikut mengalihkan
beranda cms ke `*.vercel.app`. Sekalian (opsional, boleh belakangan):
ubah `TGR_REVALIDATE_URL` di wp-config menjadi
`https://theglobal-review.com/api/revalidate` — URL vercel.app lama
tetap berfungsi, ini hanya merapikan.

**Pastikan:**

- `https://cms.theglobal-review.com/wp-admin/` bisa dipakai masuk
- `https://cms.theglobal-review.com/wp-json/` mengembalikan JSON

**Efek samping yang harus diketahui:** sejak dua baris itu aktif,
WordPress mengalihkan pengunjung `theglobal-review.com` ke
`cms.theglobal-review.com`. Selama tahap 3 belum selesai, pembaca akan
mendarat di WordPress beralamat cms — tidak rusak, tapi jelek. Itulah
alasan tahap 2–4 tidak boleh diselang.

**Mundur:** hapus dua baris `define`, simpan permalink lagi.

---

## 5. Tahap 3 — Situs baru menunjuk ke alamat baru

Dua perubahan; yang pertama **sudah ada di kode** (Agustus 2026).

**a. Kode** — `next.config.ts` sudah memuat host `cms.*` di
`remotePatterns` (featured image) dan rewrite `/wp-content/uploads/*` →
cms (gambar in-body ber-URL absolut domain lama, sekitar 1 dari 5
artikel — diteruskan ke WordPress apa adanya, tanpa bedah basis data).
Pastikan deploy terakhir sudah menyertakannya.

**b. Variabel lingkungan** — Vercel → Settings → Environment Variables:

```
WP_API_URL = https://cms.theglobal-review.com/wp-json
```

Lalu **Redeploy**.

**Pastikan, sebelum DNS disentuh** — buka alamat `*.vercel.app` dan
periksa: beranda memuat artikel, satu halaman artikel memuat gambar,
pencarian bekerja. Kalau di sini sudah benar, tahap berikutnya tinggal
soal alamat.

**Mundur:** kembalikan `WP_API_URL` ke domain lama, redeploy.

---

## 6. Tahap 4 — Domain utama menunjuk ke Vercel

**Vercel → Project → Settings → Domains → Add**: `theglobal-review.com`
dan `www.theglobal-review.com`. Vercel akan menampilkan record DNS yang
harus dipasang.

Pasang **persis nilai yang ditampilkan Vercel** (bukan nilai yang beredar
di internet — nilainya pernah berubah), di registrar atau cPanel → Zone
Editor:

| Nama | Tipe | Isi |
|---|---|---|
| `@` | A | alamat IP yang ditampilkan Vercel |
| `www` | CNAME | nilai yang ditampilkan Vercel |

**Yang tidak boleh disentuh:**

- **Jangan** memindahkan nameserver domain ke Vercel. Nameserver saat ini
  juga melayani MX (email `@theglobal-review.com`) dan record lain;
  memindahkannya akan mematikan email klien. Cukup ubah A dan CNAME.
- **Jangan** mengubah record `cms` — di situlah WordPress berada.

**Pastikan:** Vercel menampilkan "Valid Configuration"; lalu buka
beberapa URL artikel lama langsung di domain utama.

**Mundur:** kembalikan record A/CNAME ke IP hosting
(`172.236.131.177`). TTL zona saat ini 1440 detik, jadi pemulihan
terpropagasi ±24 menit; tidak perlu menurunkan TTL lebih dulu. Email
tidak ikut terpengaruh karena sudah diamankan di Tahap 0.

---

## 7. Tahap 5 — Merapikan setelah hidup

**a. Cegah WordPress terindeks ganda.** `cms.theglobal-review.com` masih
menyajikan seluruh artikel dalam bentuk HTML. Bila dibiarkan, Google
melihat dua salinan tiap artikel dan keduanya saling melemahkan.
wp-admin → **Pengaturan → Membaca → centang "Halangi mesin pencari
mengindeks situs ini"**.

**b. Sitemap.** Situs baru menyediakan `/sitemap.xml` (dibangun dari
REST API, segar tiap jam) dan `/robots.txt` yang menunjuk ke sana —
keduanya otomatis ikut pindah bersama domain.

**c. Search Console.** Kirim `https://theglobal-review.com/sitemap.xml`,
lalu pantau laporan Cakupan dan Pengalaman Halaman selama 2–4 minggu.
Turun sesaat itu normal; yang dipantau adalah pemulihannya.

**d. Kuota Vercel.** Pantau Project → Usage harian di minggu pertama
(lihat prasyarat #2: ambang upgrade dan tuas darurat gambar).

**e. Setelah stabil (± 1 bulan):** hapus host lama dari `remotePatterns`
di `next.config.ts`.

**f. Canonical.** Alamat `*.vercel.app` tetap hidup menyajikan konten
yang sama. Setiap halaman sudah memasang `<link rel="canonical">` ke
`theglobal-review.com` (metadataBase di `src/app/layout.tsx`), jadi
mesin pencari menghitung semuanya sebagai domain utama.

---

## 8. Yang sengaja tidak dikerjakan

- **Peta redirect per artikel.** Tidak perlu: pola URL-nya sudah sama.
- **`search-replace` basis data.** Digantikan rewrite `/wp-content/uploads`
  di tahap 3 — kebetulan menguntungkan, karena `search-replace` menuntut
  WP-CLI dan hosting ini tidak menyediakan akses shell.
- **Redirect di cPanel.** Lihat bagian 1.

---

## 9. Yang masih kurang sebelum peralihan

**Seluruhnya selesai (Agustus 2026):**

| Hal | Status |
|---|---|
| `sitemap.xml` di situs baru | ✔ `src/app/sitemap.ts` — 887 artikel + rubrik + halaman statis + penulis, segar tiap jam, jumlahnya diverifikasi sama dengan `X-WP-Total` |
| `robots.txt` di situs baru | ✔ `src/app/robots.ts` — menunjuk sitemap, memblokir `/api/` |
| Paginasi arsip rubrik | ✔ `/category/{rubrik}/halaman/{n}` — tautan `<a>` biasa sehingga mesin pencari punya jalur merambat ke seluruh arsip; `/halaman/1` di-308-kan ke URL dasar rubrik |
