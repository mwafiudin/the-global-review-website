# 8–12 Nov 2026: egress Railway diblok lagi, lalu webhook mengosongkan cache dan situs 500

Status: **Pulih** 12 Nov ±13.00 WIB lewat jalur sementara (IP statis Railway dimatikan + deploy PR #47). 12 Nov sore webiihost membuka blokir 208.77.246.240 dan memasukkannya ke whitelist; .241 dan .242 belum dikonfirmasi, jadi IP statis tetap mati.
Tingkat: P1 / SEV-1 (beranda dan rubrik 500 untuk semua pembaca).
Pelapor: Farrez, tangkapan layar "Terjadi kesalahan" di /category/geopolitik, 12 Nov.

## Ringkasan

Kali ketiga sesudah 23 dan 29 Okt: firewall host webiihost men-DROP koneksi
dari IP statis Railway (208.77.246.240–242) ke `cms.theglobal-review.com`
(172.236.131.177). Dari laptop WordPress tetap menjawab 200 dalam <1 dtk.

Pemicunya kali ini terlihat di log kita sendiri. 8 Nov 13.37.14 WIB sebuah
pemindai celah (`TLM-Audit-Scanner/2.0`, satu IP) menembak situs dengan
ribuan tebakan berkas: `/.env`, `/config/app.php`, `/x/web.config`,
`/.git/config`. Rute `/[lang]/[slug]` meneruskan segmen terakhir tiap
tebakan ke WordPress sebagai `posts?slug=web.config`, `posts?slug=php.ini`,
dan seterusnya, **dari IP Railway**. Dua menit kemudian, 13.39 WIB, balasan
dari host berhenti total. Jadi yang dilihat firewall host adalah IP kita
mengirim puluhan permintaan berpola serangan.

Tiga hari pertama pembaca hampir tidak merasakannya karena halaman tersaji
dari cache. Lalu 11 Nov 14.17 UTC (21.17 WIB) WordPress mengirim webhook
(ada tulisan disimpan). `/api/revalidate` memanggil
`revalidateTag(tag, { expire: 0 })` untuk `wp:posts`, yang membuang cache
seketika. Setiap halaman yang memuat daftar tulisan (beranda, semua rubrik)
harus mengambil ulang dari WordPress, gagal, dan menjawab 500.

## Bukti

| Cek | Hasil |
|---|---|
| `curl` ber-UA browser ke www, 12 Nov 10.4x WIB | `/`, `/category/geopolitik`, `/category/analisis`: 500 |
| `railway logs`, galat aplikasi | `fetch failed [UND_ERR_CONNECT_TIMEOUT]` dan "pemutus terbuka (5180 galat transport beruntun)" |
| `railway logs --filter UND_ERR_CONNECT_TIMEOUT` per jam | terus-menerus 50–120/jam sejak 8 Nov 06 UTC. Enam kelompok kecil 5–7 Nov (3–24 baris) tidak didahului pemindai dan tidak memutus balasan host: itu host yang lambat, bukan blokir |
| `railway logs --network` 8 Nov 05.00–07.00 UTC, per menit | sampai 06:38 tiap flow egress ke host punya flow ingress (37 pada 06:38); sejak 06:39 ingress 0, egress tinggal SYN 74–370 B |
| `railway logs --http` 8 Nov 06.25–06.41 UTC | `TLM-Audit-Scanner/2.0`: 2.619 permintaan mulai 06:37:14, 1.165 di antaranya sebelum 06:39:05 (1.538 dua segmen, 443 satu segmen bertitik). Tiga pemindai lebih kecil 06:25–06:34 (266, 22, 7 permintaan) |
| Log aplikasi 06:37–06:40 UTC, URL WordPress di pesan galat | 99 slug berbeda diteruskan; 85 di antaranya bukan bentuk slug (nama berkas) (`web.config`, `config.xml`, `php.ini`, `phpinfo.php`, `database.yml`, `laravel.log`, `docker-compose.yml`, …). Galat pertama saat blokir jatuh (06:39:12): `slug=config.xml` dan `slug=web.config` |
| Laju koneksi ke host sebelum blokir | 33–38 koneksi/menit pada 06:37–06:38; satu jam sebelumnya puncak 66/menit tanpa diblokir. Jadi bukan soal jumlah |
| Semua slug tayang di WordPress (`posts?_fields=slug`, 10 halaman, 12 Nov) | 928 slug, semuanya `[a-z0-9_-]`, tanpa titik, terpanjang 157 |
| `railway logs --network --since 30m` | 17 flow egress ke 172.236.131.177 (74/148/222/296 B, SYN diulang), 0 flow ingress darinya |
| Laptop ke `cms.*` (satu permintaan) | 200, 0,75 dtk |
| Service uji sementara di Railway tanpa IP statis, 12 Nov ±12.40 WIB (sudah dihapus) | IP keluar 35.198.232.215, region sin: TCP ke 172.236.131.177:443 tersambung 3 ms, `posts?per_page=1` menjawab 200. Yang diblokir tiga IP statis, bukan seluruh Railway |
| `railway logs --http --filter @path:/api/revalidate --since 4d` | satu webhook, 11 Nov 14:17:52 UTC, 200 |
| `railway logs --http` path `/`, 11 Nov 13.30–15.00 UTC | 200 sampai 14:1x, 500 sejak 14:1x (setelah webhook), 500 terus sampai kini dalam ±20 ms |

## Sebab

- **Langsung (blokir):** firewall host men-DROP IP egress Railway.
- **Pemicu blokir (terbukti, dikonfirmasi log host):** kode kita meneruskan
  tebakan pemindai ke WordPress. `getArticle(slug)` tidak memeriksa bentuk
  slug, dan `generateMetadata` memanggilnya juga saat segmen `[lang]` bukan
  bahasa yang sah. Webiihost mengirim baris `csf.deny`-nya (12 Nov, lewat
  Wafi):

  ```
  208.77.246.240 # lfd: (SUSPECTFILES) Suspected Files Access via
  /var/log/nginx/access.log 208.77.246.240 (SG/Singapore/-): 10 in the last
  3600 secs - Sun Nov  8 13:38:55 2026
  ```

  Jadi aturannya **SUSPECTFILES** milik lfd, bukan ModSecurity seperti dugaan
  awal saya: lfd membaca access log nginx host, menghitung permintaan yang
  menyebut nama berkas mencurigakan (`web.config`, `.env`, `php.ini`, ...),
  dan memblokir IP yang mencapai 10 dalam satu jam. URL kita memuat nama
  berkas itu di query (`posts?slug=web.config`). Waktunya cocok sampai menit:
  pemindai mulai 13.37.14 WIB, blokir 13.38.55, balasan host terakhir di log
  jaringan kita pada menit 13.38, galat pertama 13.39.12 (`slug=config.xml`).
  Hanya .240 yang tercatat di `csf.deny`; Railway HA memakai ketiganya
  bergantian, dan kebetulan lalu lintas saat itu keluar lewat .240.
  Insiden 23 dan 29 Okt tidak bisa dicek ulang: log HTTP Railway untuk
  tanggal itu sudah tidak tersedia.
- **Langsung (500):** `{ expire: 0 }` di webhook. Menurut docs
  `revalidateTag` Next 16, `expire: 0` berarti "stale content is never
  served"; profil `"max"` menyajikan salinan lama selagi revalidasi berjalan,
  dan bila revalidasi gagal salinan lama tetap dipakai.
- **Yang memperpanjang:** whitelist yang diminta sejak 23 Okt belum
  terkonfirmasi. Pemantau "Pantau situs" tetap lulus 8–11 Nov karena ia
  hanya memeriksa tulisan terbaru, yang saat itu masih tersaji dari cache;
  ia baru gagal 11 Nov 17.23 UTC (issue #46), tiga jam setelah situs 500.

## Yang diubah di kode kita

`src/app/api/revalidate/route.ts`: `profilUntuk()` memilih `"max"` untuk
semua tag, kecuali tag detail `wp:post:{slug}` bila tulisannya ditarik
(`status_new` bukan `publish`), yang tetap `{ expire: 0 }` supaya tulisan
yang dihapus tidak tersaji lagi. Tes regresinya merah bila `expire: 0`
dikembalikan.

`src/lib/wp/articles.ts`: `slugSah()` menolak slug yang mustahil milik
WordPress (ada titik, garis miring, bintang, kurung, spasi, lebih dari 200
karakter) sebelum ada permintaan ke host. `getArticle` langsung menjawab
"tidak ada". Tes regresinya memastikan `fetch` tidak dipanggil untuk
`web.config`, `.env`, `phpinfo.php`, `[slug]`.

`src/app/api/search/route.ts`: `normalisasiKueri()` hanya meneruskan
huruf, angka, spasi, tanda hubung, dan apostrof. Belum ada bukti pencarian
ikut memicu blokir; ini jalur kedua yang meneruskan ketikan orang luar ke
host, jadi ditutup sekalian.

Akibat sampingan yang disengaja: sesudah redaksi menerbitkan, pembaca
pertama di sebuah halaman daftar masih melihat versi lama, pembaca
berikutnya versi baru. Tulisan baru sendiri tidak terpengaruh karena
halamannya belum punya cache.

## Penanganan

1. Minta webiihost membuka blokir **dan** menaruh 208.77.246.240, .241,
   .242 di `csf.allow` (port 443) + `csf.ignore`, beserta alasan blokirnya.
2. **Jangan merge/deploy PR ini sebelum WordPress terjangkau lagi.** Halaman
   detail yang masih tersaji dari cache ikut hilang bila container diganti.
3. Setelah terbuka: `railway logs --network --since 10m --json` memuat flow
   ingress dari 172.236.131.177, `/` menjawab 200; lalu PR di-merge.

## Pemulihan 12 Nov

| Waktu (WIB) | Kejadian |
|---|---|
| ±12.40 | Service uji tanpa IP statis: WordPress menjawab 200 dari 35.198.232.215. Service dihapus. |
| 12.5x | `railway outbound-network static-ip disable -s web` (keputusan Farrez). Berlaku di deploy berikutnya. |
| 12.57 | PR #47 di-merge (`273877f`), deploy `74f095a4` sukses. |
| ±13.00 | `/`, `/category/geopolitik`, `/category/analisis`, artikel terbaru: 200. `/x/web.config`: 404 dalam 0,09 dtk. `railway logs --network`: 28 flow ingress dari 172.236.131.177 dalam 5 menit. `node scripts/pantau-artikel-terbaru.mjs`: sehat. |

12 Nov ±18.00 WIB, uji service sementara ber-IP statis (5 deploy, lalu dihapus): tiap deploy memakai SATU IP untuk semua koneksinya (30/30), bergantian antar deploy. Hasil per IP: .240 30/30 ke WordPress 200 (2 deploy), .241 30/30 (2 deploy), .242 30/30 (1 deploy). Ketiganya saat ini tidak diblokir. Pelajaran: HA Railway membagi IP per container, bukan per koneksi, jadi satu container yang kena blokir mati total walau dua IP lain sehat.

12 Nov sore webiihost (lewat Wafi) membuka blokir 208.77.246.240 dan
menambahkannya ke whitelist. Belum ada konfirmasi untuk .241 dan .242.

Keadaan sekarang menyimpang dari ADR 0001 dengan sengaja: IP keluar
diambil dari kumpulan bersama Railway dan bisa berganti tiap deploy. Jadi
**setiap deploy adalah lemparan dadu kecil**; sesudah deploy, cek
`railway logs --network` untuk flow ingress dari host. Jalan kembali:
webiihost mengonfirmasi **ketiga** IP (208.77.246.240–242) sudah di
`csf.allow` dan `csf.ignore` (.240 sudah, .241 dan .242 belum), lalu
`railway outbound-network static-ip enable -s web` dan satu deploy.

## Pelajaran

- Webhook revalidasi tidak boleh menjadi jalan untuk membuang satu-satunya
  salinan isi. Bawaannya stale-while-revalidate; pembuangan seketika hanya
  untuk konten yang memang harus hilang.
- Apa pun yang diketik orang luar dan kita teruskan ke host bersama akan
  dinilai firewall host sebagai perbuatan IP kita. Saring bentuknya di sisi
  kita dulu; yang mustahil sah jangan pernah dikirim.
- Firewall host bersama tidak hanya membaca kode status: lfd SUSPECTFILES
  membaca URL di access log. Nama berkas di query string sudah cukup untuk
  diblokir, walau WordPress menjawab 200 dan tidak ada 406 sama sekali.
- "Host memblokir kita" bukan akhir diagnosis. Lihat dulu apa yang kita
  kirim di menit-menit sebelum blokir (`railway logs --http` dan URL di
  pesan galat aplikasi).
- Pemantau yang hanya membandingkan tulisan terbaru buta terhadap blokir
  selama redaksi tidak menerbitkan apa pun.
