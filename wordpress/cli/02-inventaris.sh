#!/usr/bin/env bash
#
# 02 — Tarik inventaris konten sebagai bahan pemetaan rubrik.
#
# Menghasilkan berkas CSV yang bisa dibuka di spreadsheet dan diisi redaksi:
# kolom "rubrik_baru" dikosongkan untuk diisi manual.
#
#   bash 02-inventaris.sh
#
set -euo pipefail

TUJUAN="${TUJUAN:-$HOME/inventaris-tgr}"
mkdir -p "$TUJUAN"

echo "==> Kategori (beserta jumlah tulisan)"
wp term list category \
  --fields=term_id,name,slug,parent,count \
  --orderby=count --order=DESC --format=csv > "$TUJUAN/kategori.csv"

# Tambahkan kolom kosong untuk diisi redaksi.
{
  head -1 "$TUJUAN/kategori.csv" | sed 's/$/,rubrik_baru,tindakan/'
  tail -n +2 "$TUJUAN/kategori.csv" | sed 's/$/,,/'
} > "$TUJUAN/kategori-pemetaan.csv"
rm "$TUJUAN/kategori.csv"
echo "    $TUJUAN/kategori-pemetaan.csv"

echo "==> Tag"
wp term list post_tag --fields=term_id,name,slug,count \
  --orderby=count --order=DESC --format=csv > "$TUJUAN/tag.csv"
echo "    $TUJUAN/tag.csv"

echo "==> Artikel (5.678 — mungkin perlu beberapa menit)"
wp post list --post_type=post --post_status=publish \
  --fields=ID,post_title,post_name,post_date,post_author \
  --format=csv > "$TUJUAN/artikel.csv"
echo "    $TUJUAN/artikel.csv"

echo "==> Penulis"
wp user list --fields=ID,user_login,display_name,user_email,roles \
  --format=csv > "$TUJUAN/penulis.csv"
echo "    $TUJUAN/penulis.csv"

echo "==> Halaman"
wp post list --post_type=page --post_status=any \
  --fields=ID,post_title,post_name,post_status --format=csv > "$TUJUAN/halaman.csv"
echo "    $TUJUAN/halaman.csv"

echo
echo "==> Artikel tanpa gambar utama (perlu perhatian saat migrasi)"
wp post list --post_type=post --post_status=publish --format=ids \
  | tr ' ' '\n' | while read -r id; do
      [ -z "$id" ] && continue
      if [ -z "$(wp post meta get "$id" _thumbnail_id 2>/dev/null)" ]; then
        echo "$id"
      fi
    done > "$TUJUAN/tanpa-gambar.txt" || true
echo "    $(wc -l < "$TUJUAN/tanpa-gambar.txt") artikel → $TUJUAN/tanpa-gambar.txt"

echo
echo "Selesai. Unduh folder $TUJUAN, lalu isi kolom rubrik_baru pada"
echo "kategori-pemetaan.csv bersama redaksi."
