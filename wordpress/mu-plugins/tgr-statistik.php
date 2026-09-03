<?php
/**
 * Plugin Name:  TGR Headless — Klien Statistik
 * Description:  Klien baca untuk Google Search Console (traffic pencarian)
 *               dan PageSpeed Insights (data lapangan Chrome + skor
 *               Lighthouse). Menyediakan fungsi pengambil data saja;
 *               halaman tampilannya menyusul di tahap berikutnya.
 * Version:      1.0.0
 * Author:       Coderoach Studio
 *
 * SENGAJA berkas terpisah dari tgr-headless.php. Berkas itu menyimpan
 * seluruh tipe konten dan field yang membuat situs hidup; galat fatal di
 * sana berarti CMS mati total dan hanya bisa dipulihkan lewat File Manager.
 * Statistik adalah fitur pinggiran — memisahkannya berarti ia bisa dicabut
 * sendiri tanpa menyentuh apa pun yang menyangkut konten.
 *
 * Prasyarat — konstanta di wp-config.php, di atas baris
 * "That's all, stop editing!":
 *
 *     define( 'TGR_GSC_SA_JSON', '/home/USER/rahasia/gsc-service-account.json' );
 *     define( 'TGR_GSC_SITE',    'sc-domain:theglobal-review.com' );
 *     define( 'TGR_PSI_KEY',     '<kunci Google Cloud untuk PageSpeed Insights>' );
 *
 * Berkas JSON service account diletakkan DI LUAR public_html supaya tidak
 * pernah bisa diunduh lewat peramban, bahkan bila PHP suatu saat berhenti
 * mengeksekusi. Isinya dipakai apa adanya seperti yang diunduh dari Google
 * Cloud — tidak ada kunci privat yang perlu ditempel ulang ke wp-config,
 * karena PEM berbaris banyak mudah rusak saat disalin.
 *
 * Tanpa konstanta itu plugin ini DIAM: tidak memuat menu, tidak memanggil
 * apa pun, tidak fatal. Jadi berkasnya aman diunggah lebih dulu sebelum
 * wp-config disunting — pola yang sama dengan tgr-revalidate.php.
 *
 * @package TGR
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Semua panggilan keluar diberi batas waktu; wp-admin tidak boleh menggantung. */
const TGR_STAT_TIMEOUT_GSC = 15;

/**
 * PSI menjalankan Lighthouse sungguhan di sisi Google — 10-30 detik itu
 * normal, bukan tanda gangguan. Karena itu ia TIDAK boleh dipanggil saat
 * halaman dimuat; tahap berikutnya menjadwalkannya lewat cron.
 */
const TGR_STAT_TIMEOUT_PSI = 60;

/**
 * Token OAuth Google berlaku 60 menit; disimpan 55 agar tak dipakai basi.
 * Ditulis sebagai detik apa adanya, bukan 55 * MINUTE_IN_SECONDS: const di
 * lingkup berkas menuntut konstanta itu sudah terdefinisi saat mu-plugin
 * dimuat, dan bergantung pada urutan pemuatan WordPress tidak sepadan
 * dengan keterbacaan yang didapat.
 */
const TGR_STAT_TOKEN_TTL = 3300;

/** Apakah konfigurasi Search Console lengkap. */
function tgr_stat_gsc_siap() {
	return defined( 'TGR_GSC_SA_JSON' ) && defined( 'TGR_GSC_SITE' );
}

/** Apakah konfigurasi PageSpeed Insights lengkap. */
function tgr_stat_psi_siap() {
	return defined( 'TGR_PSI_KEY' ) && TGR_PSI_KEY;
}

/* ── Search Console ────────────────────────────────────────────────── */

/** base64url: base64 biasa tanpa padding, +/ diganti -_ (RFC 7515). */
function tgr_stat_b64url( $data ) {
	return rtrim( strtr( base64_encode( $data ), '+/', '-_' ), '=' );
}

