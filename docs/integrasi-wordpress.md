# Fase Integrasi WordPress — Persiapan

Dokumen kerja untuk menyambungkan frontend Next.js (prototype Opsi A) dengan
WordPress TGR yang sedang berjalan di <https://theglobal-review.com>.

Disusun setelah pemeriksaan langsung terhadap situs produksi, Agustus 2026.

---

## Status implementasi — 14 Agustus 2026

**Fase 1 LIVE di produksi dan teruji ujung-ke-ujung** (sunting di wp-admin
→ notice hijau → halaman Vercel berubah dalam hitungan detik). Rantai
deploy: repo GitHub publik + webhook push → deploy hook Vercel (paket
Hobby menolak auto-deploy commit kolaborator pada repo privat — itulah
alasan repo dipublikkan). Pencarian dibatasi `search_columns=post_title`
(pencarian isi penuh 5–9 dtk di host ini dan kerap melewati batas waktu
fungsi; judul saja <1 dtk) plus indikator "Mencari…" di panel.

**Fase 2a (Podcast, Galeri, Jajak Pendapat dari CPT) diimplementasikan.**
`src/lib/wp/podcasts|gallery|polls.ts` membaca `podcasts`/`albums`/`polls`
(anonim, terverifikasi 200) dengan `unstable_cache` bertag
`wp:podcasts|albums|polls` (revalidate 300); `/api/revalidate` memetakan
`type` CPT → tag koleksinya, dan `tgr-revalidate.php` memang sudah
mengirimkan tipe-tipe itu sejak awal. **Koleksi kosong atau WP gagal →
fallback ke data contoh `src/data/*.ts`**, sehingga seksi berpindah ke
WordPress dengan sendirinya begitu redaksi menerbitkan konten pertamanya
— tanpa deploy, tanpa perubahan visual. Bedah Buku tetap katalog kurasi
di kode (meta `tgr_buku_*` belum punya slot UI). Suara poll pengunjung
masih di sisi klien — penyimpanan suara ke WP = Fase 2b (butuh endpoint
tulis di mu-plugin + Application Password).

**Batas arsip (proposal §3.2).** Tulisan yang terbit sebelum
`WP_ARCHIVE_AFTER` (bawaan `2022-12-31T23:59:59`) tidak ditampilkan:
**5.683 → 876 artikel**. Ambangnya disisipkan terpusat lewat `withArchive()`
di `src/lib/wp/articles.ts`, dengan dua pengecualian yang disengaja —
`adjacentArticles()` yang memakai `after` sebagai jangkar, dan pencarian
berdasarkan `slug` (rujukan eksplisit kartu jajak pendapat). Halaman detail
`getArticle()` tidak difilter, jadi URL langsung ke tulisan lama tetap hidup
(proposal hanya melarang *menampilkan*; redirect URL lama di luar lingkup).
Kosongkan `WP_ARCHIVE_AFTER` untuk menayangkan seluruh arsip lagi.

Konsekuensi yang perlu diketahui redaksi: **dua tulisan sticky yang ada
bertanggal 2021 dan 2017**, jadi keduanya ikut tersembunyi dan hero beranda
kini jatuh ke artikel terbaru. Redaksi perlu mencentang "Lekatkan di atas
blog" pada tulisan 2023+ untuk mengendalikan hero.

Konten Fase 1 (arsip 5.600+ artikel) dibaca langsung dari `wp-json`:

- Lapisan data: `src/lib/wp/` (client + peta rubrik + sanitasi + pemetaan
  `WpPost → Article`); tipe `Article` tetap jadi kontrak sehingga seluruh
  komponen tampilan tidak berubah. Pencarian via `/api/search` (proxy
  `?search=` WordPress, kolom judul).
- Keputusan §3.2 dieksekusi: **URL artikel `/{slug}`** (route root
  `src/app/[slug]/` + redirect `/artikel/:slug → /:slug`). Nol tabrakan
  slug dengan route statis (diaudit terhadap 5.683 post).
- Kesegaran: **webhook** `wordpress/mu-plugins/tgr-revalidate.php` →
  `/api/revalidate` (tag cache, kedaluwarsa seketika), dengan ISR berkala
  sebagai jaring pengaman. Artikel utama beranda = **sticky post**.
- Peta rubrik sementara (37 term → rubrikasi baru) hidup di
  `src/lib/wp/rubrik.ts` — baris `TODO(editorial)` menunggu keputusan
  redaksi §3.1; setelah `04-rubrik.sh` dijalankan, tabel itu dikecilkan.
