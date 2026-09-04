# Laporan Mingguan — The Global Review

**Periode:** 25 Agustus – 4 September 2026
**Sumber:** 48 commit di `main`, checklist cek-dan-ricek 25/08/2026, ruang lingkup proposal Bagian 3–4, dan pemeriksaan langsung situs, CMS, serta data pencarian.

---

## Ringkasan

| | |
|---|---|
| Commit terdorong | 48 |
| Butir checklist selesai | 14 dari 16 |
| Butir ruang lingkup tertutup | 12 dari 12 (3 lewat kesepakatan penggantian) |
| Pekerjaan besar di luar lingkup | 4 |
| Biaya langganan baru | Rp 0 |
| Artikel di CMS | 893 |
| URL di peta situs | 936 |

Ruang lingkup Bagian 3 tertutup seluruhnya. Tiga butir di antaranya ditutup lewat kesepakatan 4 September, bukan karena dibangun: penghitung pengunjung aktif dan Google Analytics 4 diganti halaman Statistik, dan formulir langganan dinilai memadai sampai tahap pengumpulan data. Apa yang tidak ikut tergantikan didaftar terbuka di Bagian B.

---

## Status checklist

### Situs

| # | Butir | Status | Hasilnya |
|---|---|---|---|
| 1 | Migrasi data pengurus | **Selesai** | Bio delapan pengurus disesuaikan dengan halaman CMS, dua bahasa. Enam potret baru dipasang. |
| 2 | "Penulis" → "Editor" | **Selesai** | Byline artikel kini menyebut Editor. |
| 3 | Tombol bagikan FB, Telegram, X, Instagram | **Selesai** | Empat tombol, menggantikan set lama. |
| 4 | Semua artikel dapat terbuka | **Selesai** | 893 artikel terbaca; uji acak seluruhnya menjawab 200. |
| 5 | Tagline terlihat di HP | **Selesai** | Muncul sebagai kop panel menu burger. Di bar atas tetap disembunyikan — hanya tersisa 40 px di samping wordmark, dan menumpuknya membuat header terasa penuh. |
| 8 | Favicon lebih jelas | **Selesai** | Latar putih dengan mark navy, diterapkan ke enam aset ikon. |
| 9 | Logo GFI di footer | **Selesai** | Logo asli lengkap dengan teks "Global Future Institute". |
| 10 | Foto artikel muncul saat dibagikan | **Selesai** | Kartu pratinjau 1200×630 digambar otomatis untuk tiap artikel. |
| 11 | Persentase migrasi artikel | **Terjawab** | 893 artikel, seluruhnya terbaca dari CMS dan tersaji di situs. |
| 12 | Pencarian nama penulis | **Selesai** | "m arief pranoto" dan nama penulis lain terdeteksi. |
| 13 | Auto-posting ke FB dan X | **Belum** | Masuk penawaran lanjutan. |
| 14 | Pakem ukuran foto 702×336 | **Selesai** | Bebas. Ukuran apa pun ditangani otomatis. |
| — | Halaman buku pilihan | **Selesai** | Halaman Pustaka GFI + seksi karya sendiri di beranda. |

### Menu Admin

| # | Butir | Status | Hasilnya |
|---|---|---|---|
| 1 | Upgrade versi WordPress | **Ditahan** | Perlu membereskan disk lebih dulu. Masuk penawaran lanjutan. |
| 2 | Jumlah pembaca tiap artikel | **Selesai, dengan batas** | Halaman Statistik di wp-admin menampilkan peringkat artikel menurut klik dari hasil pencarian Google. Yang datang lewat WhatsApp, Facebook, atau tautan langsung belum terhitung — lihat daftar di Bagian B. |

---

## Cocok-silang dengan ruang lingkup

Checklist 25 Agustus dan ruang lingkup proposal tidak sepenuhnya berimpit. Beberapa butir checklist ternyata di luar lingkup dan tetap dikerjakan; sebaliknya, tiga butir lingkup tidak pernah muncul di checklist sehingga baru terbahas sekarang — dan ketiganya ditutup lewat kesepakatan 4 September.

### Status per work-stream

