# Panduan: memindahkan nameserver ke Cloudflare

Untuk: Farrez. Ditulis 12 Okt 2026.

Ini langkah yang tertunda dari migrasi Railway (lihat
`docs/hosting-railway.md` §10). Nameserver `theglobal-review.com` sampai
hari ini masih `ns1/ns2.webiihost.net`, jadi Cloudflare belum melayani
apa pun. Semua request, termasuk dari bot, langsung menembak Railway:
tidak ada cache CDN, tidak ada WAF, dan tidak ada blokir bot. Setelah
panduan ini selesai, Cloudflare berdiri di depan situs dan kita bisa
memangkas lalu lintas bot yang ikut membesarkan tagihan RAM di Railway.

Panduan ini dibagi dua fase:

- **Fase 1 (wajib):** pindahkan nameserver **tanpa mengubah perilaku
  situs**. Alamat utama tetap `www`, apex tetap melempar ke `www` lewat
  server WordPress. Isi zona Cloudflare dibuat sama persis dengan zona
  cPanel sekarang. Dengan begitu, selama masa propagasi (bisa sampai 48
  jam), pembaca mendapat jawaban yang sama dari zona mana pun.
- **Fase 2 (opsional, kapan-kapan):** kembalikan apex sebagai alamat
  utama. Tidak perlu dikerjakan untuk mendapat manfaat Cloudflare.

> ⚠️ **Jangan langsung ganti nameserver.** Zona Cloudflare yang disiapkan
> September berisi rencana lama: `@` CNAME ke Railway dan Redirect Rule
> www → apex yang sudah aktif. Railway sekarang hanya memegang domain
> `www`. Kalau nameserver dipindah dengan isi zona seperti itu, pembaca
> dilempar dari `www` ke apex, lalu apex menembak Railway yang tidak
> mengenalnya, dan **situs mati**. Kerjakan langkah 1–3 dulu.

Perkiraan waktu: 45–60 menit kerja, lalu menunggu propagasi.

---

## Yang dibutuhkan

- [ ] Login **panel klien webiihost** (billing/client area, tempat
      nameserver domain diganti, **bukan** cPanel). Ini yang dulu tidak
      bisa diakses. Kalau masih terkunci, minta ke support webiihost: reset
      akses, atau minta mereka mengganti nameserver untukmu (sebutkan dua
      nameserver dari langkah 1).
- [ ] Login **Cloudflare** akun `farrezalhakim@gmail.com`.
- [ ] Login **cPanel** webiihost (untuk melihat zona DNS yang berlaku
      sekarang).
- [ ] Akses Railway tidak wajib. Wafi bisa memeriksa dari sisinya.

---

## Fase 1: pindah nameserver, perilaku situs tetap

### Langkah 1: cek zona Cloudflare masih ada

1. Buka dash.cloudflare.com → pilih `theglobal-review.com`.
2. Kalau zonanya **tidak ada** (Cloudflare bisa menghapus zona yang terlalu
   lama berstatus *Pending*), tambahkan lagi: **Add a domain** →
   `theglobal-review.com` → plan **Free**.
3. Catat **dua nameserver** yang ditampilkan Cloudflare untuk zona ini
   (halaman Overview, atau DNS → Records → bagian bawah). Di runbook
   tercatat `arvind.ns.cloudflare.com` dan `sneh.ns.cloudflare.com`, tapi
   **pakai yang tampil di dasbor**. Kalau zona dibuat ulang, pasangannya
   bisa berbeda.

### Langkah 2: samakan record DNS dengan cPanel

Prinsipnya: **setiap record di cPanel harus ada juga di Cloudflare dengan
nilai yang sama.** Tabel di bawah adalah keadaan yang diketahui per
September. Sumber kebenarannya tetap cPanel, jadi bandingkan dulu.

1. cPanel → **Zone Editor** → `theglobal-review.com` → **Manage**. Biarkan
   tab ini terbuka. (Atau ekspor zona lewat menu yang tersedia di sana dan
   simpan berkasnya sebagai cadangan.)
2. Cloudflare → **DNS → Records**. Samakan isinya dengan tabel ini:

