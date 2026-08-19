# Laporan Progres — Integrasi The Global Review

Catatan berkala pengerjaan penyambungan situs baru (Next.js di Vercel) dengan
WordPress yang sudah ada. Entri terbaru di atas; tiap periode ditutup dengan
status, angka, dan hal yang menunggu keputusan.

**Ruang lingkup yang dikerjakan:** butir 3.2 (WordPress sebagai backend
headless) dan 3.3 (pengembangan frontend) pada proposal, ditambah 3.4 POLLING
dan SUBSCRIBER. Butir 3.4 REAL-TIME dan 3.5 (analitik) dikerjakan pihak lain.

---

## Periode 19 Agustus 2026

### Status: situs berbahasa dua — English tersedia di /en

Tombol ID/EN di header kini sungguhan: seluruh antarmuka (navigasi, footer,
pencarian, arsip rubrik, halaman 404, dan lima halaman statis termasuk
Tentang, Redaksi, dan Hubungi Kami) tampil dalam bahasa Inggris di alamat
`/en/...`, dirender di server. URL bahasa Indonesia tidak berubah satu pun.

### Yang selesai

**1. Rute dua bahasa tanpa mengubah URL lama**

- Semua halaman pindah ke segmen `[lang]`; `proxy.ts` (konvensi Next 16
  pengganti middleware) menyajikan pohon `/id` di balik URL tanpa prefiks,
  meloloskan `/en`, dan memulangkan `/id/*` maupun trailing slash permalink
  WordPress lama dengan 308.
- Bahasa ditentukan URL, bukan localStorage — render server dan client
  selalu sepakat, tanpa kedip ganti bahasa.

**2. Terjemahan antarmuka menyeluruh**

- Kamus UI tumbuh dari 55 menjadi 190+ entri; tes otomatis memaksa setiap
  string ber-`t()` dan seluruh label menu punya padanan Inggris.
- Copy panjang lima halaman statis (termasuk profil delapan pengurus GFI)
  diterjemahkan penuh lewat modul bertipe `Record<Lang, ...>` — kolom
  Inggris yang hilang gagal kompilasi, bukan halaman bolong.

**3. Isi artikel: terjemahan on-device, nol biaya**

- Di halaman artikel `/en`, tombol terjemah memakai Translator API bawaan
  Chrome (model berjalan di perangkat pembaca; Chrome/Edge desktop). Tanpa
  API berbayar, teks tidak meninggalkan peramban.
- Mesinnya dibungkus kontrak `TranslateProvider` — bila kelak terjemahan
  tersimpan di WordPress (LLM, sekali jalan untuk seluruh arsip), cukup
  tukar satu modul tanpa menyentuh routing.
- GTranslate diverifikasi tidak kompatibel dengan arsitektur headless:
  versi gratis menyuntik skrip ke tema WordPress yang tidak pernah dilihat
  pembaca, dan tidak menyimpan terjemahan apa pun ke database.

**4. SEO dua bahasa yang jujur**

- Lima halaman statis ber-hreflang timbal balik dan boleh diindeks di dua
  bahasa; beranda, artikel, dan arsip versi `/en` di-noindex sampai
  terjemahan kontennya sungguhan. Sitemap ikut memancarkan pasangannya.
- `metadataBase` + canonical per bahasa terpasang di semua halaman.

**5. Pengerasan terhadap terjemahan otomatis peramban**

- Boundary galat per rute + global mencegah halaman mati putih saat Google
  Translate memutasi DOM (crash `removeChild` yang terkenal di React);
  teks yang bertetangga dengan angka dinamis dibungkus `span`.

### Menunggu keputusan

- **WordPress 6.5.10 dengan 99 pembaruan tertunda** — risiko keamanan
  produksi; pembaruan perlu dijadwalkan (di luar lingkup pekerjaan ini).
- Upgrade terjemahan artikel server-side (tersimpan di post meta, bisa
  diindeks Google, jalan di ponsel) menunggu keputusan biaya — estimasi
  sekali jalan untuk seluruh arsip 887 tulisan di kisaran belasan ribu
  rupiah per artikel memakai model bahasa, atau ditulis manual redaksi.

## Periode 13–15 Agustus 2026