- Perilaku host yang ditemukan (WAF menolak UA curl, blokir `?author=N`,
  rate-limit burst) beserta mitigasinya terdokumentasi di
  `wordpress/README.md`.

Keterbatasan Fase 1 yang disengaja (hilang saat paginasi server masuk di
Fase 2): daftar halaman rubrik & penulis menampilkan maksimal 100/50
tulisan terbaru meski header menunjukkan jumlah arsip sebenarnya — filter
dan sort di toolbar hanya menjangkau subset itu. Empat sub-rubrik menu
(Asia Timur/Selatan/Tengah, Australia) masih kosong sampai redaksi
memecah kategori `asia` di WordPress (§3.1). Slug artikel/rubrik yang tak
dikenal menampilkan halaman 404 dengan status HTTP 200 + meta `noindex`
(konsekuensi streaming `loading.tsx` di Next 16; aman untuk SEO, halaman
penulis yang tanpa streaming tetap 404 murni).

**Menunggu tindakan pemilik akses** (rincian di `wordpress/README.md`):
unggah ulang `tgr-headless.php` **v1.1** (menambah field `tgr_kategori`
album + `tgr_unggulan` podcast — timpa file lama di
`wp-content/mu-plugins/`, cek beranda sesudahnya), lalu butir keamanan
(backup + update WP core, limit-login) dan keputusan visibilitas repo.
Redaksi: mulai mengisi Podcast/Album/Poll di wp-admin (menu sudah ada;
field lewat panel Custom Fields), pemetaan 8 rubrik TINJAU + pemecahan
`asia`, atribusi M. Arief Pranoto, tinjau 2 sticky lama.

---

## 1. Hasil pemeriksaan situs sekarang

Semua angka di bawah diambil langsung dari REST API situs produksi.

| Aspek | Temuan |
|---|---|
| WordPress | **6.5.9** (rilis terbaru sudah 6.8.x — perlu pembaruan) |
| Web server | nginx |
| Panel hosting | Namespace `wp-toolkit/api` terdeteksi → indikasi **Plesk/cPanel WP Toolkit** |
| REST API | **Terbuka penuh tanpa autentikasi** untuk posts, pages, categories, tags, media, users |
| Autentikasi tulis | **Application Passwords tersedia** |
| SEO | **Yoast SEO aktif**, dan `yoast_head_json` ikut terekspos di REST |
| Formulir | Contact Form 7 |
| Komentar | Endpoint `comments` → 404 (komentar dinonaktifkan) |
| Permalink | `https://theglobal-review.com/{slug}/` — **tanpa awalan `/artikel/` atau `/category/`** |
| Sitemap | Yoast, terpecah 6 berkas untuk post + 3 untuk attachment |

### Volume konten

| Entitas | Jumlah |
|---|---|
| Artikel (post) | **5.678** |
| Media | **7.000** |
| Tag | 474 |
| Kategori | 37 |
| Halaman statis | 12 |
| Penulis (user) | 4 |

### Custom post type

**Tidak ada.** Seluruh konten memakai `post` dan `page` bawaan. Artinya Podcast
dan Galeri belum punya wadah data terstruktur di WordPress.

### Penulis terdaftar

| ID | Slug | Nama tampil |
|---|---|---|
| 3 | `hendrajit` | Hendrajit \| Dir. Eksekutif |
| 2 | `rusman` | Rusman \| Dir Teknologi Informasi |
| 6 | `writer` | Writer |
| 1 | `yudikobo` | Yudi Kobo \| Redaksi |

Catatan: **M Arief Pranoto** ada di data prototype tetapi bukan user WordPress —
tulisannya kemungkinan diunggah lewat akun lain. Perlu dikonfirmasi ke redaksi.

### Halaman statis yang sudah ada

`/beranda` · `/tentang-gfi` · `/tentang-gfi-2` · `/redaksi-2` · `/pengurus-gfi` ·
`/bedah-buku` · `/gallery` · `/video` · `/hubungi-kami` · `/advertising` ·
`/disclaimer` · `/test`

Dua kejanggalan yang sebaiknya dibereskan lebih dulu:

- Slug tertukar — `/tentang-gfi` berjudul *"Tentang The Global Review"*,
  sedangkan `/tentang-gfi-2` berjudul *"Tentang Global Future Institute"*.
- `/test` adalah halaman sampah yang layak dihapus.

---

## 2. Kabar baik

