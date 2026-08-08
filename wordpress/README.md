# Sisi WordPress

Berkas untuk dijalankan/dipasang di WordPress produksi TGR
(<https://theglobal-review.com>). Frontend Next.js membacanya lewat REST API.

```
wordpress/
├── mu-plugins/
│   └── tgr-headless.php     # CPT Podcast, Album, Jajak Pendapat + field Bedah Buku
└── cli/
    ├── 01-backup.sh         # cadangkan basis data + wp-content
    ├── 02-inventaris.sh     # tarik CSV konten untuk bahan pemetaan rubrik
    ├── 03-pasang-mu-plugin.sh
    └── 04-rubrik.sh         # tata ulang 37 kategori → rubrikasi desain baru
```

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

Terpisah dari SSH, frontend memerlukan kredensial baca/tulis REST:

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
| `/wp-json/wp/v2/polls` | Jajak pendapat (non-publik, perlu autentikasi) |

Field tambahan pada tulisan biasa (`/wp-json/wp/v2/posts`):

| Meta | Kegunaan |
|---|---|
| `tgr_sorotan` | Frasa judul yang diberi coretan penanda di frontend |
| `tgr_buku_judul`, `tgr_buku_penulis`, `tgr_buku_penerbit`, `tgr_buku_tahun`, `tgr_buku_isbn`, `tgr_buku_sampul` | Data ulasan Bedah Buku |

**Bedah Buku sengaja tetap berupa kategori**, bukan tipe konten tersendiri,
agar 78 URL ulasan yang sudah terindeks tidak berubah.

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
