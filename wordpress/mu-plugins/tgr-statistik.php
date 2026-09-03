<?php
/**
 * Plugin Name:  TGR Headless — Klien Statistik
 * Description:  Klien baca untuk Google Search Console (traffic pencarian)
 *               dan Chrome UX Report (Core Web Vitals pengguna sungguhan).
 *               Menyediakan klien baca, pengambilan terjadwal, dan halaman
 *               Statistik di wp-admin untuk redaksi: grafik SVG, filter
 *               rentang, dan pembandingan dua periode.
 *
 * Layar diagnostik "Peralatan > Uji Statistik" dihapus di v3.2.0 setelah
 * tugasnya selesai: ia dipakai memverifikasi kredensial sebelum halaman
 * sungguhan ada, dan menyisakannya berarti memajang tombol yang memanggil
 * dua API luar tanpa alasan. Riwayatnya ada di git bila suatu saat
 * diagnostik semacam itu diperlukan lagi.
 * Version:      4.2.0
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

/* ── Riwayat CrUX ──────────────────────────────────────────────────── */

/**
 * Core Web Vitals mingguan, sampai 40 minggu ke belakang.
 *
 * Endpoint terpisah dari queryRecord, kunci API dan kuota yang sama.
 * Inilah alasan tidak ada arsip yang perlu disimpan sendiri: Google sudah
 * menyimpan riwayatnya, jadi menabung snapshot bulanan hanya akan
 * menduplikasi data yang bisa diminta kapan saja.
 *
 * @return array|WP_Error
 */
function tgr_stat_crux_riwayat( $minggu = 25 ) {
	$kunci = tgr_stat_kunci_google();
	if ( '' === $kunci ) {
		return new WP_Error( 'tgr_stat_crux_belum_disetel', 'Kunci Google Cloud belum didefinisikan.' );
	}

	$jawaban = wp_remote_post(
		'https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord?key=' . rawurlencode( $kunci ),
		array(
			'timeout' => TGR_STAT_TIMEOUT_CRUX,
			'headers' => array( 'Content-Type' => 'application/json' ),
			'body'    => wp_json_encode(
				array(
					'origin'               => tgr_stat_origin_publik(),
					'formFactor'           => 'PHONE',
					'collectionPeriodCount' => max( 5, min( 40, (int) $minggu ) ),
				)
			),
		)
	);

	if ( is_wp_error( $jawaban ) ) {
		return $jawaban;
	}

	$kode = wp_remote_retrieve_response_code( $jawaban );
	$isi  = json_decode( (string) wp_remote_retrieve_body( $jawaban ), true );

	if ( 404 === $kode ) {
		return array();
	}
	if ( 200 !== $kode || ! isset( $isi['record']['metrics'] ) ) {
		return new WP_Error(
			'tgr_stat_riwayat_galat',
			sprintf(
				'Riwayat CrUX menolak (HTTP %d): %s',
				$kode,
				isset( $isi['error']['message'] ) ? $isi['error']['message'] : 'tanpa keterangan'
			)
		);
	}

	$hasil = array();
	foreach ( tgr_stat_peta_metrik() as $nama_crux => $ringkas ) {
		$deret = isset( $isi['record']['metrics'][ $nama_crux ]['percentilesTimeseries']['p75s'] )
			? $isi['record']['metrics'][ $nama_crux ]['percentilesTimeseries']['p75s']
			: array();
		// null dipertahankan: minggu tanpa sampel bukan nol, dan grafik harus
		// memutus garisnya di sana alih-alih menjatuhkannya ke dasar.
		$hasil[ $ringkas ] = array_map(
			static function ( $v ) {
				return null === $v ? null : (float) $v;
			},
			$deret
		);
	}

	$label = array();
	if ( isset( $isi['record']['collectionPeriods'] ) ) {
		foreach ( $isi['record']['collectionPeriods'] as $p ) {
			$a       = $p['lastDate'];
			$label[] = sprintf( '%04d-%02d-%02d', $a['year'], $a['month'], $a['day'] );
		}
	}

	return array(
		'periode' => $label,
		'metrik'  => $hasil,
	);
}

/* ── Pengumpulan & cache (tahap 3) ─────────────────────────────────── */

/** Nama opsi penyimpan hasil. Tidak di-autoload: isinya besar. */
const TGR_STAT_OPSI = 'tgr_stat_data';

/** Rentang siap pakai, dalam hari. */
const TGR_STAT_PRESET = '7,28,90,365';

/** Tanggal akhir laporan: 3 hari lalu, karena data GSC tertinggal 2-3 hari. */
function tgr_stat_tanggal_akhir() {
	return gmdate( 'Y-m-d', strtotime( '-3 days' ) );
}

/** Daftar preset sebagai bilangan. */
function tgr_stat_preset() {
	return array_map( 'intval', explode( ',', TGR_STAT_PRESET ) );
}

/**
 * Ringkas satu potong deret harian menjadi total.
 *
 * Posisi dirata-rata BERBOBOT impresi, bukan rata-rata sederhana: hari
 * dengan 5 impresi dan hari dengan 8.000 tidak layak diberi bobot sama,
 * dan rata-rata polos membuat hari sepi menyeret angkanya tanpa alasan.
 */
function tgr_stat_ringkas_deret( array $deret ) {
	$klik    = 0;
	$impresi = 0;
	$posisi  = 0.0;

	foreach ( $deret as $h ) {
		$klik    += (int) $h['klik'];
		$impresi += (int) $h['impresi'];
		$posisi  += (float) $h['posisi'] * (int) $h['impresi'];
	}

	return array(
		'klik'    => $klik,
		'impresi' => $impresi,
		'ctr'     => $impresi > 0 ? $klik / $impresi : 0.0,
		'posisi'  => $impresi > 0 ? $posisi / $impresi : 0.0,
	);
}

/**
 * Potong deret harian pada rentang tanggal.
 *
 * Inilah yang membuat filter tanggal dan pembandingan dua periode tidak
 * memanggil API sama sekali: satu deret 365 hari diambil sekali, lalu
 * seluruh rentang diturunkan darinya di sisi PHP.
 */
function tgr_stat_potong( array $harian, $mulai, $sampai ) {
	$hasil = array();
	foreach ( $harian as $tanggal => $nilai ) {
		if ( $tanggal >= $mulai && $tanggal <= $sampai ) {
			$hasil[ $tanggal ] = $nilai;
		}
	}
	ksort( $hasil );
	return $hasil;
}

