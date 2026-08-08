<?php
/**
 * Plugin Name:  TGR Headless — Tipe Konten & Field
 * Description:  Mendaftarkan tipe konten khusus (Podcast, Album Galeri, Jajak
 *               Pendapat) dan field tambahan Bedah Buku, seluruhnya terekspos
 *               ke REST API untuk dikonsumsi frontend Next.js.
 * Version:      1.0.0
 * Author:       Coderoach Studio
 *
 * Diletakkan di wp-content/mu-plugins/ sehingga aktif otomatis, tidak bisa
 * dinonaktifkan dari dasbor, dan tetap hidup saat tema diganti.
 *
 * @package TGR
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Tipe konten khusus.
 *
 * Catatan: Bedah Buku sengaja TIDAK dijadikan tipe konten tersendiri karena
 * sudah berupa kategori berisi 78 tulisan dengan URL yang terindeks. Ia cukup
 * diberi field tambahan (lihat tgr_register_book_meta).
 */
add_action(
	'init',
	function () {
		// ── Podcast: penampilan tim GFI di kanal media lain ──────────────
		register_post_type(
			'tgr_podcast',
			array(
				'labels'        => array(
					'name'          => 'Podcast',
					'singular_name' => 'Podcast',
					'add_new_item'  => 'Tambah Penampilan',
					'edit_item'     => 'Sunting Penampilan',
					'all_items'     => 'Semua Penampilan',
				),
				'public'        => true,
				'has_archive'   => false,
				'menu_icon'     => 'dashicons-microphone',
				'menu_position' => 21,
				'rewrite'       => array( 'slug' => 'podcast' ),
				'supports'      => array( 'title', 'editor', 'excerpt', 'thumbnail', 'custom-fields' ),
				'show_in_rest'  => true,
				'rest_base'     => 'podcasts',
			)
		);

		// ── Album galeri: dokumentasi kegiatan per acara ─────────────────
		register_post_type(
			'tgr_album',
			array(
				'labels'        => array(
					'name'          => 'Album Galeri',
					'singular_name' => 'Album',
					'add_new_item'  => 'Tambah Album',
					'edit_item'     => 'Sunting Album',
					'all_items'     => 'Semua Album',
				),
				'public'        => true,
				'has_archive'   => false,
				'menu_icon'     => 'dashicons-format-gallery',
				'menu_position' => 22,
				'rewrite'       => array( 'slug' => 'galeri' ),
				'supports'      => array( 'title', 'editor', 'excerpt', 'thumbnail', 'custom-fields' ),
				'show_in_rest'  => true,
				'rest_base'     => 'albums',
			)
		);

		// ── Jajak pendapat: satu artikel bisa punya nol atau lebih ───────
		register_post_type(
			'tgr_poll',
			array(
				'labels'        => array(
					'name'          => 'Jajak Pendapat',
					'singular_name' => 'Jajak Pendapat',
					'add_new_item'  => 'Tambah Jajak Pendapat',
					'edit_item'     => 'Sunting Jajak Pendapat',
					'all_items'     => 'Semua Jajak Pendapat',
				),
				'public'        => false,
				'show_ui'       => true,
				'menu_icon'     => 'dashicons-chart-bar',
				'menu_position' => 23,
				'supports'      => array( 'title', 'custom-fields' ),
				'show_in_rest'  => true,
				'rest_base'     => 'polls',
			)
		);
	}
);

/**
 * Field Podcast.
 *
 * tgr_kanal     — nama kanal/media pengunggah (mis. "Jaya Suprana Show")
 * tgr_narasumber— narasumber dari tim GFI
 * tgr_format    — Talkshow / Podcast / Bedah Buku / Wawancara / Diskusi
 * tgr_video_id  — ID video YouTube (bukan URL penuh)
 * tgr_tayang    — tanggal tayang asli di kanal sumber (YYYY-MM-DD)
 */
add_action(
	'init',
	function () {
		$fields = array( 'tgr_kanal', 'tgr_narasumber', 'tgr_format', 'tgr_video_id', 'tgr_tayang' );

		foreach ( $fields as $key ) {
			register_post_meta(
				'tgr_podcast',
				$key,
				array(
					'type'              => 'string',
					'single'            => true,
					'default'           => '',
					'show_in_rest'      => true,
					'sanitize_callback' => 'sanitize_text_field',
					'auth_callback'     => function () {
						return current_user_can( 'edit_posts' );
					},
				)
			);
		}
	}
);

/**
 * Field Album Galeri.
 *
 * tgr_lokasi  — kota/tempat kegiatan
 * tgr_tanggal — tanggal kegiatan (YYYY-MM-DD)
 * tgr_foto    — daftar ID lampiran (attachment) sebagai isi album
 */
