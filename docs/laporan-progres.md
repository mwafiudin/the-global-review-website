# Laporan Progres — Integrasi The Global Review

Catatan berkala pengerjaan penyambungan situs baru (Next.js di Vercel) dengan
WordPress yang sudah ada. Entri terbaru di atas; tiap periode ditutup dengan
status, angka, dan hal yang menunggu keputusan.

**Ruang lingkup yang dikerjakan:** butir 3.2 (WordPress sebagai backend
headless) dan 3.3 (pengembangan frontend) pada proposal, ditambah 3.4 POLLING
dan SUBSCRIBER. Butir 3.4 REAL-TIME dan 3.5 (analitik) dikerjakan pihak lain.

---

## Periode 25 Agustus 2026

### Status: domain utama sudah dilayani situs baru; gerbang sorotan aktif di produksi

### Yang selesai

**1. Peralihan domain tuntas**

`theglobal-review.com` kini dilayani Vercel — pembaca yang mengetik alamat
lama langsung mendarat di situs baru, tanpa singgah ke mana pun. WordPress
pindah ke `cms.theglobal-review.com` dan tetap menjadi tempat redaksi
bekerja.

- Diperiksa saat peralihan: sertifikat SSL terbit; beranda, artikel, dan
  gambar tayang di domain utama; sitemap terjangkau; REST `cms` sehat;
  email masuk-keluar tidak tersentuh.
- Tautan lama ber-garis-miring (`/slug/`) dialihkan sekali ke bentuk
  kanonis `/slug`. Disengaja: satu alamat untuk satu artikel, supaya mesin
  pencari tidak menghitungnya dua kali.
- TTL record baru terpasang 3600 detik (niat semula 300) — bila harus
  mundur, propagasinya ±1 jam.
- Runbook lengkap beserta riwayat eksekusinya di `docs/peralihan-domain.md`.

**2. Ranjau email dijinakkan sebelum apex disentuh**

MX domain ini dulu menunjuk ke apex — artinya mengubah A record apex,
persis yang dilakukan peralihan, akan mematikan seluruh email masuk.
Ranjau ini tidak tercatat di runbook awal; ditemukan saat gladi 19 Agustus
dan diperbaiki lebih dulu: `mail.theglobal-review.com` dijadikan A record
tersendiri dan MX menunjuk ke sana. Email kini kebal terhadap perubahan
apex apa pun.

**3. Alamat panel berubah — dicatat karena mudah dikira situs rusak**

`theglobal-review.com:2083` mati selamanya. Vercel tidak melayani port itu,
jadi yang muncul adalah halaman menggantung, bukan pesan error yang
menjelaskan. Alamat penggantinya:

| Untuk | Alamat baru |
|---|---|
| cPanel | `https://cpanel.theglobal-review.com` |
| Webmail | `https://webmail.theglobal-review.com` |
| wp-admin | `https://cms.theglobal-review.com/wp-admin` |

Record subdomain `cms`, `mail`, dan `webmail` sengaja tidak disentuh saat
peralihan justru untuk ini.

**4. Gerbang sorotan aktif sungguhan (`tgr-headless.php` v3.2.0)**

Mu-plugin v3.2.0 sudah terunggah ke produksi. Aturan wajib Sorotan Judul
yang ditutup rapat kemarin kini berlaku di keempat jalur terbit — layar
sunting, Sunting Cepat, Sunting Massal, dan penjadwalan. Sebelum ini
kebijakannya hanya menjaga satu pintu.

### Ringkasan minggu 19–25 Agustus

| Hal | Hasil |
|---|---|
| Domain | `theglobal-review.com` beralih ke situs baru; WordPress di `cms.` |
| Bahasa | Situs `/en` berbahasa Inggris otomatis seluruhnya lewat Selat |
| Sorotan Judul | Wajib sebelum terbit, empat jalur terbit tertutup; **871 dari 887** tulisan tayang sudah terisi |
| Panduan redaksi | Diaudit terhadap kode (sembilan klaim dibetulkan), dibuat bergambar, plus kartu langkah A4 |
| WordPress | Runbook pembaruan inti 6.5.10 → 7.1 siap; eksekusi menunggu jendela pemeliharaan |
| Mu-plugin | v3.1.0 → v3.1.1 → v3.2.0, seluruhnya sudah di produksi |

