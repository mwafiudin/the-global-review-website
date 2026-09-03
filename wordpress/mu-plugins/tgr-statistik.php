<?php
/**
 * Plugin Name:  TGR Headless — Klien Statistik
 * Description:  Klien baca untuk Google Search Console (traffic pencarian)
 *               dan Chrome UX Report (Core Web Vitals pengguna sungguhan).
 *               Menyediakan fungsi pengambil data saja; halaman tampilannya
 *               menyusul di tahap berikutnya.
 * Version:      2.1.0
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
 *     define( 'TGR_GSC_SITE',    'https://theglobal-review.com/' );
 *
 * TGR_GSC_SITE harus PERSIS sama dengan bentuk properti di Search
 * Console. Properti yang dipakai TGR berjenis URL prefix, jadi nilainya
 * URL lengkap berikut garis miring penutup. Bila suatu saat diganti ke
 * properti Domain, bentuknya menjadi 'sc-domain:theglobal-review.com'.
 * Salah bentuk menghasilkan HTTP 403 yang bunyinya seolah soal izin,
 * padahal hanya alamat properti yang tidak dikenali.
 *     define( 'TGR_PSI_KEY',     '<kunci Google Cloud>' );
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
 * CrUX hanya MEMBACA data yang sudah dikumpulkan Chrome — biasanya di bawah
 * satu detik. Ini pengganti PageSpeed Insights, yang menjalankan Lighthouse
 * secara langsung tiap dipanggil (10-40 detik) dan karena itu selalu dibunuh
 * max_execution_time hosting ini sebelum sempat menjawab. Tidak ada nilai
 * timeout yang bisa memperbaiki hal itu; sumbernyalah yang harus diganti.
 *
 * Yang hilang bersama PSI hanya skor Lighthouse — hasil simulasi lab. Data
 * lapangan di bawah ini justru sumber yang sama yang dibaca PSI, dan itu
 * yang dipakai Google untuk peringkat.
 */
const TGR_STAT_TIMEOUT_CRUX = 15;

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

/**
 * Kunci Google Cloud. TGR_PSI_KEY dipertahankan sebagai nama lama supaya
 * pergantian PSI -> CrUX tidak menuntut penyuntingan wp-config lagi; kunci
 * yang sama berlaku untuk kedua API.
 */
function tgr_stat_kunci_google() {
	if ( defined( 'TGR_GOOGLE_API_KEY' ) && TGR_GOOGLE_API_KEY ) {
		return TGR_GOOGLE_API_KEY;
	}
	if ( defined( 'TGR_PSI_KEY' ) && TGR_PSI_KEY ) {
		return TGR_PSI_KEY;
	}
	return '';
}

/**
 * Origin situs PUBLIK — bukan home_url().
 *
 * Plugin ini berjalan di WordPress, jadi home_url() mengembalikan
 * https://cms.theglobal-review.com: backend headless yang halamannya
 * noindex dan nyaris tak pernah dibuka manusia. CrUX menjawab 404 untuk
 * origin itu, dan 404-nya terbaca sebagai "belum cukup data" — menyesatkan,
 * karena situs publiknya justru punya sampel berlimpah.
 *
 * TGR_GSC_SITE dipakai ulang karena ia sudah menyimpan alamat situs publik
 * dan pasti terdefinisi bila statistik dipakai sama sekali.
 */
function tgr_stat_origin_publik() {
	if ( defined( 'TGR_GSC_SITE' ) && TGR_GSC_SITE ) {
		$situs = TGR_GSC_SITE;
		// Properti Search Console berjenis Domain ditulis "sc-domain:contoh.com";
		// CrUX menuntut origin lengkap berskema.
		if ( 0 === strpos( $situs, 'sc-domain:' ) ) {
			return 'https://' . substr( $situs, strlen( 'sc-domain:' ) );
		}
		return untrailingslashit( $situs );
	}

	return untrailingslashit( home_url() );
}

