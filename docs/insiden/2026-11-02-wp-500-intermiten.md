# 30 Okt–2 Nov 2026: WordPress menjawab 500/503 secara intermiten

Status: **Diamati**, sebab akar belum terbukti. Jejak isi 5xx ditambahkan di PR `claude/hungry-franklin-855950`; log PHP host menunggu Wafi.
Tingkat: P3 / SEV-3 (pembaca hampir tidak melihatnya: data lama tetap tersaji dari cache).
Pelapor: sampling log Railway (`WP menjawab`) dan pemeriksa sintetis (issue #40, 1 Nov 21.20 UTC).

## Yang terlihat

`railway logs --since 4d --filter '"WP menjawab"' --json`, 30 Okt 06.07 sampai 2 Nov 03.46 UTC:

- 348 baris = **96 kejadian** (satu galat tercetak 2–4 kali: `⨯ Error` + `Error`, metadata + halaman). Tiap kejadian sudah termasuk satu ulangan 700 ms kemudian, jadi kondisinya bertahan lebih dari satu detik.
- 500: 325 baris, 503: 23 baris (503 berkelompok, mis. 30 Okt 12.47 UTC empat slug dalam satu detik).
- **Semuanya** permintaan detail `getArticle`: `/posts?slug=…&_embed=wp:featuredmedia,wp:term&_fields=…,tgr_gambar,_links,_embedded`. Tidak ada satu pun permintaan daftar yang tercatat 5xx dalam periode yang sama.
- Puluhan slug berbeda; slug teratas (`polarisasi-blok-indo-pasifik…`, 16 baris) hanya muncul 4 kali. Bukan satu pos rusak.
- Reproduksi tunggal, 2 Nov 04.19 UTC, UA `TGR-Frontend/1.0`, URL persis seperti di log: **200**, TTFB 1,2 dtk, 53 KB, `Server: nginx`, tanpa header cache. Pos yang sama sehat di luar jendela gangguan.
- Pemantau GitHub (#40) mendapat 500 untuk `/posts?per_page=1&_fields=slug,date_gmt` (tanpa `_embed`, UA lain, IP runner). Jadi 500 bukan khas `_embed`, bukan khas IP Railway: host sedang tidak sanggup pada saat itu.

## Korelasi dengan beban

`railway logs --since 4d -n 5000 --filter '"Menunggu antrean"'` (terpotong di 5.000 baris, 1 Nov 03.36 sampai 2 Nov 04.17 UTC): galat antrean slot 10 dtk muncul **90–580 baris per jam sepanjang hari**, puncak 1 Nov 05.31–05.35 UTC. Dari 45 kejadian 5xx di jendela itu, **35 (78%)** berada dalam ±2 menit dari galat antrean, padahal galat antrean hanya ada di 236 dari 1.480 menit (16%). Artinya 5xx muncul saat WP lambat menjawab dan keempat slot penuh.

Log HTTP Railway 3 jam terakhir (5.000 permintaan): 1.105 IP berbeda, UA browser palsu berotasi, 1.379 permintaan ke `/category/*` (tiap rubrik ±55 kali). 98% terlayani cache (< 100 ms). Beban ke WP datang dari **revalidasi latar** cache daftar (300 dtk): `byCategory` meminta 100 pos lengkap dengan `content` (3–8 MB, beratnya di filter `the_content` PHP) dan `adjacentArticles` membuat kunci baru per artikel.

## Dugaan, urut dari yang paling didukung bukti

1. **Batas sumber daya akun shared host** (CloudLinux LVE: entry processes / jumlah proses PHP / memori) tercapai saat revalidasi daftar berat berbarengan dengan permintaan detail. Cocok dengan korelasi beban dan 503 berkelompok. Belum terbukti karena isi jawaban 500 tidak pernah dicatat.
2. Koneksi MySQL habis (`max_user_connections`): WP menjawab 500 HTML "Error establishing a database connection".
3. PHP fatal sesekali di salah satu plugin saat memori hampir habis.

`tgr_gambar` (mu-plugin) **bukan** tersangka utama: hanya `wp_get_attachment_image_url` per pos, dan permintaan yang sama sehat di luar jendela gangguan.

## Yang diubah di kode kita

`src/lib/wp/client.ts`: galat 5xx kini membawa `server`, `content-type`, `retry-after`, dan 200 karakter pertama isi jawaban (tag HTML dibuang). Kejadian berikutnya langsung membedakan JSON `internal_server_error` (PHP fatal), halaman DB, halaman batas sumber daya, atau 503 nginx. Isi jawaban kini juga dibaca habis, sehingga soket tidak menunggu GC.

## Pertanyaan untuk Wafi (cPanel webiihost)

1. **Resource Usage** (cPanel > Metrics > Resource Usage), rentang 30 Okt–2 Nov: apakah ada *faults* untuk Entry Processes, NPROC, Physical Memory, atau CPU? Jam berapa saja (bandingkan dengan 1 Nov 05.31–05.35 UTC = 12.31–12.35 WIB, dan 1 Nov 21.20 UTC = 2 Nov 04.20 WIB)? Berapa batas EP dan memori paketnya?
2. **Errors** (cPanel > Metrics > Errors) dan `error_log` di akar WordPress `cms.theglobal-review.com`: baris pada 1 Nov 12.31–12.35 WIB dan 2 Nov 04.20 WIB. Kami mencari "Allowed memory size", "max_user_connections", "Maximum execution time", atau "PHP Fatal error".
3. Versi PHP dan `memory_limit` / `max_execution_time` untuk domain itu (MultiPHP INI Editor), serta jumlah PHP-FPM `max_children` bila paketnya pakai FPM.
4. Apakah ada cron host, backup, atau pemindaian malware terjadwal di sekitar jam tersebut?
5. Apakah paket bisa dinaikkan batas EP/memorinya, berapa biayanya?

## Langkah berikutnya

- Setelah deploy PR ini, tunggu satu kejadian lalu baca isinya: `railway logs --since 1d --filter '"WP menjawab 5"' --json`.
- Bila dugaan 1 terbukti, pilihan di sisi kita (keputusan Farrez, Technical Decision Protocol): daftar tanpa `content` (waktu baca dihitung PHP lewat field REST baru), memperpanjang `LIST_REVALIDATE`, atau menurunkan `MAX_CONCURRENT`.
