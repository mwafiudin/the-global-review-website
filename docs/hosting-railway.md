# Hosting: Railway di belakang Cloudflare

Runbook operasional situs `theglobal-review.com` sejak pindah dari Vercel
(September 2026). Ditulis supaya siapa pun yang memegang akses bisa
men-deploy, memeriksa, dan memulihkan situs tanpa bertanya.

---

## 1. Peta

| Lapisan | Apa | Di mana |
|---|---|---|
| DNS + TLS tepi + cache statis | Cloudflare (plan Free), proxy oranye untuk `@` dan `www` | dash.cloudflare.com → zona `theglobal-review.com` |
| Aplikasi | Next.js 16, `next start`, **satu replica** | Railway → workspace "M Izzul Haq Wafiuddin's Projects" → project `the-global-review` → service `web` |
| Data | WordPress (REST `wp-json`) | `cms.theglobal-review.com` (cPanel webiihost, IP `172.236.131.177`) |
| Email redaksi | cPanel | `mail.theglobal-review.com`, MX ke sana — **tidak lewat Cloudflare** |

Alur permintaan: pembaca → Cloudflare (TLS, cache `/_next/static/*` dan
`/wp-content/uploads/*`) → Railway (`*.up.railway.app`, TLS sendiri) →
Next.js → REST WordPress bila cache ISR belum hangat.

## 2. Kenapa begini

- **Railway, bukan Vercel Hobby lagi.** Situs ini padam 6 September 2026
  karena kuota Hobby jebol (ISR Writes 1,1 jt/200 rb, CPU 12 j/4 j, transfer
  21/10 GB, transformasi gambar 5,2 rb/5 rb) dan Vercel menjeda deployment.
  Railway menagih pemakaian nyata (RAM, CPU, egress) tanpa kuota fitur:
  optimasi gambar `next/image` berjalan lokal lewat `sharp`, ISR menulis ke
  disk container, revalidasi webhook gratis.
- **`next start`, bukan Docker/standalone.** Railpack membaca `.nvmrc` dan
  `package-lock.json`, menjalankan `npm ci` + `npm run build`, lalu
  `npm start`. Itu jalur "Node.js server" di dokumentasi Next (semua fitur
  didukung) dengan konfigurasi paling sedikit. `output: "standalone"` +
  Dockerfile hanya menghemat ukuran image, yang tidak kita butuhkan.
- **Satu replica.** `/api/revalidate` memanggil `revalidateTag` yang hanya
  menyentuh cache proses penerimanya, dan cache ISR hidup di `.next/cache`
  container. Menaikkan replica tanpa cache handler bersama (Redis) berarti
  sebagian pembaca melihat artikel basi sampai jendela ISR lewat.
- **DNS di Cloudflare.** Railway tidak punya IP statis (hanya CNAME), dan
  cPanel webiihost tidak bisa CNAME/ALIAS di nama akar. Cloudflare
  meratakan CNAME di akar (*CNAME flattening*), sekaligus memberi cache
  statis dan WAF gratis, dan menjadi jalan ke server sendiri nanti lewat
  Cloudflare Tunnel (tanpa membuka port di rumah).

## 3. Variabel lingkungan (service `web`)

| Nama | Nilai | Dipakai saat |
|---|---|---|
| `WP_API_URL` | `https://cms.theglobal-review.com/wp-json` | build **dan** runtime (halaman statis, sitemap, dan feed di-prerender saat build) |
| `REVALIDATE_SECRET` | sama dengan `TGR_REVALIDATE_SECRET` di `wp-config.php`; boleh beberapa nilai dipisah koma untuk rotasi | runtime (`/api/revalidate`, `/api/contact`, `/api/subscribe`, `/api/vote`) |
| `WP_ARCHIVE_AFTER` | `2022-12-31T23:59:59` (= bawaan kode; ditulis eksplisit agar terlihat di dasbor) | build **dan** runtime |

`NODE_ENV=production` tidak perlu ditulis — Railpack menyetelnya sendiri.
Mengubah variabel memicu redeploy otomatis.

```bash
railway variables --set "WP_ARCHIVE_AFTER=2022-12-31T23:59:59"
```