/** Rentang tanggal sebuah preset, berakhir di tanggal akhir laporan. */
function tgr_stat_rentang_preset( $hari ) {
	$sampai = tgr_stat_tanggal_akhir();
	return array(
		'mulai'  => gmdate( 'Y-m-d', strtotime( '-' . ( (int) $hari - 1 ) . ' days', strtotime( $sampai ) ) ),
		'sampai' => $sampai,
	);
}

/**
 * Kueri berimpresi tinggi tapi jarang diklik.
 *
 * Metrik paling actionable di halaman ini: TGR sudah muncul di hasil
 * pencarian, hanya judulnya yang tidak menarik klik. Perbaikannya
 * menyunting judul, bukan menulis artikel baru.
 */
function tgr_stat_peluang_judul( $kueri, $batas = 5 ) {
	$kandidat = array();

	foreach ( (array) $kueri as $k ) {
		$impresi = isset( $k['impressions'] ) ? (int) $k['impressions'] : 0;
		$ctr     = isset( $k['ctr'] ) ? (float) $k['ctr'] : 0.0;
		if ( $impresi >= 100 && $ctr < 0.02 ) {
			$kandidat[] = $k;
		}
	}

	usort(
		$kandidat,
		static function ( $a, $b ) {
			return $b['impressions'] <=> $a['impressions'];
		}
	);

	return array_slice( $kandidat, 0, $batas );
}

/**
 * Ambil seluruh data dan susun jadi satu struktur siap pakai.
 *
 * Deret harian diambil SEKALI untuk preset terpanjang, lalu semua total,
 * tren, grafik, dan pembandingan periode diturunkan darinya di PHP. Tanpa
 * itu, tiap preset dan tiap pembandingan berarti panggilan API sendiri —
 * dan halaman dengan filter tanggal akan memanggil Google tiap kali
 * seseorang menekan tombol.
 *
 * Kegagalan sebagian TIDAK menggugurkan keseluruhan: tiap bagian menyimpan
 * galatnya sendiri.
 */
function tgr_stat_kumpulkan() {
	$preset  = tgr_stat_preset();
	$terjauh = max( $preset );
	$sampai  = tgr_stat_tanggal_akhir();
	$mulai   = gmdate( 'Y-m-d', strtotime( '-' . ( $terjauh - 1 ) . ' days', strtotime( $sampai ) ) );

	$data = array(
		'diperbarui' => time(),
		'sampai'     => $sampai,
		'galat'      => array(),
		'harian'     => array(),
		'periode'    => array(),
	);

	if ( tgr_stat_gsc_siap() ) {
		$deret = tgr_stat_gsc_kueri(
			array(
				'mulai'   => $mulai,
				'sampai'  => $sampai,
				'dimensi' => array( 'date' ),
				// Lebih besar dari jumlah harinya: rowLimit yang pas-pasan
				// diam-diam memotong ujung deret bila GSC mengirim baris
				// tambahan, dan grafiknya berakhir menggantung.
				'batas'   => $terjauh + 40,
			)
		);

		if ( is_wp_error( $deret ) ) {
			$data['galat']['gsc_deret'] = $deret->get_error_message();
		} else {
			foreach ( $deret as $b ) {
				$tgl = isset( $b['keys'][0] ) ? $b['keys'][0] : '';
				if ( '' === $tgl ) {
					continue;
				}
				$data['harian'][ $tgl ] = array(
					'klik'    => (int) $b['clicks'],
					'impresi' => (int) $b['impressions'],
					'posisi'  => (float) $b['position'],
				);
			}
			ksort( $data['harian'] );
		}

		// Tabel kueri & halaman tetap perlu panggilan per preset: keduanya
		// agregat yang tidak bisa diturunkan dari deret harian.
		foreach ( $preset as $hari ) {
			$r     = tgr_stat_rentang_preset( $hari );
			$kueri = tgr_stat_gsc_kueri(
				array(
					'mulai'   => $r['mulai'],
					'sampai'  => $r['sampai'],
					'dimensi' => array( 'query' ),
					'batas'   => 100,
				)
			);
			$halaman = tgr_stat_gsc_kueri(
				array(
					'mulai'   => $r['mulai'],
					'sampai'  => $r['sampai'],
					'dimensi' => array( 'page' ),
					'batas'   => 10,
				)
			);

			if ( is_wp_error( $kueri ) || is_wp_error( $halaman ) ) {
				$data['galat'][ 'gsc_preset_' . $hari ] = is_wp_error( $kueri )
					? $kueri->get_error_message()
					: $halaman->get_error_message();
			}

			$data['periode'][ $hari ] = array(
				'kueri'   => is_wp_error( $kueri ) ? array() : array_slice( $kueri, 0, 10 ),
				'halaman' => is_wp_error( $halaman ) ? array() : $halaman,
				'peluang' => is_wp_error( $kueri ) ? array() : tgr_stat_peluang_judul( $kueri ),
			);
		}
	}

	if ( tgr_stat_crux_siap() ) {
		$crux = tgr_stat_crux();
		if ( is_wp_error( $crux ) ) {
			$data['galat']['crux'] = $crux->get_error_message();
			$data['performa']      = null;
		} else {
			$data['performa'] = $crux;
		}

		$riwayat = tgr_stat_crux_riwayat();
		if ( is_wp_error( $riwayat ) ) {
			$data['galat']['crux_riwayat'] = $riwayat->get_error_message();
			$data['riwayat']               = null;
		} else {
			$data['riwayat'] = $riwayat;
		}
	}

	return $data;
}

/**
 * Segarkan cache. Data lama dipertahankan bila pengambilan baru gagal
 * seluruhnya — angka basi masih lebih berguna daripada halaman kosong,
 * asalkan waktu pembaruannya terlihat.
 */
function tgr_stat_segarkan() {
	$baru = tgr_stat_kumpulkan();

	$ada_isi = ! empty( $baru['harian'] ) || ! empty( $baru['performa'] );
	if ( ! $ada_isi ) {
		$lama = get_option( TGR_STAT_OPSI );
		if ( is_array( $lama ) ) {
			$lama['galat']      = $baru['galat'];
			$lama['gagal_pada'] = time();
			update_option( TGR_STAT_OPSI, $lama, false );
			return $lama;
		}
	}

	update_option( TGR_STAT_OPSI, $baru, false );
	return $baru;
}