| | Butir lingkup | Status |
|---|---|---|
| **3.1** | Penyegaran logo, cover/beranda, rubrikasi, sistem desain | **Selesai** — ditambah favicon dan logo GFI asli di footer minggu ini |
| **3.2** | WordPress headless tanpa migrasi, akses API, rubrikasi | **Selesai** |
| **3.2** | Arsip 2022 ke bawah tidak ditampilkan | **Selesai** — batas 31 Desember 2022 aktif di kode, dipakai di tiga tempat |
| **3.3** | Arsitektur Next.js, implementasi desain, responsiveness | **Selesai** |
| **3.3** | Performa — gambar teroptimasi, caching, penundaan embed | **Selesai** — akar LCP ditemukan dan diperbaiki minggu ini |
| **3.4** | `POLLING` jajak pendapat | **Selesai** — fiturnya jalan, isinya masih kosong |
| **3.4** | `SOSIAL` tombol tertaut ke akun resmi GFI | **Selesai** |
| **3.4** | `SUBSCRIBER` formulir langganan email | **Selesai** — formulir dan pengumpulan data dinilai sudah memadai (disepakati 4 September) |
| **3.4** | `REAL-TIME` penghitung pengunjung aktif | **Diganti** — halaman Statistik dinilai sudah cukup mewakili (disepakati 4 September) |
| **3.5** | Google Analytics 4 | **Diganti** — Search Console + Chrome UX Report (disepakati 4 September) |
| **3.5** | Optimasi dan pengukuran performa | **Selesai** — angkanya menunggu jendela 28 hari |
| **3.5** | Dashboard ringkas untuk tim GFI | **Selesai** — halaman Statistik di wp-admin |

### Dikerjakan, padahal di luar lingkup

Empat pekerjaan besar minggu ini tidak ada di Bagian 3 mana pun:

| Pekerjaan | Kenapa di luar lingkup |
|---|---|
| **Kartu pratinjau bagikan (Open Graph)** | Tidak disebut di 3.1–3.5. Yang paling dekat justru ada di daftar pengecualian: "SEO berkelanjutan pasca-launch". Ini pekerjaan terbesar minggu ini — sembilan commit. |
| **Halaman Pustaka GFI + seksi beranda** | Lingkup 3.3 menyebut implementasi desain ke halaman yang sudah ada. Ini halaman baru. |
| **Kedalaman halaman Statistik** | *Deliverable*-nya memang diminta 3.5 ("dashboard ringkas / panduan membaca metrik"). Yang dibangun jauh melampauinya: klien Search Console dan Chrome UX Report, grafik, filter rentang, perbandingan periode, penjadwalan, dan peringatan otomatis. |
| **Bio dan potret pengurus** | "Produksi konten, fotografi, atau penulisan editorial" ada di daftar pengecualian. Potretnya sendiri disediakan GFI. |

### Bukan lingkup — dan memang tepat ditolak

| Butir | Dasar |
|---|---|
| Auto-posting ke FB dan X (checklist 13) | Tidak ada di Bagian 3; kampanye pemasaran ada di pengecualian. |
| Upgrade WordPress (Menu Admin 1) | Pemeliharaan rutin pasca-launch — paket opsional, Bagian 8. |
| Disk hosting dan peningkatannya | Biaya pihak ketiga, ditanggung GFI. |
| Redirect URL lama | Ada di daftar pengecualian secara eksplisit. |
| Migrasi konten 2022 ke bawah | Ada di daftar pengecualian; batasnya sudah diterapkan di kode. |

### Tiga butir lingkup ditutup lewat kesepakatan

Disepakati 4 September 2026. Ketiganya ditutup dengan cara berbeda, dan bedanya perlu tercatat.

**`REAL-TIME` penghitung pengunjung aktif → diganti halaman Statistik.**
Angka di halaman Statistik dinilai sudah cukup mewakili. Yang tidak tergantikan: angka sesaat — berapa orang sedang membaca detik ini. Data Search Console baru tersedia setelah jeda dua hingga tiga hari.

**`SUBSCRIBER` → formulir dan pengumpulan data dinilai memadai.**
Formulir berjalan dan alamat pelanggan tersimpan. Pengiriman artikel terbaru ke pelanggan tidak jadi bagian pekerjaan ini. Alamat yang terkumpul tetap bisa diekspor kapan saja bila nanti GFI memilih layanan pengiriman email.

**Google Analytics 4 → diganti Search Console + Chrome UX Report.**
Konsekuensinya: tidak ada pelacak sama sekali di situs, tidak ada biaya, dan data performanya berasal dari pengunjung sungguhan, bukan simulasi. Yang tidak ikut tergantikan sudah didaftar terpisah di Bagian B.

### Satu penyimpangan teknis dari proposal

**Data fitur interaktif disimpan di WordPress, bukan penyimpanan terpisah.**
Proposal 3.4 menyebut penyimpanan tersendiri, terpisah dari WordPress. Implementasinya menyimpan suara jajak pendapat dan alamat pelanggan di WordPress lewat endpoint sendiri. Konsekuensinya — tidak ada biaya penyimpanan pihak ketiga, tetapi keduanya ikut terdampak saat CMS bermasalah.