**Nilai rahasia (`REVALIDATE_SECRET`) hanya lewat dasbor**, bukan CLI:
service → Variables → New Variable → isi → centang **Seal** → Add. Variabel
yang di-seal tidak bisa dibaca lagi lewat UI, API, maupun
`railway variables` (pengganti tanda *Sensitive* di Vercel). Perintah CLI
`--set "REVALIDATE_SECRET=…"` sengaja tidak dipakai: nilainya tertinggal
di riwayat shell. Jangan pernah menjalankan `railway variables --kv` atau
`--json` di service ini — keduanya mencetak nilai mentah.

## 4. Deploy

Prasyarat sekali saja per mesin: `npm i -g @railway/cli`, `railway login`
(akun yang menjadi anggota workspace), lalu di akar repo `railway link`
(pilih project `the-global-review`, environment `production`, service `web`).

```bash
railway up --detach -m "deskripsi singkat"
```

`railway up` mengunggah direktori kerja (menghormati `.gitignore`; tanpa
`node_modules`, `.next`, `.env*`), Railway membangun di sisinya, dan
deployment baru menggantikan yang lama hanya bila build sukses dan
healthcheck `/` menjawab 200. Build gagal = deployment lama tetap hidup.

Pantau:

```bash
railway logs --build      # log build
railway logs              # stdout aplikasi (next start tidak mencatat per-request)
railway logs --http       # log HTTP tepi Railway: metode, path, status
railway deployment list
```

Build butuh jaringan ke `cms.theglobal-review.com` (prerender `/`) dan ke
Google Fonts; bila WordPress sedang 503, ulangi `railway up` — jangan
"memperbaiki" dengan menghapus prerender.

Rollback: dasbor → Deployments → deployment sebelumnya → **Redeploy**, atau
`railway redeploy` untuk membangun ulang deployment terakhir. Restart tanpa
build: `railway restart`.

Auto-deploy dari GitHub (belum dipasang): Service → Settings → Source →
hubungkan `mwafiudin/the-global-review-website` cabang `main`. Butuh
Railway GitHub App terpasang di akun pemilik repo. Setelah itu `railway up`
tidak diperlukan lagi.

## 5. Domain

Di Railway (service `web` → Settings → Networking):

- Domain bawaan `*.up.railway.app` — alat verifikasi; jangan dibagikan
  (canonical di kode tetap `https://theglobal-review.com`).
- Custom domain `theglobal-review.com` — Railway memberi target CNAME dan
  record TXT verifikasi; keduanya wajib ada di Cloudflare.

`www.theglobal-review.com` **tidak** didaftarkan di Railway: Cloudflare
mengalihkannya (301) ke akar lewat Redirect Rule, meniru perilaku Vercel
dulu. Paket Hobby Railway membatasi 2 custom domain per service.

Cek status: `railway domain list` dan `railway domain status theglobal-review.com`.

## 6. Cloudflare — setelan yang disengaja

Zona `theglobal-review.com`, plan Free, di akun `farrezalhakim@gmail.com`.
Nameserver yang ditetapkan Cloudflare untuk zona ini (dipasang di panel
klien webiihost, menggantikan `ns1/ns2.webiihost.net`):

```
arvind.ns.cloudflare.com
sneh.ns.cloudflare.com
```

Jebakan saat onboarding: di layar "Review your DNS records" checkbox
proxy per baris **tidak tersimpan**. Setel status proxy dari halaman DNS →
Records (pilih baris → "Edit N records" → Proxy status), lalu periksa
ulang kolom Proxy status.

**DNS.** Record hosting (email, cPanel, WordPress) **DNS-only (awan
abu-abu)** — proxy oranye akan mematikan IMAP/SMTP, FTP, port 2083, dan
AutoSSL cPanel yang butuh melihat IP asli. Daftar lengkap yang harus ada
(dipotret dari `ns1.webiihost.net` saat migrasi):