/**
 * Hari pengambilan: Senin, Kamis, Sabtu (1, 4, 6 menurut ISO-8601).
 *
 * Dipilih redaksi. Pola hari tetap, bukan interval bergulir: interval 3
 * hari akan mengambang begitu satu jalannya terlewat, sehingga lama-lama
 * jatuh di hari yang tak terduga. Jangkar hari juga membuat jarak
 * terjauhnya lebih pendek — 3 hari (Sen ke Kam), sisanya 2.
 */
const TGR_STAT_HARI_AMBIL = '1,4,6';

/** Apakah hari ini jadwal pengambilan, menurut zona waktu situs. */
function tgr_stat_hari_ini_jadwal() {
	// wp_date, bukan gmdate: zona situs Asia/Jakarta, dan memakai UTC
	// membuat pengambilan Senin dini hari terhitung Minggu.
	$hari = (int) wp_date( 'N' );
	return in_array( $hari, array_map( 'intval', explode( ',', TGR_STAT_HARI_AMBIL ) ), true );
}

/**
 * Penjaga jadwal harian.
 *
 * Cron didaftarkan HARIAN lalu disaring di sini, bukan tiga acara mingguan
 * terpisah: WP-Cron menjadwalkan dengan interval, bukan hari, sehingga
 * "tiap Senin" hanya bisa ditiru dengan mendaftar acara per hari — tiga
 * jadwal yang harus dijaga tetap selaras. Satu tik harian yang pulang awal
 * jauh lebih murah dirawat, dan biayanya nyaris nol.
 */
function tgr_stat_cron_jalan() {
	if ( ! tgr_stat_hari_ini_jadwal() ) {
		return;
	}
	tgr_stat_segarkan();
}

add_action( 'tgr_stat_cron', 'tgr_stat_cron_jalan' );

/**
 * Sumber datanya sendiri harian — Search Console diperbarui sekali sehari
 * dengan jeda 2-3 hari, CrUX juga harian — jadi mengambil lebih sering
 * tidak menghasilkan angka baru.
 *
 * Konsekuensi jadwal ini: angka terlama bisa ±6 hari di belakang kenyataan
 * (3 hari jeda GSC + 3 hari jarak terjauh antar pengambilan). Itu sebabnya
 * ambang peringatan data basi dinaikkan ke 7 hari — pada 3 hari ia akan
 * menyala terus tanpa ada yang rusak.
 */
add_action(
	'init',
	function () {
		if ( ! tgr_stat_gsc_siap() && ! tgr_stat_crux_siap() ) {
			return;
		}

		$berikutnya = wp_next_scheduled( 'tgr_stat_cron' );

		// Jadwal non-harian dari versi sebelumnya dicabut lebih dulu; tanpa
		// ini keduanya hidup berdampingan dan pengambilan berjalan dua irama.
		if ( $berikutnya ) {
			$acara = wp_get_scheduled_event( 'tgr_stat_cron' );
			if ( $acara && 'daily' !== $acara->schedule ) {
				wp_unschedule_event( $berikutnya, 'tgr_stat_cron' );
				$berikutnya = false;
			}
		}

		if ( ! $berikutnya ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'tgr_stat_cron' );
		}
	}
);

/* ── Pemberitahuan data basi (tahap 5) ─────────────────────────────── */

/**
 * Batas usia data sebelum dianggap bermasalah, dalam detik.
 *
 * Tujuh hari, mengikuti jadwal Senin-Kamis-Sabtu: jarak terjauh antar
 * pengambilan 3 hari, jadi ambang 3 hari akan menyala terus-menerus tanpa
 * ada yang rusak — alarm yang selalu berbunyi sama saja dengan tidak ada.
 * Tujuh hari berarti dua jadwal berturut-turut terlewat: itu memang gagal.
 *
 * Ditulis sebagai detik apa adanya, bukan 7 * DAY_IN_SECONDS — alasan yang
 * sama dengan TGR_STAT_TOKEN_TTL di atas: const di lingkup berkas menuntut
 * konstanta itu sudah terdefinisi saat mu-plugin dimuat.
 */
const TGR_STAT_BATAS_BASI = 604800;

/** Usia data dalam detik; null bila belum pernah terisi. */
function tgr_stat_usia() {
	$data = get_option( TGR_STAT_OPSI );
	if ( ! is_array( $data ) || empty( $data['diperbarui'] ) ) {
		return null;
	}
	return time() - (int) $data['diperbarui'];
}

/**
 * Peringatan di seluruh wp-admin saat data berhenti diperbarui.
 *
 * Kenapa ini perlu, dan bukan sekadar kehati-hatian berlebihan: WP-Cron
 * tidak dijadwalkan sistem operasi — ia hanya menyala ketika ada permintaan
 * masuk ke WordPress. Padahal instalasi ini headless dan nyaris tak pernah
 * dikunjungi manusia; satu-satunya lalu lintas rutinnya adalah revalidasi
 * dari Vercel. Bila itu berhenti, cron ikut diam, dan halaman Statistik
 * akan memajang angka lama tanpa tanda apa pun bahwa ia sudah membeku.
 *
 * Angka basi yang tampak segar lebih berbahaya daripada halaman kosong,
 * karena keputusan redaksi diambil di atasnya.
 */
add_action(
	'admin_notices',
	function () {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return;
		}
		if ( ! tgr_stat_gsc_siap() && ! tgr_stat_crux_siap() ) {
			return;
		}

		$usia = tgr_stat_usia();

		// Belum pernah terisi sama sekali bukan "basi" — itu keadaan awal,
		// dan halaman Statistik sudah menyediakan tombol pengambilnya.
		if ( null === $usia || $usia < TGR_STAT_BATAS_BASI ) {
			return;
		}

		printf(
			'<div class="notice notice-warning"><p><strong>Statistik berhenti diperbarui.</strong> Data terakhir %s lalu. %s <a href="%s">Perbarui sekarang</a> &middot; <a href="%s">buka Statistik</a></p></div>',
			esc_html( human_time_diff( time() - $usia ) ),
			esc_html( 'Penjadwal WordPress hanya berjalan saat ada permintaan masuk; bila situs ini lama tak tersentuh, ia ikut diam.' ),
			esc_url( wp_nonce_url( admin_url( 'admin.php?page=tgr-statistik&segarkan=1' ), 'tgr_stat_segarkan' ) ),
			esc_url( admin_url( 'admin.php?page=tgr-statistik' ) )
		);
	}
);