---

## Apa yang dikerjakan

### 1. Tautan yang dibagikan akhirnya tampil sebagai kartu

Butir nomor 10 ternyata paling dalam dan memakan porsi terbesar minggu ini — sembilan commit.

Masalah aslinya bukan satu, melainkan tiga yang bertumpuk:

- **Judul dan gambar tidak ikut terbawa.** Metadata artikel tidak pernah naik menjadi kartu karena layout induknya sudah menetapkan judulnya sendiri.
- **Gambar diambil dari perantara yang lambat bangun.** Crawler WhatsApp menyerah lebih dulu, lalu menyimpan kegagalan itu di cache-nya.
- **Bentuk gambar tidak seragam.** Gambar unggulan TGR berukuran 337–1024 px dengan rasio bermacam-macam, dan WhatsApp memutuskan sendiri kapan menampilkannya besar atau mengecilkannya jadi kotak kecil. Artikel yang satu tampil megah, tetangganya tampil seperti tautan biasa.

**Jalan keluarnya:** tiap artikel kini punya kartu 1200×630 yang digambar sendiri — foto artikel, lapisan gelap, logo The Global Review. Selalu ukuran yang sama, apa pun bentuk sumbernya.

Tiga keputusan di dalamnya:

- **Judul tidak digambar di kartu.** WhatsApp dan X sudah menampilkannya sebagai teks di bawah gambar; menggambarnya lagi hanya mengulang yang sudah terbaca sambil menutupi separuh fotonya.
- **Foto potret tidak dipotong.** Sampul buku dan foto tokoh ditaruh utuh di tengah dengan salinan buramnya sebagai latar. Dipotong penuh, sampul buku justru kehilangan judulnya sendiri.
- **Keluaran JPEG, bukan PNG.** WhatsApp menolak menampilkan gambar di atas 600 KB, dan kegagalannya senyap. Kartu pertama yang diuji 613 KB; versi JPEG 59–86 KB.

Satu pengalihan di jalur crawler juga dihapus, jadi kartunya kini terambil tanpa lompatan sama sekali.

**Berlaku untuk seluruh 893 artikel sekaligus, tanpa satu pun pekerjaan redaksi.**

### 2. Kecepatan halaman

Skor LCP tercatat 2.736 ms, sedikit di atas ambang baik 2.500 ms — satu-satunya metrik performa yang belum lulus.

Akarnya ditemukan: layanan optimasi gambar bawaan sudah kehabisan kuota dan mengembalikan galat, bukan gambar. Jalur muat gambar dialihkan ke rute yang bekerja, dengan keluaran WebP.

Contoh terukur: satu berkas PNG **606 KB turun menjadi 45 KB**.

Perbaikannya sudah terpasang, tetapi angka resminya memakai rata-rata 28 hari terakhir — hasilnya baru terlihat beberapa minggu lagi. Tidak ada yang perlu dikerjakan; cukup dipantau di halaman Statistik.

### 3. Halaman Statistik di wp-admin

Butir Menu Admin nomor 2, dikerjakan dari nol dalam lima tahap.

Isinya:

- **Traffic** dari Google Search Console — kunjungan, impresi, kueri, dan halaman terpopuler
- **Performa** dari Chrome UX Report — pengalaman pengunjung sungguhan, bukan simulasi
- **Grafik SVG**, filter rentang tanggal, dan perbandingan antar-periode
- **Peringatan otomatis** bila data berhenti diperbarui
- **Pengambilan terjadwal** tiap Senin, Kamis, dan Sabtu

Semua **tanpa memasang pelacak apa pun di situs** dan **tanpa biaya langganan baru**.

Istilah lencana statusnya sengaja dipilih netral, dilengkapi penjelasan tiap metrik saat disentuh — supaya angka yang belum ideal terbaca sebagai informasi, bukan alarm.

Temuan pertama yang langsung bisa ditindaklanjuti: **lima kata kunci sudah sering memunculkan TGR di hasil pencarian tetapi hampir tidak pernah diklik — sekitar 12.100 impresi, 16% dari seluruh kemunculan TGR di Google.** Posisinya sudah di peringkat 5–8, artinya Google menganggap tulisannya relevan; yang tidak menjawab hanya judulnya. Ini pekerjaan menyunting beberapa judul, bukan menulis artikel baru.

### 4. Halaman Pustaka GFI

Halaman baru khusus buku terbitan GFI — Tangan-Tangan Amerika, Japanese Militarism, Neo Kolonialisme, Perang Asimetris — terpisah dari Bedah Buku yang membahas buku internal maupun eksternal. Ditambah seksi tersendiri di beranda, di bawah Tentang Kami.