| Nama | Tipe | Nilai | Proxy status |
|---|---|---|---|
| `www` | CNAME | `2sa3iw89.up.railway.app` | **Proxied (oranye)** |
| `_railway-verify.www` | TXT | `railway-verify=8e84848af0db12e5e10d4dec8994b3d3e88c8db7ab8ba61806d4cc7de622279e` | — |
| `@` | A | `172.236.131.177` | **DNS only (abu-abu)** |
| `@` | MX 0 | `mail.theglobal-review.com` | — |
| `@` | TXT | SPF: salin persis dari cPanel (`v=spf1 …`) | — |
| `default._domainkey` | TXT | DKIM: salin persis dari cPanel (`v=DKIM1; k=rsa; p=…`) | — |
| `_dmarc` | TXT | salin dari cPanel **bila ada** | — |
| `_acme-challenge` (bila ada) | TXT | salin dari cPanel | — |
| `cms` | A | `172.236.131.177` | **DNS only** |
| `cms` | MX 0 | `cms.theglobal-review.com` | — |
| `cms` | TXT | salin SPF `cms` dari cPanel | — |
| `mail`, `cpanel`, `webmail`, `ftp`, `whm`, `webdisk`, `autodiscover`, `autoconfig`, `cpcalendars`, `cpcontacts` | A | `172.236.131.177` | **DNS only** |

Yang **wajib diubah** dari isi zona lama (rencana September):

- [ ] `@`: **hapus** CNAME ke target Railway, ganti dengan **A
      `172.236.131.177`, DNS only**. Apex tetap dilayani server WordPress,
      yang melempar ke `www` lewat mu-plugin `tgr-alih-www.php`. Itu
      perilaku yang berjalan sekarang.
- [ ] `www`: **ubah** dari CNAME `theglobal-review.com` menjadi CNAME
      **`2sa3iw89.up.railway.app`**, Proxied.
- [ ] Tambah TXT `_railway-verify.www`. Kalau ada TXT `_railway-verify`
      (tanpa `.www`) peninggalan rencana lama, hapus saja.

Kenapa semua record hosting **abu-abu**: proxy oranye mematikan email
(IMAP/SMTP), FTP, port cPanel 2083, dan AutoSSL. Satu-satunya yang oranye
hanya `www`.

Jebakan: di layar onboarding Cloudflare, centang proxy per baris **tidak
tersimpan**. Setelah selesai, periksa ulang kolom *Proxy status* di
halaman DNS → Records.

Kalau ada record di cPanel yang **tidak** ada di tabel ini (misalnya
verifikasi Google Search Console, record layanan lain), **salin juga**.
Record yang tertinggal = layanan itu mati setelah nameserver pindah.

### Langkah 3: matikan aturan rencana lama, pasang setelan yang benar

1. **Rules → Redirect Rules:** aturan `www.theglobal-review.com/*` → 301 ke
   akar → **matikan** (toggle off, jangan dihapus; dipakai lagi di Fase 2).
   Selama Fase 1, `www` adalah alamat utama.
2. **SSL/TLS → Overview:** mode **Full** (bukan *Flexible*, bukan *Full
   (strict)*). *Flexible* membuat redirect loop dengan Railway.
3. **SSL/TLS → Edge Certificates:** *Always Use HTTPS* **on**.
4. **Scrape Shield → Email Address Obfuscation:** **off** (kalau on, React
   error hydration di halaman yang memuat email).
5. **Speed → Rocket Loader:** **off**.
6. **Security → Bots → Bot Fight Mode:** **off**. Webhook WordPress dan
   `wsrv.nl` (proxy gambar) bukan peramban, dan tantangan JavaScript akan
   memutus keduanya.
7. **Caching:** biarkan bawaan. **Jangan** pasang *Cache Everything*.
   Artikel yang disunting akan tertahan di cache tepi, karena webhook
   revalidasi tidak membersihkan cache Cloudflare.

### Langkah 4: cek DNSSEC di webiihost

Di panel klien webiihost, buka pengaturan domain `theglobal-review.com` →
cari **DNSSEC**. Kalau aktif, **matikan dulu** dan tunggu beberapa jam
sebelum langkah 5. DNSSEC lama + nameserver baru = domain gagal resolve di
sebagian resolver. Kalau tidak ada menu DNSSEC atau statusnya off, lanjut.

### Langkah 5: ganti nameserver

1. Panel klien webiihost → Domains → `theglobal-review.com` →
   **Nameservers** → pilih *custom nameservers*.
2. Hapus `ns1.webiihost.net` dan `ns2.webiihost.net`, isi dua nameserver
   Cloudflare dari langkah 1. Simpan.
3. Di Cloudflare, Overview → **Check nameservers now**.
4. Catat jam penggantian. Kabari Wafi.

