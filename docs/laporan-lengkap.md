# Laporan Pertanggungjawaban — Integrasi The Global Review

Periode kerja **25 Juli – 25 Agustus 2026**. Dokumen ini menjawab satu
pertanyaan: apa yang dijanjikan, dan apa yang sudah diserahkan.

Laporan berkala per periode ada di `docs/laporan-progres.md`; yang di sini
adalah gambaran utuhnya. Angka commit, berkas, dan tes diukur ulang dari
repositori saat laporan ini ditulis. Angka konten dikutip dari periode
pengukurannya dan tanggalnya selalu disebut, karena sebagian bergerak.

---

## 1. Ringkasan eksekutif

The Global Review kini berjalan di atas dua bagian yang terpisah rapi.
Redaksi tetap menulis di wp-admin seperti biasa — tidak ada satu pun
kebiasaan yang harus diganti — sementara yang dilihat pembaca adalah situs
baru berbasis Next.js yang jauh lebih cepat, tersaji dari jaringan Vercel.
Keduanya tersambung otomatis: satu tulisan disimpan di wp-admin, halaman
terkait di situs baru ikut berubah dalam hitungan detik.

Sejak **24 Agustus 2026**, alamat `theglobal-review.com` sudah menunjuk ke
situs baru itu. WordPress tetap hidup, pindah ke `cms.theglobal-review.com`,
dan menjadi ruang kerja redaksi. Peralihan berjalan tanpa memutus email dan
tanpa memutus satu pun tautan artikel lama — permalink lama dipertahankan
apa adanya.

Yang berpindah bukan hanya artikel. Podcast, album galeri, jajak pendapat,
bedah buku, profil pengurus dan masthead redaksi, teks empat halaman
statis, pesan dari formulir kontak, dan daftar pelanggan buletin — semuanya
kini dikelola dari wp-admin. Sebelum pekerjaan ini, sebagian besar di
antaranya hanya bisa diubah dengan menyunting kode. Praktis tidak ada lagi
konten situs yang terkunci di tangan pengembang.

Satu hal yang belum tuntas dan perlu dinyatakan terang-terangan: **inti
WordPress masih di versi 6.5.10**, jauh tertinggal, dan itu satu-satunya
risiko keamanan produksi yang tersisa. Runbook pembaruannya sudah ditulis
lengkap dengan jalur pemulihan; yang ditunggu hanya kesepakatan jendela
pemeliharaan. Rincian di bagian 6 dan 11.

---

## 2. Ruang lingkup: yang dijanjikan vs yang diserahkan

| Butir proposal | Status | Bukti |
|---|---|---|
| **3.2** WordPress sebagai backend headless | **Selesai** | Seluruh konten dibaca dari `wp-json` produksi; tanpa migrasi database, tanpa penyalinan data |
| **3.3** Pengembangan frontend | **Selesai** | Situs Next.js live di domain utama, dua bahasa, SEO terpasang |
| **3.4** POLLING | **Selesai** | Jajak pendapat dikelola dari wp-admin, suara pembaca tercatat sungguhan, rekap terlihat redaksi |
| **3.4** SUBSCRIBER | **Selesai** | Pendaftar buletin tersimpan di WordPress + ekspor CSV kapan saja |
| **3.4** REAL-TIME | **Di luar lingkup** | Dikerjakan pihak lain |
| **3.5** Analitik | **Di luar lingkup** | Dikerjakan pihak lain |

Tambahan di luar daftar proposal yang dikerjakan karena kebutuhannya muncul
di tengah jalan, dan semuanya sudah selesai:

- **Peralihan domain** dari WordPress ke Vercel, berikut penyelamatan email.
- **Situs dua bahasa** — seluruh antarmuka dan isi artikel tersedia dalam
  bahasa Inggris di `/en`.