| Nama | Tipe | Nilai | Proxy |
|---|---|---|---|
| `@` | CNAME | target Railway (`….up.railway.app`) | oranye |
| `www` | CNAME | `theglobal-review.com` | oranye |
| `_railway-verify` (nama persis dari Railway) | TXT | nilai dari Railway | — |
| `@` | MX 0 | `mail.theglobal-review.com` | — |
| `@` | TXT | `v=spf1 ip4:172.236.131.177 ip4:68.183.183.101 +a +mx +ip4:188.166.211.214 +ip4:119.81.26.66 ~all` | — |
| `default._domainkey` | TXT | `v=DKIM1; k=rsa; p=…` (kunci DKIM cPanel) | — |
| `_acme-challenge` | TXT | token AutoSSL cPanel | — |
| `cms` | A | `172.236.131.177` | abu-abu |
| `cms` | MX 0 | `cms.theglobal-review.com` | — |
| `cms` | TXT | `v=spf1 +a +mx +ip4:172.236.131.177 ~all` | — |
| `mail`, `cpanel`, `webmail`, `ftp`, `whm`, `webdisk`, `autodiscover`, `autoconfig`, `cpcalendars`, `cpcontacts` | A | `172.236.131.177` | abu-abu |
| `localhost` | A | `127.0.0.1` | abu-abu (warisan cPanel, tidak penting) |

**SSL/TLS → Overview: Full** (bukan *Full (strict)*: Railway menyajikan
sertifikat untuk domain custom, tapi dokumentasi Railway menyebut mode
strict tidak bekerja seperti seharusnya). **Edge Certificates → Always Use
HTTPS: on.**

**Scrape Shield → Email Address Obfuscation: off.** Fitur ini menyuntik
skrip dan mengubah `mailto:` di HTML — React akan mengeluh *hydration
mismatch* di halaman yang memuat alamat email (Hubungi Kami, footer).

**Speed → Rocket Loader: off** (bawaan). **Security → Bot Fight Mode: off**
(bawaan) — webhook WordPress dan `wsrv.nl` (cadangan gambar) bukan peramban;
tantangan JavaScript akan mematikannya.

**Rules → Redirect Rules:** `www.theglobal-review.com/*` → 301 ke
`https://theglobal-review.com` + path + query.

**Caching:** biarkan bawaan. Cloudflare hanya meng-cache berkas
berekstensi (JS/CSS/gambar); HTML tidak, jadi revalidasi webhook tetap
instan. `Cache Everything` **jangan** — ia akan menahan artikel lama
sampai TTL lewat, dan tidak ada yang membersihkan cache tepi saat webhook.

## 7. Pemeriksaan rutin

```bash
curl -sI https://theglobal-review.com/ | grep -i "HTTP/\|server\|cf-cache"
curl -sI https://www.theglobal-review.com/x | grep -i "HTTP/\|location"
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -H "Accept: image/webp" "https://theglobal-review.com/_next/image?url=%2Ftgr-ikon-192.png&w=256&q=75"
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "X-TGR-Secret: salah" https://theglobal-review.com/api/revalidate
```

Harapan: `200` + `server: cloudflare`; `301` ke akar; `200 image/webp`
(tanpa header `Accept` optimizer mengembalikan `image/png` — itu normal);
`401` (bukan `503` — 503 berarti `REVALIDATE_SECRET` kosong di Railway).

Uji webhook ujung-ke-ujung: sunting judul satu artikel di wp-admin →
`railway logs --http` mencatat `POST /api/revalidate 200` → halaman
berubah ≤30 s.

Metrik: `railway metrics` atau dasbor → service → Metrics (RAM, CPU,
egress). Biaya berjalan tampil di workspace → Usage.

## 8. Biaya (perkiraan)

Railway menagih RAM $10/GB-bulan, CPU $20/vCPU-bulan, egress $0,05/GB.
Situs ini: RAM ±0,5–1 GB, CPU aktual ±12 jam/bulan, egress ±20 GB (lebih
kecil lagi karena Cloudflare menyerap aset statis dan gambar `uploads`) →
sekitar **$6–12/bulan**, sebagian tertutup kredit $5 paket Hobby.

## 9. Batasan dan jebakan

