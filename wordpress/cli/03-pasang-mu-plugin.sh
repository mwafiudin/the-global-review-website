#!/usr/bin/env bash
#
# 03 — Pasang mu-plugin tipe konten, lalu verifikasi lewat REST API.
#
# Dijalankan DARI MESIN LOKAL (bukan di server). Menyalin berkas via scp,
# kemudian memverifikasi hasilnya.
#
#   HOST=tgr WP_PATH=/var/www/theglobal-review.com bash 03-pasang-mu-plugin.sh
#
# HOST     — nama host di ~/.ssh/config (autentikasi kunci, tanpa kata sandi)
# WP_PATH  — direktori instalasi WordPress di server
#
set -euo pipefail

HOST="${HOST:?setel HOST, mis. HOST=tgr}"
WP_PATH="${WP_PATH:?setel WP_PATH, mis. WP_PATH=/var/www/theglobal-review.com}"
SITUS="${SITUS:-https://theglobal-review.com}"

SUMBER_DIR="$(cd "$(dirname "$0")/.." && pwd)/mu-plugins"

echo "==> Memastikan direktori mu-plugins ada"
ssh "$HOST" "mkdir -p '$WP_PATH/wp-content/mu-plugins'"

# Kedua mu-plugin dipasang bersama — tgr-revalidate.php dulu hanya punya
# jalur unggah manual (File Manager) dan mudah tertinggal versi.
for BERKAS in tgr-headless.php tgr-revalidate.php; do
	echo "==> Menyalin $BERKAS"
	scp "$SUMBER_DIR/$BERKAS" "$HOST:$WP_PATH/wp-content/mu-plugins/$BERKAS"

	echo "==> Memeriksa sintaks PHP di server"
	ssh "$HOST" "php -l '$WP_PATH/wp-content/mu-plugins/$BERKAS'"
done

echo "==> Menyegarkan permalink (agar rute CPT baru dikenali)"
ssh "$HOST" "cd '$WP_PATH' && wp rewrite flush && wp cache flush"

echo "==> Tipe konten terdaftar di server"
ssh "$HOST" "cd '$WP_PATH' && wp post-type list --fields=name,label,public --format=table" \
  | grep -E "tgr_|name" || true

echo
echo "==> Verifikasi lewat REST API publik"
for rute in podcasts albums polls; do
  kode=$(curl -sS -o /dev/null -w "%{http_code}" "$SITUS/wp-json/wp/v2/$rute?per_page=1" || echo "gagal")
  printf "    /wp-json/wp/v2/%-10s → HTTP %s\n" "$rute" "$kode"
done

echo
echo "Catatan: 'polls' bersifat non-publik, jadi wajar bila menolak akses"
echo "anonim. Ia tetap terbaca memakai Application Password."
