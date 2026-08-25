<?php
/**
 * Plugin Name:  TGR Headless — Revalidasi Frontend
 * Description:  Memberi tahu frontend Next.js (Vercel) setiap kali tulisan
 *               diterbitkan, disunting, atau dihapus — juga saat gambar
 *               unggulan diganti, media disunting, kategori ditata, atau
 *               profil penulis berubah — lewat webhook /api/revalidate,
 *               sehingga perubahan di wp-admin langsung tampil tanpa
 *               deploy ulang.
 * Version:      1.2.0
 * Author:       Coderoach Studio
 *
 * Diletakkan di wp-content/mu-plugins/ bersama tgr-headless.php.
 *
 * Prasyarat — dua konstanta di wp-config.php, di atas baris
 * "That's all, stop editing!":
 *
 *     define( 'TGR_REVALIDATE_SECRET', '<hasil openssl rand -hex 32>' );
 *     define( 'TGR_REVALIDATE_URL', 'https://theglobal-review.com/api/revalidate' );
 *
 * Tanpa TGR_REVALIDATE_SECRET plugin diam saja (tidak fatal), jadi berkas
 * ini aman diunggah lebih dulu sebelum wp-config disunting. Kegagalan
 * kirim tidak diulang oleh WordPress — frontend memasang ISR berkala
 * sebagai jaring pengaman, sehingga webhook yang hilang paling lama
 * tersusul satu jendela revalidasi.
 *
 * @package TGR
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Tipe konten yang perubahannya perlu diteruskan ke frontend.
 * tgr_pesan dan tgr_subscriber sengaja TIDAK di sini: keduanya kiriman
 * pembaca, bukan konten halaman — tiap pesan masuk berarti satu webhook
 * blocking yang tidak menggugurkan cache apa pun.
 */
function tgr_revalidate_post_types() {
	return array( 'post', 'page', 'tgr_podcast', 'tgr_album', 'tgr_poll', 'tgr_orang' );
}

/**
 * Alamat webhook — WAJIB dari konstanta wp-config.php, tanpa cadangan
 * tertanam: bila subdomain vercel.app suatu saat dilepas lalu diklaim
 * pihak lain, cadangan tertanam berarti secret terkirim ke alamat orang.
 */
function tgr_revalidate_url() {
	if ( defined( 'TGR_REVALIDATE_URL' ) && TGR_REVALIDATE_URL ) {
		return TGR_REVALIDATE_URL;
	}
	return '';
}

/**
 * Kirim webhook. Blocking dengan timeout singkat (±0,3 dtk tambahan saat
 * redaksi menekan simpan) supaya hasilnya bisa dicatat dan ditampilkan
 * sebagai notice — non-blocking berarti buta terhadap kegagalan.
 *
 * Dedup per request: satu simpanan bisa menyentuh beberapa hook sekaligus
 * (transition_post_status + meta _thumbnail_id + edit lampiran). Tanpa
 * dedup, satu klik Perbarui berarti dua-tiga kiriman blocking beruntun dan
 * layar admin ikut menunggu semuanya.
 */
function tgr_revalidate_kirim( $type, $slug, $status_new, $status_old, $modified ) {
	if ( ! defined( 'TGR_REVALIDATE_SECRET' ) || ! TGR_REVALIDATE_SECRET ) {
		return;
	}
	if ( '' === tgr_revalidate_url() ) {
		return;
	}
	if ( '' === $slug ) {
		return;
	}

	static $sudah = array();
	$kunci = $type . '|' . $slug;
	if ( isset( $sudah[ $kunci ] ) ) {
		return;
	}
	$sudah[ $kunci ] = true;

	$response = wp_remote_post(
		tgr_revalidate_url(),
		array(
			'timeout' => 3,
			'headers' => array(
				'Content-Type' => 'application/json',
				'X-TGR-Secret' => TGR_REVALIDATE_SECRET,
			),
			'body'    => wp_json_encode(
				array(
					'type'       => $type,
					'slug'       => $slug,
					'status_new' => $status_new,
					'status_old' => $status_old,
					'modified'   => $modified,
				)
			),
		)
	);

	// Catat hasil terakhir untuk notice di layar edit (redaksi tidak punya
	// akses log Vercel).
	$code = is_wp_error( $response )
		? $response->get_error_message()
		: wp_remote_retrieve_response_code( $response );
	set_transient(
		'tgr_revalidate_last',
		array(
			'slug' => $slug,
			'code' => $code,
			'time' => time(),
		),
		15 * MINUTE_IN_SECONDS
	);
}

