# Panduan Redaksi — Menulis untuk Situs Baru

Untuk tim redaksi dan penulis The Global Review. Tidak ada istilah teknis;
kalau ada yang tidak jelas, tanyakan ke pengelola situs.

## Singkatnya: cara kerja Anda tidak berubah

Tetap menulis di **wp-admin** seperti biasa — Tambah Pos Baru, tulis,
Terbitkan. Tidak ada sistem baru yang perlu dipelajari, tidak ada
kata sandi tambahan, tidak ada langkah ekstra.

Yang berubah hanya **tempat pembaca melihatnya**. Situs baru mengambil
tulisan dari wp-admin secara otomatis, biasanya **kurang dari 30 detik**
setelah Anda menekan Terbitkan atau Perbarui.

Setiap kali menyimpan, di layar sunting akan muncul pemberitahuan hijau
*"Situs baru diperbarui…"*. Itu tanda tulisan Anda sudah diteruskan. Bila
yang muncul kuning, tulisan Anda **tetap aman dan tetap akan tampil** —
paling lama satu jam kemudian; laporkan saja bila sering terjadi.

---

## Lima kebiasaan yang sangat memengaruhi tampilan

### 1. Gambar Unggulan itu wajib

Gambar unggulan (Featured Image) dipakai sebagai gambar kartu di beranda,
halaman rubrik, dan hasil pencarian. Tulisan tanpa gambar unggulan tetap
tampil, tapi kartunya memakai gambar pengganti yang tidak ada
hubungannya dengan isi.

Ukuran ideal **1200 × 630 piksel** (mendatar). Gambar tegak akan terpotong
di bagian atas dan bawah.

### 2. Kutipan (Excerpt) adalah ringkasan yang dibaca orang

Kolom **Kutipan** di bawah editor menjadi teks ringkasan di kartu artikel
dan di hasil pencarian Google. Bila dibiarkan kosong, sistem memakai
kalimat-kalimat pertama tulisan — sering terpotong di tengah kalimat.

Tulis 1–2 kalimat yang membuat orang ingin membaca. Ini pekerjaan lima
belas detik yang berdampak besar.

### 3. "Lekatkan di atas blog" menentukan artikel utama beranda

Di panel **Terbitkan** → **Visibilitas** → **Sunting**, ada centang
**"Lekatkan di atas blog"**. Tulisan yang dicentang menjadi **artikel
utama besar di paling atas beranda**.

- Centang satu tulisan saja pada satu waktu.
- **Lepas centang tulisan sebelumnya** ketika mengganti — kalau tidak,
  yang tampil bisa bukan yang Anda maksud.
- Tanpa ada yang dicentang, beranda menampilkan tulisan terbaru.

### 4. Rubrik: pilih dari yang sudah ada

Rubrik di situs baru mengikuti kategori di wp-admin. Pilih satu yang
paling tepat; boleh lebih dari satu, dan situs akan memakai yang paling
spesifik (misalnya "Asia Tenggara" menang atas "Internasional").

### 5. Judul yang panjang tetap rapi, tapi hindari yang ekstrem

Tata letak sudah menangani judul panjang. Namun judul di atas ±15 kata
akan mendominasi kartunya dan menenggelamkan yang lain.

### 6. Sorotan Judul: coretan penanda pada frasa kunci — WAJIB sebelum terbit

Di sisi kanan layar edit ada kotak **Sorotan Judul**. Isi dengan satu
frasa yang disalin **persis dari judul** — frasa itu akan diberi coretan
penanda (navy, atau emas pada mode gelap) di situs baru.

- Pada artikel utama beranda dan halaman artikelnya, coretan langsung tampil.
- Pada kartu artikel di daftar, coretan muncul saat kursor menyapu kartunya.

**Sejak Agustus 2026 kotak ini wajib untuk menerbitkan.** Saat kotaknya
kosong, tombol Terbitkan/Perbarui terkunci dan muncul peringatan merah;
isi frasanya, tombol langsung terbuka lagi. Menyimpan **draf** tidak
pernah terkunci — tulisan setengah jadi tetap aman disimpan kapan pun.

Frasa yang tidak ada di judul akan dikosongkan saat disimpan. Jadi kalau
kotaknya kembali kosong setelah Perbarui, artinya frasanya belum cocok
dengan judul — bukan gagal tersimpan. (Beda huruf besar-kecil dibetulkan
otomatis.)

Sebagian besar tulisan lama sudah terisi otomatis (530 dari 887); sisanya
menunggu tangan redaksi — tulisan lama yang masih kosong akan diminta
mengisi saat pertama kali disunting dan diterbitkan ulang. Di daftar
**Tulisan** ada kolom **Sorotan** yang memperlihatkan mana yang masih
kosong (bertanda "—"), supaya tidak perlu membuka satu per satu.

---

## Tiga hal yang perlu dikabarkan ke pengelola situs

Ketiganya bukan larangan — hanya perlu penyesuaian kecil di situs, dan
biasanya selesai belasan menit. Yang berbahaya adalah melakukannya tanpa
memberi tahu, karena **tidak ada pesan error apa pun** yang muncul.