Rincian tiap butir ada di entri periodenya masing-masing di bawah.

### Menunggu tindakan pemilik akses

Sisa rapikan peralihan domain:

- **Halangi `cms.theglobal-review.com` dari indeks mesin pencari** — supaya
  ia tidak bersaing dengan domain utama untuk artikel yang sama.
- **Kirim sitemap ke Google Search Console** atas nama domain utama.
- **Pantau Usage di Vercel** — project masih di paket Hobby, sementara
  seluruh trafik domain utama kini melewatinya.

Terbawa dari periode sebelumnya:

- **Jalankan `npm run potret`** setelah login sekali — 19 gambar panduan
  redaksi belum ada isinya sampai langkah ini dikerjakan.
- **Terbitkan ulang "Remilitarisasi Jepang…"** — masih draf; selama draf,
  artikel itu hilang dari situs.
- Tinjau pos hantu 21200 — masih tayang dengan judul kosong.
- **Pembaruan inti WordPress → 7.1** — masih di 6.5.10, satu-satunya risiko
  keamanan produksi yang tersisa. Sesudahnya jalankan ulang `npm run potret`
  agar seluruh gambar panduan mengikuti tampilan baru.

---

## Periode 24 Agustus 2026

### Status: panduan redaksi diaudit dan dibetulkan, dibuat bergambar; gerbang sorotan ditutup rapat

### Yang selesai

**1. Audit panduan redaksi terhadap kode — sembilan klaim meleset**

Panduan disandingkan baris demi baris dengan `tgr-headless.php` dan
`src/lib/wp/`. Sebagian besar cocok, tapi sembilan hal salah — dan tiga di
antaranya ada di bab yang paling mungkin dibaca sambil menatap layar:

- Bab **Pengurus & Redaksi** meleset di tiga titik sekaligus: kotak
  Kelompok disebut di sisi kanan padahal ada di kolom utama, labelnya
  ditulis "Pengurus"/"Redaksi" padahal berbunyi "Pengurus GFI"/"Susunan
  Redaksi", dan jabatan/bio disebut "di bawah editor" padahal tipe konten
  ini tidak punya editor sama sekali.
- Metabox buku bernama **"Identitas Buku — rubrik Bedah Buku"**, bukan
  "Identitas Buku"; dan ia muncul di semua tulisan, bukan hanya yang
  berkategori Bedah Buku.
- **"Menyimpan draf tidak pernah terkunci"** tidak berlaku untuk tulisan
  yang sudah tayang tanpa sorotan — justru 16 arsip yang panduan minta
  dilengkapi. Diperbaiki di kode, lihat butir 3.
- Aturan wajib sorotan disajikan sebagai gerbang mutlak padahal bisa
  ditembus tiga jalur. Diperbaiki di kode, lihat butir 3.
- "Pesan Masuk tidak bisa disunting" — judulnya (nama pengirim) sebetulnya
  masih bisa diubah.
- Angka arsip diperbarui: **871 dari 887** tulisan tayang ber-sorotan
  (diukur ulang lewat REST hari ini; sebelumnya tertulis 870 dari 886).
- "Lima kebiasaan" padahal isinya enam.

Ditambahkan pula tujuh perilaku yang selama ini tidak terdokumentasi
padahal gagal secara senyap: podcast tanpa video YouTube tidak tampil,
tautan YouTube/tanggal yang tak dikenali dikosongkan tanpa pesan, dropdown
artikel sumber hanya memuat 100 tulisan terbaru, tombol Unduh CSV hanya
terlihat oleh Editor ke atas, bagian "Suara pembaca" baru bertabel setelah
ada suara, dan empat Laman statis harus dikenali dari judul karena
slug-nya tertukar.

**2. Panduan dibuat bergambar + kartu langkah A4**

- 19 tangkapan layar wp-admin ditautkan di sepanjang panduan, lengkap
  dengan penunjuk bernomor pada kotak yang sedang dibicarakan. Latar
  belakangnya: redaksi berusia sepuh dan panduan ini seluruhnya berbicara
  tentang posisi di layar.
- `wordpress/potret/` — skrip Playwright yang memotret ke-19 layar itu
  sekali jalan. Login dikerjakan manual sekali oleh pemilik akses (skrip
  tidak pernah menyentuh kata sandi), sesinya disimpan di berkas
  ter-gitignore. Data pribadi di layar Pelanggan Buletin dan Pesan Masuk
  diganti teks contoh **sebelum** jepretan diambil, jadi piksel aslinya
  tidak pernah masuk ke PNG.