- **Penataan ulang rubrik** WordPress agar cocok dengan struktur situs baru.
- **Penyembunyian arsip lama** (2022 ke bawah) sesuai arahan GFI.
- **Sorotan Judul** — mekanisme penyorotan frasa kunci pada judul, lengkap
  dengan aturan wajib isi sebelum terbit dan pengisian massal arsip lama.
- **Dokumentasi redaksi** bergambar plus kartu langkah cetak A4.

---

## 3. Yang sekarang bisa dilakukan redaksi sendiri

Semua dari wp-admin, tanpa menghubungi pengembang:

| Menu | Yang dikelola |
|---|---|
| Tulisan | Artikel, rubrik, penulis, Sorotan Judul, Identitas Buku (Bedah Buku) |
| Podcast | Daftar penampilan podcast beserta video YouTube-nya |
| Galeri | Album foto |
| Jajak Pendapat | Pertanyaan, pilihan, dan rekap suara pembaca |
| Pengurus & Redaksi | Profil pengurus GFI dan susunan redaksi, berikut foto dan urutan tampil |
| Laman | Isi empat halaman statis lewat kotak "Isi Halaman — Situs Baru" |
| Pesan Masuk | Pesan dari formulir kontak, berikut unduh CSV |
| Pelanggan Buletin | Daftar pendaftar buletin, berikut unduh CSV |

Perubahan apa pun di menu-menu itu muncul di situs dalam hitungan detik.
Bila pemberitahuan otomatis gagal terkirim, ada penyegaran berkala sebagai
jaring pengaman — jadi konten tidak pernah tertahan diam-diam.

Panduannya ada di `docs/panduan-redaksi.md` (bergambar, 19 tangkapan layar
wp-admin dengan penunjuk bernomor) dan `docs/kartu-langkah-redaksi.html`
(dua halaman A4 siap cetak untuk ditempel di sebelah komputer).

---

## 4. Kronologi per fase

**Fase 0 — Prototype frontend (25 Juli – 8 Agustus)**
Situs baru dibangun sebagai prototype dengan data contoh: tata letak,
rubrikasi, halaman statis, sidebar, identitas brand, dan penyesuaian
kanal sosial milik TGR.

**Fase 1 — Persiapan integrasi (8 – 12 Agustus)**
Audit langsung terhadap situs produksi: volume konten, struktur kategori,
kondisi hosting. Ditemukan bahwa akses shell dan SSH diblokir penyedia,
sehingga seluruh perkakas administratif dirancang ulang berbasis REST.
Hasilnya di `docs/integrasi-wordpress.md`.

**Fase 2 — Situs live membaca WordPress (13 – 15 Agustus)**
Seluruh data pindah dari kode ke WordPress. Rubrik ditata ulang, arsip
lama disembunyikan, tipe konten baru diberi layar isian, formulir buletin
dan jajak pendapat difungsikan. Situs baru live dan sepenuhnya membaca
WordPress. 52 commit dalam tiga hari.

**Fase 3 — Dua bahasa dan SEO (16 – 19 Agustus)**
Pohon rute dua bahasa, kamus antarmuka, terjemahan lima halaman statis,
canonical/hreflang/robots per bahasa, sitemap, paginasi arsip rubrik, dan
pengerasan terhadap terjemahan otomatis peramban.

**Fase 4 — Pengerasan redaksional dan peralihan domain (20 – 25 Agustus)**
Formulir kontak difungsikan, profil dan halaman statis pindah ke wp-admin,
Selat menggantikan tombol terjemah per artikel, Sorotan Judul dijadikan
wajib dan arsipnya diisi, panduan redaksi diaudit dan dibuat bergambar,
lalu domain dialihkan ke situs baru.

---

## 5. Angka dan bukti

