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

---

## Tiga hal yang perlu dikabarkan ke pengelola situs

Ketiganya bukan larangan — hanya perlu penyesuaian kecil di situs, dan
biasanya selesai belasan menit. Yang berbahaya adalah melakukannya tanpa
memberi tahu, karena **tidak ada pesan error apa pun** yang muncul.

| Bila Anda ingin… | Yang terjadi bila langsung dilakukan |
|---|---|
| **Membuat kategori/rubrik baru** | Tulisannya tetap tampil, tapi rubriknya belum punya tempat di menu situs |
| **Menambah penulis baru** | Tulisannya tampil, tapi namanya muncul sebagai "Redaksi" |
| **Membuat Halaman baru** (bukan Pos) | Tidak muncul di situs baru — halaman statis dikelola terpisah |

Dan satu larangan sungguhan: **jangan mengubah "slug" kategori** yang sudah
ada. Mengganti *nama tampilannya* aman; mengganti slug-nya memutus
sambungan dan membuat tulisan di dalamnya kehilangan rubrik — tanpa
peringatan.

---

## Menu baru di wp-admin

Selain Pos seperti biasa, kini ada empat menu tambahan:

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

### Jajak Pendapat

Isi pertanyaan, pilih **artikel sumber** (kartu jajak pendapat menautkan
pembaca ke sana — wajib), tanggal tutup, lalu daftar pilihan jawaban.
Tombol **Tambah pilihan** untuk menambah baris. Minimal dua pilihan.

Kolom **"Suara awal"** adalah angka pembuka sebelum pembaca ikut memilih —
isi 0 bila ingin mulai dari nol.

### Pelanggan Buletin

Daftar pembaca yang mendaftar lewat formulir di situs. Hanya untuk
dilihat — tidak bisa ditambah manual. Tombol **Unduh CSV** mengekspor
seluruh daftarnya kapan saja.

Daftar ini berisi **data pribadi pembaca**: jangan dibagikan ke luar
redaksi, dan gunakan hanya untuk mengirim buletin sebagaimana yang
dijanjikan saat mereka mendaftar.

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