### 5. Tampilan dan navigasi

- **Byline artikel** kini menyebut Editor, bukan Penulis
- **Tombol bagikan** diganti menjadi Facebook, Telegram, X, Instagram
- **Tagline** muncul sebagai kop panel menu burger saat di HP
- **Favicon** berlatar putih dengan mark navy, diterapkan ke enam aset
- **Logo GFI asli** di footer, lengkap dengan teks lembaganya

### 6. Pencarian

Pencarian situs kini mendeteksi nama penulis, bukan hanya judul dan isi. Diuji dengan "m arief pranoto".

### 7. Halaman Pengurus GFI

- **Bio delapan pengurus** disusun ulang dari halaman CMS, dua bahasa. Sebelumnya ringkasan dua-tiga kalimat yang menghilangkan sebagian besar riwayat tiap orang.
- **Jabatan** diperiksa satu per satu terhadap CMS — kedelapannya sudah sama persis.
- **Enam potret baru** dipasang. Sebelumnya beberapa orang berbagi wajah yang sama: Halim memakai foto Harry, Neisya memakai foto Murniatun.
- **Nama berkas** ditulis agar terbaca mesin pencari — nama orang diikuti jabatannya, bukan nama keluaran generator.

### 8. Pemeliharaan

- Pembaruan dependensi minor dan patch
- Gambar sisipan di badan artikel ikut diperbaiki jalur muatnya
- Plugin pengalihan yang sudah kedaluwarsa dipensiunkan, alamat cPanel usang dibetulkan
- Umpan RSS hidup kembali

---

## Uji tutup lingkup

Seluruh butir Bagian 3 diuji langsung di produksi pada 4 September 2026 — bukan disimpulkan dari kode.

| Yang diuji | Hasil |
|---|---|
| Beranda, rubrik, artikel, halaman statis, Pustaka GFI, pohon `/en` | Enam-enamnya **200** |
| Peta situs, umpan RSS, `robots.txt`, API rubrik, pencarian | Lima-limanya **200** |
| Batas arsip 2022 | **893 URL, nol** bertanggal sebelum 2023 — batasnya bekerja |
| `POLLING`, `SUBSCRIBER`, formulir kontak | Ketiganya menolak masukan tidak sah dengan pesan yang benar |
| Tombol bagikan di halaman artikel | Facebook, Telegram, Instagram, X — empat-empatnya hadir |
| `SOSIAL` tautan akun resmi GFI | Facebook dan X hadir di beranda, header, footer, dan sidebar |
| Penundaan pemuatan embed | Pemutar video memakai `loading="lazy"` dan domain tanpa cookie |
| Artikel dibuka acak | Delapan dari peta situs, seluruhnya **200** |

Tidak ditemukan cacat. Satu-satunya temuan adalah kesalahan pada uji itu sendiri — parameter API rubrik salah tulis, bukan cacat aplikasi.

---

## Angka untuk dipakai di slide

| Angka | Konteks |
|---|---|
| **893** | artikel, seluruhnya terbaca dan tersaji |
| **48** | commit dalam periode ini |
| **606 KB → 45 KB** | satu berkas gambar setelah perbaikan jalur muat |
| **613 KB → 59–86 KB** | kartu pratinjau setelah diubah ke JPEG |
| **12.100** | impresi dari lima kueri yang nyaris tanpa klik (16% dari total) |
| **0** | biaya langganan baru untuk seluruh pekerjaan ini |
| **0** | pelacak yang dipasang di situs |

---

## Belum selesai

Dipisah menurut siapa yang menanggungnya — itu perbedaan yang paling menentukan.

### A. Masih di dalam lingkup

Setelah kesepakatan 4 September dan uji tutup lingkup di atas, **tidak ada lagi pekerjaan pemrograman yang tersisa di Bagian 3.** Dua butir tinggal menunggu pihak lain.

| Butir | Lingkup | Yang ditunggu |
|---|---|---|
| **Target skor performa membaik** | 3.5 | Menunggu waktu. Perbaikannya sudah terpasang; angkanya memakai rata-rata 28 hari sehingga baru terlihat beberapa minggu lagi. Cukup dipantau di halaman Statistik. |
| **Profil pengurus dan redaksi dapat disunting dari wp-admin** | 3.2 akses data | Menunggu GFI mengunggah versi terbaru plugin ke CMS. Halamannya sudah tayang benar memakai data cadangan, tetapi kolom jabatan dan bio belum terdaftar di CMS sehingga belum bisa disunting redaksi. Begitu berkasnya terunggah, penyelarasan datanya sekali jalan. |