/**
 * Kredensial service account dari berkas JSON.
 *
 * Dibaca tiap kali dipakai, bukan di-cache: berkasnya kecil, dan meng-cache
 * kunci privat di database justru memperluas tempat rahasia itu tersimpan.
 *
 * @return array|WP_Error
 */
function tgr_stat_gsc_kredensial() {
	$path = TGR_GSC_SA_JSON;

	if ( ! is_readable( $path ) ) {
		// Penyebab tersering di hosting cPanel: open_basedir melarang PHP
		// membaca di atas public_html. Pesannya menyebut itu supaya tidak
		// didiagnosis sebagai salah ketik path.
		return new WP_Error(
			'tgr_stat_sa_tak_terbaca',
			sprintf(
				'Berkas service account tidak terbaca di %s. Periksa path dan izin berkas; bila ia berada di atas public_html, open_basedir hosting mungkin melarangnya.',
				$path
			)
		);
	}

	$json = json_decode( (string) file_get_contents( $path ), true );

	if ( ! is_array( $json ) || empty( $json['client_email'] ) || empty( $json['private_key'] ) ) {
		return new WP_Error(
			'tgr_stat_sa_tak_sah',
			'Isi berkas service account tidak sesuai: client_email atau private_key tidak ditemukan.'
		);
	}

	return $json;
}

/**
 * Access token Google lewat alur JWT bearer service account.
 *
 * Ditandatangani RS256 memakai openssl_sign bawaan PHP — tanpa pustaka
 * pihak ketiga, karena host tanpa SSH membuat pemasangan dependensi
 * Composer menjadi pekerjaan manual yang rapuh.
 *
 * @return string|WP_Error
 */
function tgr_stat_gsc_token() {
	$tersimpan = get_transient( 'tgr_stat_gsc_token' );
	if ( is_string( $tersimpan ) && '' !== $tersimpan ) {
		return $tersimpan;
	}

	$sa = tgr_stat_gsc_kredensial();
	if ( is_wp_error( $sa ) ) {
		return $sa;
	}

	$sekarang = time();
	$header   = array(
		'alg' => 'RS256',
		'typ' => 'JWT',
	);
	$klaim    = array(
		'iss'   => $sa['client_email'],
		'scope' => 'https://www.googleapis.com/auth/webmasters.readonly',
		'aud'   => 'https://oauth2.googleapis.com/token',
		'iat'   => $sekarang,
		'exp'   => $sekarang + HOUR_IN_SECONDS,
	);

	$bahan = tgr_stat_b64url( (string) wp_json_encode( $header ) )
		. '.' . tgr_stat_b64url( (string) wp_json_encode( $klaim ) );

	$tanda = '';
	if ( ! openssl_sign( $bahan, $tanda, $sa['private_key'], OPENSSL_ALGO_SHA256 ) ) {
		return new WP_Error(
			'tgr_stat_tanda_gagal',
			'Penandatanganan JWT gagal. Pastikan ekstensi OpenSSL aktif dan private_key utuh.'
		);
	}

	$jwt = $bahan . '.' . tgr_stat_b64url( $tanda );

	$jawaban = wp_remote_post(
		'https://oauth2.googleapis.com/token',
		array(
			'timeout' => TGR_STAT_TIMEOUT_GSC,
			'body'    => array(
				'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
				'assertion'  => $jwt,
			),
		)
	);

	if ( is_wp_error( $jawaban ) ) {
		return $jawaban;
	}

	$isi = json_decode( (string) wp_remote_retrieve_body( $jawaban ), true );

	if ( empty( $isi['access_token'] ) ) {
		// error_description Google jauh lebih berguna daripada kode HTTP-nya
		// ("invalid_grant: Invalid JWT Signature" vs sekadar 400).
		return new WP_Error(
			'tgr_stat_token_gagal',
			sprintf(
				'Gagal menukar JWT dengan access token (HTTP %d): %s',
				wp_remote_retrieve_response_code( $jawaban ),
				isset( $isi['error_description'] ) ? $isi['error_description'] : 'tanpa keterangan'
			)
		);
	}

	set_transient( 'tgr_stat_gsc_token', $isi['access_token'], TGR_STAT_TOKEN_TTL );

	return $isi['access_token'];
}