**REST API sudah terbuka penuh.** Ini berarti integrasi headless bisa langsung
dikerjakan tanpa menunggu akses SSH, tanpa memasang plugin apa pun, dan tanpa
menyentuh situs produksi. Frontend cukup membaca dari `wp-json`.

**Yoast mengekspos `yoast_head_json`.** Judul SEO, meta description, dan data
Open Graph tiap artikel bisa ikut dipindahkan — tidak perlu menyusun ulang
metadata untuk 5.678 artikel.

**Featured image tersedia** lewat `_embed`, jadi thumbnail artikel bisa langsung
dipakai (menggantikan placeholder picsum di prototype).

---

## 3. Tiga hal yang perlu diputuskan lebih dulu

Ini keputusan editorial/strategis, bukan pekerjaan teknis — dan menentukan
bentuk pekerjaan berikutnya.

### 3.1 Peta rubrik lama → rubrikasi baru — PALING PENTING

Rubrikasi yang disepakati pada meeting Minggu 1 **tidak sama** dengan 37
kategori yang hidup di WordPress. Beberapa selisih yang mencolok:

| Rubrikasi baru (prototype) | Kenyataan di WordPress |
|---|---|
| Internasional → Asia Tenggara, Asia Timur, Asia Selatan, Asia Tengah, Australia, Timur Tengah, Afrika, Amerika Latin | Internasional → Amerika (312), Timur Tengah (282), Asia (222), Eropa (128), ASEAN (103), Diplomasi (57), Amerika Latin (56), Afrika (24) |
| Politik-Keamanan | POLITIK (910) dan HANKAM (188) terpisah, HANKAM punya anak: Militer (630), Intelijen (146), Kejahatan Transnasional (74) |
| Sains & Teknologi | IPTEK (187) |
| Sosial, Budaya (terpisah) | Sosial Budaya (277) menyatu, di bawah KHAZANAH |
| Features | Tidak ada padanan |
| Podcast | Tidak ada kategori |
| — | Ada rubrik besar tanpa padanan: Kepentingan Nasional (504), KHAZANAH (244), STRATEGI GLOBAL (105), GEOPOLITIK MILITER (70), Komentar Pembaca (91), Sejarah (221), Nusantara (107), Pendidikan (81), Wawancara (11) |

**Yang dibutuhkan:** tabel pemetaan dari redaksi — tiap kategori lama diarahkan
ke rubrik baru yang mana, mana yang digabung, mana yang dipensiunkan. Tanpa ini,
5.678 artikel tidak bisa ditempatkan.

### 3.2 Pola URL

WordPress sekarang memakai `/{slug}/` di akar domain. Prototype memakai
`/artikel/{slug}`.

**Rekomendasi: pertahankan `/{slug}/`.** Mengubahnya berarti memutus 5.678 URL
yang sudah terindeks Google dan dirujuk dari luar. Jika tetap ingin diubah,
wajib disiapkan redirect 301 satu per satu — pekerjaan besar dengan risiko
kehilangan trafik.

### 3.3 Arsitektur setelah pindah

Perlu disepakati: setelah frontend baru hidup, WordPress ditaruh di mana?

- **Opsi umum:** WordPress dipindah ke subdomain (mis. `cms.theglobal-review.com`)
  dan hanya dipakai redaksi; domain utama dilayani Next.js.
- Konsekuensinya: alamat media ikut berubah, perlu diputuskan apakah 7.000 media
  tetap dilayani WordPress atau dipindah ke CDN/object storage.

---

## 4. Yang perlu disiapkan

### 4.1 Akses & kredensial

| # | Kebutuhan | Untuk apa | Status |
|---|---|---|---|
| 1 | **Jenis hosting Webiihost** — VPS atau shared? | Menentukan bisa/tidaknya WP-CLI | ⏳ ditanyakan |
| 2 | **Akses SSH** | Syarat mutlak WP-CLI (backup, bulk edit kategori, clone staging) | ⏳ |
| 3 | Akses panel hosting (Plesk/cPanel) | Backup, staging, kelola berkas | ⏳ |
| 4 | **Application Password** WordPress | Baca/tulis REST API dari frontend & skrip migrasi — **jangan pakai password utama** | ⏳ |
| 5 | Akun WP peran Administrator | Membuat CPT, mengelola kategori | ⏳ |
| 6 | Akses Google Search Console | Memantau dampak SEO saat peralihan | ⏳ |
| 7 | Akses pengelola DNS domain | Peralihan domain saat go-live | ⏳ |

### 4.2 Soal WP-CLI