add_action(
	'init',
	function () {
		foreach ( array( 'tgr_lokasi', 'tgr_tanggal' ) as $key ) {
			register_post_meta(
				'tgr_album',
				$key,
				array(
					'type'              => 'string',
					'single'            => true,
					'default'           => '',
					'show_in_rest'      => true,
					'sanitize_callback' => 'sanitize_text_field',
					'auth_callback'     => function () {
						return current_user_can( 'edit_posts' );
					},
				)
			);
		}

		register_post_meta(
			'tgr_album',
			'tgr_foto',
			array(
				'type'          => 'array',
				'single'        => true,
				'default'       => array(),
				'show_in_rest'  => array(
					'schema' => array(
						'type'  => 'array',
						'items' => array( 'type' => 'integer' ),
					),
				),
				'auth_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}
);

/**
 * Field Jajak Pendapat.
 *
 * tgr_pertanyaan  — pertanyaan yang diajukan
 * tgr_artikel_id  — ID artikel sumber (relasi ke post)
 * tgr_tutup       — tanggal penutupan (YYYY-MM-DD)
 * tgr_opsi        — daftar pilihan: [{ id, label, base }]
 */
add_action(
	'init',
	function () {
		register_post_meta(
			'tgr_poll',
			'tgr_pertanyaan',
			array(
				'type'              => 'string',
				'single'            => true,
				'default'           => '',
				'show_in_rest'      => true,
				'sanitize_callback' => 'sanitize_text_field',
				'auth_callback'     => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);

		register_post_meta(
			'tgr_poll',
			'tgr_artikel_id',
			array(
				'type'          => 'integer',
				'single'        => true,
				'default'       => 0,
				'show_in_rest'  => true,
				'auth_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);

		register_post_meta(
			'tgr_poll',
			'tgr_tutup',
			array(
				'type'              => 'string',
				'single'            => true,
				'default'           => '',
				'show_in_rest'      => true,
				'sanitize_callback' => 'sanitize_text_field',
				'auth_callback'     => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);

		register_post_meta(
			'tgr_poll',
			'tgr_opsi',
			array(
				'type'          => 'array',
				'single'        => true,
				'default'       => array(),
				'show_in_rest'  => array(
					'schema' => array(
						'type'  => 'array',
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'id'    => array( 'type' => 'string' ),
								'label' => array( 'type' => 'string' ),
								'base'  => array( 'type' => 'integer' ),
							),
						),
					),
				),
				'auth_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}
);

/**
 * Field tambahan Bedah Buku, dipasang pada tipe `post` biasa.
 *
 * Dipakai hanya oleh tulisan berkategori "bedah-buku". Cara ini dipilih agar
 * 78 URL ulasan yang sudah terindeks tidak berubah.
 */
function tgr_register_book_meta() {
	$fields = array(
		'tgr_buku_judul'    => 'string',
		'tgr_buku_penulis'  => 'string',
		'tgr_buku_penerbit' => 'string',
		'tgr_buku_tahun'    => 'string',
		'tgr_buku_isbn'     => 'string',
	);

	foreach ( $fields as $key => $type ) {
		register_post_meta(
			'post',
			$key,
			array(
				'type'              => $type,
				'single'            => true,
				'default'           => '',
				'show_in_rest'      => true,
				'sanitize_callback' => 'sanitize_text_field',
				'auth_callback'     => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}

	// Sampul buku disimpan sebagai ID lampiran agar bisa dipakai next/image.
	register_post_meta(
		'post',
		'tgr_buku_sampul',
		array(
			'type'          => 'integer',
			'single'        => true,
			'default'       => 0,
			'show_in_rest'  => true,
			'auth_callback' => function () {
				return current_user_can( 'edit_posts' );
			},
		)
	);
}
add_action( 'init', 'tgr_register_book_meta' );

/**
 * Sorotan judul: satu frasa pada judul yang diberi coretan penanda di frontend.
 * Berlaku untuk seluruh tulisan.
 */
add_action(
	'init',
	function () {
		register_post_meta(
			'post',
			'tgr_sorotan',
			array(
				'type'              => 'string',
				'single'            => true,
				'default'           => '',
				'show_in_rest'      => true,
				'sanitize_callback' => 'sanitize_text_field',
				'auth_callback'     => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}
);

/**
 * Naikkan batas per_page REST dari 100 ke 200 khusus permintaan ber-token,
 * agar sinkronisasi 5.678 artikel tidak perlu terlalu banyak putaran.
 */
add_filter(
	'rest_post_collection_params',
	function ( $params ) {
		if ( is_user_logged_in() ) {
			$params['per_page']['maximum'] = 200;
		}
		return $params;
	}
);