| Bila Anda ingin… | Yang terjadi bila langsung dilakukan |
|---|---|
| **Membuat kategori/rubrik baru** | Tulisannya tetap tampil, tapi rubriknya belum punya tempat di menu situs |
| **Menambah penulis baru** | Tulisannya tampil, tapi namanya muncul sebagai "Redaksi" |
| **Membuat Halaman baru** (bukan Pos) | Tidak muncul di situs baru — hanya empat Laman tertentu yang dibaca situs (lihat *Menyunting isi halaman statis* di bawah) |

Dan satu larangan sungguhan: **jangan mengubah "slug" kategori** yang sudah
ada. Mengganti *nama tampilannya* aman; mengganti slug-nya memutus
sambungan dan membuat tulisan di dalamnya kehilangan rubrik — tanpa
peringatan.

---

## Menu baru di wp-admin

Selain Pos seperti biasa, kini ada enam menu tambahan:

### Podcast

Untuk penampilan tim GFI di kanal media lain. Isi: judul, kanal,
narasumber, format, **video YouTube** (boleh tempel tautan penuh — sistem
mengambil sendiri kodenya), tanggal tayang, dan ringkasan di editor.

Centang **"Penampilan utama"** untuk menaruhnya besar di atas halaman
Podcast — mencentang yang baru otomatis melepas yang lama.

### Album Galeri

Untuk dokumentasi kegiatan. Isi jenis kegiatan, lokasi, tanggal, lalu
klik **Pilih foto** untuk mengambil banyak foto sekaligus dari Media
Library. Urutan foto bisa digeser dengan menyeretnya. **Album tanpa foto
tidak akan tampil di situs.**

Keterangan tiap foto diambil dari kolom *Caption* foto itu di Media
Library — isilah di sana bila ingin ada teks di bawah foto.

Contoh album yang dulu mengisi halaman Galeri sudah dihapus. Selama belum
ada satu album pun yang terbit, halaman itu menampilkan keterangan
**"Belum ada album."** — itu bukan galat. Album pertama yang Anda
terbitkan langsung menggantikannya.

### Jajak Pendapat

Isi pertanyaan, pilih **artikel sumber** (kartu jajak pendapat menautkan
pembaca ke sana — wajib), tanggal tutup, lalu daftar pilihan jawaban.
Tombol **Tambah pilihan** untuk menambah baris. Minimal dua pilihan.

Kolom **"Suara awal"** adalah angka pembuka sebelum pembaca ikut memilih —
isi 0 bila ingin mulai dari nol.

**Melihat hasilnya:** buka kembali jajak pendapat itu, dan di bawah tabel
pilihan ada bagian **Suara pembaca** — berisi jumlah suara nyata per
pilihan, terpisah dari angka pembuka yang Anda ketik. Layar daftar Jajak
Pendapat juga punya kolom **Suara** berisi totalnya. Angka ini dihitung
otomatis dari situs dan tidak bisa disunting.

Satu pembaca dihitung sekali per jajak pendapat (dibatasi per perangkat dan
per alamat internet selama 24 jam). Ini penahan wajar, bukan pengaman
mutlak — sebagaimana jajak pendapat mana pun yang tidak meminta pembaca
masuk akun.

Contoh jajak pendapat (dengan angka suara karangan) sudah dihapus. Bila
belum ada jajak pendapat sama sekali, seksinya di beranda **disembunyikan**
— beranda tetap rapi, tanpa ruang kosong. Seksi itu muncul kembali begitu
Anda menerbitkan jajak pendapat pertama.

### Bedah Buku

Bukan menu tersendiri — **ulasan buku ditulis seperti tulisan biasa**, cukup
beri kategori **Bedah Buku**. Ulasan itu otomatis muncul di halaman Bedah
Buku situs baru.

Bila yang diulas memang sebuah buku, isi kotak **Identitas Buku** di bagian
bawah layar edit: judul buku, penulis, penerbit, tahun, ISBN, dan sampul.
Semuanya opsional — yang kosong disembunyikan, tidak menyisakan ruang
kosong. Sampul sebaiknya foto sampul buku (potret), bukan gambar artikel
biasa; kalau dikosongkan, Gambar Unggulan tulisan yang dipakai.

Di kotak yang sama ada centang **"Buku pilihan sidebar"**: buku yang
dicentang tampil sebagai kartu promosi di kolom samping situs. Satu buku
saja pada satu waktu — mencentang yang baru otomatis melepas yang lama,
sama seperti "Penampilan utama" di Podcast.

### Pelanggan Buletin

Daftar pembaca yang mendaftar lewat formulir di situs. Hanya untuk
dilihat — tidak bisa ditambah manual. Tombol **Unduh CSV** mengekspor
seluruh daftarnya kapan saja.

Daftar ini berisi **data pribadi pembaca**: jangan dibagikan ke luar
redaksi, dan gunakan hanya untuk mengirim buletin sebagaimana yang
dijanjikan saat mereka mendaftar.

### Pesan Masuk

