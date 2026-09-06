<?php
/**
 * Plugin Name:  TGR Headless — Alihan Apex ke www (jembatan)
 * Description:  Melempar setiap permintaan ke theglobal-review.com (tanpa
 *               www) ke https://www.theglobal-review.com dengan path dan
 *               query utuh. Dipakai selama nameserver domain belum bisa
 *               dipindah ke Cloudflare: apex diarahkan kembali ke server
 *               ini (A record) karena hanya server ini yang punya IP tetap,
 *               sementara www sudah bisa CNAME ke Railway dari cPanel.
 * Version:      1.0.0
 * Author:       Coderoach Studio
 *
 * 308, bukan 301: webhook tgr-revalidate mem-POST ke
 * https://theglobal-review.com/api/revalidate — 308 mempertahankan metode
 * dan body-nya, 301 boleh diubah klien menjadi GET (405 di Next).
 *
 * Yang sengaja tidak tersentuh: permintaan dengan host cms.* (WordPress
 * sendiri), REST (keluar sebelum template_redirect), dan berkas statis di
 * wp-content/uploads (dilayani web server tanpa PHP — tautan gambar lama
 * ber-URL apex tetap hidup).
 *
 * MENGEMBALIKAN (saat apex sudah dilayani Cloudflare → Railway): hapus
 * berkas ini. Tidak ada opsi tersimpan atau .htaccess yang disunting.
 */

defined( 'ABSPATH' ) || exit;

const TGR_ALIH_WWW_ASAL   = 'theglobal-review.com';
const TGR_ALIH_WWW_TUJUAN = 'https://www.theglobal-review.com';

// Prioritas 1: mendahului redirect_canonical (prioritas 10) yang akan
// melempar host apex ke WP_HOME (cms.*) lebih dulu.
add_action( 'template_redirect', 'tgr_alihkan_apex_ke_www', 1 );

function tgr_alihkan_apex_ke_www() {
	$host = isset( $_SERVER['HTTP_HOST'] ) ? strtolower( (string) wp_unslash( $_SERVER['HTTP_HOST'] ) ) : '';
	if ( TGR_ALIH_WWW_ASAL !== preg_replace( '/:\d+$/', '', $host ) ) {
		return;
	}

	$uri = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '/';
	// Garis miring ujung dilepas di sini supaya URL lama /slug/ hanya
	// melompat sekali (Next.js akan melepasnya lagi kalau tidak).
	$bagian = explode( '?', $uri, 2 );
	$path   = rtrim( $bagian[0], '/' );
	$uri    = ( '' === $path ? '/' : $path ) . ( isset( $bagian[1] ) ? '?' . $bagian[1] : '' );

	nocache_headers();
	wp_redirect( TGR_ALIH_WWW_TUJUAN . $uri, 308 );
	exit;
}