WP-CLI **mewajibkan akses SSH**. Karena itu pertanyaan "VPS atau shared hosting"
menentukan:

- **Ada SSH** → WP-CLI bisa dipakai. Sangat membantu untuk:
  - `wp db export` — backup basis data sebelum apa pun disentuh
  - `wp term list/update` — merapikan 37 kategori secara massal
  - `wp post list --format=csv` — menarik inventaris 5.678 artikel
  - `wp search-replace` — mengganti URL saat pindah domain/subdomain
- **Tanpa SSH** (shared murni) → alternatifnya:
  - Backup lewat panel hosting atau plugin (mis. All-in-One WP Migration)
  - Ekspor basis data via phpMyAdmin
  - Perapian kategori lewat wp-admin (manual) atau skrip yang memanggil REST API

**Penting:** integrasi headless-nya sendiri **tidak bergantung pada WP-CLI**,
karena REST API sudah terbuka. WP-CLI adalah alat bantu migrasi & pemeliharaan,
bukan syarat.

### 4.3 Pekerjaan teknis

| # | Pekerjaan | Catatan |
|---|---|---|
| 1 | **Backup penuh** (basis data + `wp-content`) | Wajib, sebelum menyentuh apa pun |
| 2 | **Staging** — klon situs untuk uji coba | Jangan pernah bereksperimen di produksi |
| 3 | Perbarui WordPress 6.5.9 → terbaru | Lakukan **setelah** backup dan di staging dulu |
| 4 | Buat Custom Post Type: **Podcast**, **Galeri/Album** | Beserta field khusus (ACF): kanal, videoId, tanggal tayang, dsb |
| 5 | Field tambahan untuk **Bedah Buku** | Sudah ada kategorinya (78 artikel); butuh field sampul, penulis, penerbit, tahun, ISBN |
| 6 | Wadah data **Jajak Pendapat** | Belum ada di WP — bisa CPT sendiri, atau tetap dikelola di frontend |
| 7 | Lapisan pengambilan data di Next.js | Mengganti `src/data/*.ts` dengan klien REST API + revalidasi |
| 8 | Strategi gambar | Daftarkan domain WordPress di `next.config.ts` `images.remotePatterns` |
| 9 | Peta redirect | Hanya bila pola URL berubah |

### 4.4 Penyesuaian di sisi frontend — ✅ selesai untuk Fase 1

Realisasinya (lihat "Status implementasi" di atas):

- `src/lib/wp/articles.ts` → pengambilan dari `/wp-json/wp/v2/posts`
  (daftar tanpa `_embed`, media via batch `/media`, cache `unstable_cache`)
- `src/lib/wp/map.ts` → user WP ⇄ penulis FE; roster profil tetap
  `src/data/authors.ts` (WordPress tidak punya role/bio)
- `src/data/site.ts` → tetap statis + entri rubrik `bedah-buku`
- `src/lib/articles.ts` → tinggal helper murni (aman diimpor komponen client)
- `src/data/books.ts`, `podcasts.ts`, `gallery.ts` → menunggu CPT tersedia
- `articleImage()` → featured media asli, picsum hanya fallback bila
  tulisan belum punya gambar unggulan

---

## 5. Urutan kerja yang disarankan

1. **Kumpulkan akses** (§4.1) — terutama jawaban soal SSH dari Webiihost.
2. **Backup + staging** — sebelum perubahan apa pun.
3. **Kunci keputusan** (§3) — peta rubrik, pola URL, arsitektur akhir.
4. **Sambungkan artikel dulu** — rubrik dan artikel lebih dahulu, karena inilah
   inti situs dan sudah tersedia lewat REST API.
5. **Susul konten khusus** — Podcast, Galeri, Bedah Buku setelah CPT dibuat.
6. **Uji di staging**, bandingkan dengan produksi.
7. **Peralihan (cutover)** — dengan Search Console terpantau.

---

## 6. Pertanyaan terbuka untuk klien / hosting

1. Webiihost: **VPS atau shared hosting?** Apakah tersedia akses SSH?
2. Panel apa yang dipakai — Plesk atau cPanel?
3. Apakah tersedia fitur staging bawaan?
4. Siapa yang memegang DNS domain?
5. Redaksi: bersedia memetakan 37 kategori lama ke rubrikasi baru?
6. Setelah go-live, WordPress ditaruh di subdomain apa?
7. Apakah 5.678 artikel akan dipindahkan seluruhnya, atau ada penyaringan arsip?
