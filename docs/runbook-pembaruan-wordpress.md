# Runbook: pembaruan inti WordPress (6.5.10 → 7.1)

Panduan klik-demi-klik untuk pemilik akses. Seluruh langkah dijalankan dari
sisi pemilik akses — tidak ada yang bisa (atau boleh) diotomatiskan dari
luar, karena host menolak SSH/WP-CLI dan pembaruan inti mengubah database
searah.

## Kenapa relatif aman di arsitektur ini — dan di mana rawannya

Pembaca **tidak akan terganggu** apa pun yang terjadi: mereka melihat
Next.js di Vercel yang menyajikan halaman dari cache. Kalau WordPress
tumbang satu jam, situs tetap tayang; yang berhenti hanya artikel baru dan
pembaruan konten.

Yang menanggung risiko adalah **wp-admin** (tempat redaksi bekerja) dan
**REST API** (sumber data situs). Peta risikonya:

| Risiko | Peluang | Mitigasi |
| --- | --- | --- |
| Plugin tua fatal error → wp-admin layar putih | Paling mungkin — ada ±99 pembaruan tertunda | Perbarui plugin DULU sebelum inti; backup = jalan pulang |
| Versi PHP host terlalu tua untuk plugin baru | Mungkin | Cek dulu di Peralatan → Kesehatan Situs |
| Migrasi database inti gagal di tengah | Kecil | Backup database sebelum mulai |
| REST API berubah perilaku | Sangat kecil (API-nya stabil bertahun-tahun) | Potret kesehatan sebelum/sesudah membandingkannya otomatis |
| mu-plugin `tgr-headless.php` rusak | Nyaris nol — pembaruan inti TIDAK menyentuh `wp-content/` | Tidak perlu tindakan |

Editor klasik yang dipakai redaksi juga perlu dipastikan tetap klasik
setelah pembaruan (langkah 6) — kalau tampilannya berubah jadi editor blok,
biasanya tinggal memperbarui/mengaktifkan plugin Classic Editor.

## Prasyarat

- Pilih jam sepi redaksi (tidak ada yang sedang menulis/menerbitkan).
- Akses cPanel + akun admin wp-admin.
- PC dengan repo ini + `.env.local` terisi (untuk skrip potret kesehatan).
- Sisihkan ±45–60 menit; jangan disambi.

## Langkah

**1. Backup penuh (WAJIB — ini satu-satunya jalan pulang).**
Di cPanel → Backup (atau WP Toolkit → Back Up): buat backup **file + database**
dan unduh salinannya ke PC. Jangan lanjut sebelum backup selesai terunduh.

**2. Potret kesehatan SEBELUM.**

```bash
node wordpress/rest/periksa-kesehatan.mjs
```

Menghasilkan `wordpress/rest/kesehatan-<waktu>.json` — biarkan, ini
pembanding langkah 7.

**3. Cek kesehatan dasar.**
wp-admin → Peralatan → Kesehatan Situs: catat versi PHP host. Bila PHP di
bawah 7.4, naikkan dulu lewat cPanel (Select PHP Version) — plugin modern
banyak yang menolak PHP tua.

**4. Perbarui PLUGIN dulu, baru inti.**
wp-admin → Dasbor → Pembaruan:

- Centang semua plugin → Perbarui Plugin. Tunggu selesai; bila satu gagal,
  catat namanya dan lanjutkan sisanya.
- Perbarui tema bila ditawarkan (tema tidak dipakai pembaca, tapi versi tua
  bisa memicu peringatan di wp-admin).
- Terakhir: tombol **Perbarui ke WordPress 7.1** (banner biru). Jangan
  menutup tab selama proses berjalan.
- Bila diminta "Perbarui Basis Data WordPress" setelahnya → klik ya.

**5. Muat ulang wp-admin.**
Layar putih / error? Jangan panik — lihat "Jalur pemulihan" di bawah.

**6. Uji fungsi redaksi (5 menit).**

- Buka satu tulisan lama → pastikan editornya masih klasik, kotak
  **Sorotan Judul** masih ada di sidebar.
- Simpan draf tanpa sorotan → harus bebas; coba Terbitkan tanpa sorotan →
  harus tertahan + notice merah.
- Terbitkan ulang satu tulisan ber-sorotan → buka situsnya, pastikan
  perubahan tampil (webhook revalidate masih hidup).

**7. Potret kesehatan SESUDAH + banding.**

```bash
node wordpress/rest/periksa-kesehatan.mjs
```

```bash
node wordpress/rest/periksa-kesehatan.mjs --banding wordpress/rest/kesehatan-<sebelum>.json wordpress/rest/kesehatan-<sesudah>.json
```

Keluaran tanpa `⚠ REGRESI` = selesai. Commit kedua berkas JSON sebagai
jejak audit.

## Jalur pemulihan

- **wp-admin layar putih setelah pembaruan plugin**: cPanel → File Manager →
  `wp-content/plugins/` → ganti nama folder plugin yang barusan diperbarui
  (mis. `nama-plugin` → `nama-plugin.off`) → wp-admin hidup lagi tanpa
  plugin itu. Ulangi per plugin bila perlu.
- **Rusak setelah pembaruan inti**: cPanel → Backup → Restore (file +
  database) dari backup langkah 1. Situs pembaca tidak terganggu selama
  proses ini.
- `wp-content/mu-plugins/tgr-headless.php` tidak pernah disentuh pembaruan
  inti — tidak perlu diunggah ulang.

## Catatan versi

Runbook ini semula ditulis untuk target 7.0.4; banner wp-admin kini
menawarkan 7.1 — langkahnya sama persis, cukup ikuti versi yang ditawarkan
banner.
