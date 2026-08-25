#!/usr/bin/env bash
#
# 05 — Rapikan induk lampiran gambar unggulan & sampul buku.
#
# Latar: REST menyembunyikan lampiran yang post_parent-nya bukan pos publik
# dari pembaca anonim (401 rest_forbidden). Gambar unggulan yang diunggah
# saat menyunting draf lain berinduk pada draf itu — situs tidak bisa
# membacanya dan jatuh ke gambar pengganti, walau wp-admin menampilkan
# gambarnya baik-baik saja. mu-plugin ≥3.3 (tgr_gambar) membuat render
# kebal terhadap kasus ini; skrip ini merapikan datanya: kolom "Diunggah Ke"
# kembali jujur, /media/{id} kembali terbaca anonim, dan redaksi berhenti
# menambal dengan mengunggah ulang berkas yang sama.
#
# AMAN SECARA BAWAAN: tanpa APPLY=1 skrip hanya menampilkan rencana, tidak
# mengubah apa pun. Dijalankan DI SERVER (direktori instalasi WordPress),
# dan hanya setelah 01-backup.sh dijalankan.
#
#   bash 05-perbaiki-induk-media.sh            # tinjau rencana saja
#   APPLY=1 bash 05-perbaiki-induk-media.sh    # jalankan sungguhan
#
# Idempoten: lampiran yang sudah dirapikan tidak lagi cocok dengan kueri,
# jadi eksekusi ulang menghasilkan nol baris. Induk lama dicetak per baris
# agar bisa dipulihkan manual bila perlu. Catatan: `wp post update` memicu
# attachment_updated → tgr-revalidate ≥1.2 ikut menyegarkan cache tiap
# artikel yang diperbaiki, maka pasang mu-plugin barunya lebih dulu.
#
set -euo pipefail

APPLY="${APPLY:-0}"

jalan() {
	if [ "$APPLY" = "1" ]; then
		echo "    \$ $*"
		"$@"
	else
		echo "    [rencana] $*"
	fi
}

PREFIX="$(wp db prefix)"

# Lampiran yang dipakai pos PUBLISH (gambar unggulan / sampul buku) tapi
# berinduk pada pos yang hilang atau tidak publish. GROUP BY lampiran:
# satu lampiran yang dipakai beberapa pos cukup dirapikan sekali (pos
# pemakai pertama yang menang).
kueri() {
	local meta_key="$1"
	wp db query --skip-column-names --batch "
		SELECT a.ID, MIN(p.ID), a.post_parent,
		       COALESCE(MIN(ip.post_status), '(hilang)')
		FROM ${PREFIX}posts p
		JOIN ${PREFIX}postmeta pm ON pm.post_id = p.ID AND pm.meta_key = '${meta_key}'
		JOIN ${PREFIX}posts a ON a.ID = pm.meta_value AND a.post_type = 'attachment'
		LEFT JOIN ${PREFIX}posts ip ON ip.ID = a.post_parent
		WHERE p.post_type = 'post' AND p.post_status = 'publish'
		  AND a.post_parent <> 0
		  AND (ip.ID IS NULL OR ip.post_status <> 'publish')
		GROUP BY a.ID, a.post_parent
	" | tr -d '\r'
}

echo "═══ Rapikan induk lampiran ═══"
[ "$APPLY" = "1" ] && echo "MODE: DIJALANKAN SUNGGUHAN" || echo "MODE: TINJAUAN (tidak ada perubahan)"
echo

total=0
for meta_key in _thumbnail_id tgr_buku_sampul; do
	echo "── Lampiran ${meta_key} berinduk pos non-publik ──"
	jumlah=0
	while IFS=$'\t' read -r lampiran pos induk_lama status_induk; do
		[ -z "${lampiran:-}" ] && continue
		echo "  lampiran $lampiran → induk baru: pos $pos (induk lama: $induk_lama, status: $status_induk)"
		jalan wp post update "$lampiran" --post_parent="$pos"
		jumlah=$((jumlah + 1))
	done < <(kueri "$meta_key")
	echo "  subtotal: $jumlah lampiran"
	total=$((total + jumlah))
	echo
done

if [ "$APPLY" = "1" ]; then
	echo "Selesai: $total lampiran dirapikan."
	echo "Periksa ulang (harus nol baris):  bash 05-perbaiki-induk-media.sh"
else
	echo "Tinjauan selesai — $total lampiran akan dirapikan; tidak ada yang diubah."
	echo "Bila rencana di atas sudah disetujui:  APPLY=1 bash 05-perbaiki-induk-media.sh"
fi
