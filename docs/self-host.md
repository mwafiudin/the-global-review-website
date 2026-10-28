# Self-host: image Docker

Jalur cadangan dan rencana pindah dari Railway ke server sendiri (container
di belakang Cloudflare Tunnel + Caddy). Railway **tidak** memakai berkas di
sini: Railpack tetap membangun dari `package.json` dan menjalankan
`startCommand` di `railway.json`. Runbook Railway di
[`hosting-railway.md`](hosting-railway.md); langkah pindah DNS di §11-nya.

---

## 1. Build

```bash
docker build -t tgr-web .
```

`Dockerfile` memasang `NEXT_OUTPUT=standalone`, dan `next.config.ts` hanya
menyalakan `output: "standalone"` bila variabel itu ada. Build Railway tidak
berubah selama variabel ini tidak dipasang di Railway.

Build **menghubungi WordPress**: `/`, `/redaksi`, halaman statis, sitemap,
dan feed di-prerender dari REST `cms.*` (alasan yang sama dengan
[`ci.md`](ci.md) → "Kenapa `next build` sengaja tidak ada di CI"). URL-nya
masuk lewat build arg, bawaannya produksi:

```bash
docker build --build-arg WP_API_URL=https://cms.theglobal-review.com/wp-json \
             --build-arg WP_ARCHIVE_AFTER=2022-12-31T23:59:59 -t tgr-web .
```

Keduanya bukan rahasia dan tercatat di riwayat image. `REVALIDATE_SECRET`
tidak dibutuhkan build dan **jangan** dioper sebagai build arg. Bila WP
sedang 503 atau IP builder diblok firewall host
([`hosting-railway.md`](hosting-railway.md) §9), build gagal; ulangi
setelah `cms.*` menjawab, jangan menghapus prerender.

Base image `node:22-bookworm-slim` dipaku ke digest. Menaikkan versi: ganti
ketiga baris `FROM` dengan hasil
`docker buildx imagetools inspect node:22-bookworm-slim`.

## 2. Jalan

```bash
docker run -d --name tgr-web --restart unless-stopped -p 127.0.0.1:3000:3000 \
  --env-file /etc/tgr/web.env tgr-web
```

| Variabel | Wajib | Catatan |
|---|---|---|
| `WP_API_URL` | ya | sama dengan saat build |
| `REVALIDATE_SECRET` | ya | sama dengan `TGR_REVALIDATE_SECRET` di `wp-config.php`. Tanpa ini `/api/revalidate`, `/api/contact`, `/api/subscribe`, `/api/vote` menjawab 503 |
| `WP_ARCHIVE_AFTER` | tidak | bawaan kode `2022-12-31T23:59:59` |
| `PORT`, `HOSTNAME`, `MALLOC_ARENA_MAX` | tidak | sudah diisi image: `3000`, `0.0.0.0`, `2` |

Daftar lengkap ada di [`.env.example`](../.env.example). Alamat situs
(canonical, sitemap) tidak diambil dari env, tapi dari `src/data/site.ts`.
`--env-file` dipakai supaya secret tidak tertinggal di riwayat shell;
berkasnya `chmod 600`.

Port diikat ke `127.0.0.1`: yang boleh bicara ke container hanya Caddy /
cloudflared di host yang sama.

## 3. Health check

`GET /api/health` menjawab `200 {"ok":true}` dengan `Cache-Control:
no-store`. Ia **tidak** menyentuh WordPress, jadi hanya membuktikan proses
Node hidup dan melayani request. Itu disengaja: health check yang ikut
menunggu `cms.*` membuat container sehat di-restart setiap kali WP lambat,
dan restart mengosongkan cache ISR yang justru menjaga situs tetap tayang.
Kesegaran konten dipantau terpisah oleh `scripts/pantau-artikel-terbaru.mjs`
(workflow `pantau-situs.yml`).

`HEALTHCHECK` di image memanggilnya tiap 30 detik lewat `fetch` Node (image
slim tanpa curl). Untuk Caddy atau pemantau luar, pakai path yang sama.

`railway.json` masih memakai `healthcheckPath: "/"`; ia sengaja tidak
diubah di sini. Menggantinya ke `/api/health` adalah keputusan terpisah
untuk Railway.

## 4. Cache di disk

Cache ISR, fetch-cache, dan gambar hasil optimasi `next/image` ditulis ke
`.next/server/app` dan `.next/cache` di dalam container. Image berjalan
sebagai user `node` (uid 1000); kode (`server.js`, `node_modules`,
`public`) milik root dan tidak bisa ditimpa proses, sedangkan isi `.next`
milik `node` supaya cache bisa ditulis.

Cache hilang setiap container dibuat ulang, sama seperti tiap deploy di
Railway. Panaskan dengan tempo yang sama (±0,6 detik antar URL dari
`sitemap.xml`, [`hosting-railway.md`](hosting-railway.md) §4). Volume untuk
`.next/cache` boleh dipasang agar gambar teroptimasi bertahan antar deploy;
`.next/server/app` jangan, karena ia juga memuat hasil build yang harus
ikut berganti.

Tetap **satu container**. `revalidateTag` hanya menyentuh cache proses
penerimanya; menjalankan dua container tanpa cache handler bersama (Redis)
membuat sebagian pembaca melihat artikel basi.

## 5. Memori

`CMD` menjalankan `node --max-old-space-size=512 server.js`, batas yang
sama dengan `startCommand` Railway ([`hosting-railway.md`](hosting-railway.md)
§2). Batasnya di `CMD`, bukan `NODE_OPTIONS`, supaya tidak ikut terbaca
proses lain. Bila log menunjukkan `JavaScript heap out of memory`, naikkan
angkanya di `Dockerfile`, jangan hapus batasnya. Batasi juga container-nya
(`--memory=1g`) supaya bocor memori tidak menjatuhkan service lain di host.

## 6. IP klien di belakang Tunnel

`src/lib/client-ip.ts` hanya memercayai `cf-connecting-ip` bila peer
terakhir di `x-forwarded-for` adalah IP Cloudflare. Di belakang
cloudflared + Caddy, peer-nya Caddy/cloudflared lokal, bukan Cloudflare,
sehingga semua pembaca terbaca satu IP: rate limit `/api/contact` dan
`/api/subscribe` jadi bersama, dan poll WordPress menghitung satu pemilih.
**Ini harus diselesaikan sebelum lalu lintas nyata dipindah**; belum
dikerjakan di sini.