/** Varian untuk objek pos — jalur yang dipakai hampir semua hook di bawah. */
function tgr_revalidate_send( $post, $status_new, $status_old, $slug_override = '' ) {
	// Saat dipindah ke tong sampah WordPress bisa menambah akhiran
	// __trashed pada slug; buang agar cache halaman aslinya yang gugur.
	$slug = str_replace( '__trashed', '', $slug_override ? $slug_override : $post->post_name );
	tgr_revalidate_kirim( $post->post_type, $slug, $status_new, $status_old, $post->post_modified_gmt );
}

/**
 * Terbit, sunting-saat-terbit, jadwal yang tayang lewat WP-Cron, tarik
 * dari tayang, dan tong sampah — semuanya lewat transisi status.
 */
add_action(
	'transition_post_status',
	function ( $status_new, $status_old, $post ) {
		if ( wp_is_post_revision( $post ) || wp_is_post_autosave( $post ) ) {
			return;
		}
		if ( ! in_array( $post->post_type, tgr_revalidate_post_types(), true ) ) {
			return;
		}
		// Hanya relevan bila sebelum atau sesudahnya berstatus tayang.
		if ( 'publish' !== $status_new && 'publish' !== $status_old ) {
			return;
		}
		tgr_revalidate_send( $post, $status_new, $status_old );
	},
	10,
	3
);

/**
 * Hapus permanen (lolos dari transition_post_status).
 *
 * Yang dihapus dari Tong Sampah sengaja dilewati: frontend sudah berhenti
 * menampilkannya sejak ia masuk Tong Sampah, jadi kirimannya mubazir.
 * Ini juga yang membuat tombol "Kosongkan Tong Sampah" tetap bisa dipakai —
 * tanpa penjaga ini, mengosongkan ribuan tulisan berarti ribuan kiriman
 * blocking berturut-turut dan layar admin menggantung sampai timeout.
 */
add_action(
	'deleted_post',
	function ( $post_id, $post ) {
		if ( ! $post || ! in_array( $post->post_type, tgr_revalidate_post_types(), true ) ) {
			return;
		}
		if ( 'trash' === $post->post_status ) {
			return;
		}
		tgr_revalidate_send( $post, 'deleted', $post->post_status );
	},
	10,
	2
);

/**
 * Slug tulisan tayang berubah: cache slug LAMA ikut digugurkan — tanpa ini
 * halaman lama tetap tersaji dari cache sampai jendela ISR berikutnya.
 */
add_action(
	'post_updated',
	function ( $post_id, $post_after, $post_before ) {
		if ( wp_is_post_revision( $post_after ) || wp_is_post_autosave( $post_after ) ) {
			return;
		}
		if ( ! in_array( $post_after->post_type, tgr_revalidate_post_types(), true ) ) {
			return;
		}
		if ( 'publish' !== $post_before->post_status || $post_after->post_name === $post_before->post_name ) {
			return;
		}
		tgr_revalidate_send( $post_after, 'renamed', 'publish', $post_before->post_name );
	},
	10,
	3
);

/**
 * Gambar unggulan diganti TANPA menyimpan pos: kotak Gambar Andalan editor
 * klasik menulis meta _thumbnail_id seketika lewat AJAX (set-post-thumbnail),
 * begitu pula WP-CLI dan penulisan meta lewat REST — tidak satu pun melewati
 * wp_insert_post, jadi transition_post_status tidak pernah menyala dan
 * gambar lama bertahan sampai jendela ISR berikutnya.
 */
function tgr_revalidate_meta_gambar( $meta_id, $object_id, $meta_key ) {
	if ( '_thumbnail_id' !== $meta_key ) {
		return;
	}
	$post = get_post( $object_id );
	if ( ! $post || ! in_array( $post->post_type, tgr_revalidate_post_types(), true ) ) {
		return;
	}
	if ( 'publish' !== $post->post_status ) {
		return;
	}
	tgr_revalidate_send( $post, 'publish', 'publish' );
}
add_action( 'updated_post_meta', 'tgr_revalidate_meta_gambar', 10, 3 );
add_action( 'added_post_meta', 'tgr_revalidate_meta_gambar', 10, 3 );
add_action( 'deleted_post_meta', 'tgr_revalidate_meta_gambar', 10, 3 );

