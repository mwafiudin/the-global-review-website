# Peralihan domain ke situs baru

Runbook untuk memindahkan `theglobal-review.com` dari WordPress ke situs
Next.js di Vercel. Ditulis untuk dijalankan berurutan dalam satu duduk;
tiap tahap punya cara memastikan hasilnya sebelum lanjut, dan cara mundur
bila gagal.

---

## 1. Kenapa bukan sekadar redirect

Godaan pertama adalah memasang redirect di cPanel: `theglobal-review.com`
dan turunannya diarahkan ke `the-global-review-website.vercel.app`. Tiga
alasan mengapa itu justru merusak.

**Domain lama bukan cuma situs lama — ia sumber datanya.** Situs baru
membaca `https://theglobal-review.com/wp-json` setiap kali menyegarkan
halaman. Wild Card Redirect ikut menangkap `/wp-json/`, `/wp-admin/`,
dan `/wp-content/uploads/`. Hasilnya berantai: situs baru kehilangan
seluruh artikel, redaksi tak bisa masuk wp-admin, dan semua gambar mati.

**301 ke `*.vercel.app` menyerahkan reputasi 5.683 URL ke alamat pinjaman.**
Domain `vercel.app` ada di Public Suffix List — Google memperlakukannya
sebagai situs milik pihak lain, bukan cabang dari domain kita. Peringkat
yang dibangun sejak 2008 dipindahkan ke alamat yang justru akan dibuang
saat peralihan sebenarnya. Redirect permanen juga disimpan peramban
nyaris selamanya, jadi pengunjung lama bisa tetap terlempar ke
`vercel.app` lama setelah domainnya dibereskan.

**Dan redirect itu tidak diperlukan.** Situs baru sudah memakai pola URL
yang sama persis dengan permalink WordPress (`/{slug}/`) — itulah alasan
route `/artikel/{slug}` dulu dipindahkan ke akar. Begitu domainnya
menunjuk ke Vercel, setiap URL yang sudah terindeks langsung dilayani
situs baru **tanpa satu pun aturan redirect**.

Jadi yang dikerjakan bukan "redirect ke Vercel", melainkan "pindahkan
domainnya ke Vercel, dan pindahkan WordPress ke subdomain".

Tujuan akhir:

| Alamat | Dilayani | Untuk siapa |
|---|---|---|
| `theglobal-review.com` | Vercel (situs baru) | pembaca |
| `cms.theglobal-review.com` | WordPress | redaksi + sumber data situs baru |

---

## 2. Prasyarat

Jangan mulai sebelum kelimanya beres.

1. **Project Vercel berada di akun yang dikendalikan klien.** Sekarang
   project ini ada di akun pribadi rekan. Mengarahkan domain klien ke
   akun pribadi orang lain berarti domain utama bergantung pada akun yang
   tidak dipegang klien. Pindahkan project-nya lebih dulu
   (Vercel → Project → Settings → Transfer).
2. **Paket Vercel sesuai penggunaan.** Paket Hobby dilarang untuk
   penggunaan komersial menurut ketentuan Vercel; situs media milik
   lembaga masuk kategori itu. Naikkan ke Pro sebelum domain dipasang.
3. **Akses pengelola DNS** — di registrar atau di cPanel (Zone Editor),
   tergantung nameserver domainnya menunjuk ke mana.
4. **Backup penuh** basis data + `wp-content` lewat cPanel Backup Wizard.
5. **Google Search Console** aktif untuk domain ini, supaya dampaknya
   terpantau harian, bukan ditebak.

---

## 3. Tahap 1 — WordPress mendapat rumah barunya

**cPanel → Domains → Create A Domain**

- Domain: `cms.theglobal-review.com`
- Document Root: **samakan dengan domain utama** (biasanya
  `/home/<user>/public_html`). Hilangkan centang "Share document root"
  bila cPanel menawarkan folder baru — WordPress-nya tidak dipindah,
  hanya diberi nama tambahan.

Tunggu AutoSSL menerbitkan sertifikat (biasanya beberapa menit).

**Pastikan:** `https://cms.theglobal-review.com/` terbuka tanpa peringatan
sertifikat.

Belum ada yang berubah bagi pembaca sampai titik ini.

---

## 4. Tahap 2 — WordPress pindah alamat resmi

Mulai di sini ada jendela waktu yang terlihat pembaca, jadi kerjakan
tahap 2–4 berurutan tanpa jeda panjang, di jam sepi.

**cPanel → File Manager → `wp-config.php`**, sisipkan tepat di atas baris
`/* That's all, stop editing! */`:

```php
define( 'WP_HOME', 'https://cms.theglobal-review.com' );
define( 'WP_SITEURL', 'https://cms.theglobal-review.com' );
```

Lewat `wp-config.php`, bukan lewat Pengaturan → Umum: kalau ada yang
meleset, memulihkannya cukup menghapus dua baris itu — sementara nilai
yang terlanjur tersimpan di basis data hanya bisa dibetulkan lewat
phpMyAdmin, dan situsnya sudah tidak bisa diakses saat itu.

Lalu **Pengaturan → Permalink → Simpan Perubahan** (flush rewrite).

**Pastikan:**

- `https://cms.theglobal-review.com/wp-admin/` bisa dipakai masuk
- `https://cms.theglobal-review.com/wp-json/` mengembalikan JSON