/**
 * Kueri Search Analytics.
 *
 * @param array $args {
 *     @type string   $mulai      Tanggal awal, Y-m-d.
 *     @type string   $sampai     Tanggal akhir, Y-m-d.
 *     @type string[] $dimensi    mis. array( 'query' ) atau array( 'page' ).
 *     @type int      $batas      Jumlah baris maksimum.
 * }
 * @return array|WP_Error Daftar baris; tiap baris punya keys, clicks,
 *                        impressions, ctr, position.
 */
function tgr_stat_gsc_kueri( array $args = array() ) {
	if ( ! tgr_stat_gsc_siap() ) {
		return new WP_Error( 'tgr_stat_gsc_belum_disetel', 'TGR_GSC_SA_JSON / TGR_GSC_SITE belum didefinisikan di wp-config.php.' );
	}

	$token = tgr_stat_gsc_token();
	if ( is_wp_error( $token ) ) {
		return $token;
	}

	$args = wp_parse_args(
		$args,
		array(
			// Data GSC tertinggal 2-3 hari; meminta sampai "hari ini" hanya
			// menghasilkan baris kosong di ujung dan tren yang tampak anjlok.
			'mulai'   => gmdate( 'Y-m-d', strtotime( '-30 days' ) ),
			'sampai'  => gmdate( 'Y-m-d', strtotime( '-3 days' ) ),
			'dimensi' => array( 'query' ),
			'batas'   => 25,
		)
	);

	$endpoint = sprintf(
		'https://www.googleapis.com/webmasters/v3/sites/%s/searchAnalytics/query',
		rawurlencode( TGR_GSC_SITE )
	);

	$jawaban = wp_remote_post(
		$endpoint,
		array(
			'timeout' => TGR_STAT_TIMEOUT_GSC,
			'headers' => array(
				'Authorization' => 'Bearer ' . $token,
				'Content-Type'  => 'application/json',
			),
			'body'    => wp_json_encode(
				array(
					'startDate'  => $args['mulai'],
					'endDate'    => $args['sampai'],
					'dimensions' => array_values( $args['dimensi'] ),
					'rowLimit'   => (int) $args['batas'],
				)
			),
		)
	);

	if ( is_wp_error( $jawaban ) ) {
		return $jawaban;
	}

	$kode = wp_remote_retrieve_response_code( $jawaban );
	$isi  = json_decode( (string) wp_remote_retrieve_body( $jawaban ), true );

	if ( 200 !== $kode ) {
		return new WP_Error(
			'tgr_stat_gsc_galat',
			sprintf(
				'Search Console menolak (HTTP %d): %s',
				$kode,
				isset( $isi['error']['message'] ) ? $isi['error']['message'] : 'tanpa keterangan'
			)
		);
	}

	// Rentang tanpa data menjawab 200 tanpa "rows" sama sekali. Itu keadaan
	// sah, bukan galat — pemanggil membedakannya dari WP_Error.
	return isset( $isi['rows'] ) ? $isi['rows'] : array();
}

/* ── PageSpeed Insights ────────────────────────────────────────────── */

/**
 * Data performa satu URL: lapangan (CrUX) dan lab (Lighthouse) sekaligus.
 *
 * Satu panggilan memberi keduanya, dan itu alasan memilih PSI ketimbang
 * CrUX API terpisah: data lapangan lebih jujur tetapi bisa kosong bila
 * sampelnya kurang, sedangkan skor lab selalu ada. Halaman statistik jadi
 * tidak pernah benar-benar hampa.
 *
 * @param string $url      URL yang diukur; kosong berarti beranda situs.
 * @param string $strategi 'mobile' atau 'desktop'.
 * @return array|WP_Error
 */
