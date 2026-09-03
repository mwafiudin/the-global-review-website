<?php
/**
 * Plugin Name:  TGR Headless — Klien Statistik
 * Description:  Klien baca untuk Google Search Console (traffic pencarian)
 *               dan Chrome UX Report (Core Web Vitals pengguna sungguhan).
 *               Menyediakan klien baca, cron harian, dan halaman Statistik
 *               di wp-admin untuk redaksi.
 *
 * Layar diagnostik "Peralatan > Uji Statistik" dihapus di v3.2.0 setelah
 * tugasnya selesai: ia dipakai memverifikasi kredensial sebelum halaman
 * sungguhan ada, dan menyisakannya berarti memajang tombol yang memanggil
 * dua API luar tanpa alasan. Riwayatnya ada di git bila suatu saat
 * diagnostik semacam itu diperlukan lagi.
 * Version:      3.2.0
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

/* ── Pengumpulan & cache (tahap 3) ─────────────────────────────────── */

/** Nama opsi penyimpan hasil. Tidak di-autoload: isinya besar. */
const TGR_STAT_OPSI = 'tgr_stat_data';

/** Jendela laporan, dalam hari. */
const TGR_STAT_JENDELA = 28;

/**
 * Rentang tanggal laporan.
 *
 * Berakhir 3 hari lalu, bukan hari ini: data Search Console tertinggal
 * 2-3 hari, dan memasukkan hari-hari yang belum lengkap membuat tren
 * selalu tampak menukik di ujungnya.
 *
 * @return array{mulai:string,sampai:string,mulai_lalu:string,sampai_lalu:string}
 */
function tgr_stat_rentang() {
	$sampai = strtotime( '-3 days' );
	$mulai  = strtotime( '-' . ( TGR_STAT_JENDELA - 1 ) . ' days', $sampai );

	// Periode pembanding: sama panjang, tepat sebelum periode berjalan.
	$sampai_lalu = strtotime( '-1 day', $mulai );
	$mulai_lalu  = strtotime( '-' . ( TGR_STAT_JENDELA - 1 ) . ' days', $sampai_lalu );

	return array(
		'mulai'       => gmdate( 'Y-m-d', $mulai ),
		'sampai'      => gmdate( 'Y-m-d', $sampai ),
		'mulai_lalu'  => gmdate( 'Y-m-d', $mulai_lalu ),
		'sampai_lalu' => gmdate( 'Y-m-d', $sampai_lalu ),
	);
}

/** Jumlahkan klik & impresi satu kumpulan baris jadi satu ringkasan. */
function tgr_stat_ringkas( $baris ) {
	$klik    = 0;
	$impresi = 0;
	$posisi  = 0.0;

	foreach ( (array) $baris as $b ) {
		$klik    += isset( $b['clicks'] ) ? (int) $b['clicks'] : 0;
		$impresi += isset( $b['impressions'] ) ? (int) $b['impressions'] : 0;
		$posisi  += isset( $b['position'] ) ? (float) $b['position'] : 0.0;
	}

	$n = max( 1, count( (array) $baris ) );

	return array(
		'klik'    => $klik,
		'impresi' => $impresi,
		// CTR dihitung ulang dari total, bukan dirata-rata dari CTR per baris:
		// merata-ratakan persentase memberi bobot sama pada kueri berimpresi 5
		// dan berimpresi 8.000, dan hasilnya tidak berarti apa-apa.
		'ctr'     => $impresi > 0 ? $klik / $impresi : 0.0,
		'posisi'  => $posisi / $n,
	);
}

/**
 * Kueri berimpresi tinggi tapi jarang diklik.
 *
 * Metrik paling actionable di halaman ini: TGR sudah muncul di hasil
 * pencarian, hanya judulnya yang tidak menarik klik. Perbaikannya menyunting
 * judul, bukan menulis artikel baru.
 *
 * Ambang 100 impresi menyaring ekor panjang yang datanya terlalu tipis untuk
 * disimpulkan; CTR di bawah 2% jauh di bawah wajar untuk posisi 10 besar.
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
 * Ambil seluruh data dari kedua API dan susun jadi satu struktur siap pakai.
 *
 * Kegagalan sebagian TIDAK menggugurkan keseluruhan: tiap bagian menyimpan
 * galatnya sendiri, sehingga Search Console yang mati tidak ikut menghapus
 * angka performa yang baik-baik saja — dan sebaliknya.
 *
 * @return array
 */