| Metrik | Angka |
|---|---|
| Commit | 111 |
| Berkas tersentuh sejak awal | 180 (+30.069 baris) |
| Tes otomatis | 140 di 16 berkas, seluruhnya hijau |
| Gerbang tiap commit | tes + typecheck + lint + build produksi |
| Artikel tayang | 5.683 → 878 (per 15 Agustus, arsip ≤2022 disembunyikan) |
| Tulisan diarsipkan | 4.734 — ke Tong Sampah, bukan dihapus permanen |
| Tulisan berpindah rubrik | 447 |
| Kategori | 37 → 34 |
| Tulisan tayang ber-Sorotan Judul | 871 dari 887 (per 24 Agustus) |
| Podcast dipindah ke wp-admin | 9 |
| Kamus antarmuka Inggris | 55 → 190+ entri |
| Mu-plugin WordPress | 2 — `tgr-headless` v3.4.0, `tgr-revalidate` v1.2.0 (`tgr-alih-sementara` pensiun setelah peralihan domain tuntas) |
| Perkakas administratif | 10 skrip REST + 4 skrip cPanel |
| Tangkapan layar panduan | 19 |
| Dokumen serah terima | 9 berkas Markdown + 1 kartu langkah cetak |

Setiap commit harus melewati empat gerbang otomatis sebelum diterima —
tes, pemeriksaan tipe, pemeriksaan gaya kode, dan build produksi. Tidak ada
perubahan yang masuk tanpa keempatnya hijau. Rinciannya di `docs/ci.md`.

---

## 6. Keamanan dan privasi

Yang sudah dikerjakan:

- **Isi artikel disaring** lewat daftar-izin sebelum ditampilkan —
  pertahanan terhadap skrip yang menyusup lewat editor.
- **Endpoint tulis WordPress bersecret**; probe tanpa secret harus dijawab
  penolakan, dan itu ikut diperiksa skrip pemeriksa kesehatan.
- **Formulir kontak dan buletin berlapis**: jebakan bot, validasi isian,
  dan pembatas laju di dua sisi (situs dan WordPress).
- **Data pribadi tidak dibuka ke API publik.** Daftar Pesan Masuk dan
  Pelanggan Buletin sengaja tidak diekspos REST.
- **Alamat IP disimpan sebagai sidik**, bukan apa adanya.
- **Ekspor CSV diberi penangkal injeksi formula** — berkas unduhan tidak
  bisa dijadikan alat serang saat dibuka di aplikasi lembar sebar.
- **Data pribadi tidak pernah masuk ke gambar panduan**: layar Pelanggan
  Buletin dan Pesan Masuk diganti teks contoh sebelum dipotret. Skrip
  potret juga tidak pernah menyentuh kata sandi — login dikerjakan manual
  sekali oleh pemilik akses, sesinya disimpan di berkas ter-gitignore.
- **Boundary galat per rute dan global**, sehingga satu kegagalan tidak
  memutihkan seluruh halaman.

Risiko yang masih terbuka, dan perlu keputusan:

1. **Inti WordPress 6.5.10.** Tertinggal jauh, dengan puluhan pembaruan
   tertunda. Ini risiko keamanan produksi yang nyata dan satu-satunya yang
   tersisa. Runbook lengkap sudah siap di
   `docs/runbook-pembaruan-wordpress.md` — backup, potret kesehatan
   sebelum/sesudah, plugin dulu baru inti, jalur pemulihan. Pembaca tidak
   terdampak apa pun hasilnya, karena situs disajikan dari cache Next.js
   terlepas hidup-matinya WordPress.
2. **Repositori kode masih publik.** Keputusan sementara: paket Vercel yang
   dipakai menolak deployment kontributor selain pemilik akun pada
   repositori privat. Jalan permanennya memindahkan project Vercel ke akun
   pemilik, lalu memprivatkan repo kembali.
3. **Mesin terjemah `/en` berstatus deprecated.** Layanan `element.js` yang
   menggerakkan Selat sudah ditandai usang oleh Google. Belum mati, tapi
   jalur penggantinya perlu diputuskan sebelum mati — cetak birunya sudah
   dibekukan di `docs/terjemahan-tersimpan-rencana.md`.
