#!/usr/bin/env bash
#
# 01 — Cadangkan dulu, sebelum apa pun disentuh.
#
# Jalankan di server (lewat SSH), dari direktori instalasi WordPress.
# Hasil cadangan diletakkan di luar document root agar tidak bisa diunduh
# publik.
#
#   bash 01-backup.sh
#
set -euo pipefail

STAMP="$(date +%Y%m%d-%H%M%S)"
TUJUAN="${TUJUAN:-$HOME/backup-tgr}"

mkdir -p "$TUJUAN"

echo "==> Memeriksa WP-CLI dan instalasi WordPress"
wp --info
wp core version
echo

echo "==> Mengekspor basis data"
wp db export "$TUJUAN/db-$STAMP.sql"
gzip -f "$TUJUAN/db-$STAMP.sql"
echo "    tersimpan: $TUJUAN/db-$STAMP.sql.gz"
echo

echo "==> Mengarsipkan wp-content (tema, plugin, unggahan)"
# 7.000 media — arsip ini akan besar; jalankan saat trafik rendah.
tar -czf "$TUJUAN/wp-content-$STAMP.tar.gz" wp-content
echo "    tersimpan: $TUJUAN/wp-content-$STAMP.tar.gz"
echo

echo "==> Ringkasan"
ls -lh "$TUJUAN" | tail -5
echo
echo "Selesai. Unduh kedua berkas ke tempat aman sebelum melanjutkan."