/* ── Grafik SVG ────────────────────────────────────────────────────── */

/**
 * Grafik garis sebagai SVG inline, digambar di PHP.
 *
 * Tanpa pustaka dan tanpa JavaScript: halaman ini diunggah manual lewat
 * File Manager tanpa proses build, dan menambahkan skrip CDN ke wp-admin
 * berarti halamannya rusak setiap kali CDN itu tak terjangkau. Interaksi
 * yang benar-benar dipakai — melihat angka satu titik — dicukupi elemen
 * <title> bawaan SVG, yang dirender peramban sebagai tooltip asli.
 *
 * @param array  $seri   [ 'label' => string, 'titik' => [ [x_label, nilai|null], ... ], 'warna' => string, 'putus' => bool ]
 * @param string $satuan Ditempel di tooltip.
 */
function tgr_stat_grafik( array $seri, $satuan = '' ) {
	$semua = array();
	foreach ( $seri as $s ) {
		foreach ( $s['titik'] as $t ) {
			if ( null !== $t[1] ) {
				$semua[] = (float) $t[1];
			}
		}
	}
	if ( ! $semua ) {
		echo '<p class="description">Belum ada data untuk digambar.</p>';
		return;
	}

	$maks = max( $semua );
	$maks = $maks > 0 ? $maks : 1;
	$w    = 1000;
	$h    = 220;
	$pad  = array( 'kiri' => 46, 'kanan' => 10, 'atas' => 12, 'bawah' => 26 );
	$pw   = $w - $pad['kiri'] - $pad['kanan'];
	$ph   = $h - $pad['atas'] - $pad['bawah'];

	echo '<div style="background:#fff;border:1px solid #dcdcde;border-radius:6px;padding:14px 16px;overflow-x:auto;">';
	printf(
		'<svg viewBox="0 0 %d %d" width="100%%" height="%d" role="img" preserveAspectRatio="none" style="display:block;">',
		$w,
		$h,
		$h
	);

	// Garis bantu + label sumbu Y. Empat baris cukup untuk membaca skala
	// tanpa membuat latar jadi ramai.
	for ( $i = 0; $i <= 4; $i++ ) {
		$y    = $pad['atas'] + $ph - ( $ph * $i / 4 );
		$nilai = $maks * $i / 4;
		printf(
			'<line x1="%F" y1="%F" x2="%F" y2="%F" stroke="#f0f0f1" stroke-width="1"/>',
			$pad['kiri'],
			$y,
			$w - $pad['kanan'],
			$y
		);
		printf(
			'<text x="%F" y="%F" font-size="11" fill="#8c8f94" text-anchor="end">%s</text>',
			$pad['kiri'] - 8,
			$y + 4,
			esc_html( tgr_stat_angka( $nilai, $maks < 10 ? 1 : 0 ) )
		);
	}

	foreach ( $seri as $s ) {
		$n = count( $s['titik'] );
		if ( $n < 2 ) {
			continue;
		}

		// Garis dipecah pada nilai null, bukan disambung melompatinya:
		// minggu tanpa sampel bukan nol, dan menyambungnya mengarang data.
		$segmen = array();
		$kini   = array();
		foreach ( $s['titik'] as $i => $t ) {
			if ( null === $t[1] ) {
				if ( count( $kini ) > 1 ) {
					$segmen[] = $kini;
				}
				$kini = array();
				continue;
			}
			$x      = $pad['kiri'] + ( $pw * $i / max( 1, $n - 1 ) );
			$y      = $pad['atas'] + $ph - ( $ph * ( (float) $t[1] / $maks ) );
			$kini[] = array( $x, $y, $t[0], $t[1] );
		}
		if ( count( $kini ) > 1 ) {
			$segmen[] = $kini;
		}

		foreach ( $segmen as $seg ) {
			$d = '';
			foreach ( $seg as $i => $p ) {
				$d .= ( 0 === $i ? 'M' : 'L' ) . sprintf( '%F %F ', $p[0], $p[1] );
			}
			printf(
				'<path d="%s" fill="none" stroke="%s" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"%s/>',
				esc_attr( trim( $d ) ),
				esc_attr( $s['warna'] ),
				empty( $s['putus'] ) ? '' : ' stroke-dasharray="5 4"'
			);
		}

		// Titik sentuh transparan selebar 10px: lingkaran sebesar titik
		// datanya sendiri terlalu kecil untuk disasar kursor.
		foreach ( $segmen as $seg ) {
			foreach ( $seg as $p ) {
				printf(
					'<circle cx="%F" cy="%F" r="5" fill="transparent"><title>%s</title></circle>',
					$p[0],
					$p[1],
					esc_html(
						sprintf(
							'%s — %s%s%s',
							$p[2],
							tgr_stat_angka( $p[3], $p[3] < 10 ? 1 : 0 ),
							$satuan ? ' ' . $satuan : '',
							count( $seri ) > 1 ? ' (' . $s['label'] . ')' : ''
						)
					)
				);
			}
		}
	}

	// Label sumbu X hanya di ujung dan tengah: 365 tanggal berdempetan
	// menjadi bubur tinta yang tak terbaca.
	$acuan = $seri[0]['titik'];
	$n     = count( $acuan );
	if ( $n > 1 ) {
		foreach ( array( 0, intdiv( $n - 1, 2 ), $n - 1 ) as $idx ) {
			$x = $pad['kiri'] + ( $pw * $idx / max( 1, $n - 1 ) );
			printf(
				'<text x="%F" y="%d" font-size="11" fill="#8c8f94" text-anchor="%s">%s</text>',
				$x,
				$h - 8,
				0 === $idx ? 'start' : ( $idx === $n - 1 ? 'end' : 'middle' ),
				esc_html( $acuan[ $idx ][0] )
			);
		}
	}

	echo '</svg>';

	if ( count( $seri ) > 1 ) {
		echo '<div style="display:flex;gap:16px;margin-top:8px;font-size:12px;color:#646970;">';
		foreach ( $seri as $s ) {
			printf(
				'<span><span style="display:inline-block;width:14px;height:0;border-top:2px %s %s;vertical-align:middle;margin-right:5px;"></span>%s</span>',
				empty( $s['putus'] ) ? 'solid' : 'dashed',
				esc_attr( $s['warna'] ),
				esc_html( $s['label'] )
			);
		}
		echo '</div>';
	}

	echo '</div>';
}