4. **Pemasangan plugin lewat wp-admin diblokir WAF hosting.** Bukan celah,
   tapi batasan yang perlu diketahui: penambahan plugin harus lewat cPanel
   File Manager, bukan installer bawaan WordPress.

---

## 7. Kendala yang ditemukan dan diselesaikan

| Kendala | Dampak | Penyelesaian |
|---|---|---|
| Paket Vercel menolak deploy kontributor pada repo privat | Situs tidak bisa dideploy sama sekali | Repositori dijadikan publik — keputusan sementara, alternatif permanennya memindahkan project ke akun pemilik |
| Pencarian isi penuh memakan 5–9 detik di hosting ini | Pencarian gagal di produksi meski jalan di lokal | Dibatasi ke kolom judul: turun ke bawah 1 detik, dan hasilnya justru lebih relevan |
| Akses shell dan SSH diblokir penyedia hosting | WP-CLI tidak bisa dipakai untuk operasi massal | Seluruh perkakas administratif dibangun ulang berbasis REST dengan Application Password |
| Hosting menolak permintaan beruntun | Operasi massal terputus di tengah jalan | Dijalankan bertahap dengan antrean terbatas dan pengulangan berjeda |
| WAF hosting memblokir installer plugin wp-admin | Plugin tidak bisa dipasang dari dalam WordPress | Mu-plugin dipasang lewat cPanel File Manager; prosedurnya didokumentasikan |
| MX menunjuk ke apex — ranjau yang tidak tercatat di runbook awal | Peralihan domain akan mematikan seluruh email masuk | Ditemukan saat gladi, diperbaiki lebih dulu: `mail.` jadi A record tersendiri sebelum apex disentuh |
| Google Translate memutasi DOM dan merusak React | Halaman bisa mati putih saat pembaca memakai terjemahan peramban | Boundary galat per rute; komponen interaktif dipagari dari penulisan ulang DOM |
| Sapuan terjemahan datang terlalu dini atau macet karena cookie sisa | Halaman `/en` kadang tetap berbahasa Indonesia | Selat mengawal dan mendorong ulang otomatis; dua mode gagal ini ditemukan saat verifikasi dan dijinakkan |
| Notice hijau "Pos diterbitkan" muncul padahal terbit ditahan | Redaksi mengira tulisan sudah tayang padahal belum | Pesan sukses palsu dibuang pada request yang ditahan; hanya peringatan merah yang tampil |
| Kebijakan wajib Sorotan Judul bisa ditembus tiga jalur | Tulisan bisa tayang tanpa sorotan lewat Sunting Cepat, Sunting Massal, atau penjadwalan | Semua jalur terbit dimuarakan ke satu pemeriksa (v3.2.0) |

---

## 8. Aset yang diserahkan

**Untuk redaksi dan penulis**

| Berkas | Isi |
|---|---|
| `docs/panduan-redaksi.md` | Panduan menulis untuk situs baru — enam kebiasaan yang memengaruhi tampilan, checklist pra-terbit, dan tur menu wp-admin, dengan 19 tangkapan layar berpenunjuk |
| `docs/kartu-langkah-redaksi.html` | Dua halaman A4 siap cetak: enam langkah sebelum menekan Terbitkan |

**Untuk pemilik akses dan pengembang berikutnya**