### Status: situs baru LIVE dan sepenuhnya membaca WordPress

Redaksi sudah bisa menulis di wp-admin seperti biasa dan hasilnya tampil di
situs baru dalam hitungan detik. Tidak ada satu pun artikel yang masih berasal
dari data contoh.

### Yang selesai

**1. Sambungan data (Fase 1)**

- Seluruh artikel, rubrik, penulis, dan pencarian dibaca langsung dari
  `wp-json` produksi — tanpa migrasi, tanpa penyalinan data.
- URL artikel mengikuti permalink lama (`/{slug}`), lengkap dengan pengalihan
  permanen dari pola `/artikel/{slug}`.
- Kesegaran dua lapis: webhook dari WordPress menggugurkan cache halaman
  terkait dalam hitungan detik, dan pembaruan berkala jadi jaring pengaman
  bila webhook gagal terkirim.
- Isi artikel disaring lewat allowlist sebelum ditampilkan (pertahanan
  terhadap skrip yang menyusup lewat editor).

**2. Rubrikasi disamakan dengan situs baru**

- Struktur kategori WordPress ditata ulang agar identik dengan rubrik situs:
  5 kategori dibuat, 16 diganti nama/slug, 7 disusun ulang hierarkinya, dan
  8 dipensiunkan lewat penggabungan.
- **447 tulisan** berpindah rubrik; 37 kategori menjadi **34**.
- Peta penerjemah di kode kini 1:1 — tidak ada lagi kategori yang butuh
  terjemahan khusus.
- Ditambah alat pemeriksa selisih: satu perintah melaporkan kategori
  WordPress yang belum tertangani di kode, karena kasus ini tidak pernah
  memunculkan pesan error dan hanya bisa ditemukan bila sengaja diperiksa.

**3. Arsip lama disembunyikan sesuai arahan GFI**

- Tulisan terbit 2022 ke bawah tidak lagi ditampilkan di situs baru:
  **5.683 → 878** artikel tayang.
- **4.734 tulisan** dipindahkan ke Tong Sampah WordPress (bukan dihapus
  permanen — masih bisa dipulihkan ±30 hari; arsip terpisah sudah dipegang
  GFI).
- Batas tahunnya satu pengaturan, bisa digeser tanpa mengubah kode.

**4. Tipe konten baru bisa dikelola redaksi**

- **Podcast, Album Galeri, dan Jajak Pendapat** kini punya layar isian di
  wp-admin. Sebelumnya field-nya sudah ada di sistem tetapi mustahil diisi
  redaksi karena berbentuk daftar, sedangkan kotak bawaan WordPress hanya
  menerima teks biasa.
- Sembilan penampilan podcast asli dipindahkan dari kode ke wp-admin sehingga
  bisa ditambah dan disunting sendiri.
- Ketiga seksi berpindah otomatis dari data contoh ke WordPress begitu
  koleksinya terisi — sudah diuji dan dibersihkan kembali.

**5. Formulir buletin berfungsi**

- Pendaftar tersimpan di WordPress sebagai daftar tersendiri, lengkap dengan
  **unduh CSV** kapan saja tanpa bergantung plugin lain.
- Daftar alamat email sengaja tidak dibuka ke API publik; alamat IP pendaftar
  disimpan sebagai sidik, bukan apa adanya.

**6. Jajak pendapat menghitung suara sungguhan**

- Sebelumnya pembaca bisa memilih tetapi suaranya hanya tersimpan di
  peramban masing-masing — tidak ada hasil yang bisa dilihat siapa pun.
- Kini tiap suara tercatat di WordPress dan redaksi melihat rekapnya langsung
  di layar jajak pendapat serta kolom di daftarnya.
- Sudah diuji ujung-ke-ujung lewat situs produksi: suara tercatat, pemilih
  kedua dari alamat yang sama ditolak tanpa menambah angka, pilihan karangan
  ditolak.

**7. Dokumentasi**

- `docs/panduan-redaksi.md` — panduan non-teknis untuk penulis/editor: cara
  kerja mereka tidak berubah, plus lima kebiasaan yang memengaruhi tampilan
  dan tiga hal yang perlu dikabarkan lebih dulu.