- **Build gagal bila WordPress mati.** `next build` mem-prerender `/`,
  `/redaksi`, halaman statis, sitemap, dan feed dari REST `cms.*`; bila host
  itu tidak menjawab, build berhenti ("Export encountered an error … exiting
  the build") dan deployment lama tetap hidup. Saat host down, jangan
  memaksa deploy — tunggu `https://cms.theglobal-review.com/wp-json/`
  menjawab 200 dulu (terverifikasi 7 Sep 2026 lewat build lokal saat `cms`
  tak terjangkau dari laptop).
- **Semua port host timeout dari satu lokasi ≠ server mati.** 7 Sep 2026
  laptop pengelola diblok firewall host webiihost (pola CSF/lfd: DROP semua
  port termasuk ICMP; traceroute mati tepat di hop terakhir; host lain di
  /24 yang sama tetap terjangkau) setelah beberapa request ber-User-Agent
  non-browser dijawab 406 oleh WAF dan uji port berulang. Selama ±10 jam
  ini keliru dibaca sebagai server padam. Sebelum menyimpulkan "down", cek
  dari vantage luar (`https://api.hackertarget.com/httpheaders/?q=https://cms.theglobal-review.com/`
  atau HP lewat data seluler). Ke `cms.`/`cpanel.` hanya kirim request
  ber-UA `TGR-Admin/1.0 (+https://theglobal-review.com)` atau UA frontend,
  dan jangan pernah uji port. Bila terblok: ganti IP publik (restart modem /
  hotspot) atau minta webiihost membuka blokir. Build Railway tidak
  terpengaruh — egress-nya IP lain.
- **`railway.json` (Config as Code) dinyatakan usang** oleh Railway; masih
  dibaca sampai 1 Des 2026. Sebelum itu jalankan `railway config migrate
  --apply` (menghasilkan `.railway/railway.ts`, diterapkan lewat
  `railway config apply`), tinjau hasilnya, lalu hapus `railway.json`.

- **Cache ISR ikut hilang tiap deploy/restart.** Menit-menit pertama
  setelah deploy, tiap halaman pertama kali diminta akan menembak
  WordPress (semafor `MAX_CONCURRENT = 4` di `src/lib/wp/client.ts`).
  Deploy di jam sepi.
- **Jangan menaikkan `numReplicas`** tanpa cache handler bersama (lihat
  §2). `railway.json` mengunci 1.
- **Alamat IP pembaca** ditentukan `src/lib/client-ip.ts`: `cf-connecting-ip`
  hanya dipercaya bila peer-nya (entri terakhir `x-forwarded-for`) memang
  IP Cloudflare; selain itu peer itulah yang dipakai. Entri pertama
  `x-forwarded-for` tidak pernah dipercaya — Cloudflare menambahkan, bukan
  menimpa, jadi klien bisa menulis apa pun di situ. Nilai ini menjadi kunci
  rate limit `/api/contact` dan `/api/subscribe` **dan** diteruskan ke
  WordPress lewat header `X-TGR-Client-IP` (mu-plugin `tgr-headless.php`
  ≥ 3.4.0, fungsi `tgr_ip_klien`). Tanpa header itu WordPress hanya melihat
  alamat egress Railway — seluruh pembaca dihitung satu pemilih (1 suara per
  poll per hari untuk semua orang). Rentang IP Cloudflare di-hardcode;
  perbarui dari cloudflare.com/ips bila berubah.
- **Origin tetap bisa dicapai langsung** (`*.up.railway.app`, atau Host
  header ke tepi Railway). Cloudflare tidak menyembunyikannya, dan mode SSL
  *Full* tidak mengautentikasi origin. Rate limit tetap benar di jalur itu
  (IP = peer), tapi WAF/cache Cloudflare terlewati. Bila kelak perlu ditutup:
  Cloudflare Authenticated Origin Pulls atau header rahasia dari Transform
  Rule yang diperiksa di `src/proxy.ts`.
- **Alamat `*.up.railway.app` tetap hidup** dan menyajikan konten yang
  sama. Canonical di setiap halaman menunjuk domain utama, jadi mesin
  pencari tidak menghitungnya ganda.
- **Vercel lama** tidak perlu dibersihkan: DNS sudah tidak menunjuk ke
  sana. Akun `mwafiudin` di Vercel terkunci (2FA); bila suatu saat pulih,
  hapus project-nya supaya tidak menagih.

## 10. Jembatan www (berlaku sampai nameserver pindah ke Cloudflare)

Dipasang September 2026 karena panel klien webiihost (tempat nameserver
diganti) tidak bisa diakses, sedangkan situs harus hidup segera. Zona DNS
tetap di cPanel webiihost, yang hanya bisa CNAME di subdomain:

| Record (cPanel → Zone Editor) | Nilai | Untuk apa |
|---|---|---|
| `www` CNAME | `2sa3iw89.up.railway.app` | situs |
| `_railway-verify.www` TXT | `railway-verify=8e84848af0db12e5e10d4dec8994b3d3e88c8db7ab8ba61806d4cc7de622279e` | Railway memverifikasi kepemilikan lalu menerbitkan sertifikat |
| `@` A | `172.236.131.177` (server WordPress) | apex hidup lagi sebagai papan penunjuk |

(Nilai di atas keluaran `railway domain www.theglobal-review.com --json`;
bila domain dihapus dan dibuat ulang di Railway, nilainya berganti.)

**Terpasang 7 September 2026 pukul 11.47 WIB**, lewat UAPI cPanel
`DNS::mass_edit_zone` (serial zona 2026090705 → 2026090706). Record `@` A
sudah menunjuk server WordPress sejak sebelumnya, jadi yang berubah hanya
`www` dan TXT verifikasinya; keduanya diberi TTL 300 supaya perpindahan
berikutnya cepat. Terverifikasi dari `ns1.webiihost.net` dan `8.8.8.8`,
dan apex menjawab 308 ke `www` dengan path serta query utuh.

> **Menguji apex lewat curl:** WAF host menolak User-Agent non-peramban
> dengan **406**, bukan 308. Selalu sertakan `-A "Mozilla/5.0 …Chrome…"`
> saat menguji `theglobal-review.com`, `cms.`, atau `cpanel.`; 406 di sini
> berarti UA-nya yang salah, bukan pengalihannya yang rusak.
Project Railway: `theglobal-review` (workspace Coderoach), service `web`,
domain bawaan `https://web-production-95661.up.railway.app`.

Di server WordPress, mu-plugin **`tgr-alih-www.php`** melempar semua
permintaan ber-host `theglobal-review.com` ke `https://www.theglobal-review.com`
(308, path + query utuh; berkas `wp-content/uploads` tetap dilayani
langsung). Di kode, `site.url` sementara `https://www.theglobal-review.com`
supaya canonical, sitemap, dan feed konsisten dengan alamat yang tayang.
Railway hanya memegang domain `www`.

Efek: pembaca dan Google mendarat di `www…`; tautan lama tanpa www tetap
sampai lewat satu lompatan. Webhook `TGR_REVALIDATE_URL` tidak perlu
diubah (308 mempertahankan POST).

**Mengembalikan apex sebagai alamat utama** (setelah nameserver menunjuk
`arvind`/`sneh.ns.cloudflare.com` dan zona Cloudflare aktif), urutannya:

1. Railway: tambah custom domain `theglobal-review.com`; Cloudflare: record
   `@` CNAME → target Railway (proxied), TXT verifikasinya, `www` CNAME →
   `theglobal-review.com` (proxied). Redirect Rule www → akar sudah ada.
2. Kode: `site.url` kembali `https://theglobal-review.com`, deploy.
3. WordPress: hapus `tgr-alih-www.php`. Zona cPanel boleh dibiarkan (tidak
   lagi dibaca siapa pun).
4. Search Console: kirim ulang `https://theglobal-review.com/sitemap.xml`.

Sampai langkah 2 selesai, jangan aktifkan Redirect Rule www → akar untuk
lalu lintas nyata — ia memang sudah "Active" di zona yang masih pending,
jadi begitu NS pindah, kerjakan langkah 1–3 dalam satu duduk.

## 11. Jalan ke server sendiri

Rencana pemilik: hardware sendiri. Yang berubah hanya lapisan aplikasi:

1. Server menjalankan `npm ci && npm run build && npm start` (atau
   container yang sama) dengan tiga variabel §3. Node 22 (`engines.node`
   = `22.x`, sama dengan `.nvmrc`).
2. Pasang `cloudflared` (Cloudflare Tunnel) di server → tunnel ke
   `localhost:3000`; Cloudflare menerbitkan CNAME `@` → `<tunnel-id>.cfargotunnel.com`.
   Tidak ada port yang dibuka ke internet, tidak perlu IP publik statis.
3. Ganti record `@` di Cloudflare dari target Railway ke target tunnel;
   Railway boleh dimatikan setelah beberapa hari pemantauan.

Cadangan ISR di disk tetap sah selama tetap satu proses. Bila nanti
lebih dari satu (dua server, PM2 cluster), pasang cache handler Redis
sebelum menaikkan jumlah proses.
