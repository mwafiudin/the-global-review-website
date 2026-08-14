# Continuous Integration

Pemeriksaan otomatis yang berjalan di GitHub Actions setiap push ke `main`
dan setiap pull request. Definisinya di `.github/workflows/ci.yml`.

Aturan mainnya satu kalimat: **CI hanya menjalankan yang tidak dijalankan
siapa pun.** Vercel sudah membangun tiap push dan membuat preview per PR,
jadi verifikasi build ada di sana — CI mengisi celahnya.

---

## Apa yang dijalankan

| Job | Isi | Butuh jaringan? |
| --- | --- | --- |
| `frontend` | `npm ci` → `lint` → `typecheck` → `test` | tidak |
| `wordpress` | `php -l` mu-plugin, `shellcheck` skrip CLI | tidak |

Keduanya berjalan paralel, tanpa satu pun secret, dan selesai sekitar satu
menit.

- **`lint`** — `eslint --max-warnings 0`. Sejak Next 16, `next build` tidak
  lagi memanggil ESLint, jadi tanpa job ini `eslint.config.mjs` praktis
  konfigurasi mati. `--max-warnings 0` bukan hiasan: aturan performa
  `core-web-vitals` (`no-img-element` dkk.) berlevel *warning*, dan tanpa
  flag itu ESLint keluar dengan kode 0 sambil masalahnya menumpuk.
- **`typecheck`** — `next typegen && tsc --noEmit`. `next build` hanya
  mengecek tipe modul yang ikut ter-bundle; ini mengecek seluruh cakupan
  `tsconfig.json`.
- **`test`** — `vitest run` atas fungsi murni di `src/lib/wp/`
  (`sanitize`, `rubrik`, `map`). Semuanya offline: `users` dan `category`
  disuplai langsung ke `wpPostToArticle`, jadi tidak ada request ke WP.
- **`wordpress`** — `wordpress/mu-plugins/*.php` dipasang manual ke host
  produksi lewat cPanel tanpa SSH. Syntax error di sana berarti situs WP
  putih dan mahal dipulihkan; `php -l` menangkapnya di sini, gratis.
  Skrip CLI dicek `shellcheck --severity=warning` — bukan default. Skrip
  yang ada sudah rapi (`set -euo pipefail`, variabel dikutip), sementara
  shellcheck default keluar non-zero bahkan untuk temuan level *info*
  seperti SC2015 di `04-rubrik.sh` (pola `[ … ] && echo … || echo …`,
  aman di sana karena `echo` tidak bisa gagal). Ambang ini menyaring nit
  yang tidak mencegah outage. Bisa dinaikkan ke default begitu skripnya
  pernah dibersihkan sekali.

## Kenapa `next typegen` wajib mendahului `tsc`

`tsconfig.json` meng-`include` `.next/types/**` dan `next-env.d.ts`, tapi
keduanya gitignored. Di clone bersih file itu belum ada, jadi `tsc --noEmit`
polos akan gagal. `next typegen` (Next ≥ 15.5) menghasilkannya **tanpa
build dan tanpa jaringan** — ia hanya membaca `next.config.ts`.

Itulah yang membuat typecheck penuh bisa jalan tanpa `WP_API_URL`.

## Kenapa `next build` sengaja tidak ada di CI

`src/lib/wp/client.ts` melempar error bila `WP_API_URL` kosong, dan `/`
serta `/redaksi` di-prerender saat build — artinya `next build` selalu
menembak WordPress produksi. Host itu rate-limited (lihat semafor
`MAX_CONCURRENT` di `client.ts` dan catatan WAF di `wordpress/README.md`).

Menjalankannya di CI berarti menambah beban ke host rapuh tiap push, butuh
secret, dan membuat CI bisa merah karena 503 padahal kodenya benar —
sementara Vercel sudah melakukan build yang sama dan statusnya sudah
tampil di PR. Jadi build diserahkan sepenuhnya ke Vercel.

## Menjalankan gate yang sama di lokal

Persis urutan yang dipakai CI:

```bash
npm ci && npm run lint && npm run typecheck && npm test
```

Kalau ini hijau di laptop, ia hijau di CI. `.nvmrc` (Node 22) dan
`engines` di `package.json` menjaga versi Node laptop, CI, dan Vercel tetap
sama; CI membacanya lewat `node-version-file`.

Job `wordpress` tidak punya langkah instalasi: `ubuntu-latest` (kini
Ubuntu 24.04) sudah membawa **PHP 8.3.6** dan **ShellCheck 0.9.0**. Di
Windows keduanya biasanya tidak ada, jadi job itu paling praktis
diverifikasi lewat CI saja.

Perlu diingat `php -l` mengecek terhadap PHP 8.3, bukan versi PHP host
WordPress (yang belum terdokumentasi di repo ini). Hari ini itu aman:
kedua mu-plugin tidak memakai satu pun sintaks khusus PHP 8.x — tanpa
`match`, nullsafe, atribut, maupun deklarasi tipe skalar — jadi tidak ada
celah "lolos di CI, fatal di host". Kalau nanti ada yang menulis sintaks
modern di sana, versi PHP host harus dipastikan lebih dulu.

## Kalau CI merah

1. Buka tab **Actions** → run yang merah → job yang gagal.
2. Langkah yang gagal ditandai; bacanya dari baris error paling atas.
3. Reproduksi lokal dengan perintah step yang sama (semuanya di atas).
4. Perhatikan bahwa job dibatalkan otomatis (`cancel-in-progress`) kalau
   ada push baru di branch yang sama — itu bukan kegagalan.

## Langkah manual: branch protection

CI ini melaporkan, tapi belum menghalangi merge. Setelah run pertama
hijau, aktifkan di **Settings → Branches → Add rule** untuk `main`, dan
tandai kedua status check sebagai *required*:

- `Lint, typecheck & test`
- `Lint mu-plugin & skrip`

Nama yang muncul di daftar adalah `name:` job, bukan kunci `jobs:`-nya.

## Dependabot

`.github/dependabot.yml` membuka PR mingguan untuk dua ekosistem: `npm`
dan `github-actions`. Yang kedua adalah pasangan wajib dari keputusan
mem-pin action ke tag mayor (`@v5`) — action yang basi adalah jalur masuk
supply-chain.

Update `minor` dan `patch` dikelompokkan jadi satu PR; `major` tetap
terpisah supaya catatan rilisnya sempat dibaca. `next` dan `react` di-pin
eksak, jadi kenaikannya memang selalu lewat PR yang harus di-review.

CI **tidak** menjalankan `npm audit`. Alasannya: hari ini `npm audit`
sudah melaporkan advisory pada `next@16.2.10` yang baru tuntas di 16.3.x,
jadi menambahkannya sekarang hanya membuat CI merah permanen tanpa
menambah informasi. Dependabot yang menanganinya — lewat PR yang bisa
di-review, bukan lewat gate yang diabaikan.