| Berkas | Isi |
|---|---|
| `docs/laporan-progres.md` | Log berkala per periode, entri terbaru di atas |
| `docs/peralihan-domain.md` | Runbook peralihan domain + riwayat eksekusi + alamat panel pasca-peralihan |
| `docs/runbook-pembaruan-wordpress.md` | Langkah klik-demi-klik pembaruan inti WordPress 6.5.10 → 7.1, berikut jalur pemulihan |
| `docs/integrasi-wordpress.md` | Dokumen kerja integrasi: hasil audit, keputusan arsitektur, pertanyaan terbuka |
| `docs/terjemahan-tersimpan-rencana.md` | Cetak biru pengganti mesin terjemah, siap diaktifkan bila diputuskan |
| `docs/ci.md` | Gerbang otomatis tiap commit dan alasan urutannya |
| `wordpress/README.md` | Rujukan teknis sisi WordPress: kondisi hosting, mu-plugin per versi, perkakas REST, prosedur pasang lewat cPanel |
| `wordpress/mu-plugins/` | Tiga mu-plugin beserta versinya |
| `wordpress/rest/`, `wordpress/cli/` | 14 perkakas administratif — penataan rubrik, pengarsipan, impor konten, pengisian sorotan, pemeriksa kesehatan |

---

## 9. Menunggu keputusan redaksi

| Hal | Dampak bila belum diputuskan |
|---|---|
| Pemilahan 37 tulisan kategori "Asia" ke Asia Timur/Selatan/Tengah | Empat sub-rubrik itu tampil kosong di menu |
| Rumah untuk kategori "Amerika" (47) dan "Eropa" (30) | Artikelnya tampil di bawah rubrik Internasional |
| Melekatkan artikel 2023+ sebagai Isu Utama | Beranda menampilkan artikel terbaru; dua artikel lekat yang lama bertanggal 2021 dan 2017 ikut tersembunyi bersama arsip |
| Atribusi tulisan M. Arief Pranoto | Halaman penulisnya kosong — ia ada di daftar redaksi tetapi bukan pengguna WordPress |
| 16 tulisan tanpa Sorotan Judul | Judul satu kata, nama tokoh utuh, atau slogan retoris — memang tak layak dipilihkan mesin, terbuka untuk selera redaksi saat menyuntingnya |
| Pos hantu 21200 | Tayang dengan judul kosong; perlu dilengkapi atau diarsipkan |
| Artikel "Remilitarisasi Jepang…" | Masih draf sejak dipakai menguji aturan wajib sorotan; selama draf ia hilang dari situs |

## 10. Menunggu keputusan pemilik / komersial

| Hal | Dampak bila belum diputuskan |
|---|---|
| Jendela pemeliharaan pembaruan WordPress | Risiko keamanan produksi terus berjalan |
| Paket Vercel (masih Hobby) | Seluruh trafik domain utama kini melewatinya; perlu dipantau sebelum menyentuh batas |
| Visibilitas repositori | Kode tetap terbuka sampai project Vercel dipindahkan ke akun pemilik |
| Biaya terjemahan tersimpan | `/en` tetap bergantung layanan Google yang sudah deprecated; versi tersimpan juga yang bisa diindeks mesin pencari |

---

## 11. Sisa pekerjaan, menurut prioritas

1. **Pembaruan inti WordPress 6.5.10 → 7.1** — *pemilik akses.* Prioritas
   tertinggi; ini risiko keamanan, bukan sekadar kerapian. Ikuti
   `docs/runbook-pembaruan-wordpress.md`.
2. **Halangi `cms.theglobal-review.com` dari indeks mesin pencari** —
   *pemilik akses.* Supaya WordPress tidak bersaing dengan domain utama
   untuk artikel yang sama.
3. **Kirim sitemap ke Google Search Console** atas nama domain utama —
   *pemilik akses.*
4. **Jalankan `npm run potret`** setelah login sekali — *pemilik akses.*
   19 gambar panduan redaksi belum ada isinya sampai ini dikerjakan.
   Jalankan ulang setelah pembaruan inti agar gambarnya mengikuti
   tampilan baru.
5. **Tuntaskan tujuh butir keputusan redaksi** di bagian 9 — *redaksi.*
6. **Pindahkan project Vercel ke akun pemilik**, lalu privatkan repositori
   kembali — *pemilik akses + pengembang.*
7. **Putuskan jalur terjemahan tersimpan** sebelum `element.js` benar-benar
   dimatikan Google — *pemilik + pengembang.* Cetak birunya sudah siap
   pakai.