- `docs/kartu-langkah-redaksi.html` — dua halaman A4 siap cetak berisi
  enam langkah pra-terbit, untuk ditempel di sebelah komputer. Sengaja
  bukan salinan panduan: hanya yang dilihat tiap hari.
- Bab **"Checklist sebelum menekan Terbitkan"** ditambahkan ke panduan.

**3. Gerbang sorotan ditutup rapat (`tgr-headless.php` v3.2.0)**

Kebijakan wajib sorotan ternyata hanya menjaga satu pintu. **Sunting
Cepat**, **Sunting Massal**, dan **penjadwalan** menembusnya karena tidak
mengirim field sorotan di request. Semua pintu kini bermuara ke satu
pemeriksa; `future` ikut dijaga, dan `transition_post_status` menangkap
penerbitan oleh WP-Cron. Rinciannya di `wordpress/README.md`.

Sekalian dilepas: kuncian editor blok yang membekukan seluruh penyimpanan
pada tulisan tayang tanpa sorotan — kuncian yang justru menghalangi
perbaikan 16 arsip itu.

### Menunggu tindakan pemilik akses

- **Unggah `tgr-headless.php` v3.2.0** (menggantikan v3.1.1 yang juga belum
  naik) — push dulu, tunggu CI hijau, baru unggah lewat cPanel File
  Manager. Uji empat jalur terbit setelahnya: layar sunting, Sunting Cepat,
  Sunting Massal, dan penjadwalan.
- **Jalankan `npm run potret`** setelah login sekali — 19 gambar panduan
  belum ada isinya sampai langkah ini dikerjakan.
- **Terbitkan ulang "Remilitarisasi Jepang…"** — diperiksa hari ini, masih
  draf.
- Tinjau pos hantu 21200 — diperiksa hari ini, masih tayang dengan judul
  kosong.
- **Pembaruan inti WordPress → 7.1** — masih di 6.5.10. Sesudahnya,
  jalankan ulang `npm run potret` agar seluruh gambar panduan mengikuti
  tampilan baru.

---

## Periode 21 Agustus 2026

### Status: seluruh arsip tayang praktis ber-sorotan; runbook pembaruan WordPress tertulis

### Yang selesai

**1. Pengisian sorotan menyeluruh — 870 dari 886 tulisan tayang**

- 356 judul yang kemarin tak tertebak mesin kini dikurasi satu per satu:
  tiap judul dibaca dan dipilihkan frasa kuncinya, diperiksa tiga lapis
  (aturan bentuk, perbaikan otomatis, tinjauan redaksional), lalu
  divalidasi ulang terhadap judul asli produksi sebelum ditulis — 340
  terisi.
- 16 sisanya memang tak layak dipil otomatis: judul satu kata ("Ganis",
  "Poerba"), nama tokoh utuh ("Ong Hok Ham"), atau slogan/judul retoris
  utuh ("No Viral, No Justice!") — terbuka untuk selera redaksi saat
  menyuntingnya.
- Temuan sampingan: pos id 21200 terbit dengan judul kosong (slug
  `21200-2`) — pos hantu, perlu ditinjau redaksi.

**2. Notif keliru di editor klasik dipadamkan (`tgr-headless.php` v3.1.1)**

- Saat terbit ditahan karena sorotan kosong, WordPress tetap memamerkan
  notice hijau "Pos diterbitkan." — core memilih pesan dari tombol yang
  ditekan, bukan dari status akhir tulisan. Pesan sukses palsu itu kini
  dibuang pada request demosi; yang tampil hanya peringatan merah.

**3. Runbook pembaruan inti WordPress ditulis**

- `docs/runbook-pembaruan-wordpress.md`: langkah klik-demi-klik dari sisi
  pemilik akses — backup, plugin dulu baru inti 7.1, potret kesehatan
  sebelum/sesudah (`periksa-kesehatan.mjs --banding`), jalur pemulihan.
  Pembaca tidak terdampak apa pun hasilnya: situs disajikan Next.js dari
  cache, terlepas hidup-matinya WordPress.

### Menunggu tindakan pemilik akses