/* ── Halaman Statistik (tahap 4) ───────────────────────────────────── */

/** Angka bergaya Indonesia: 75.018 dan 8,5. */
function tgr_stat_angka( $n, $desimal = 0 ) {
	return number_format( (float) $n, $desimal, ',', '.' );
}

/** Selisih terhadap periode pembanding, sebagai penanda naik/turun. */
function tgr_stat_tren( $kini, $dulu, $satuan = 'persen', $terbalik = false ) {
	if ( null === $dulu || 0.0 === (float) $dulu ) {
		return '';
	}

	if ( 'poin' === $satuan ) {
		$delta = ( (float) $kini - (float) $dulu ) * 100;
		$teks  = sprintf( '%+.1f poin', $delta );
	} elseif ( 'posisi' === $satuan ) {
		$delta = (float) $kini - (float) $dulu;
		$teks  = sprintf( '%+.1f', $delta );
	} else {
		$delta = ( ( (float) $kini - (float) $dulu ) / (float) $dulu ) * 100;
		$teks  = sprintf( '%+.0f%%', $delta );
	}

	if ( abs( $delta ) < 0.5 ) {
		return '<span style="color:#646970;">tetap</span>';
	}

	// $terbalik untuk metrik yang mengecil berarti membaik — posisi
	// pencarian 3 lebih baik daripada 8.
	$naik  = $terbalik ? $delta < 0 : $delta > 0;
	$warna = $naik ? '#00734c' : '#b32d2e';

	return sprintf( '<span style="color:%s;">%s</span>', esc_attr( $warna ), esc_html( $teks ) );
}

/**
 * Satu kartu angka besar.
 *
 * $jelas ditempel sebagai atribut title — tooltip bawaan peramban, tanpa
 * JavaScript, sejalan dengan grafik SVG di atas. Judulnya diberi garis
 * putus-putus dan kursor bantuan supaya keberadaan penjelasan itu terlihat;
 * tooltip yang tak ada tandanya sama saja dengan tidak ada.
 */
function tgr_stat_kartu( $judul, $nilai, $tren = '', $jelas = '', $kanan = false ) {
	?>
	<div style="flex:1 1 190px;background:#fff;border:1px solid #dcdcde;border-radius:6px;padding:16px 18px;">
		<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#646970;display:flex;align-items:center;gap:5px;">
			<?php echo esc_html( $judul ); ?>
			<?php
			echo wp_kses(
				tgr_stat_tip( $jelas, $kanan ),
				array( 'span' => array( 'class' => array(), 'tabindex' => array(), 'aria-hidden' => array() ) )
			);
			?>
		</div>
		<div style="font-size:28px;font-weight:600;line-height:1.2;margin-top:6px;color:#1d2327;">
			<?php echo esc_html( $nilai ); ?>
		</div>
		<div style="font-size:12px;margin-top:4px;min-height:18px;">
			<?php echo wp_kses( $tren, array( 'span' => array( 'style' => array() ) ) ); ?>
		</div>
	</div>
	<?php
}

/**
 * Lencana status.
 *
 * Istilahnya sengaja berbeda dari terjemahan harfiah Google ("Needs
 * Improvement" / "Poor"). Tingkat kuning berarti nilainya memadai tetapi
 * bukan yang terbaik — menyebutnya "perlu perbaikan" terbaca sebagai
 * tuduhan bahwa ada yang salah dikerjakan, padahal tidak. "Cukup"
 * menyatakan hal yang sama tanpa menuduh.
 *
 * Tingkat merah TIDAK dilunakkan: melunakkannya berarti menyembunyikan
 * masalah yang nyata, dan halaman ini kehilangan gunanya.
 */
function tgr_stat_lencana( $status ) {
	$peta = array(
		'baik'            => array( 'Baik', '#00734c', '#edfaef' ),
		'perlu-perbaikan' => array( 'Cukup', '#8a6116', '#fcf5e6' ),
		'buruk'           => array( 'Perlu perhatian', '#b32d2e', '#fcf0f1' ),
	);
	$g = isset( $peta[ $status ] ) ? $peta[ $status ] : array( 'Belum cukup data', '#646970', '#f0f0f1' );

	printf(
		'<span style="display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:10px;color:%s;background:%s;">%s</span>',
		esc_attr( $g[1] ),
		esc_attr( $g[2] ),
		esc_html( $g[0] )
	);
}

/**
 * Gaya tooltip, dicetak sekali di kepala halaman.
 *
 * Atribut `title` bawaan peramban sempat dipakai dan ternyata tidak
 * memadai: ia menuntut kursor diam sekitar satu detik, tidak bereaksi saat
 * diklik, dan sama sekali tidak muncul di layar sentuh. Tooltip CSS ini
 * tampil seketika, dan `:focus-within` membuatnya ikut terbuka saat ditekan
 * atau diakses lewat papan ketik — tetap tanpa satu baris JavaScript.
 */
function tgr_stat_gaya() {
	?>
	<style>
		.tgr-tip { position: relative; display: inline-flex; align-items: center; gap: 4px; }
		.tgr-tip__i {
			display: inline-flex; align-items: center; justify-content: center;
			width: 14px; height: 14px; border-radius: 50%;
			background: #dcdcde; color: #50575e;
			font-size: 10px; font-weight: 700; font-style: normal;
			line-height: 1; cursor: help; user-select: none;
		}
		.tgr-tip:hover .tgr-tip__i,
		.tgr-tip:focus-within .tgr-tip__i { background: #2271b1; color: #fff; }
		.tgr-tip__isi {
			position: absolute; left: 0; top: calc(100% + 6px); z-index: 100;
			width: 260px; padding: 9px 11px;
			background: #1d2327; color: #f0f0f1;
			font-size: 12px; font-weight: 400; line-height: 1.5;
			text-transform: none; letter-spacing: 0;
			border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,.25);
			opacity: 0; visibility: hidden; transition: opacity .12s;
			pointer-events: none;
		}
		.tgr-tip:hover .tgr-tip__isi,
		.tgr-tip:focus-within .tgr-tip__isi { opacity: 1; visibility: visible; }
		/* Kartu terakhir di baris: gelembung dijangkarkan ke kanan agar tidak
		   terpotong tepi layar. */
		.tgr-tip--kanan .tgr-tip__isi { left: auto; right: 0; }
	</style>
	<?php
}