function tgr_stat_psi( $url = '', $strategi = 'mobile' ) {
	if ( ! tgr_stat_psi_siap() ) {
		return new WP_Error( 'tgr_stat_psi_belum_disetel', 'TGR_PSI_KEY belum didefinisikan di wp-config.php.' );
	}

	$endpoint = add_query_arg(
		array(
			'url'      => rawurlencode( $url ? $url : home_url( '/' ) ),
			'key'      => rawurlencode( TGR_PSI_KEY ),
			'strategy' => 'desktop' === $strategi ? 'desktop' : 'mobile',
		),
		'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
	);
	// category berulang tidak bisa lewat add_query_arg (kunci yang sama
	// saling menimpa), jadi ditempel manual.
	$endpoint .= '&category=performance&category=accessibility&category=best-practices&category=seo';

	$jawaban = wp_remote_get( $endpoint, array( 'timeout' => TGR_STAT_TIMEOUT_PSI ) );

	if ( is_wp_error( $jawaban ) ) {
		return $jawaban;
	}

	$kode = wp_remote_retrieve_response_code( $jawaban );
	$isi  = json_decode( (string) wp_remote_retrieve_body( $jawaban ), true );

	if ( 200 !== $kode || ! is_array( $isi ) ) {
		return new WP_Error(
			'tgr_stat_psi_galat',
			sprintf(
				'PageSpeed Insights menolak (HTTP %d): %s',
				$kode,
				isset( $isi['error']['message'] ) ? $isi['error']['message'] : 'tanpa keterangan'
			)
		);
	}

	$lapangan = isset( $isi['loadingExperience']['metrics'] ) ? $isi['loadingExperience']['metrics'] : array();
	$lab      = isset( $isi['lighthouseResult']['categories'] ) ? $isi['lighthouseResult']['categories'] : array();

	$ambil_lapangan = static function ( $kunci ) use ( $lapangan ) {
		// N/A adalah jawaban sah: metrik yang sampelnya belum cukup memang
		// tidak dikirim. null diteruskan apa adanya supaya halaman bisa
		// menuliskan "belum cukup data" alih-alih memajang angka nol.
		return isset( $lapangan[ $kunci ]['percentile'] )
			? array(
				'nilai'  => $lapangan[ $kunci ]['percentile'],
				'status' => isset( $lapangan[ $kunci ]['category'] ) ? $lapangan[ $kunci ]['category'] : null,
			)
			: null;
	};

	$skor = static function ( $kunci ) use ( $lab ) {
		return isset( $lab[ $kunci ]['score'] ) ? (int) round( $lab[ $kunci ]['score'] * 100 ) : null;
	};

	return array(
		'diambil'  => gmdate( 'c' ),
		'strategi' => $strategi,
		'lapangan' => array(
			'lcp'  => $ambil_lapangan( 'LARGEST_CONTENTFUL_PAINT_MS' ),
			'inp'  => $ambil_lapangan( 'INTERACTION_TO_NEXT_PAINT' ),
			'cls'  => $ambil_lapangan( 'CUMULATIVE_LAYOUT_SHIFT_SCORE' ),
			'fcp'  => $ambil_lapangan( 'FIRST_CONTENTFUL_PAINT_MS' ),
			'ttfb' => $ambil_lapangan( 'EXPERIMENTAL_TIME_TO_FIRST_BYTE' ),
		),
		'lab'      => array(
			'performance'    => $skor( 'performance' ),
			'accessibility'  => $skor( 'accessibility' ),
			'best_practices' => $skor( 'best-practices' ),
			'seo'            => $skor( 'seo' ),
		),
	);
}