Jangan ubah zona cPanel selama propagasi. Sebagian resolver masih membaca
zona lama sampai 48 jam, dan isinya sudah sama dengan Cloudflare, jadi
tidak ada yang perlu dikerjakan di sana.

### Langkah 6: verifikasi

Zona dianggap aktif saat Cloudflare mengirim email "… is now active" dan
Overview berstatus **Active** (biasanya < 1 jam, maksimal 24–48 jam).

Lalu jalankan dari terminal. Pakai UA peramban: WAF host menjawab 406
untuk UA `curl`.

```bash
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"
```

```bash
dig +short NS theglobal-review.com
```
Harapan: dua nameserver Cloudflare.

```bash
curl -sI -A "$UA" https://www.theglobal-review.com/ | grep -iE "^HTTP|^server|cf-ray"
```
Harapan: `HTTP/2 200`, `server: cloudflare`, ada `cf-ray`. (Sebelum
pindah: `server: railway-hikari`.)

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -A "$UA" https://theglobal-review.com/artikel-apa-saja
```
Harapan: `308 https://www.theglobal-review.com/artikel-apa-saja`.

```bash
curl -s -o /dev/null -w "%{http_code}\n" -A "$UA" https://cms.theglobal-review.com/wp-json/
```
Harapan: `200`.

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "X-TGR-Secret: salah" https://www.theglobal-review.com/api/revalidate
```
Harapan: `401`.

Uji manual:

- [ ] Buka situs di HP lewat data seluler: beranda, satu artikel, satu
      rubrik.
- [ ] Kirim satu email ke dan dari alamat `@theglobal-review.com`, cek
      masuk/keluar.
- [ ] Login wp-admin di `cms.theglobal-review.com`, sunting judul satu
      artikel → situs berubah dalam ±30 detik (webhook revalidasi jalan).
- [ ] Bagikan satu tautan artikel ke WhatsApp → pratinjau gambar muncul.

**Kalau ada yang rusak** dan sebabnya tidak jelas: kembalikan nameserver
di panel webiihost ke `ns1.webiihost.net` / `ns2.webiihost.net`. Zona
cPanel tidak disentuh, jadi semua kembali seperti semula setelah
propagasi.

---

## Setelah aktif: pangkas bot (alasan utama pindah)

Kerjakan **setelah** langkah 6 lolos. Dari log Railway 12 Okt, sekitar 45%
request datang dari crawler, sebagian menyusuri `/en/*` yang tidak
diindeks. `robots.txt` sudah menutup `/en/`, tapi tidak semua bot patuh.

1. **Security → Bots → Block AI Scrapers and Crawlers** (atau *AI Crawl
   Control*; nama menunya bisa berbeda): **on**. Ini memblok crawler AI
   (meta-externalagent, Bytespider, GPTBot, ClaudeBot, dan sebangsanya)
   tanpa tantangan JavaScript, jadi webhook tidak terganggu. Search engine
   biasa (Googlebot, Bingbot) tidak kena.
2. **Security → WAF → Custom rules → Create rule**, nama
   `blok-crawler-boros`:
   - Expression (Edit expression):
     ```
     (http.user_agent contains "PetalBot") or (http.user_agent contains "Bytespider") or (http.user_agent contains "meta-externalagent")
     ```
   - Action: **Block**.
   - **Jangan** masukkan `facebookexternalhit`, `WhatsApp`,
     `Twitterbot`, atau `TelegramBot`. Itu pengambil pratinjau saat
     artikel dibagikan.
   - Amazonbot boleh ditambahkan kalau tim setuju. Ia bukan sumber
     pembaca.
3. Seminggu kemudian, minta Wafi membandingkan metrik RAM dan jumlah
   request di Railway.

Lalu perbarui `docs/hosting-railway.md`: §1 dan §10 (status nameserver),
dan catat tanggal aktifnya.

---

## Fase 2 (opsional): kembalikan apex sebagai alamat utama

Hanya bila tim memutuskan `theglobal-review.com` (tanpa www) jadi alamat
utama lagi. Sejak September Google sudah mengindeks `www`, jadi ini
perpindahan URL kedua dan **bukan keharusan**. Kalau dikerjakan, urutan
lengkapnya di `docs/hosting-railway.md` §10, "Mengembalikan apex sebagai
alamat utama". Keempat langkahnya (Railway, kode `site.url`, hapus
`tgr-alih-www.php`, Search Console) dikerjakan dalam satu duduk, lalu
Redirect Rule www → akar yang dimatikan di langkah 3 dinyalakan lagi.
