# Terjemahan Tersimpan — cetak biru (BELUM diimplementasikan)

Status: **dibekukan atas keputusan pemilik (20 Agu 2026)** — pohon `/en` saat
ini diterjemahkan otomatis oleh **Selat** (widget Google `element.js` di
browser pembaca; lihat `src/components/Selat.tsx`). Dokumen ini adalah cetak biru
lengkap jalur penggantinya: artikel diterjemahkan **sekali**, hasilnya
**tersimpan di WordPress**, dan disajikan dari server selamanya. Diaktifkan
kapan pun pemilik memutuskan — tidak ada kode yang perlu dirombak, hanya
ditambah.

## Kenapa jalur ini disiapkan

| | Selat / widget element.js (sekarang) | Terjemahan tersimpan (cetak biru ini) |
|---|---|---|
| Biaya | Rp0 | Rp0 (kuota gratis Azure) — atau ±Rp150rb sekali bila pakai LLM |
| Umur | Layanan deprecated Google, bisa mati kapan saja | Milik sendiri, permanen |
| SEO | Nol — HTML tetap Indonesia, `/en` selamanya noindex | `/en/{slug}` bisa dibuka untuk Google Search + hreflang |
| Koreksi redaksi | Tidak bisa | Bisa (judul/ringkasan disunting di wp-admin) |
| Pembaca | Terjemah ulang di tiap kunjungan | Instan, sudah jadi dari server |

## Arsitektur

Terjemahan disimpan sebagai **post meta pada artikel yang sama** (bukan post
duplikat — tidak mengotori daftar tulisan, dan ikut terbawa jalur data yang
sudah ada karena `LIST_FIELDS`/`DETAIL_FIELDS` di `src/lib/wp/articles.ts`
sudah menyertakan `meta`).

### 1. mu-plugin baru `wordpress/mu-plugins/tgr-translate.php`

Gaya mengikuti `tgr-revalidate.php`: diam total bila konstanta belum ada di
`wp-config.php` (aman diunggah lebih dulu), komentar Indonesia, guard ABSPATH.

Konstanta `wp-config.php`:

```php
define( 'TGR_TRANSLATE_ENGINE', 'azure' );   // 'azure' | 'google'; tanpa ini plugin diam
define( 'TGR_TRANSLATE_API_KEY', '...' );    // kunci mesin — hanya di sini, jangan di DB/repo
define( 'TGR_TRANSLATE_REGION', 'southeastasia' ); // khusus Azure
```

Meta yang diregistrasi (`register_post_meta`, pola persis meta buku di
`tgr-headless.php`):

| Meta | REST | Sanitasi |
|---|---|---|
| `tgr_en_title` | `show_in_rest: true` | `sanitize_text_field` |
| `tgr_en_excerpt` | `show_in_rest: true` | `sanitize_textarea_field` |
| `tgr_en_html` | **bukan lewat `meta`** — diekspos sebagai field REST level-atas via `register_rest_field('post','tgr_en_html')` | `wp_kses` allowed-post **+ iframe** (embed YouTube; `wp_kses_post` polos membuangnya) |
| `tgr_en_hash` | true | pola md5 |
| `tgr_en_status` | true | whitelist `idle/queued/running/done/error` |
| `tgr_en_updated`, `tgr_en_error` | false (pesan galat tak bocor publik) | `sanitize_text_field` |

Kenapa `tgr_en_html` tidak lewat `meta`: respons daftar `/posts` sudah 4–8 MB;
menaruh HTML ±12rb karakter di `meta` menggandakannya. `register_rest_field`
dengan `get_callback` bersifat lazy sejak WP 5.3 — tidak dieksekusi bila tak
diminta `_fields` — dan filter `_fields` level-atas terbukti bekerja di host
ini (nested `_fields=meta.xxx` justru TIDAK — lihat catatan di
`src/lib/wp/articles.ts`). Frontend cukup menambah `,tgr_en_html` ke
`DETAIL_FIELDS`; daftar tidak pernah memuatnya.

Alur otomatis:

- Hook `transition_post_status` (guard revision/autosave/tipe/status publish):
  bila `md5(title|excerpt|content)` ≠ `tgr_en_hash` → status `queued` +
  `wp_schedule_single_event` (+15 dtk, dedup `wp_next_scheduled`).
- Handler cron: re-cek hash → `running` → panggil mesin → simpan meta +
  panggil `tgr_revalidate_send()` milik `tgr-revalidate.php` secara eksplisit
  (menulis meta TIDAK memicu webhook revalidate yang ada) → `done`; gagal →
  `error` + pesan ringkas di `tgr_en_error`.
- Anti-loop: semua penulisan via `update_post_meta` (tak pernah
  `wp_update_post`), hash menghentikan penjadwalan ulang.
- **Drip backfill harian** (arsip ±887 artikel ≈ 10,3 juta karakter): event
  cron harian menerjemahkan pos tertua yang belum `done` (sejak
  `2023-01-01` — selaras `WP_ARCHIVE_AFTER`, jangan buang kuota untuk pos
  pra-arsip) sampai budget harian ±63rb karakter. Pelacak kuota bulanan di
  satu option (`{bulan, karakter}`, reset tiap ganti bulan, berhenti halus di
  1,9 juta) — kuota F0 Azure 2 juta karakter/bulan → backfill selesai
  **±5–6 bulan, Rp0**.