Kiriman formulir **Hubungi Kami** di situs. Tiap pesan tampil dengan nama
pengirim sebagai judulnya; buka untuk melihat email, telepon, subjek, dan
isi pesannya. Semuanya **hanya untuk dibaca** — tidak bisa disunting, dan
tidak bisa ditambah manual. Tombol **Unduh CSV** mengekspor seluruh
daftarnya kapan saja.

Setiap pesan baru juga dikirim sebagai **email pemberitahuan**. Membalas
email itu langsung sampai ke si penanya — alamat balasannya sudah
diarahkan ke pengirim pesan, bukan ke situs. Kolom **Notifikasi** di
daftar menandai (✓) pesan yang emailnya terkirim; yang tidak bertanda
tetap tersimpan utuh di menu ini, jadi tidak ada pesan yang hilang hanya
karena emailnya gagal.

Pemberitahuan dikirim ke alamat email admin situs. Ingin dialihkan ke
alamat lain (misalnya email khusus redaksi)? Minta pengelola situs — ada
pengaturan untuk itu.

Seperti Pelanggan Buletin, daftar ini berisi **data pribadi**: jangan
dibagikan ke luar redaksi.

### Pengurus & Redaksi

Menu ini mengisi dua halaman situs sekaligus: **Pengurus GFI** dan
**Redaksi** (susunan redaksi). Satu orang = satu entri:

- **Nama** ditulis sebagai judul.
- **Kelompok** dipilih di kotak sisi kanan — *Pengurus* atau *Redaksi* —
  menentukan orangnya tampil di halaman mana. Orang yang ada di keduanya
  dibuat dua entri.
- **Foto** dipasang lewat **Gambar Unggulan**, seperti pada tulisan biasa.
- **Jabatan** dan **bio** diisi di kotak isian di bawah editor. Kolom
  versi Inggrisnya boleh dikosongkan — halaman bahasa Inggris memakai
  teks Indonesia sebagai gantinya.
- **Urutan tampil** diatur di kotak **Atribut → Urutan**: angka kecil
  tampil lebih dulu. Bisa juga diubah cepat lewat **Sunting Cepat** di
  daftarnya, tanpa membuka entri satu per satu.

Syarat tampil berbeda per kelompok: entri **Pengurus** butuh foto,
jabatan, **dan** bio supaya muncul di halamannya; entri **Redaksi** cukup
jabatan (foto tidak dipakai di susunan redaksi).

---

## Menyunting isi halaman statis

Empat Laman lama kini menjadi sumber teks halaman statis situs baru:
**Tentang The Global Review**, **Tentang Global Future Institute**,
**Pengurus GFI** (teks pengantarnya), dan **Hubungi Kami** (alamat, jam
kerja, lokasi peta).

Buka **Laman** di wp-admin lalu buka salah satu dari keempatnya. Di bawah
editor ada kotak **"Isi Halaman — Situs Baru"** — di situlah teks yang
dipakai situs, kolom per kolom. (Kotak ini hanya muncul di keempat Laman
itu.)

- Kolom yang berupa daftar (butir isu, butir misi, dan sejenisnya) diisi
  **satu item per baris** — tekan Enter untuk butir baru, tanpa tanda
  hubung atau penomoran.
- Kolom **versi Inggris** boleh kosong: halaman bahasa Inggris memakai
  teks Indonesia sebagai gantinya.
- Kolom yang dikosongkan sama sekali memakai teks bawaan situs — halaman
  tidak pernah tampil bolong.

**Penting:** isi editor besar di atas kotak itu (teks Laman yang lama)
**tidak dipakai situs baru** sama sekali. Menyunting di editor besar
tidak mengubah apa pun di situs — yang dibaca hanya kolom-kolom di kotak
"Isi Halaman — Situs Baru".

---

## Arsip 2022 ke bawah

Atas keputusan GFI, tulisan yang terbit **2022 ke bawah tidak ditampilkan**
di situs baru dan sudah dipindahkan ke **Tong Sampah** di wp-admin.
Arsipnya tersimpan terpisah di Google Drive.

Bila ada tulisan lama yang ingin ditampilkan kembali, jangan menerbitkan
ulang dari Tong Sampah begitu saja — hubungi pengelola situs, karena
batas tahunnya diatur di sisi situs.

---

## Bila ada yang terlihat aneh

1. **Tulisan tidak muncul setelah beberapa menit** — muat ulang paksa
   halaman (Ctrl+Shift+R). Sering kali itu hanya cache peramban Anda.
2. **Masih belum muncul setelah satu jam** — laporkan, sertakan tautan
   tulisannya.
3. **Gambar tidak tampil** — periksa gambar unggulannya sudah terpasang di
   wp-admin.
4. **Rubriknya salah** — kemungkinan kategorinya baru dan belum
   didaftarkan di situs. Laporkan nama kategorinya.

Yang **tidak perlu** Anda khawatirkan: situs tidak akan pernah menampilkan
tulisan yang belum diterbitkan, dan menghapus tulisan di wp-admin selalu
ikut menghapusnya dari situs.