/** Penanda tooltip: bulatan i plus gelembung penjelasannya. */
function tgr_stat_tip( $teks, $kanan = false ) {
	if ( '' === $teks ) {
		return '';
	}
	return sprintf(
		'<span class="tgr-tip%s" tabindex="0"><span class="tgr-tip__i" aria-hidden="true">i</span><span class="tgr-tip__isi">%s</span></span>',
		$kanan ? ' tgr-tip--kanan' : '',
		esc_html( $teks )
	);
}

/** Tautan filter yang mempertahankan pilihan lain. */
function tgr_stat_url( $ubah = array() ) {
	$dasar = array( 'page' => 'tgr-statistik' );
	return admin_url( 'admin.php?' . http_build_query( array_merge( $dasar, $ubah ) ) );
}

add_action(
	'admin_menu',
	function () {
		if ( ! tgr_stat_gsc_siap() && ! tgr_stat_crux_siap() ) {
			return;
		}

		add_menu_page(
			'Statistik',
			'Statistik',
			// edit_posts, bukan manage_options: halaman ini memang untuk
			// redaksi, dan menguncinya ke administrator meniadakan tujuannya.
			'edit_posts',
			'tgr-statistik',
			'tgr_stat_halaman',
			'dashicons-chart-bar',
			3
		);
	}
);