- **Terbitkan ulang "Remilitarisasi Jepang…"** — artikel itu turun jadi
  draf saat dipakai menguji aturan wajib sorotan; isi kotak Sorotan
  Judul lalu terbitkan lagi (selama draf, ia hilang dari situs).
- **Unggah `tgr-headless.php` v3.1.1** — urutannya: push dulu, tunggu CI
  hijau (gerbang `php -l` ada di CI), baru unggah lewat cPanel File
  Manager.
- **Pembaruan inti WordPress → 7.1** mengikuti runbook baru — tinggal
  menyepakati jendela pemeliharaan.
- Tinjau pos hantu 21200: lengkapi judulnya atau arsipkan.

---

## Periode 20 Agustus 2026

### Status: formulir kontak berfungsi; profil & halaman statis disunting dari wp-admin

Tombol Kirim di halaman Hubungi Kami kini sungguhan — pesan pembaca
tersimpan di wp-admin dan diteruskan ke email redaksi. Profil pengurus,
masthead redaksi, dan teks empat halaman statis juga pindah ke wp-admin,
sehingga praktis tidak ada lagi konten situs yang hanya bisa diubah
lewat kode.

### Yang selesai

**1. Formulir kontak berfungsi (sebelumnya pura-pura)**

- Tombol Kirim di Hubungi Kami dulu hanya menampilkan "berhasil" tanpa
  mengirim apa pun. Kini pesan tersimpan di wp-admin (menu baru **Pesan
  Masuk**, lengkap dengan unduh CSV) dan diteruskan sebagai email
  notifikasi yang bisa langsung dibalas ke penanya.
- Pesan disimpan dulu, email menyusul — email yang gagal terkirim tidak
  pernah menghilangkan pesan, dan statusnya terlihat di kolom daftar.
- Pengaman berlapis: jebakan bot, validasi isian, pembatas laju di dua
  sisi; daftar pesan sengaja tidak dibuka ke API publik (data pribadi),
  alamat IP disimpan sebagai sidik, dan ekspor CSV diberi penangkal
  injeksi formula.

**2. Pengurus & Redaksi dikelola dari wp-admin**

- Menu baru **Pengurus & Redaksi**: satu entri per orang mengisi halaman
  Pengurus GFI dan masthead Redaksi sekaligus. Foto lewat Gambar
  Unggulan, urutan tampil lewat satu angka, kolom bahasa Inggris
  opsional (kosong → memakai teks Indonesia).

**3. Halaman statis tersunting dari wp-admin**

- Empat Laman lama (Tentang TGR, Tentang GFI, Pengurus GFI, Hubungi
  Kami) mendapat kotak **"Isi Halaman — Situs Baru"** berisi 26 kolom
  teks. Kolom yang kosong memakai teks bawaan — halaman tidak pernah
  tampil bolong.