- `docs/integrasi-wordpress.md` dan `wordpress/README.md` — rujukan teknis.

### Angka periode ini

| | |
|---|---|
| Commit | 43 (termasuk pembaruan dependensi otomatis) |
| Tes otomatis | 60, seluruhnya hijau |
| Gerbang tiap commit | tes + typecheck + lint + build produksi |
| Artikel tayang | 5.683 → 878 (arsip lama disembunyikan) |
| Tulisan diarsipkan | 4.734 |
| Tulisan berpindah rubrik | 447 |
| Kategori | 37 → 34 |
| Podcast dipindah ke wp-admin | 9 |

### Kendala yang ditemukan dan diselesaikan

1. **Deploy terblokir.** Paket Vercel yang dipakai tidak mengizinkan
   deployment dari kontributor selain pemilik akun pada repositori privat —
   termasuk lewat jalur otomatis. Diselesaikan dengan menjadikan repositori
   publik (keputusan sementara; alternatif permanennya memindahkan project ke
   akun sendiri).
2. **Pencarian gagal di produksi meski jalan di lokal.** Pencarian isi penuh
   memakan 5–9 detik di hosting ini dan melewati batas waktu di server. Dibatasi
   ke kolom judul: turun ke bawah 1 detik dan hasilnya lebih relevan.
3. **WP-CLI tidak bisa dipakai.** Hosting tidak menyediakan akses shell dan
   layanan SSH-nya diblokir penyedia. Digantikan perkakas berbasis REST
   dengan Application Password, yang menutup hampir seluruh kebutuhan
   administratif (kategori, tulisan, media, tipe konten, pengguna).
4. **Batas kecepatan hosting.** Permintaan beruntun dijawab penolakan
   sementara; seluruh operasi massal dijalankan bertahap dengan antrean
   terbatas dan pengulangan berjeda.

### Menunggu keputusan redaksi

| Hal | Dampak bila belum diputuskan |
|---|---|
| Pemilahan 37 tulisan kategori "Asia" ke Asia Timur/Selatan/Tengah | Empat sub-rubrik itu tampil kosong di menu |
| Rumah untuk kategori "Amerika" (47) dan "Eropa" (30) | Artikelnya tampil di bawah rubrik Internasional |
| Melekatkan artikel 2023+ sebagai Isu Utama | Beranda menampilkan artikel terbaru (dua artikel lekat yang lama bertanggal 2021 dan 2017, ikut tersembunyi bersama arsip) |
| Atribusi tulisan M. Arief Pranoto | Halaman penulisnya kosong; ia ada di daftar redaksi tetapi bukan pengguna WordPress |
| Bedah Buku: halaman `/bedah-buku` tetap di kode atau dibaca dari WordPress | Halaman itu menampilkan 4 ulasan yang tertulis di kode dan tidak bisa disunting redaksi, sementara kategori Bedah Buku di wp-admin berisi 32 ulasan yang hanya terjangkau lewat `/category/bedah-buku` — tidak dari menu |

### Menunggu tindakan pemilik akses

- Keputusan visibilitas repositori (tetap publik, atau pindahkan project
  Vercel lebih dulu sebelum diprivatkan kembali).
- Backup penuh lalu pembaruan inti WordPress; pemasangan pembatas percobaan
  masuk.
- Jawaban penyedia hosting soal aktivasi SSH (berguna nanti saat pemindahan
  domain, tidak menghambat apa pun sekarang).

### Rencana periode berikutnya

1. Menindaklanjuti keputusan redaksi di atas (pemilahan rubrik Asia,
   penetapan Isu Utama).
2. Menghapus data contoh Galeri dan Jajak Pendapat begitu redaksi mengisi
   yang sebenarnya — dilakukan per seksi agar situs tidak pernah tampil
   kosong di tengah jalan.
3. Paginasi arsip rubrik (saat ini menampilkan 100 terbaru; jumlah
   sebenarnya sudah ditampilkan di header).
4. Persiapan pemindahan domain: runbook lengkapnya tersedia di
   `docs/peralihan-domain.md`, tinggal menunggu waktu yang disepakati
   dan tiga prasyarat di dalamnya (kepemilikan project Vercel, sitemap,
   `robots.txt`).