**Efek samping yang harus diketahui:** sejak dua baris itu aktif,
WordPress mengalihkan pengunjung `theglobal-review.com` ke
`cms.theglobal-review.com`. Selama tahap 3 belum selesai, pembaca akan
mendarat di WordPress beralamat cms — tidak rusak, tapi jelek. Itulah
alasan tahap 2–4 tidak boleh diselang.

**Mundur:** hapus dua baris `define`, simpan permalink lagi.

---

## 5. Tahap 3 — Situs baru menunjuk ke alamat baru

Dua perubahan, keduanya sudah bisa disiapkan sebelum hari-H.

**a. Kode** — `next.config.ts`:

```ts
// remotePatterns: tambahkan host baru; host lama dibiarkan sampai
// peralihan terbukti stabil.
{
  protocol: "https",
  hostname: "cms.theglobal-review.com",
  pathname: "/wp-content/uploads/**",
},
```

```ts
// Gambar yang disisipkan di dalam badan artikel memakai URL absolut
// domain lama (sekitar 1 dari 5 artikel). Setelah domainnya dilayani
// Vercel, URL itu akan 404. Diteruskan ke WordPress apa adanya —
// tidak perlu bedah basis data, dan tautan gambar yang beredar di
// luar pun tetap hidup.
async rewrites() {
  return [
    {
      source: "/wp-content/uploads/:path*",
      destination: "https://cms.theglobal-review.com/wp-content/uploads/:path*",
    },
  ];
},
```

**b. Variabel lingkungan** — Vercel → Settings → Environment Variables:

```
WP_API_URL = https://cms.theglobal-review.com/wp-json
```

Lalu **Redeploy**.

**Pastikan, sebelum DNS disentuh** — buka alamat `*.vercel.app` dan
periksa: beranda memuat artikel, satu halaman artikel memuat gambar,
pencarian bekerja. Kalau di sini sudah benar, tahap berikutnya tinggal
soal alamat.

**Mundur:** kembalikan `WP_API_URL` ke domain lama, redeploy.

---

## 6. Tahap 4 — Domain utama menunjuk ke Vercel

**Vercel → Project → Settings → Domains → Add**: `theglobal-review.com`
dan `www.theglobal-review.com`. Vercel akan menampilkan record DNS yang
harus dipasang.

Pasang **persis nilai yang ditampilkan Vercel** (bukan nilai yang beredar
di internet — nilainya pernah berubah), di registrar atau cPanel → Zone
Editor:

| Nama | Tipe | Isi |
|---|---|---|
| `@` | A | alamat IP yang ditampilkan Vercel |
| `www` | CNAME | nilai yang ditampilkan Vercel |

**Yang tidak boleh disentuh:**

- **Jangan** memindahkan nameserver domain ke Vercel. Nameserver saat ini
  juga melayani MX (email `@theglobal-review.com`) dan record lain;
  memindahkannya akan mematikan email klien. Cukup ubah A dan CNAME.
- **Jangan** mengubah record `cms` — di situlah WordPress berada.

**Pastikan:** Vercel menampilkan "Valid Configuration"; lalu buka
beberapa URL artikel lama langsung di domain utama.

**Mundur:** kembalikan record A/CNAME ke IP hosting
(`172.236.131.177`). Propagasi butuh waktu, jadi turunkan TTL ke 300
detik sehari sebelumnya agar pemulihan cepat.

---

## 7. Tahap 5 — Merapikan setelah hidup

**a. Cegah WordPress terindeks ganda.** `cms.theglobal-review.com` masih
menyajikan seluruh artikel dalam bentuk HTML. Bila dibiarkan, Google
melihat dua salinan tiap artikel dan keduanya saling melemahkan.
wp-admin → **Pengaturan → Membaca → centang "Halangi mesin pencari
mengindeks situs ini"**.

**b. Sitemap.** WordPress lama menyediakan `/wp-sitemap.xml`; situs baru
belum punya padanannya, dan setelah peralihan alamat itu tidak lagi ada
di domain utama. Perlu dibuat sebelum tahap ini — lihat "Yang masih
kurang" di bawah.

**c. Search Console.** Kirim sitemap baru, lalu pantau laporan Cakupan
dan Pengalaman Halaman selama 2–4 minggu. Turun sesaat itu normal;
yang dipantau adalah pemulihannya.

**d. Setelah stabil (± 1 bulan):** hapus host lama dari `remotePatterns`
di `next.config.ts`.

---

## 8. Yang sengaja tidak dikerjakan

- **Peta redirect per artikel.** Tidak perlu: pola URL-nya sudah sama.
- **`search-replace` basis data.** Digantikan rewrite `/wp-content/uploads`
  di tahap 3 — kebetulan menguntungkan, karena `search-replace` menuntut
  WP-CLI dan hosting ini tidak menyediakan akses shell.
- **Redirect di cPanel.** Lihat bagian 1.

---

## 9. Yang masih kurang sebelum peralihan

| Hal | Kenapa penting saat peralihan |
|---|---|
| `sitemap.xml` di situs baru | Tanpa ini Google menemukan ulang 878 artikel dengan meraba-raba, tepat saat domainnya berpindah rumah |
| `robots.txt` di situs baru | Menyatakan lokasi sitemap dan memastikan tidak ada yang terhalang tanpa sengaja |
| Paginasi arsip rubrik | Halaman rubrik kini menampilkan 100 terbaru; artikel di luar itu tidak punya jalur tautan internal untuk ditelusuri mesin pencari |

Ketiganya pekerjaan frontend biasa dan bisa dikerjakan kapan saja
sebelum hari-H.