function tgr_stat_kumpulkan() {
	$r    = tgr_stat_rentang();
	$data = array(
		'diperbarui' => time(),
		'rentang'    => $r,
		'galat'      => array(),
	);

	if ( tgr_stat_gsc_siap() ) {
		$total = tgr_stat_gsc_kueri(
			array(
				'mulai'   => $r['mulai'],
				'sampai'  => $r['sampai'],
				'dimensi' => array( 'date' ),
				'batas'   => TGR_STAT_JENDELA,
			)
		);
		$lalu  = tgr_stat_gsc_kueri(
			array(
				'mulai'   => $r['mulai_lalu'],
				'sampai'  => $r['sampai_lalu'],
				'dimensi' => array( 'date' ),
				'batas'   => TGR_STAT_JENDELA,
			)
		);
		// 100 baris, bukan 10: daftar yang tampil memang pendek, tetapi
		// peluang judul disaring DARI daftar ini — menyaring sepuluh baris
		// teratas hampir tidak pernah menemukan apa pun.
		$kueri   = tgr_stat_gsc_kueri(
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

		foreach ( array( 'total' => $total, 'lalu' => $lalu, 'kueri' => $kueri, 'halaman' => $halaman ) as $nama => $hasil ) {
			if ( is_wp_error( $hasil ) ) {
				$data['galat'][ 'gsc_' . $nama ] = $hasil->get_error_message();
			}
		}

		$data['sekarang'] = is_wp_error( $total ) ? null : tgr_stat_ringkas( $total );
		$data['lalu']     = is_wp_error( $lalu ) ? null : tgr_stat_ringkas( $lalu );
		$data['harian']   = is_wp_error( $total ) ? array() : $total;
		$data['kueri']    = is_wp_error( $kueri ) ? array() : array_slice( $kueri, 0, 10 );
		$data['halaman']  = is_wp_error( $halaman ) ? array() : $halaman;
		$data['peluang']  = is_wp_error( $kueri ) ? array() : tgr_stat_peluang_judul( $kueri );
	}

	if ( tgr_stat_crux_siap() ) {
		$crux = tgr_stat_crux();
		if ( is_wp_error( $crux ) ) {
			$data['galat']['crux'] = $crux->get_error_message();
			$data['performa']      = null;
		} else {
			$data['performa'] = $crux;
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

	$ada_isi = ! empty( $baru['sekarang'] ) || ! empty( $baru['performa'] );
	if ( ! $ada_isi ) {
		$lama = get_option( TGR_STAT_OPSI );
		if ( is_array( $lama ) ) {
			$lama['galat']       = $baru['galat'];
			$lama['gagal_pada']  = time();
			update_option( TGR_STAT_OPSI, $lama, false );
			return $lama;
		}
	}

	update_option( TGR_STAT_OPSI, $baru, false );
	return $baru;
}

add_action( 'tgr_stat_cron', 'tgr_stat_segarkan' );

/**
 * Jadwalkan sekali sehari. Dipasang di 'init' dan bukan saat aktivasi
 * karena mu-plugin tidak punya hook aktivasi — ia selalu aktif.
 */
add_action(
	'init',
	function () {
		if ( ! tgr_stat_gsc_siap() && ! tgr_stat_crux_siap() ) {
			return;
		}
		if ( ! wp_next_scheduled( 'tgr_stat_cron' ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'tgr_stat_cron' );
		}
	}
);

/* ── Halaman Statistik (tahap 4) ───────────────────────────────────── */

/**
 * Angka bergaya Indonesia: 75.018 dan 8,5.
 *
 * number_format() eksplisit, bukan number_format_i18n(): di pemasangan ini
 * fungsi itu mengembalikan konvensi Inggris (75,018 / 8.5) meski antarmuka
 * berbahasa Indonesia, sehingga pemisah ribuan dan desimal justru tertukar
 * artinya bagi pembacanya.
 */
function tgr_stat_angka( $n, $desimal = 0 ) {
	return number_format( (float) $n, $desimal, ',', '.' );
}

/** Selisih terhadap periode sebelumnya, sebagai penanda naik/turun. */
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

	// Ambang setengah satuan, bukan 0,05: selisih -0,4% dibulatkan menjadi
	// "-0%" — tanda yang menyiratkan penurunan padahal angkanya nol.
	if ( abs( $delta ) < 0.5 ) {
		return '<span style="color:#646970;">tetap</span>';
	}

	// $terbalik untuk metrik yang mengecil berarti membaik — posisi
	// pencarian 3 lebih baik daripada 8.
	$naik  = $terbalik ? $delta < 0 : $delta > 0;
	$warna = $naik ? '#00734c' : '#b32d2e';

	return sprintf( '<span style="color:%s;">%s</span>', esc_attr( $warna ), esc_html( $teks ) );
}

/** Satu kartu angka besar. */
function tgr_stat_kartu( $judul, $nilai, $tren = '', $catatan = '' ) {
	?>
	<div style="flex:1 1 190px;background:#fff;border:1px solid #dcdcde;border-radius:6px;padding:16px 18px;">
		<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#646970;">
			<?php echo esc_html( $judul ); ?>
		</div>
		<div style="font-size:28px;font-weight:600;line-height:1.2;margin-top:6px;color:#1d2327;">
			<?php echo esc_html( $nilai ); ?>
		</div>
		<div style="font-size:12px;margin-top:4px;min-height:18px;">
			<?php
			echo wp_kses( $tren, array( 'span' => array( 'style' => array() ) ) );
			if ( $catatan ) {
				echo ' <span style="color:#646970;">' . esc_html( $catatan ) . '</span>';
			}
			?>
		</div>
	</div>
	<?php
}

/** Lencana status Core Web Vitals. */
function tgr_stat_lencana( $status ) {
	$peta = array(
		'baik'            => array( 'Baik', '#00734c', '#edfaef' ),
		'perlu-perbaikan' => array( 'Perlu perbaikan', '#8a6116', '#fcf5e6' ),
		'buruk'           => array( 'Buruk', '#b32d2e', '#fcf0f1' ),
	);
	$g = isset( $peta[ $status ] ) ? $peta[ $status ] : array( 'Belum cukup data', '#646970', '#f0f0f1' );

	printf(
		'<span style="display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:10px;color:%s;background:%s;">%s</span>',
		esc_attr( $g[1] ),
		esc_attr( $g[2] ),
		esc_html( $g[0] )
	);
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

	// Penyegaran manual: hanya bagi yang boleh, dan hanya lewat nonce —
	// tanpa itu satu tautan di email bisa memaksa panggilan API berulang.
	if ( isset( $_GET['segarkan'] ) && check_admin_referer( 'tgr_stat_segarkan' ) ) {
		tgr_stat_segarkan();
		echo '<div class="notice notice-success is-dismissible"><p>Data disegarkan.</p></div>';
	}

	$data = get_option( TGR_STAT_OPSI );

	echo '<div class="wrap"><h1 style="margin-bottom:4px;">Statistik</h1>';

	if ( ! is_array( $data ) || empty( $data['diperbarui'] ) ) {
		printf(
			'<p>Belum ada data. <a href="%s" class="button button-primary">Ambil sekarang</a></p>',
			esc_url( wp_nonce_url( admin_url( 'admin.php?page=tgr-statistik&segarkan=1' ), 'tgr_stat_segarkan' ) )
		);
		echo '<p class="description">Selanjutnya data diperbarui otomatis sekali sehari.</p></div>';
		return;
	}

	$r = $data['rentang'];
	printf(
		'<p class="description" style="margin-top:0;">%s &ndash; %s &middot; diperbarui %s &middot; <a href="%s">perbarui sekarang</a></p>',
		esc_html( $r['mulai'] ),
		esc_html( $r['sampai'] ),
		esc_html( human_time_diff( $data['diperbarui'] ) . ' lalu' ),
		esc_url( wp_nonce_url( admin_url( 'admin.php?page=tgr-statistik&segarkan=1' ), 'tgr_stat_segarkan' ) )
	);

	if ( ! empty( $data['galat'] ) ) {
		echo '<div class="notice notice-warning inline"><p><strong>Sebagian data tidak terambil:</strong><br>';
		foreach ( $data['galat'] as $bagian => $pesan ) {
			echo esc_html( $bagian . ' — ' . $pesan ) . '<br>';
		}
		echo '</p></div>';
	}

	/* Kartu angka */
	$kini = isset( $data['sekarang'] ) ? $data['sekarang'] : null;
	$lalu = isset( $data['lalu'] ) ? $data['lalu'] : null;

	if ( $kini ) {
		echo '<div style="display:flex;flex-wrap:wrap;gap:14px;margin:18px 0 8px;">';
		tgr_stat_kartu(
			'Klik dari pencarian',
			tgr_stat_angka( $kini['klik'] ),
			tgr_stat_tren( $kini['klik'], $lalu ? $lalu['klik'] : null )
		);
		tgr_stat_kartu(
			'Impresi',
			tgr_stat_angka( $kini['impresi'] ),
			tgr_stat_tren( $kini['impresi'], $lalu ? $lalu['impresi'] : null )
		);
		tgr_stat_kartu(
			'CTR',
			tgr_stat_angka( $kini['ctr'] * 100, 1 ) . '%',
			tgr_stat_tren( $kini['ctr'], $lalu ? $lalu['ctr'] : null, 'poin' )
		);
		tgr_stat_kartu(
			'Posisi rata-rata',
			tgr_stat_angka( $kini['posisi'], 1 ),
			tgr_stat_tren( $kini['posisi'], $lalu ? $lalu['posisi'] : null, 'posisi', true )
		);
		echo '</div>';
		echo '<p class="description" style="margin-top:0;">Angka di atas adalah <strong>klik dari pencarian Google</strong> &mdash; bukan total pembaca. Kunjungan langsung, dari Facebook, dan dari WhatsApp tidak terlihat di sini.</p>';
	}

	/* Dua kolom: halaman & kueri */
	echo '<div style="display:flex;flex-wrap:wrap;gap:20px;margin-top:22px;">';

	echo '<div style="flex:1 1 420px;">';
	echo '<h2 style="font-size:14px;">Halaman paling banyak diklik</h2>';
	if ( ! empty( $data['halaman'] ) ) {
		echo '<table class="widefat striped"><tbody>';
		foreach ( $data['halaman'] as $h ) {
			$url = isset( $h['keys'][0] ) ? $h['keys'][0] : '';
			$path  = trim( (string) wp_parse_url( $url, PHP_URL_PATH ), '/' );
			// Path beranda kosong; tanpa ini ia tampil sebagai URL penuh dan
			// menjadi satu-satunya baris yang berbeda bentuk dari yang lain.
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

	echo '<div style="flex:1 1 420px;">';
	echo '<h2 style="font-size:14px;">Kueri pencarian teratas</h2>';
	if ( ! empty( $data['kueri'] ) ) {
		echo '<table class="widefat striped"><tbody>';
		foreach ( $data['kueri'] as $k ) {
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
	echo '</div>';

	echo '</div>';

	/* Peluang judul */
	echo '<h2 style="font-size:14px;margin-top:26px;">Perlu perbaikan judul</h2>';
	echo '<p class="description" style="margin-top:0;">Kueri yang sudah sering memunculkan TGR di hasil pencarian, tetapi jarang diklik. Yang perlu diperbaiki judulnya, bukan ditulis ulang artikelnya.</p>';
	if ( ! empty( $data['peluang'] ) ) {
		echo '<table class="widefat striped"><thead><tr><th>Kueri</th><th style="width:110px;text-align:right;">Impresi</th><th style="width:90px;text-align:right;">CTR</th><th style="width:90px;text-align:right;">Posisi</th></tr></thead><tbody>';
		foreach ( $data['peluang'] as $p ) {
			printf(
				'<tr><td>%s</td><td style="text-align:right;">%s</td><td style="text-align:right;color:#b32d2e;">%s%%</td><td style="text-align:right;color:#646970;">%s</td></tr>',
				esc_html( isset( $p['keys'][0] ) ? $p['keys'][0] : '' ),
				esc_html( tgr_stat_angka( $p['impressions'] ) ),
				esc_html( tgr_stat_angka( $p['ctr'] * 100, 2 ) ),
				esc_html( tgr_stat_angka( $p['position'], 1 ) )
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
		$label = array(
			'lcp'  => array( 'LCP', 'Kecepatan muat', 'ms' ),
			'inp'  => array( 'INP', 'Respons interaksi', 'ms' ),
			'cls'  => array( 'CLS', 'Kestabilan tata letak', '' ),
			'fcp'  => array( 'FCP', 'Tampil pertama', 'ms' ),
			'ttfb' => array( 'TTFB', 'Jawaban server', 'ms' ),
		);
		echo '<div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:10px;">';
		foreach ( $label as $kunci => $l ) {
			$m = isset( $perf['metrik'][ $kunci ] ) ? $perf['metrik'][ $kunci ] : null;
			echo '<div style="flex:1 1 170px;background:#fff;border:1px solid #dcdcde;border-radius:6px;padding:14px 16px;">';
			printf(
				'<div style="font-size:11px;font-weight:600;color:#646970;">%s <span style="font-weight:400;">%s</span></div>',
				esc_html( $l[0] ),
				esc_html( $l[1] )
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

	echo '</div>';
}