### B. Yang tidak ikut tergantikan — calon daftar kerja berikutnya

Search Console dan Chrome UX Report menjawab sebagian besar kebutuhan, tetapi ada enam hal yang memang hanya bisa diberikan alat sekelas GA4. Didaftar di sini supaya keputusannya tercatat sebagai pilihan sadar, bukan kelalaian.

| Yang belum terjawab | Kenapa |
|---|---|
| **Jumlah baca sesungguhnya per artikel** | Angka yang ada sekarang hanya klik dari hasil pencarian Google. Artikel yang tersebar lewat WhatsApp, Facebook, atau tautan langsung tidak terhitung sama sekali — padahal di situlah lalu lintas TGR paling ramai. |
| **Jumlah pengunjung yang sedang membaca** | Data Search Console baru tersedia setelah jeda dua sampai tiga hari. Tidak ada angka sesaat. |
| **Sumber kunjungan selain Google** | Langsung, media sosial, dan rujukan situs lain tidak terlihat. Efek satu artikel yang viral di grup WhatsApp tidak terukur. |
| **Perilaku pembaca di dalam situs** | Durasi baca, kedalaman gulir, artikel apa yang dibuka berikutnya, di halaman mana pembaca berhenti. |
| **Profil pembaca** | Kota dan negara, jenis perangkat, peramban. |
| **Hasil formulir dan tombol** | Berapa yang benar-benar mengisi formulir langganan atau menekan tombol bagikan. |

Bila nanti GA4 dipasang, dua konsekuensi ikut masuk: pelacak berarti kewajiban izin cookie, dan satu skrip pihak ketiga tambahan di tiap halaman — yang berlawanan arah dengan pekerjaan LCP minggu ini. Ada juga alat analitik ringan tanpa cookie sebagai jalan tengah, tetapi hampir semuanya berbayar bulanan.

### C. Di luar lingkup — bila mau dibantu kerjakan

Seluruhnya sudah tersusun berikut urgensi, perkiraan beban, dan prasyaratnya di dokumen terpisah:

**→ [Rencana Lanjutan TGR](https://claude.ai/code/artifact/502d2492-0b00-4a65-ac84-09a8d28f5cc0)**

| Butir di dokumen itu | Kenapa di luar lingkup | Urgensi |
|---|---|---|
| **Disk hosting di atas 90%** | Biaya dan pengelolaan hosting ditanggung GFI | Mendesak — backup tidak bisa jalan sama sekali |
| **Situs menipis saat CMS mati** | Akibat langsung disk; selesai sendiri bila disk dibereskan | Mendesak |
| **Upgrade WordPress 7.1** | Pemeliharaan rutin pasca-launch, paket opsional Bagian 8 | Mendesak, tapi menunggu disk |
| **Perbaikan lima judul berpotensi tinggi** | SEO pasca-launch dan penulisan editorial — keduanya dikecualikan | Berikutnya — ±12.100 impresi menganggur |
| **Ukuran gambar unggulan** | Fotografi dan produksi konten dikecualikan | Berikutnya, sudah tidak mendesak sejak kartu pratinjau jalan |
| **Galeri dan jajak pendapat masih kosong** | Produksi konten dikecualikan | Berikutnya — fiturnya sudah siap, tinggal diisi |
| **Penjaga ukuran gambar saat unggah** | Tambahan di luar Bagian 3 | Bila diperlukan |
| **Membersihkan varian gambar tak terpakai** | Pengelolaan hosting | Bila diperlukan — pembebas ruang disk terbesar, juga paling berisiko |
| **Penjadwal statistik lewat cron cPanel** | Pengelolaan hosting | Hanya bila terbukti perlu |

Auto-posting ke FB dan X (checklist nomor 13) juga masuk kelompok ini dan belum tercatat di dokumen itu.

### D. Butuh tindakan GFI sebelum pekerjaan bisa dilanjutkan

| Butir | Yang tertahan |
|---|---|
| **Unggah plugin versi terbaru ke CMS** | Halaman Pengurus dan Redaksi masih memakai data cadangan. Kolom jabatan dan bio belum terdaftar di CMS, sehingga isian apa pun tidak akan tersimpan — sudah terbukti sekali. |
| **Disk hosting** | Memblokir backup dan update WordPress. Lihat Bagian C. |

---

## Catatan

Potret enam pengurus adalah hasil render, bukan foto kamera. Kemiripannya dengan foto di CMS jelas, tetapi wajahnya tidak akan sama persis bila dibandingkan. Ini keputusan redaksi, dicatat di sini supaya tidak terlewat.
