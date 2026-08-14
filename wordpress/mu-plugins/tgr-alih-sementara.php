<?php
/**
 * Plugin Name:  TGR Headless — Alihan Sementara Beranda
 * Description:  Mengalihkan HANYA halaman depan theglobal-review.com ke situs
 *               baru selama masa peralihan. Bersifat sementara (302): mesin
 *               pencari diberi tahu agar tetap mengindeks alamat aslinya.
 * Version:      1.0.0
 * Author:       Coderoach Studio
 *
 * Diletakkan di wp-content/mu-plugins/ bersama tgr-headless.php.
 *
 * Kenapa lewat mu-plugin, bukan cPanel → Redirects:
 *
 * Form cPanel bekerja pada tingkat berkas .htaccess dan hanya mengenal
 * "direktori" — satu centang Wild Card Redirect membuatnya ikut menangkap
 * /wp-json, /wp-admin, dan /wp-content/uploads. Ketiganya justru yang
 * dipakai situs baru untuk hidup, jadi salah centang di sana bukan sekadar
 * salah alamat, melainkan memadamkan tujuan redirect-nya sendiri.
 *
 * Kait `template_redirect` hanya berjalan untuk permintaan halaman biasa.
 * Permintaan REST keluar lebih dulu lewat rest_api_init, wp-admin tidak
 * pernah memanggilnya, dan berkas di wp-content dilayani web server tanpa
 * menyentuh PHP sama sekali. Ketiganya aman secara bawaan, bukan karena
 * ada aturan pengecualian yang harus diingat orang.
 *
 * MENGEMBALIKAN: hapus berkas ini dari wp-content/mu-plugins/. Tidak ada
 * jejak lain yang perlu dibersihkan — tidak ada opsi tersimpan, tidak ada
 * .htaccess yang tersunting.
 */

defined( 'ABSPATH' ) || exit;

/** Ganti bila alamat situs baru berubah sebelum peralihan domain. */
const TGR_ALIH_TUJUAN = 'https://the-global-review-website.vercel.app/';

/** Jalan pintas melihat beranda lama tanpa perlu login: ?beranda-lama */
const TGR_ALIH_LEWATI = 'beranda-lama';

add_action( 'template_redirect', 'tgr_alihkan_beranda' );

function tgr_alihkan_beranda() {
	// Halaman depan saja. Arsip, artikel, feed, dan halaman statis lain
	// tetap dilayani WordPress seperti biasa.
	if ( ! is_front_page() || is_paged() ) {
		return;
	}

	// Redaksi yang sedang masuk tetap melihat beranda lama — supaya
	// pratinjau dan pengecekan tata letak tidak ikut terhalang.
	if ( is_user_logged_in() || isset( $_GET[ TGR_ALIH_LEWATI ] ) ) {
		return;
	}

	// Tanpa ini proxy di depan situs berpeluang menyimpan alihannya, dan
	// alihan sementara yang tersimpan berperilaku seperti alihan permanen.
	nocache_headers();

	wp_redirect( TGR_ALIH_TUJUAN, 302 );
	exit;
}