- **wp-admin untuk redaksi**: meta box "Terjemahan Inggris" di editor post
  (status + waktu + galat; input koreksi `tgr_en_title`/`tgr_en_excerpt`;
  tombol "Terjemahkan sekarang/ulang" = tautan ber-nonce `admin-post.php`,
  pola tombol CSV di `tgr-headless.php`) + kolom ringkas **EN** (✓/—/!) di
  daftar tulisan untuk memantau sebaran backfill.
- WP-Cron di CMS headless tetap terpicu oleh trafik REST rutin dari Vercel
  (ISR tiap 300 dtk). Bila macet: tombol manual memanggil `spawn_cron()`
  langsung, dan tersedia opsi cron cPanel (`wget -q -O /dev/null
  ".../wp-cron.php?doing_wp_cron"` per 5 menit — pakai wget; WAF host menolak
  UA curl). Jangan `DISABLE_WP_CRON`.

Adapter mesin (`switch` pada `TGR_TRANSLATE_ENGINE`), 3 bidang per artikel —
`post_title` mentah, `post_excerpt` mentah (kosong = lewati; excerpt otomatis
WP hanyalah duplikat awal body), dan `apply_filters('the_content', …)`:

- **azure**: `POST api.cognitive.microsofttranslator.com/translate
  ?api-version=3.0&from=id&to=en&textType=html`, header
  `Ocp-Apim-Subscription-Key` + `Ocp-Apim-Subscription-Region`. Limit 50rb
  karakter/permintaan (artikel ±12rb muat sekali kirim; pecah di `</p>` bila
  >45rb). Timeout 60 dtk, 1 kali ulang untuk 429/5xx.
- **google**: `POST translation.googleapis.com/language/translate/v2?key=…`,
  `{q:[…], source:'id', target:'en', format:'html'}`. Limit 100 KB/permintaan.

### 2. Lapisan frontend (Next.js)

- `Article.en?: { title; excerpt; bodyHtml? }` di `src/lib/types.ts`;
  dipetakan di `src/lib/wp/map.ts` dari meta + field `tgr_en_html`, dengan
  `bodyHtml` melewati **pipeline sanitasi yang sama** (`sanitize.ts`) —
  sanitasi dua lapis (kses PHP + FE).
- Helper murni `articleTitle(article, lang)` / `articleExcerpt(article, lang)`
  di `src/lib/articles.ts` → dipakai `ArticleCard`, `Search`, kartu
  prev/next: teaser di daftar `/en` ikut Inggris begitu tersimpan.
- `[lang]/[slug]/page.tsx`: bila `lang==="en"` dan `article.en?.bodyHtml` ada
  → render judul/lead/body EN, metadata dari EN, `highlight` di-nol-kan
  (frasa sorotan berbahasa Indonesia); robots di-flip dari `noindex` ke
  index + hreflang timbal balik
  (`dwibahasa()` di `src/lib/seo.ts` sudah ada); sitemap menambah entri
  `/en/{slug}` hanya untuk artikel ber-terjemahan.
- Cache tidak berubah: terjemahan menempel di objek post yang sama, cache
  tetap bebas-bahasa (aturan `i18n-server.ts` dipatuhi). Penyegaran memakai
  alur revalidate yang ada (`wp:post:{slug}` + `wp:posts`).

## Langkah aktivasi (saat pemilik memutuskan)

1. **Daftar Azure** (±10 menit): akun di `azure.microsoft.com/free` (kartu
   hanya verifikasi identitas — tier F0 **hard-cap, tidak mungkin menagih**;
   itu alasannya dipilih di atas Google Cloud yang menagih otomatis begitu
   kuota gratis 500rb/bln terlewati) → Create a resource → **Translator** →
   region Southeast Asia, pricing tier **F0** → salin Key + Region.
2. Minta dev membangun `tgr-translate.php` + lapisan frontend sesuai dokumen
   ini (perkiraan ±550 baris PHP + ±350 baris TS + tes).
3. Unggah mu-plugin via cPanel File Manager TANPA konstanta dulu (plugin diam,
   situs aman; pola teruji `wordpress/README.md`), lalu isi konstanta.
4. Uji satu artikel lewat tombol manual → cek `/en/{slug}` tersaji Inggris
   dari server → biarkan drip mencicil arsip.
5. Setelah tersimpan, konten `/en` sudah Inggris dari server sehingga Selat
   praktis tak menemukan apa pun untuk disapu; begitu arsip selesai,
   komponen `Selat` dipensiunkan (satu baris di `[lang]/layout.tsx`).

Ditinjau ulang saat aktivasi: label transparansi kecil pada artikel EN
("Machine-translated from the Indonesian original" + tautan versi asli) —
pernah disetujui pemilik untuk terjemahan tersimpan, lalu ditangguhkan;
praktik standar media dan melindungi redaksi bila ada istilah meleset.

Alternatif kualitas: mesin LLM (Anthropic Haiku, Batch API) — ±Rp100–200rb
sekali untuk seluruh arsip, kualitas editorial di atas NMT; arsitektur sama
persis, hanya satu adapter tambahan. Tier gratis DeepL sudah dihapus (Juli
2026) — tidak relevan lagi.