- Petanya dikunci ke ID halaman, bukan slug, karena slug di produksi
  tertukar (halaman ber-slug `tentang-gfi` justru berjudul "Tentang The
  Global Review").
- Kotak Identitas Buku bertambah centang **Buku pilihan sidebar** untuk
  memilih buku yang dipromosikan di kolom samping situs.

**4. Data contoh galeri & jajak pendapat dihapus**

- Rencana sebelumnya ("hapus per seksi begitu redaksi mengisi yang
  sebenarnya") diganti yang lebih jujur: dihapus sekarang. Enam album
  berfoto stok dan tiga jajak pendapat dengan angka suara karangan tidak
  pantas tampil di situs berita sungguhan.
- Galeri kosong kini menampilkan keterangan "Belum ada album."; seksi
  jajak pendapat di beranda disembunyikan sampai ada isinya. Data contoh
  podcast dan bedah buku dipertahankan sebagai cadangan pemadaman —
  isinya cermin konten nyata di WordPress, bukan karangan.

**5. Perkakas: dua skrip pemindah + pemeriksa kesehatan**

- Dua skrip pemindah baru: profil pengurus/redaksi (termasuk unggah
  fotonya) dan isi 26 kolom halaman statis — keduanya mode tinjauan
  dulu, aman diulang, dan menolak berjalan bila mu-plugin barunya belum
  terpasang.
- Skrip **periksa kesehatan**: potret kondisi WordPress (jumlah konten,
  autentikasi, endpoint, versi inti) tersimpan sebagai berkas jejak
  audit, plus mode pembanding dua potret — disiapkan untuk mengawal
  pembaruan inti WordPress sebelum/sesudah.

**6. Pembaruan dependensi otomatis digabungkan**

- Seluruh usulan pembaruan dependensi (Dependabot) ditinjau dan
  digabungkan; gerbang tes/typecheck/lint/build tetap hijau.

**7. Selat: seluruh situs /en kini berbahasa Inggris otomatis**

- Memilih EN pada saklar bahasa di menu kini menerjemahkan SEMUA konten
  — termasuk isi artikel — secara otomatis, di semua browser, tanpa
  tombol tambahan apa pun. Kembali ke ID = naskah asli dari server.
  Teknologinya dinamai **Selat** (`src/components/Selat.tsx`):
  jembatan yang menghubungkan dua daratan bahasa.
- Mesinnya widget Google Translate `element.js` — mekanisme yang sama
  dengan plugin GTranslate versi gratis (hasil bedah kode resminya),
  dipakai langsung di frontend tanpa plugin dan tanpa menyentuh
  WordPress. Ini menggantikan tombol per-artikel ber-Chrome-Translator
  yang desktop-saja dan sering gagal mengunduh model.
- Komponen interaktif (pencarian, filter rubrik, tab, poll, formulir)
  dipagari atribut `translate="no"` di pohon `/en` supaya penulisan
  ulang DOM oleh Google tidak bentrok dengan React — diuji tekan tanpa
  satu pun error. Konsekuensi sadar: teks di dalam pagar (teaser pada
  grid interaktif) tetap Indonesia demi stabilitas.
- Selat mengawal hasilnya ±2 menit per muat halaman: sapuan Google yang
  datang terlalu dini (kalah balapan dengan hidrasi) atau macet karena
  cookie sisa akan didorong ulang otomatis — dua mode gagal yang
  ditemukan dan dijinakkan saat verifikasi.
- Diverifikasi ujung-ke-ujung di dev: beranda dan artikel `/en` tersaji
  Inggris tanpa satu klik, banner Google tak muncul, mode gelap
  selamat, halaman Indonesia tak tersentuh. Catatan sadar-risiko:
  layanan `element.js` berstatus deprecated di Google — jalur
  penggantinya dibekukan sebagai cetak biru di
  `docs/terjemahan-tersimpan-rencana.md` (terjemahan tersimpan di
  WordPress, gratis via kuota Azure; aktivasi menunggu keputusan).

**8. Sorotan Judul: jarak aman di /en, wajib sebelum terbit, arsip terisi**

- Pil sorotan tak lagi menempel kata di sebelahnya saat halaman /en
  diterjemahkan (spasi batas frasa kini dilindungi dari mesin terjemah);
  tampilan Indonesia tidak berubah. Dua penambal laten ikut: frasa yang
  muncul dua kali di judul tidak lagi memotong ekor judul, dan frasa
  ber-karakter khusus kini dicocokkan setelah dibersihkan seperti judulnya.
- Kebijakan baru di wp-admin: **Sorotan Judul wajib diisi sebelum tulisan
  terbit** — tombol Terbitkan terkunci + peringatan merah selama kosong;
  menyimpan draf tetap bebas. (Aktif setelah `tgr-headless.php` v3.1.0
  diunggah.)
- Pengisi otomatis dijalankan ulang: kini **530 dari 887** tulisan
  ber-sorotan; 357 sisanya tak punya frasa yang bisa ditebak mesin dan
  akan terisi lewat aturan wajib di atas saat tulisannya disunting.

### Menunggu tindakan pemilik akses

- **Unggah ulang dua mu-plugin** lewat cPanel File Manager:
  `tgr-headless.php` **v3.1.0** (termasuk aturan wajib Sorotan Judul) dan
  `tgr-revalidate.php` v1.1.0 — seluruh butir di atas baru aktif di
  produksi setelah ini.
- Setelah itu, **jalankan dua skrip pemindah dengan `APPLY=1`** agar
  profil dan teks halaman berpindah dari kode ke wp-admin.
- **Pembaruan inti WordPress 6.5.10 → 7.0.4**: runbook-nya sudah
  disiapkan (backup, potret kesehatan sebelum/sesudah, jalur pemulihan)
  — tinggal menunggu jendela pemeliharaan disepakati.

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