/** Apakah konfigurasi Chrome UX Report lengkap. */
function tgr_stat_crux_siap() {
	return '' !== tgr_stat_kunci_google();
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

/* ── Chrome UX Report ──────────────────────────────────────────────── */

/**
 * Ambang Core Web Vitals resmi, dipakai menerjemahkan angka p75 menjadi
 * status. CrUX tidak mengirim label seperti PSI ("FAST"/"AVERAGE"/"SLOW"),
 * hanya angka — jadi penilaiannya dilakukan di sini, memakai ambang yang
 * sama yang dipakai Google.
 *
 * Format: metrik => array( batas_baik, batas_buruk ).
 */
function tgr_stat_ambang() {
	return array(
		'lcp'  => array( 2500, 4000 ),
		'inp'  => array( 200, 500 ),
		'cls'  => array( 0.1, 0.25 ),
		'fcp'  => array( 1800, 3000 ),
		'ttfb' => array( 800, 1800 ),
	);
}

/** Nama metrik CrUX => kunci ringkas yang dipakai frontend. */
function tgr_stat_peta_metrik() {
	return array(
		'largest_contentful_paint'       => 'lcp',
		'interaction_to_next_paint'      => 'inp',
		'cumulative_layout_shift'        => 'cls',
		'first_contentful_paint'         => 'fcp',
		'experimental_time_to_first_byte' => 'ttfb',
	);
}

/**
 * Core Web Vitals pengguna Chrome sungguhan, 28 hari terakhir.
 *
 * @param string $origin      Asal situs; kosong berarti situs ini.
 * @param string $form_factor 'PHONE' atau 'DESKTOP'.
 * @return array|WP_Error
 */
function tgr_stat_crux( $origin = '', $form_factor = 'PHONE' ) {
	$kunci = tgr_stat_kunci_google();
	if ( '' === $kunci ) {
		return new WP_Error( 'tgr_stat_crux_belum_disetel', 'TGR_PSI_KEY / TGR_GOOGLE_API_KEY belum didefinisikan di wp-config.php.' );
	}

	// Origin, bukan URL: data tingkat halaman jauh lebih sering kosong karena
	// tiap URL perlu ambang sampelnya sendiri, sedangkan origin menghimpun
	// seluruh halaman menjadi satu.
	$jawaban = wp_remote_post(
		'https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=' . rawurlencode( $kunci ),
		array(
			'timeout' => TGR_STAT_TIMEOUT_CRUX,
			'headers' => array( 'Content-Type' => 'application/json' ),
			'body'    => wp_json_encode(
				array(
					'origin'     => $origin ? $origin : tgr_stat_origin_publik(),
					'formFactor' => 'DESKTOP' === $form_factor ? 'DESKTOP' : 'PHONE',
				)
			),
		)
	);

	if ( is_wp_error( $jawaban ) ) {
		return $jawaban;
	}

	$kode = wp_remote_retrieve_response_code( $jawaban );
	$isi  = json_decode( (string) wp_remote_retrieve_body( $jawaban ), true );

	// 404 berarti origin ini belum punya sampel yang cukup. Itu keadaan sah,
	// bukan kegagalan — halaman menampilkannya sebagai "belum cukup data".
	if ( 404 === $kode ) {
		return array(
			'diambil'    => gmdate( 'c' ),
			'origin'     => $origin ? $origin : tgr_stat_origin_publik(),
			'formFactor' => $form_factor,
			'periode'    => null,
			'cukupData'  => false,
			'metrik'     => array(),
		);
	}

	if ( 200 !== $kode || ! isset( $isi['record']['metrics'] ) ) {
		return new WP_Error(
			'tgr_stat_crux_galat',
			sprintf(
				'Chrome UX Report menolak (HTTP %d): %s',
				$kode,
				isset( $isi['error']['message'] ) ? $isi['error']['message'] : 'tanpa keterangan'
			)
		);
	}

	$mentah  = $isi['record']['metrics'];
	$ambang  = tgr_stat_ambang();
	$metrik  = array();

	foreach ( tgr_stat_peta_metrik() as $nama_crux => $kunci_ringkas ) {
		if ( ! isset( $mentah[ $nama_crux ]['percentiles']['p75'] ) ) {
			// Metrik yang sampelnya belum cukup memang tidak dikirim. null
			// diteruskan apa adanya: nol akan terbaca sebagai "sempurna",
			// padahal artinya "belum diketahui".
			$metrik[ $kunci_ringkas ] = null;
			continue;
		}

		// CLS dikirim sebagai string ("0.05"); sisanya angka milidetik.
		$nilai = (float) $mentah[ $nama_crux ]['percentiles']['p75'];
		list( $baik, $buruk ) = $ambang[ $kunci_ringkas ];

		if ( $nilai <= $baik ) {
			$status = 'baik';
		} elseif ( $nilai <= $buruk ) {
			$status = 'perlu-perbaikan';
		} else {
			$status = 'buruk';
		}

		$metrik[ $kunci_ringkas ] = array(
			'nilai'  => $nilai,
			'status' => $status,
		);
	}

	$periode = null;
	if ( isset( $isi['record']['collectionPeriod']['lastDate'] ) ) {
		$akhir   = $isi['record']['collectionPeriod']['lastDate'];
		$periode = sprintf( '%04d-%02d-%02d', $akhir['year'], $akhir['month'], $akhir['day'] );
	}

	return array(
		'diambil'    => gmdate( 'c' ),
		'origin'     => $origin ? $origin : tgr_stat_origin_publik(),
		'formFactor' => $form_factor,
		'periode'    => $periode,
		'cukupData'  => true,
		'metrik'     => $metrik,
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
		if ( ! tgr_stat_gsc_siap() && ! tgr_stat_crux_siap() ) {
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

/** Cetak satu blok hasil lengkap dengan judulnya. */
function tgr_stat_cetak_hasil( $judul, $hasil ) {
	echo '<h2>' . esc_html( $judul ) . '</h2>';
	tgr_stat_cetak_isi( $hasil );
}

/** Isi satu blok hasil: galat merah, atau data dalam <pre>. */
function tgr_stat_cetak_isi( $hasil ) {
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

	// Tombol, bukan otomatis saat menu dibuka: uji ini memanggil dua API luar
	// dan tidak perlu berjalan setiap kali seseorang lewat.
	if ( ! isset( $_GET['jalankan'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		printf(
			'<p><a href="%s" class="button button-primary">Jalankan uji</a></p>',
			esc_url( admin_url( 'tools.php?page=tgr-uji-statistik&jalankan=1' ) )
		);
		echo '</div>';
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

	if ( tgr_stat_crux_siap() ) {
		// Judul tetap dicetak lebih dulu: kebiasaan yang terbukti berguna saat
		// PSI mati diam-diam di v1.0.0 dan seluruh bloknya lenyap tanpa jejak.
		echo '<h2>Chrome UX Report — origin, mobile</h2>';
		flush();

		tgr_stat_cetak_isi( tgr_stat_crux() );
	} else {
		echo '<h2>Chrome UX Report</h2><div class="notice notice-warning inline"><p>TGR_PSI_KEY belum didefinisikan.</p></div>';
	}

	echo '</div>';
}
