# Sisi WordPress

Berkas untuk dijalankan/dipasang di WordPress produksi TGR
(<https://theglobal-review.com>). Frontend Next.js membacanya lewat REST API.

```
wordpress/
├── mu-plugins/
│   ├── tgr-headless.php     # CPT (Podcast, Album, Poll, Pesan Masuk, Pengurus &
│   │                        #   Redaksi) + field Bedah Buku + isi halaman statis
│   ├── tgr-revalidate.php   # webhook: simpan di wp-admin → frontend Vercel segar
│   └── tgr-alih-sementara.php  # SEMENTARA: beranda lama → situs baru (302)
├── rest/                    # perkakas yang benar-benar dipakai (lihat catatan SSH)
│   ├── wp.mjs               # klien REST + Application Password, semafor & jeda
│   ├── arsipkan-lama.mjs    # pindahkan tulisan lama ke Tong Sampah
│   ├── rubrik.mjs           # tata ulang kategori (buat/ganti/induk/gabung)
│   ├── periksa-rubrik.mjs   # laporkan selisih kategori WP ↔ peta di kode
│   ├── impor-podcast.mjs    # pindahkan daftar podcast dari kode ke wp-admin
│   ├── sorotan.mjs          # isi tgr_sorotan dari kosakata korpus judul
│   ├── impor-buku.mjs       # pindahkan 4 ulasan Bedah Buku dari kode ke wp-admin
│   ├── impor-orang.mjs      # pindahkan profil pengurus & masthead redaksi (+foto)
│   ├── isi-halaman.mjs      # isi meta 4 halaman statis + tandai buku pilihan
│   ├── periksa-kesehatan.mjs # potret kesehatan hanya-baca + mode --banding
│   └── kesehatan-*.json     # hasil potret kesehatan (jejak audit, ikut di repo)
└── cli/                     # versi WP-CLI, tidak terpakai (host tanpa SSH)
    ├── 01-backup.sh         # cadangkan basis data + wp-content
    ├── 02-inventaris.sh     # tarik CSV konten untuk bahan pemetaan rubrik
    ├── 03-pasang-mu-plugin.sh
    └── 04-rubrik.sh         # tata ulang 37 kategori → rubrikasi desain baru
```

Semua skrip di `rest/` **mode tinjauan secara bawaan**; tambahkan `APPLY=1`
untuk benar-benar menulis, dan semuanya aman dijalankan ulang.
(`periksa-kesehatan.mjs` tidak pernah menulis ke WordPress — tanpa `APPLY`.)

---

## Kondisi hosting (hasil pemeriksaan, Agustus 2026)

| Aspek | Temuan |
|---|---|
| Panel | **cPanel** — port 2083 menjawab, port Plesk (8443/8880) tertutup |
| WHM | Port 2087 menjawab |
| IP server | 172.236.131.177 |
| SSH | **Belum terbuka.** Port 22, 2200, 2222, 2022, 22222, 65002 seluruhnya tertutup/terfilter |

Artinya SSH perlu **diaktifkan lebih dulu oleh Webiihost** — pada banyak layanan
hosting, SSH memang dimatikan secara bawaan dan baru dibuka atas permintaan
(kadang disertai verifikasi identitas), atau dibatasi daftar IP.

### Tiga jalur menjalankan WP-CLI, berurut dari yang paling disarankan

**1. SSH** — paling leluasa, bisa dipakai skrip otomatis dari mesin lokal.
Di cPanel: **Security → SSH Access → Manage SSH Keys** untuk mendaftarkan kunci.
Bila menu itu tidak ada, berarti fiturnya dikunci di tingkat penyedia.

**2. Terminal cPanel** — bila SSH tidak kunjung dibuka. Di cPanel:
**Advanced → Terminal**. Ini shell sungguhan di dalam peramban, berjalan sebagai
pengguna cPanel, dan **WP-CLI bisa dijalankan di sana**. Skrip `cli/` tinggal
disalin-tempel isinya. Kelemahannya: tidak bisa diotomatiskan dari luar.

**3. Tanpa keduanya** — integrasi headless **tetap bisa berjalan**, karena REST
API sudah terbuka. Yang hilang hanya kemudahan: backup memakai
*cPanel → Backup Wizard* atau phpMyAdmin, dan penataan kategori dilakukan lewat
wp-admin atau skrip yang memanggil REST API.

### Yang perlu ditanyakan ke Webiihost

> Mohon informasinya untuk akun hosting theglobal-review.com:
> 1. Apakah akses SSH bisa diaktifkan? Bila ya, di port berapa, dan apakah
>    perlu whitelist IP?
> 2. Apakah fitur Terminal di cPanel tersedia/bisa diaktifkan?
> 3. Apakah WP-CLI sudah terpasang di server? (perintah `wp --info`)
> 4. Layanan ini shared hosting atau VPS?
> 5. Berapa path lengkap instalasi WordPress-nya?

---

## Bila SSH sudah aktif

1. Akses SSH ke akun hosting (host, port, dan nama pengguna).
2. Konfirmasi apakah **WP-CLI sudah terpasang**. Cek dengan `wp --info`.
   Bila belum ada dan hosting mengizinkan, pasang di ruang pengguna:

   ```bash
   curl -O https://raw.githubusercontent.com/wp-cli/wp-cli/v2.11.0/utils/wp-cli.phar
   php wp-cli.phar --info
   mkdir -p ~/bin && mv wp-cli.phar ~/bin/wp && chmod +x ~/bin/wp
   echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
   ```

3. Path instalasi WordPress di server (mis. `/var/www/theglobal-review.com`).

### Cara memberi akses dengan aman

**Gunakan kunci SSH, bukan kata sandi.** Kata sandi jangan dikirim lewat chat,
surel, atau WhatsApp. Di cPanel, kunci publik didaftarkan lewat
**Security → SSH Access → Manage SSH Keys → Import Key**, lalu jangan lupa
menekan **Authorize**.

```bash
# 1) Di mesin lokal — buat kunci khusus proyek ini
ssh-keygen -t ed25519 -f ~/.ssh/tgr -C "coderoach-tgr"

# 2) Kirim ISI ~/.ssh/tgr.pub (kunci PUBLIK, aman dibagikan) ke Webiihost
#    atau tempelkan sendiri ke ~/.ssh/authorized_keys di server

# 3) Daftarkan di ~/.ssh/config agar skrip cukup memakai nama "tgr"
cat >> ~/.ssh/config <<'EOF'
Host tgr
  HostName <alamat-server>
  User <nama-pengguna>
  Port 22
  IdentityFile ~/.ssh/tgr
EOF

# 4) Uji
ssh tgr "wp --info"
```

Berkas `~/.ssh/tgr` (kunci privat) **tidak pernah** dibagikan dan tidak masuk
repositori.

### Application Password (untuk REST API)

**Fase 1 (baca artikel) TIDAK memerlukan ini** — seluruh endpoint yang
dipakai frontend terbuka publik. Application Password baru dibutuhkan di
Fase 2: membaca CPT `polls` yang non-publik, batas `per_page` 200, dan
unggah media. Saat waktunya tiba:

1. wp-admin → Pengguna → profil → **Application Passwords**
2. Beri nama, mis. `frontend-nextjs`
3. Simpan hasilnya sebagai variabel lingkungan, **jangan** di dalam kode:

   ```
   WP_API_URL=https://theglobal-review.com/wp-json
   WP_APP_USER=<nama-pengguna>
   WP_APP_PASSWORD=<sandi-aplikasi>
   ```

Jangan pernah memakai kata sandi utama akun administrator.

---

## Urutan menjalankan

Selalu di **staging** lebih dulu.

```bash
# Di server
bash 01-backup.sh
bash 02-inventaris.sh      # unduh hasilnya, isi kolom rubrik_baru bersama redaksi

# Dari mesin lokal
HOST=tgr WP_PATH=/var/www/theglobal-review.com bash 03-pasang-mu-plugin.sh

# Di server — tinjau dulu, jalankan setelah pemetaan disetujui
bash 04-rubrik.sh
APPLY=1 bash 04-rubrik.sh
```

---

## Yang dihasilkan mu-plugin

Setelah `tgr-headless.php` terpasang, REST API bertambah:

| Endpoint | Isi |
|---|---|
| `/wp-json/wp/v2/podcasts` | Penampilan di kanal media lain |
| `/wp-json/wp/v2/albums` | Album dokumentasi kegiatan |
| `/wp-json/wp/v2/polls` | Jajak pendapat (terverifikasi terbaca anonim — cukup untuk frontend) |
| `/wp-json/wp/v2/orang` | Profil pengurus GFI & masthead redaksi (sejak v3.0) |

Frontend membaca semuanya sejak Fase 2a
(`src/lib/wp/podcasts|gallery|polls|orang.ts`). Podcast masih punya
cadangan di kode (`src/data/podcasts.ts` — cermin konten nyata, jaring
pengaman bila WP tumbang), tetapi **data contoh album dan jajak pendapat
sudah dihapus**: koleksi kosong kini berarti halaman Galeri menampilkan
keadaan kosong yang jujur ("Belum ada album.") dan seksi jajak pendapat
di beranda disembunyikan — sampai redaksi menerbitkan yang sebenarnya,
tanpa deploy.

**Pembaruan v2.0 — layar editor** (timpa `tgr-headless.php` lama di
`mu-plugins/` lewat File Manager, cek beranda sesudahnya; tidak perlu flush
permalink karena hanya menambah meta + layar admin).

Sebelum versi ini, ketiga tipe konten **tidak bisa diisi redaksi**: field
`tgr_opsi` (daftar pilihan jawaban) dan `tgr_foto` (daftar lampiran)
berbentuk larik, sedangkan kotak Custom Fields bawaan hanya menerima
sepasang teks. v2.0 menambahkan kotak isian yang sebenarnya:

| Layar | Isi kotak |
|---|---|
| **Jajak Pendapat** | Pertanyaan · pemilih artikel sumber · tanggal tutup (kalender) · tabel pilihan jawaban yang bisa ditambah/dikurangi, lengkap dengan suara awal |
| **Podcast** | Kanal · narasumber · format · kolom video yang **menerima URL YouTube penuh** (ID-nya diambil otomatis) · tanggal tayang · centang "penampilan utama" (otomatis melepas tanda dari yang lain) |
| **Album Galeri** | Jenis kegiatan · lokasi · tanggal · **pemilih foto dari Media Library**, bisa banyak sekaligus dan urutannya digeser |

Semua tanggal memakai pemilih kalender sehingga formatnya dijamin
`YYYY-MM-DD` — frontend menempelkan jam ke nilai ini, jadi teks bebas akan
tampil sebagai "Invalid Date" di situs. Layar daftar (Semua Podcast/Album/
Jajak Pendapat) juga mendapat kolom ringkas: kanal, jumlah foto, jumlah
pilihan, artikel sumber, dan tanda penampilan utama.

Penyimpanan lewat REST tidak terpengaruh kotak-kotak ini (nonce admin tidak
ada di permintaan REST), jadi pengisian programatik dan pengisian manual
bisa berjalan berdampingan.

### Suara jajak pendapat (v2.1)

Suara pembaca disimpan di WordPress: tiap pilihan punya penghitung sendiri
(`tgr_suara_<id>`), dinaikkan lewat satu pernyataan `UPDATE` yang atomik —
bukan pola baca-ubah-tulis yang membuat dua pemilih bersamaan saling
menimpa. Rekapnya terbaca di REST sebagai field `tgr_hasil` pada
`/wp-json/wp/v2/polls`, dan tampil di wp-admin pada layar sunting jajak
pendapat (bagian **Suara pembaca**) serta kolom **Suara** di daftarnya.

"Suara awal" yang diketik redaksi tetap terpisah dan tidak pernah
tersentuh; frontend menjumlahkan keduanya. Endpoint `tgr/v1/vote`
mensyaratkan `X-TGR-Secret` seperti endpoint lain, menolak pilihan yang
tidak terdaftar, menolak jajak pendapat yang sudah lewat tanggal tutup, dan
membatasi satu suara per alamat IP per jajak pendapat selama 24 jam.

### Pelanggan buletin

v2.0 juga menambah menu **Pelanggan Buletin**. Pembaca yang mengisi formulir
di situs baru tersimpan sebagai tipe konten `tgr_subscriber` — alamat email
jadi judulnya, sehingga langsung terlihat, tercari, dan bisa diurutkan di
wp-admin. Tombol **Unduh CSV** di atas daftar mengekspor seluruhnya (email,
tanggal daftar, halaman asal) kapan pun dibutuhkan.

Catatan keamanan yang disengaja:

- Tipe konten ini **tidak diekspos ke REST** (`show_in_rest` false). Endpoint
  `wp/v2` situs ini terbuka dibaca siapa pun, dan daftar alamat email adalah
  data pribadi.
- Endpoint penerimanya (`tgr/v1/subscribe`) mensyaratkan header
  `X-TGR-Secret` — sama seperti webhook revalidasi. Browser tidak pernah
  memegang secret itu; frontend meneruskan pendaftaran dari sisi server.
- Alamat IP pendaftar disimpan sebagai sidik (hash), bukan apa adanya:
  cukup untuk menelusuri penyalahgunaan tanpa menyimpan data yang tidak
  diperlukan. Rem per IP berlaku di kedua sisi.
- Menambah pelanggan lewat wp-admin sengaja dimatikan (`create_posts` =
  `do_not_allow`) — daftar ini hanya boleh tumbuh dari pendaftaran nyata.

### Pesan masuk (v3.0)

**Pembaruan v3.0 memakai cara pasang yang sama dengan v2.0**: timpa
`tgr-headless.php` lama di `mu-plugins/` lewat File Manager, cek beranda
sesudahnya — kali ini `tgr-revalidate.php` (v1.1) juga perlu ditimpa
bersamaan. Tidak perlu flush permalink untuk `tgr_pesan` (tidak punya URL
publik), tapi CPT `tgr_orang` butuh **Settings → Permalinks → Save
Changes** sekali seperti biasa.

v3.0 menambah menu **Pesan Masuk**: kiriman formulir Hubungi Kami tersimpan
sebagai tipe konten `tgr_pesan` — nama pengirim jadi judul, rinciannya
(email, telepon, subjek, halaman asal) terbaca di layar detail yang
hanya-baca, dengan kolom daftar Nama/Email/Subjek/Notifikasi/Diterima dan
tombol **Unduh CSV**. Tiap pesan juga diteruskan sebagai email notifikasi
dengan **Reply-To diarahkan ke pengirim** — membalas dari aplikasi email
langsung sampai ke penanya. Penerimanya email admin situs, atau konstanta
`TGR_KONTAK_EMAIL` bila didefinisikan di wp-config.php (lihat langkah
pemasangan di bawah).

Catatan keamanan yang disengaja (pola yang sama dengan Pelanggan Buletin):

- Tipe konten ini **tidak diekspos ke REST** (`show_in_rest` false) — isi
  pesan, alamat email, dan nomor telepon adalah data pribadi, sedangkan
  endpoint `wp/v2` situs ini terbuka dibaca siapa pun.
- Endpoint penerimanya (`tgr/v1/contact`) mensyaratkan header
  `X-TGR-Secret`. Browser tidak pernah memegang secret itu; frontend
  meneruskan kiriman dari sisi server.
- Alamat IP pengirim disimpan sebagai sidik (hash), bukan apa adanya.
  Rem laju berlaku di kedua sisi: 5/menit per IP di frontend, 5/jam per
  IP di WordPress.
- Menambah pesan lewat wp-admin sengaja dimatikan (`create_posts` =
  `do_not_allow`) — daftar hanya tumbuh dari kiriman nyata.
- **Pesan disimpan dulu, email menyusul**: kegagalan `wp_mail` tidak
  pernah menghilangkan pesan — statusnya tercatat di kolom Notifikasi.
- Ekspor CSV mengawali sel yang berawalan `=` `+` `-` `@` dengan tanda
  kutip — penangkal injeksi formula saat berkas dibuka di Excel.

### Pengurus & Redaksi dan isi halaman statis (v3.0)

Tipe konten `tgr_orang` (REST `orang`, terbuka dibaca — memang konten
publik) mengisi dua halaman sekaligus: `/pengurus-gfi` (kelompok
*pengurus*) dan `/redaksi` (kelompok *redaksi*). Nama = judul pos, foto =
Gambar Unggulan, jabatan/bio (plus versi Inggris) lewat kotak isian,
urutan tampil lewat **Atribut → Urutan** (bisa juga dari Quick Edit).
Entri pengurus butuh foto + jabatan + bio agar tampil; entri redaksi
cukup jabatan. Webhook `tgr-revalidate.php` naik ke **v1.1** dan ikut
meneruskan tipe ini; `tgr_pesan` dan `tgr_subscriber` sengaja **tidak**
diteruskan — keduanya tidak pernah tampil di halaman mana pun.

Empat Laman lama kini memberi isi halaman statis situs baru lewat metabox
**"Isi Halaman — Situs Baru"** (hanya muncul di keempat Laman itu).
Petanya **dikunci ke ID, bukan slug**, karena slug di produksi tertukar:

| ID | Halaman situs baru | Catatan slug WP |
|---|---|---|
| 574 | `/tentang-tgr` | slug `tentang-gfi` — padahal judulnya "Tentang The Global Review"! |
| 576 | `/tentang-gfi` | slug `tentang-gfi-2` |
| 572 | `/hubungi-kami` | |
| 611 | `/pengurus-gfi` | |

26 kunci meta (`tgr_lead(_en)`, `tgr_paragraf(_en)`, `tgr_visi(_en)`,
`tgr_misi_butir(_en)`, `tgr_alamat`, `tgr_jam(_en)`, `tgr_peta_q`, dst.);
field berbentuk daftar diisi satu item per baris. Kolom `_en` kosong
jatuh ke teks Indonesia, dan field kosong jatuh ke teks bawaan di kode —
halaman tidak pernah tampil bolong.

Kotak **Identitas Buku** juga bertambah centang **"Buku pilihan sidebar"**
(meta `tgr_buku_unggulan`, satu-aktif seperti penampilan utama podcast) —
menentukan kartu promosi buku di sidebar situs.

Field tambahan pada tulisan biasa (`/wp-json/wp/v2/posts`):

| Meta | Kegunaan |
|---|---|
| `tgr_sorotan` | Frasa judul yang diberi coretan penanda di frontend (kotak **Sorotan Judul** di sisi kanan layar edit, sejak v2.2) |
| `tgr_buku_judul`, `tgr_buku_penulis`, `tgr_buku_penulis_lengkap`, `tgr_buku_penerbit`, `tgr_buku_tahun`, `tgr_buku_isbn`, `tgr_buku_sampul`, `tgr_buku_podcast` | Identitas buku untuk rubrik Bedah Buku (kotak **Identitas Buku** di layar edit, sejak v2.3) |

**Bedah Buku sengaja tetap berupa kategori**, bukan tipe konten tersendiri,
agar 78 URL ulasan yang sudah terindeks tidak berubah.

---

## Memasang mu-plugin TANPA SSH (cPanel File Manager)

SSH belum terbuka, tapi kedua mu-plugin bisa dipasang lewat peramban.
Sekali sesi ±30 menit:

1. Masuk cPanel: `https://theglobal-review.com:2083`.
2. Temukan akar WordPress. Bila ada **WP Toolkit**, buka — daftar instalasi
   menampilkan path lengkapnya (sekalian menjawab pertanyaan #5 ke Webiihost).
   Tanpa itu: **File Manager → public_html**, pastikan ada `wp-config.php`
   dan folder `wp-content/`.
3. Masuk `wp-content/`. Bila belum ada folder `mu-plugins/`: tombol
   **+ Folder** → beri nama `mu-plugins`.
4. **Unggah satu berkas per satu** (tombol Upload): mulai `tgr-headless.php`.
   Setelah tiap unggahan, buka beranda situs di tab lain — bila masih
   termuat, berkasnya sehat. (Salah ketik PHP di mu-plugins = situs mati
   total, dan mu-plugins tidak bisa dinonaktifkan dari dasbor. Pemulihan:
   hapus/ganti nama berkasnya di File Manager, situs langsung hidup lagi.)
5. Sebelum menyunting `wp-config.php`, unduh salinannya dulu (cadangan).
   Lalu klik kanan → Edit, dan tambahkan DI ATAS baris
   `/* That's all, stop editing! */`:

   ```php
   define( 'TGR_REVALIDATE_SECRET', '<hasil openssl rand -hex 32>' );
   define( 'TGR_REVALIDATE_URL', 'https://the-global-review-website.vercel.app/api/revalidate' );
   ```

   Opsional, untuk formulir kontak (sejak v3.0): tambahkan juga
   `define( 'TGR_KONTAK_EMAIL', 'redaksi@contoh.com' );` bila notifikasi
   pesan masuk ingin dikirim ke alamat selain email admin situs
   (Settings → General → Administration Email Address). Tanpa konstanta
   ini, email admin itulah yang dipakai — formulir tetap berfungsi.

6. Unggah `tgr-revalidate.php` ke `mu-plugins/` (cek beranda lagi).
7. wp-admin → **Settings → Permalinks → Save Changes** (tanpa mengubah
   apa pun) — menyegarkan rewrite agar slug CPT (`/podcast/…`) dikenali.
8. Verifikasi: `/wp-json/wp/v2/types` kini memuat `tgr_podcast` dkk., dan
   `/wp-json/wp/v2/podcasts` menjawab `[]` (bukan 404 lagi).

### Webhook revalidasi (tgr-revalidate.php)

Setiap terbit/sunting/hapus tulisan, WordPress mem-POST
`{ type, slug, status_new, … }` ke `/api/revalidate` di Vercel dengan header
`X-TGR-Secret`. Frontend langsung mengadaluwarsakan cache halaman terkait —
perubahan tampil dalam hitungan detik. Redaksi melihat hasilnya sebagai
notice di layar edit ("Situs baru diperbarui …" / peringatan bila gagal).

Nilai secret **harus sama** di dua tempat: konstanta `TGR_REVALIDATE_SECRET`
di wp-config.php dan variabel `REVALIDATE_SECRET` di Vercel (Project →
Settings → Environment Variables, tandai *Sensitive*, lalu redeploy).
Buat nilainya dengan `openssl rand -hex 32`; jangan kirim lewat chat/surel.

Kegagalan kirim tidak diulang — frontend memasang ISR berkala sebagai
jaring pengaman, jadi webhook yang hilang tersusul paling lama satu jendela
revalidasi. Uji ujung-ke-ujung: sunting judul satu tulisan → halaman Vercel
berubah ≤30 detik → log fungsi `/api/revalidate` di dasbor Vercel mencatat 200.

### Alihan sementara beranda (tgr-alih-sementara.php)

Pengunjung `theglobal-review.com` diantar ke situs baru, **hanya dari
halaman depan** dan dengan status **302 (sementara)** — mesin pencari
diberi tahu agar tetap mengindeks alamat aslinya, bukan alamat
`*.vercel.app` yang nanti dibuang saat peralihan domain sesungguhnya
(lihat [`docs/peralihan-domain.md`](../docs/peralihan-domain.md)).

**Jangan memakai cPanel → Redirects untuk ini.** Form itu bekerja per
direktori di `.htaccess`; sekali *Wild Card Redirect* dicentang, `/wp-json`,
`/wp-admin`, dan `/wp-content/uploads` ikut teralihkan — dan ketiganya
justru yang dipakai situs baru untuk hidup.

| | |
|---|---|
| Yang teralihkan | `https://theglobal-review.com/` saja |
| Tetap di WordPress | artikel, rubrik, halaman, feed, `/wp-json`, `/wp-admin`, media |
| Pengecualian | pengguna yang sedang masuk, dan `?beranda-lama` |
| Mengembalikan | hapus berkasnya dari `mu-plugins/` — tidak ada jejak lain |

Berkas ini memang berumur pendek: hapus pada tahap 2 runbook peralihan
domain, saat WordPress pindah ke `cms.theglobal-review.com` — bila
dibiarkan, ia ikut mengalihkan beranda cms ke `*.vercel.app`.

---

## Perilaku WAF/nginx host (ditemukan Agustus 2026)

- **User-Agent `curl/*` ditolak (HTTP 406).** Skrip pemeriksa apa pun harus
  memakai UA lain (frontend memakai `TGR-Frontend/1.0`).
- **Parameter `?author=N` diblokir (HTTP 403)** — aturan anti-enumerasi.
  Frontend memakai sintaks array REST yang sah, `?author[]=N`, yang lolos.
  Bila suatu saat halaman penulis kosong mendadak, periksa apakah aturan
  WAF host berubah.
- **Rate-limit (HTTP 503)** muncul bila permintaan beruntun terlalu deras
  (mis. menarik daftar 100 tulisan berulang-ulang). Klien frontend memasang
  jeda sebelum mengulang dan meng-cache hasil petaan, jadi lalu lintas
  normal aman.

---

## Catatan penting

- **Pola URL dipertahankan** (`/{slug}/` di akar domain). Tidak ada redirect
  yang perlu dibuat untuk 5.678 artikel.
- `04-rubrik.sh` memakai **GANTI** (ubah nama term) sebisa mungkin, bukan
  memindahkan tulisan, karena mengubah nama tidak menyentuh kaitan tulisan
  sama sekali — jauh lebih aman untuk arsip sebesar ini.
- Delapan kategori masih menunggu keputusan redaksi; skrip sengaja tidak
  menyentuhnya. Lihat bagian "Menunggu keputusan redaksi" saat menjalankan
  `04-rubrik.sh`.