/* ── Layar uji ─────────────────────────────────────────────────────── */

/**
 * Halaman Perkakas → Uji Statistik.
 *
 * Klien di atas tidak punya pemanggil sampai tahap berikutnya, dan kode
 * yang tak pernah dijalankan adalah kode yang belum terbukti. Layar ini
 * membuat tahap ini bisa diverifikasi sendiri begitu kredensial terpasang:
 * ia menjalankan kedua klien dan menampilkan hasil ATAU pesan galat
 * lengkapnya. Dihapus atau dibiarkan setelah halaman sungguhan jadi.
 */
add_action(
	'admin_menu',
	function () {
		if ( ! tgr_stat_gsc_siap() && ! tgr_stat_psi_siap() ) {
			return; // Belum disetel: tidak perlu memajang menu yang pasti gagal.
		}

		add_management_page(
			'Uji Statistik',
			'Uji Statistik',
			'manage_options',
			'tgr-uji-statistik',
			'tgr_stat_layar_uji'
		);
	}
);

/** Cetak satu blok hasil: galat merah, atau isi dalam <pre>. */
function tgr_stat_cetak_hasil( $judul, $hasil ) {
	echo '<h2>' . esc_html( $judul ) . '</h2>';

	if ( is_wp_error( $hasil ) ) {
		printf(
			'<div class="notice notice-error inline"><p><strong>%s</strong><br>%s</p></div>',
			esc_html( $hasil->get_error_code() ),
			esc_html( $hasil->get_error_message() )
		);
		return;
	}

	if ( is_array( $hasil ) && ! $hasil ) {
		echo '<div class="notice notice-warning inline"><p>Berhasil terhubung, tetapi tidak ada baris data untuk rentang ini.</p></div>';
		return;
	}

	echo '<div class="notice notice-success inline"><p>Berhasil.</p></div>';
	echo '<pre style="max-height:340px;overflow:auto;background:#fff;border:1px solid #dcdcde;padding:12px;">';
	echo esc_html( (string) wp_json_encode( $hasil, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );
	echo '</pre>';
}

/** Isi layar Perkakas → Uji Statistik. */
function tgr_stat_layar_uji() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Akses ditolak.' );
	}

	echo '<div class="wrap"><h1>Uji Statistik</h1>';
	echo '<p>Menjalankan kedua klien sekali dan menampilkan hasil mentahnya. Dipakai untuk memastikan kredensial benar sebelum halaman statistik dibangun.</p>';

	// PSI memanggil Lighthouse sungguhan dan bisa memakan puluhan detik;
	// tombol memastikan itu tidak terjadi diam-diam tiap kali menu dibuka.
	if ( ! isset( $_GET['jalankan'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		printf(
			'<p><a href="%s" class="button button-primary">Jalankan uji</a></p>',
			esc_url( admin_url( 'tools.php?page=tgr-uji-statistik&jalankan=1' ) )
		);
		echo '<p><em>PageSpeed Insights menjalankan Lighthouse langsung; sekali uji bisa memakan 10&ndash;30 detik.</em></p></div>';
		return;
	}

	if ( tgr_stat_gsc_siap() ) {
		tgr_stat_cetak_hasil(
			'Search Console — 10 kueri teratas',
			tgr_stat_gsc_kueri( array( 'batas' => 10 ) )
		);
	} else {
		echo '<h2>Search Console</h2><div class="notice notice-warning inline"><p>TGR_GSC_SA_JSON / TGR_GSC_SITE belum didefinisikan.</p></div>';
	}

	if ( tgr_stat_psi_siap() ) {
		tgr_stat_cetak_hasil( 'PageSpeed Insights — beranda, mobile', tgr_stat_psi() );
	} else {
		echo '<h2>PageSpeed Insights</h2><div class="notice notice-warning inline"><p>TGR_PSI_KEY belum didefinisikan.</p></div>';
	}

	echo '</div>';
}