/** Halaman Statistik. */
function tgr_stat_halaman() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_die( 'Akses ditolak.' );
	}

	if ( isset( $_GET['segarkan'] ) && check_admin_referer( 'tgr_stat_segarkan' ) ) {
		tgr_stat_segarkan();
		echo '<div class="notice notice-success is-dismissible"><p>Data disegarkan.</p></div>';
	}

	$data = get_option( TGR_STAT_OPSI );

	tgr_stat_gaya();
	echo '<div class="wrap"><h1 style="margin-bottom:4px;">Statistik</h1>';

	if ( ! is_array( $data ) || empty( $data['diperbarui'] ) ) {
		printf(
			'<p>Belum ada data. <a href="%s" class="button button-primary">Ambil sekarang</a></p>',
			esc_url( wp_nonce_url( tgr_stat_url( array( 'segarkan' => 1 ) ), 'tgr_stat_segarkan' ) )
		);
		echo '<p class="description">Selanjutnya data diperbarui otomatis tiap Senin, Kamis, dan Sabtu.</p></div>';
		return;
	}

	$preset  = tgr_stat_preset();
	$rentang = isset( $_GET['rentang'] ) ? (int) $_GET['rentang'] : 28; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( ! in_array( $rentang, $preset, true ) ) {
		$rentang = 28;
	}
	$banding = isset( $_GET['banding'] ) ? sanitize_key( wp_unslash( $_GET['banding'] ) ) : 'sebelum'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( ! in_array( $banding, array( 'tidak', 'sebelum', 'tahun' ), true ) ) {
		$banding = 'sebelum';
	}

	$harian = isset( $data['harian'] ) ? $data['harian'] : array();
	$r      = tgr_stat_rentang_preset( $rentang );
	$kini   = tgr_stat_potong( $harian, $r['mulai'], $r['sampai'] );

	// Periode pembanding diturunkan dari deret yang sama — tanpa satu pun
	// panggilan API tambahan, berapa kali pun tombolnya ditekan.
	$geser = 'tahun' === $banding ? 365 : $rentang;
	$b_sampai = gmdate( 'Y-m-d', strtotime( '-' . $geser . ' days', strtotime( $r['sampai'] ) ) );
	$b_mulai  = gmdate( 'Y-m-d', strtotime( '-' . ( $rentang - 1 ) . ' days', strtotime( $b_sampai ) ) );
	$dulu     = 'tidak' === $banding ? array() : tgr_stat_potong( $harian, $b_mulai, $b_sampai );

	$usia = time() - (int) $data['diperbarui'];
	printf(
		'<p class="description" style="margin-top:0;">%s &ndash; %s &middot; diperbarui %s%s &middot; <a href="%s">perbarui sekarang</a></p>',
		esc_html( $r['mulai'] ),
		esc_html( $r['sampai'] ),
		esc_html( human_time_diff( $data['diperbarui'] ) . ' lalu' ),
		$usia >= TGR_STAT_BATAS_BASI ? ' <strong style="color:#b32d2e;">(sudah basi)</strong>' : '',
		esc_url( wp_nonce_url( tgr_stat_url( array( 'rentang' => $rentang, 'banding' => $banding, 'segarkan' => 1 ) ), 'tgr_stat_segarkan' ) )
	);

	if ( ! empty( $data['gagal_pada'] ) ) {
		printf(
			'<div class="notice notice-warning inline"><p>Percobaan pembaruan terakhir gagal (%s lalu); angka di bawah berasal dari pengambilan sebelumnya.</p></div>',
			esc_html( human_time_diff( (int) $data['gagal_pada'] ) )
		);
	}

	if ( ! empty( $data['galat'] ) ) {
		echo '<div class="notice notice-warning inline"><p><strong>Sebagian data tidak terambil:</strong><br>';
		foreach ( $data['galat'] as $bagian => $pesan ) {
			echo esc_html( $bagian . ' — ' . $pesan ) . '<br>';
		}
		echo '</p></div>';
	}

	/* Baris filter */
	$label_preset = array( 7 => '7 hari', 28 => '28 hari', 90 => '90 hari', 365 => '12 bulan' );
	echo '<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;margin:16px 0 4px;">';
	echo '<div class="button-group">';
	foreach ( $preset as $hari ) {
		printf(
			'<a href="%s" class="button %s">%s</a>',
			esc_url( tgr_stat_url( array( 'rentang' => $hari, 'banding' => $banding ) ) ),
			$hari === $rentang ? 'button-primary' : '',
			esc_html( isset( $label_preset[ $hari ] ) ? $label_preset[ $hari ] : $hari . ' hari' )
		);
	}
	echo '</div>';
	echo '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#646970;">Bandingkan dengan:';
	foreach ( array( 'sebelum' => 'periode sebelumnya', 'tahun' => 'tahun lalu', 'tidak' => 'tidak usah' ) as $k => $l ) {
		printf(
			'<a href="%s" style="%s">%s</a>',
			esc_url( tgr_stat_url( array( 'rentang' => $rentang, 'banding' => $k ) ) ),
			$k === $banding ? 'font-weight:600;color:#1d2327;text-decoration:none;' : '',
			esc_html( $l )
		);
	}
	echo '</div></div>';

	/* Kartu angka */
	$t_kini = tgr_stat_ringkas_deret( array_values( $kini ) );
	$t_dulu = $dulu ? tgr_stat_ringkas_deret( array_values( $dulu ) ) : null;

	echo '<div style="display:flex;flex-wrap:wrap;gap:14px;margin:14px 0 8px;">';
	tgr_stat_kartu(
		'Klik dari pencarian',
		tgr_stat_angka( $t_kini['klik'] ),
		tgr_stat_tren( $t_kini['klik'], $t_dulu ? $t_dulu['klik'] : null ),
		'Berapa kali orang mengklik tautan TGR di hasil pencarian Google lalu sampai ke situs ini.'
	);
	tgr_stat_kartu(
		'Impresi',
		tgr_stat_angka( $t_kini['impresi'] ),
		tgr_stat_tren( $t_kini['impresi'], $t_dulu ? $t_dulu['impresi'] : null ),
		'Berapa kali tautan TGR muncul di hasil pencarian — dilihat orang, entah diklik atau tidak.'
	);
	tgr_stat_kartu(
		'CTR',
		tgr_stat_angka( $t_kini['ctr'] * 100, 1 ) . '%',
		tgr_stat_tren( $t_kini['ctr'], $t_dulu ? $t_dulu['ctr'] : null, 'poin' ),
		'Dari setiap 100 kali TGR muncul di hasil pencarian, berapa yang benar-benar diklik. Naik biasanya berarti judulnya lebih menarik.'
	);
	tgr_stat_kartu(
		'Posisi rata-rata',
		tgr_stat_angka( $t_kini['posisi'], 1 ),
		tgr_stat_tren( $t_kini['posisi'], $t_dulu ? $t_dulu['posisi'] : null, 'posisi', true ),
		'Urutan rata-rata TGR di halaman hasil pencarian. Makin kecil makin baik: 1 berarti teratas, 10 berarti di dasar halaman pertama.',
		true
	);
	echo '</div>';
	echo '<p class="description" style="margin-top:0;">Angka di atas adalah <strong>klik dari pencarian Google</strong> &mdash; bukan total pembaca. Kunjungan langsung, dari Facebook, dan dari WhatsApp tidak terlihat di sini.</p>';

	/* Grafik klik harian */
	if ( $kini ) {
		echo '<h2 style="font-size:14px;margin-top:22px;">Klik harian</h2>';
		$seri = array(
			array(
				'label' => 'Periode ini',
				'warna' => '#2271b1',
				'titik' => array_map(
					static function ( $tgl, $n ) {
						return array( $tgl, $n['klik'] );
					},
					array_keys( $kini ),
					array_values( $kini )
				),
			),
		);
		if ( $dulu ) {
			// Diselaraskan per posisi hari, bukan per tanggal: dua periode
			// berbeda tanggal, dan yang dibandingkan adalah bentuk kurvanya.
			$seri[] = array(
				'label' => 'tahun' === $banding ? 'Tahun lalu' : 'Periode sebelumnya',
				'warna' => '#8c8f94',
				'putus' => true,
				'titik' => array_map(
					static function ( $tgl, $n ) {
						return array( $tgl, $n['klik'] );
					},
					array_keys( $dulu ),
					array_values( $dulu )
				),
			);
		}
		tgr_stat_grafik( $seri, 'klik' );
	}

	/* Tabel: halaman & kueri */
	$p = isset( $data['periode'][ $rentang ] ) ? $data['periode'][ $rentang ] : array();

	echo '<div style="display:flex;flex-wrap:wrap;gap:20px;margin-top:22px;">';

	echo '<div style="flex:1 1 420px;"><h2 style="font-size:14px;">Halaman paling banyak diklik</h2>';
	if ( ! empty( $p['halaman'] ) ) {
		echo '<table class="widefat striped"><tbody>';
		foreach ( $p['halaman'] as $h ) {
			$url   = isset( $h['keys'][0] ) ? $h['keys'][0] : '';
			$path  = trim( (string) wp_parse_url( $url, PHP_URL_PATH ), '/' );
			$label = '' === $path ? 'Beranda' : wp_trim_words( urldecode( $path ), 12, '…' );
			printf(
				'<tr><td><a href="%s" target="_blank" rel="noopener">%s</a></td><td style="width:70px;text-align:right;">%s</td></tr>',
				esc_url( $url ),
				esc_html( $label ),
				esc_html( tgr_stat_angka( $h['clicks'] ) )
			);
		}
		echo '</tbody></table>';
	} else {
		echo '<p class="description">Belum ada data.</p>';
	}
	echo '</div>';

	echo '<div style="flex:1 1 420px;"><h2 style="font-size:14px;">Kueri pencarian teratas</h2>';
	if ( ! empty( $p['kueri'] ) ) {
		echo '<table class="widefat striped"><tbody>';
		foreach ( $p['kueri'] as $k ) {
			printf(
				'<tr><td>%s</td><td style="width:150px;text-align:right;color:#646970;">%s klik &middot; %s%%</td></tr>',
				esc_html( isset( $k['keys'][0] ) ? $k['keys'][0] : '' ),
				esc_html( tgr_stat_angka( $k['clicks'] ) ),
				esc_html( tgr_stat_angka( $k['ctr'] * 100, 1 ) )
			);
		}
		echo '</tbody></table>';
	} else {
		echo '<p class="description">Belum ada data.</p>';
	}
	echo '</div></div>';

	/* Peluang judul */
	echo '<h2 style="font-size:14px;margin-top:26px;">Perlu perbaikan judul</h2>';
	echo '<p class="description" style="margin-top:0;">Kueri yang sudah sering memunculkan TGR di hasil pencarian, tetapi jarang diklik. Yang perlu diperbaiki judulnya, bukan ditulis ulang artikelnya.</p>';
	if ( ! empty( $p['peluang'] ) ) {
		echo '<table class="widefat striped"><thead><tr><th>Kueri</th><th style="width:110px;text-align:right;">Impresi</th><th style="width:90px;text-align:right;">CTR</th><th style="width:90px;text-align:right;">Posisi</th></tr></thead><tbody>';
		foreach ( $p['peluang'] as $q ) {
			printf(
				'<tr><td>%s</td><td style="text-align:right;">%s</td><td style="text-align:right;color:#b32d2e;">%s%%</td><td style="text-align:right;color:#646970;">%s</td></tr>',
				esc_html( isset( $q['keys'][0] ) ? $q['keys'][0] : '' ),
				esc_html( tgr_stat_angka( $q['impressions'] ) ),
				esc_html( tgr_stat_angka( $q['ctr'] * 100, 2 ) ),
				esc_html( tgr_stat_angka( $q['position'], 1 ) )
			);
		}
		echo '</tbody></table>';
	} else {
		echo '<p class="description">Tidak ada kueri yang memenuhi kriteria &mdash; itu kabar baik.</p>';
	}

	/* Performa */
	echo '<h2 style="font-size:14px;margin-top:26px;">Performa</h2>';
	$perf = isset( $data['performa'] ) ? $data['performa'] : null;

	if ( $perf && ! empty( $perf['cukupData'] ) ) {
		printf(
			'<p class="description" style="margin-top:0;">Pengalaman pengguna Chrome sungguhan, 28 hari sampai %s.</p>',
			esc_html( (string) $perf['periode'] )
		);
		// Penjelasan ditulis untuk pembaca yang tidak mengenal istilahnya:
		// tanpa itu, kartu-kartu ini hanya deretan singkatan yang menakuti.
		// Ambangnya ikut disebut supaya angkanya bisa dinilai sendiri, dan
		// dua metrik terakhir dinyatakan terus terang sebagai pendukung —
		// Google tidak memasukkannya ke penilaian resmi.
		$label = array(
			'lcp'  => array(
				'LCP',
				'Kecepatan muat',
				'ms',
				'Waktu sampai bagian terbesar halaman — biasanya gambar utama — selesai tampil. Ini yang paling dirasakan pembaca sebagai "situsnya lambat". Ambang baik: di bawah 2.500 ms.',
			),
			'inp'  => array(
				'INP',
				'Respons interaksi',
				'ms',
				'Seberapa cepat halaman menanggapi saat diketuk atau diklik. Ambang baik: di bawah 200 ms.',
			),
			'cls'  => array(
				'CLS',
				'Kestabilan tata letak',
				'',
				'Seberapa sering isi halaman bergeser sendiri saat dimuat — penyebab pembaca salah menekan tautan. Ambang baik: di bawah 0,1.',
			),
			'fcp'  => array(
				'FCP',
				'Tampil pertama',
				'ms',
				'Waktu sampai apa pun mulai terlihat di layar. Metrik pendukung: tidak masuk penilaian resmi Google, hanya petunjuk awal. Ambang baik: di bawah 1.800 ms.',
			),
			'ttfb' => array(
				'TTFB',
				'Jawaban server',
				'ms',
				'Waktu server mulai menjawab permintaan, sebelum apa pun digambar. Metrik pendukung: tidak masuk penilaian resmi, tetapi ikut menyeret LCP bila tinggi. Ambang baik: di bawah 800 ms.',
			),
		);
		echo '<div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:10px;">';
		foreach ( $label as $kunci => $l ) {
			$m = isset( $perf['metrik'][ $kunci ] ) ? $perf['metrik'][ $kunci ] : null;
			echo '<div style="flex:1 1 170px;background:#fff;border:1px solid #dcdcde;border-radius:6px;padding:14px 16px;">';
			printf(
				'<div style="font-size:11px;font-weight:600;color:#646970;display:flex;align-items:center;gap:5px;">%s <span style="font-weight:400;">%s</span>%s</div>',
				esc_html( $l[0] ),
				esc_html( $l[1] ),
				wp_kses(
					// ttfb kartu terakhir: gelembungnya dijangkarkan ke kanan.
					tgr_stat_tip( $l[3], 'ttfb' === $kunci ),
					array( 'span' => array( 'class' => array(), 'tabindex' => array(), 'aria-hidden' => array() ) )
				)
			);
			if ( $m ) {
				// CLS pecahan dibulatkan dua desimal: nilai mentahnya membawa
				// derau floating point (0,05000000000000000277…).
				$nilai = 'ms' === $l[2]
					? tgr_stat_angka( round( $m['nilai'] ) ) . ' ms'
					: tgr_stat_angka( $m['nilai'], 2 );
				printf( '<div style="font-size:22px;font-weight:600;margin:4px 0 6px;">%s</div>', esc_html( $nilai ) );
				tgr_stat_lencana( $m['status'] );
			} else {
				echo '<div style="font-size:22px;font-weight:600;margin:4px 0 6px;color:#a7aaad;">&mdash;</div>';
				tgr_stat_lencana( '' );
			}
			echo '</div>';
		}
		echo '</div>';
	} elseif ( $perf ) {
		echo '<p class="description">Belum cukup sampel pengguna Chrome untuk origin ini.</p>';
	} else {
		echo '<p class="description">Data performa tidak tersedia.</p>';
	}

	/* Riwayat performa */
	$riwayat = isset( $data['riwayat'] ) ? $data['riwayat'] : null;
	if ( $riwayat && ! empty( $riwayat['periode'] ) && ! empty( $riwayat['metrik']['lcp'] ) ) {
		echo '<h2 style="font-size:14px;margin-top:22px;">Riwayat LCP mingguan</h2>';
		echo '<p class="description" style="margin-top:0;">Kecepatan muat pengguna sungguhan, per minggu. Ambang &ldquo;baik&rdquo; 2.500 ms.</p>';
		$titik = array();
		foreach ( $riwayat['periode'] as $i => $tgl ) {
			$titik[] = array( $tgl, isset( $riwayat['metrik']['lcp'][ $i ] ) ? $riwayat['metrik']['lcp'][ $i ] : null );
		}
		tgr_stat_grafik(
			array( array( 'label' => 'LCP', 'warna' => '#8a6116', 'titik' => $titik ) ),
			'ms'
		);
	}

	echo '</div>';
}
