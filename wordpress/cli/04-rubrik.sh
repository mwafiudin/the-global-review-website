#!/usr/bin/env bash
#
# 04 — Tata ulang 37 kategori lama menjadi rubrikasi desain baru.
#
# AMAN SECARA BAWAAN: tanpa APPLY=1 skrip hanya menampilkan rencana, tidak
# mengubah apa pun. Jalankan di STAGING lebih dulu, tidak pernah langsung
# di produksi, dan hanya setelah 01-backup.sh dijalankan.
#
#   bash 04-rubrik.sh            # tinjau rencana saja
#   APPLY=1 bash 04-rubrik.sh    # jalankan sungguhan
#
# Tiga jenis tindakan:
#   GANTI  — ubah nama/slug kategori. Paling aman: seluruh kaitan tulisan
#            tetap utuh karena term-nya sama, hanya labelnya berubah.
#   GABUNG — pindahkan seluruh tulisan ke kategori tujuan, lalu hapus asal.
#   INDUK  — pindahkan kategori menjadi anak dari kategori lain.
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

# ─────────────────────────────────────────────────────────────────────────
# GANTI — pemetaan 1:1, "slug_lama|slug_baru|Nama Baru"
# ─────────────────────────────────────────────────────────────────────────
GANTI=(
	"analisis|analisis|Analisis"
	"internasional|internasional|Internasional"
	"geopolitik|geopolitik|Geopolitik"
	"ekonomi-bisnis|ekonomi-bisnis|Ekonomi & Bisnis"
	"hukum|hukum|Hukum"
	"iptek|sains-teknologi|Sains & Teknologi"
	"lingkungan-hidup|lingkungan-hidup|Lingkungan Hidup"
	"kesehatan|kesehatan|Kesehatan"
	"sorot-tokoh|sorot-tokoh|Sorot Tokoh"
	"bedah-buku|bedah-buku|Bedah Buku"
	"media|media|Media"
	"asean|asia-tenggara|Asia Tenggara"
	"komentar-pembaca|komentar-pembaca|Komentar Pembaca"
)

# ─────────────────────────────────────────────────────────────────────────
# GABUNG — "slug_asal|slug_tujuan". Tulisan dipindah, kategori asal dihapus.
# ─────────────────────────────────────────────────────────────────────────
GABUNG=(
	"politik|politik-keamanan"
	"hankam|politik-keamanan"
	"geopolitik-militer|geopolitik"
)

# ─────────────────────────────────────────────────────────────────────────
# INDUK — "slug_anak|slug_induk". Kosongkan induk untuk menaikkan ke atas.
# ─────────────────────────────────────────────────────────────────────────
INDUK=(
	"militer|politik-keamanan"
	"intelijen|politik-keamanan"
	"kejahatan-transnasional|politik-keamanan"
	"diplomasi|"
)

# ─────────────────────────────────────────────────────────────────────────
# Menunggu keputusan redaksi — TIDAK disentuh skrip ini.
# ─────────────────────────────────────────────────────────────────────────
TINJAU=(
	"kepentingan-nasional  504  tidak ada padanan di desain baru"
	"khazanah              244  induk dari Sosial Budaya/Sejarah/Media/Nusantara/Pendidikan"
	"sosial-budaya         277  desain memisah Sosial dan Budaya — perlu pemilahan manual"
	"sejarah               221  calon: Features, atau rubrik baru"
	"nusantara             107  calon: Sosial, atau rubrik baru"
	"strategi-global       105  calon: digabung ke Geopolitik"
	"pendidikan             81  calon: Sosial"
	"wawancara              11  calon: Features"
)

echo "═══ Rencana penataan rubrik ═══"
[ "$APPLY" = "1" ] && echo "MODE: DIJALANKAN SUNGGUHAN" || echo "MODE: TINJAUAN (tidak ada perubahan)"
echo

echo "── 1. Pastikan kategori tujuan yang belum ada ──"
if ! wp term get category politik-keamanan --by=slug >/dev/null 2>&1; then
	jalan wp term create category "Politik-Keamanan" --slug=politik-keamanan
else
	echo "    politik-keamanan sudah ada"
fi
echo

echo "── 2. GANTI nama/slug (kaitan tulisan tetap utuh) ──"
for baris in "${GANTI[@]}"; do
	IFS='|' read -r lama baru nama <<< "$baris"
	id=$(wp term get category "$lama" --by=slug --field=term_id 2>/dev/null || echo "")
	if [ -z "$id" ]; then
		echo "    ! lewati: '$lama' tidak ditemukan"
		continue
	fi
	jumlah=$(wp term get category "$id" --field=count 2>/dev/null || echo "?")
	echo "  $lama ($jumlah tulisan) → $nama [$baru]"
	jalan wp term update category "$id" --name="$nama" --slug="$baru"
done
echo

echo "── 3. GABUNG (pindahkan tulisan, lalu hapus kategori asal) ──"
for baris in "${GABUNG[@]}"; do
	IFS='|' read -r asal tujuan <<< "$baris"
	id=$(wp term get category "$asal" --by=slug --field=term_id 2>/dev/null || echo "")
	if [ -z "$id" ]; then
		echo "    ! lewati: '$asal' tidak ditemukan"
		continue
	fi
	jumlah=$(wp term get category "$id" --field=count 2>/dev/null || echo "?")
	echo "  $asal ($jumlah tulisan) → $tujuan"
	if [ "$APPLY" = "1" ]; then
		wp post list --category_name="$asal" --post_type=post --format=ids \
			| tr ' ' '\n' | while read -r pid; do
				[ -z "$pid" ] && continue
				wp post term add "$pid" category "$tujuan" --by=slug
			done
		wp term delete category "$id"
	else
		echo "    [rencana] pindahkan $jumlah tulisan ke '$tujuan', lalu hapus '$asal'"
	fi
done
echo

echo "── 4. INDUK (susun ulang hierarki) ──"
for baris in "${INDUK[@]}"; do
	IFS='|' read -r anak induk <<< "$baris"
	id=$(wp term get category "$anak" --by=slug --field=term_id 2>/dev/null || echo "")
	if [ -z "$id" ]; then
		echo "    ! lewati: '$anak' tidak ditemukan"
		continue
	fi
	if [ -z "$induk" ]; then
		echo "  $anak → naik ke tingkat teratas"
		jalan wp term update category "$id" --parent=0
	else
		pid=$(wp term get category "$induk" --by=slug --field=term_id 2>/dev/null || echo "0")
		echo "  $anak → anak dari $induk"
		jalan wp term update category "$id" --parent="$pid"
	fi
done
echo

echo "── 5. Menunggu keputusan redaksi (tidak disentuh) ──"
for baris in "${TINJAU[@]}"; do
	echo "  ? $baris"
done
echo

if [ "$APPLY" = "1" ]; then
	echo "── 6. Hitung ulang & segarkan ──"
	wp term recount category
	wp rewrite flush
	wp cache flush
	echo
	echo "Selesai. Periksa hasilnya:  wp term list category --fields=name,slug,parent,count"
else
	echo "Tinjauan selesai — tidak ada yang diubah."
	echo "Bila rencana di atas sudah disetujui:  APPLY=1 bash 04-rubrik.sh"
fi