/**
 * Lampiran disunting (crop/putar di penyunting gambar, teks alternatif,
 * ganti berkas): tipe attachment tidak masuk daftar tipe di atas, jadi
 * tanpa hook ini pos induknya tetap menyajikan turunan lama. Hanya induk
 * langsung yang terjangkau — pos lain yang memakai lampiran ini sebagai
 * gambar unggulan tanpa menjadi induknya tertangkap saat penetapannya
 * (hook meta di atas) dan oleh skrip 05-perbaiki-induk-media.sh yang
 * merapikan induk lampiran.
 */
function tgr_revalidate_lampiran( $post_id ) {
	$lampiran = get_post( $post_id );
	if ( ! $lampiran || 'attachment' !== $lampiran->post_type || ! $lampiran->post_parent ) {
		return;
	}
	$induk = get_post( $lampiran->post_parent );
	if ( ! $induk || ! in_array( $induk->post_type, tgr_revalidate_post_types(), true ) ) {
		return;
	}
	if ( 'publish' !== $induk->post_status ) {
		return;
	}
	tgr_revalidate_send( $induk, 'publish', 'publish' );
}
add_action( 'attachment_updated', 'tgr_revalidate_lampiran', 10, 1 );
add_action( 'edit_attachment', 'tgr_revalidate_lampiran', 10, 1 );

/**
 * Kategori ditata (nama/slug/induk diganti, dibuat, dihapus): rubrik tiap
 * artikel dihitung dari peta kategori yang di-cache sehari penuh di
 * frontend (tag wp:categories) — satu-satunya jalur menggugurkannya lebih
 * cepat adalah webhook ini.
 */
function tgr_revalidate_term( $term_id, $tt_id, $taxonomy ) {
	if ( 'category' !== $taxonomy ) {
		return;
	}
	$term = get_term( $term_id, 'category' );
	$slug = ( $term && ! is_wp_error( $term ) ) ? $term->slug : 'kategori';
	tgr_revalidate_kirim( 'category', $slug, 'updated', 'updated', gmdate( 'Y-m-d H:i:s' ) );
}
add_action( 'created_term', 'tgr_revalidate_term', 10, 3 );
add_action( 'edited_term', 'tgr_revalidate_term', 10, 3 );
add_action( 'delete_term', 'tgr_revalidate_term', 10, 3 );

/**
 * Profil penulis berubah (slug user dipakai memetakan tulisan ke profil
 * penulis situs; cache-nya juga sehari penuh, tag wp:users).
 */
add_action(
	'profile_update',
	function ( $user_id ) {
		$user = get_userdata( $user_id );
		if ( ! $user ) {
			return;
		}
		tgr_revalidate_kirim( 'user', $user->user_nicename, 'updated', 'updated', gmdate( 'Y-m-d H:i:s' ) );
	}
);

/** Notice kecil di layar edit: status kiriman webhook terakhir. */
add_action(
	'admin_notices',
	function () {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || 'post' !== $screen->base ) {
			return;
		}
		$last = get_transient( 'tgr_revalidate_last' );
		if ( ! is_array( $last ) ) {
			return;
		}
		delete_transient( 'tgr_revalidate_last' );

		if ( 200 === (int) $last['code'] ) {
			printf(
				'<div class="notice notice-success is-dismissible"><p>Situs baru diperbarui: perubahan pada &ldquo;%s&rdquo; sudah diteruskan ke frontend.</p></div>',
				esc_html( $last['slug'] )
			);
		} else {
			printf(
				'<div class="notice notice-warning is-dismissible"><p>Webhook frontend gagal (%s) untuk &ldquo;%s&rdquo;. Perubahan tetap akan tampil paling lama satu jam lewat pembaruan berkala.</p></div>',
				esc_html( (string) $last['code'] ),
				esc_html( $last['slug'] )
			);
		}
	}
);
