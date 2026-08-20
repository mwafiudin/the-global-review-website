<?php
/**
 * Plugin Name:  TGR Headless — Tipe Konten & Field
 * Description:  Mendaftarkan tipe konten khusus (Podcast, Album Galeri, Jajak
 *               Pendapat, Pengurus & Redaksi, Pesan Masuk), field tambahan
 *               Bedah Buku, dan isi halaman statis, seluruhnya untuk
 *               dikonsumsi frontend Next.js.
 * Version:      3.0.0
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
 * tgr_unggulan  — isi "1" untuk penampilan utama halaman Podcast (sejak 1.1;
 *                 kosong = frontend memakai penampilan terbaru)
 */
add_action(
	'init',
	function () {
		$fields = array( 'tgr_kanal', 'tgr_narasumber', 'tgr_format', 'tgr_video_id', 'tgr_tayang', 'tgr_unggulan' );

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
 * tgr_lokasi   — kota/tempat kegiatan
 * tgr_tanggal  — tanggal kegiatan (YYYY-MM-DD)
 * tgr_kategori — label jenis kegiatan, mis. "Seminar" (sejak 1.1; kosong =
 *                frontend menampilkan "Kegiatan")
 * tgr_foto     — daftar ID lampiran (attachment) sebagai isi album
 */
add_action(
	'init',
	function () {
		foreach ( array( 'tgr_lokasi', 'tgr_tanggal', 'tgr_kategori' ) as $key ) {
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
		'tgr_buku_judul'           => 'string',
		'tgr_buku_penulis'         => 'string',
		'tgr_buku_penulis_lengkap' => 'string',
		'tgr_buku_penerbit'        => 'string',
		'tgr_buku_tahun'           => 'string',
		'tgr_buku_isbn'            => 'string',
		'tgr_buku_podcast'         => 'string',
		// "1" pada satu-satunya buku yang tampil di kartu promo sidebar.
		'tgr_buku_unggulan'        => 'string',
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

/* ═══════════════════════════════════════════════════════════════════════
 * Layar editor: kotak isian tiap tipe konten.
 *
 * register_post_meta di atas hanya membuka field ke REST. Tanpa kotak
 * isian, redaksi tidak punya cara mengisinya sama sekali: tgr_opsi (array
 * objek) dan tgr_foto (array ID lampiran) mustahil diketik lewat kotak
 * Custom Fields yang hanya menerima sepasang teks.
 * ═══════════════════════════════════════════════════════════════════════ */

/** Nilai meta dengan cadangan bila belum pernah diisi. */
function tgr_meta( $post_id, $key, $cadangan = '' ) {
	$nilai = get_post_meta( $post_id, $key, true );
	return ( '' === $nilai || null === $nilai ) ? $cadangan : $nilai;
}

/** Gerbang bersama sebelum menyimpan: autosave, revisi, nonce, hak akses. */
function tgr_boleh_simpan( $post_id ) {
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return false;
	}
	if ( wp_is_post_revision( $post_id ) ) {
		return false;
	}
	$nonce = isset( $_POST['tgr_meta_nonce'] )
		? sanitize_text_field( wp_unslash( $_POST['tgr_meta_nonce'] ) )
		: '';
	if ( ! $nonce || ! wp_verify_nonce( $nonce, 'tgr_simpan_meta' ) ) {
		return false;
	}
	return current_user_can( 'edit_post', $post_id );
}

/** Satu nilai teks dari $_POST, sudah dibersihkan. */
function tgr_kiriman_teks( $key ) {
	return isset( $_POST[ $key ] )
		? sanitize_text_field( wp_unslash( $_POST[ $key ] ) )
		: '';
}

/** Teks multi-baris dari $_POST — baris baru dipertahankan (isi halaman, bio). */
function tgr_kiriman_teks_panjang( $key ) {
	return isset( $_POST[ $key ] )
		? sanitize_textarea_field( wp_unslash( $_POST[ $key ] ) )
		: '';
}

/**
 * Tanggal wajib YYYY-MM-DD: frontend menempelkan "T00:00:00" ke nilai ini,
 * jadi teks bebas akan tampil sebagai "Invalid Date" di situs.
 */
function tgr_kiriman_tanggal( $key ) {
	$nilai = tgr_kiriman_teks( $key );
	return preg_match( '/^\d{4}-\d{2}-\d{2}$/', $nilai ) ? $nilai : '';
}

/**
 * Terima ID YouTube 11 karakter, atau ekstrak dari URL penuh yang biasa
 * ditempel redaksi. Cermin dari parseYoutubeId() di frontend — nilai yang
 * tidak dikenali dikosongkan, bukan diteruskan dan merusak URL sematan.
 */
function tgr_youtube_id( $nilai ) {
	$nilai = trim( $nilai );
	if ( preg_match( '/^[A-Za-z0-9_-]{11}$/', $nilai ) ) {
		return $nilai;
	}
	$pola = '#(?:youtu\.be/|youtube(?:-nocookie)?\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/|live/))([A-Za-z0-9_-]{11})#';
	return preg_match( $pola, $nilai, $cocok ) ? $cocok[1] : '';
}

add_action(
	'add_meta_boxes',
	function () {
		add_meta_box( 'tgr_isi_podcast', 'Detail Penampilan', 'tgr_kotak_podcast', 'tgr_podcast', 'normal', 'high' );
		add_meta_box( 'tgr_isi_album', 'Detail Album', 'tgr_kotak_album', 'tgr_album', 'normal', 'high' );
		add_meta_box( 'tgr_isi_poll', 'Isi Jajak Pendapat', 'tgr_kotak_poll', 'tgr_poll', 'normal', 'high' );
		add_meta_box( 'tgr_isi_sorotan', 'Sorotan Judul', 'tgr_kotak_sorotan', 'post', 'side', 'default' );
		add_meta_box( 'tgr_isi_buku', 'Identitas Buku — rubrik Bedah Buku', 'tgr_kotak_buku', 'post', 'normal', 'low' );
	}
);

/** Pemilih media (album) hanya dimuat di layar yang memakainya. */
add_action(
	'admin_enqueue_scripts',
	function ( $hook ) {
		if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}
		$layar = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $layar ) {
			return;
		}
		if ( 'tgr_album' === $layar->post_type ) {
			wp_enqueue_media();
			wp_enqueue_script( 'jquery-ui-sortable' );
		}
		// Tulisan biasa: pemilih sampul di kotak Identitas Buku.
		if ( 'post' === $layar->post_type ) {
			wp_enqueue_media();
		}
	}
);

/* ── Podcast ───────────────────────────────────────────────────────── */

function tgr_kotak_podcast( $post ) {
	wp_nonce_field( 'tgr_simpan_meta', 'tgr_meta_nonce' );
	$format_terpilih = tgr_meta( $post->ID, 'tgr_format', 'Talkshow' );
	$daftar_format   = array( 'Talkshow', 'Podcast', 'Bedah Buku', 'Wawancara', 'Diskusi' );
	?>
	<table class="form-table" role="presentation">
		<tbody>
			<tr>
				<th scope="row"><label for="tgr_kanal">Kanal / media</label></th>
				<td>
					<input type="text" id="tgr_kanal" name="tgr_kanal" class="regular-text"
						value="<?php echo esc_attr( tgr_meta( $post->ID, 'tgr_kanal' ) ); ?>">
					<p class="description">Pemilik tayangan, mis. &ldquo;Jaya Suprana Show&rdquo;.</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="tgr_narasumber">Narasumber</label></th>
				<td>
					<input type="text" id="tgr_narasumber" name="tgr_narasumber" class="regular-text"
						value="<?php echo esc_attr( tgr_meta( $post->ID, 'tgr_narasumber' ) ); ?>">
					<p class="description">Nama dari tim GFI yang tampil.</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="tgr_format">Format</label></th>
				<td>
					<select id="tgr_format" name="tgr_format">
						<?php foreach ( $daftar_format as $format ) : ?>
							<option value="<?php echo esc_attr( $format ); ?>"
								<?php selected( $format, $format_terpilih ); ?>>
								<?php echo esc_html( $format ); ?>
							</option>
						<?php endforeach; ?>
					</select>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="tgr_video_id">Video YouTube</label></th>
				<td>
					<input type="text" id="tgr_video_id" name="tgr_video_id" class="regular-text"
						value="<?php echo esc_attr( tgr_meta( $post->ID, 'tgr_video_id' ) ); ?>">
					<p class="description">
						Boleh tempel URL penuh (youtu.be/&hellip;, watch?v=&hellip;, shorts/&hellip;) &mdash;
						ID-nya diambil otomatis saat disimpan. Tanpa video, penampilan ini tidak tampil di situs.
					</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="tgr_tayang">Tanggal tayang</label></th>
				<td>
					<input type="date" id="tgr_tayang" name="tgr_tayang"
						value="<?php echo esc_attr( tgr_meta( $post->ID, 'tgr_tayang' ) ); ?>">
					<p class="description">Tanggal tayang asli di kanal sumber. Kosong &rarr; memakai tanggal terbit.</p>
				</td>
			</tr>
			<tr>
				<th scope="row">Penampilan utama</th>
				<td>
					<label>
						<input type="checkbox" name="tgr_unggulan" value="1"
							<?php checked( '1', tgr_meta( $post->ID, 'tgr_unggulan' ) ); ?>>
						Tampilkan besar di atas halaman Podcast
					</label>
					<p class="description">Hanya satu yang bisa aktif &mdash; mencentang di sini melepas tanda dari yang lain.</p>
				</td>
			</tr>
		</tbody>
	</table>
	<?php
}

add_action(
	'save_post_tgr_podcast',
	function ( $post_id ) {
		if ( ! tgr_boleh_simpan( $post_id ) ) {
			return;
		}
		update_post_meta( $post_id, 'tgr_kanal', tgr_kiriman_teks( 'tgr_kanal' ) );
		update_post_meta( $post_id, 'tgr_narasumber', tgr_kiriman_teks( 'tgr_narasumber' ) );
		update_post_meta( $post_id, 'tgr_format', tgr_kiriman_teks( 'tgr_format' ) );
		update_post_meta( $post_id, 'tgr_video_id', tgr_youtube_id( tgr_kiriman_teks( 'tgr_video_id' ) ) );
		update_post_meta( $post_id, 'tgr_tayang', tgr_kiriman_tanggal( 'tgr_tayang' ) );

		$unggulan = isset( $_POST['tgr_unggulan'] ) ? '1' : '';
		update_post_meta( $post_id, 'tgr_unggulan', $unggulan );
		if ( '1' === $unggulan ) {
			$lainnya = get_posts(
				array(
					'post_type'   => 'tgr_podcast',
					'post_status' => 'any',
					'numberposts' => -1,
					'exclude'     => array( $post_id ),
					'meta_key'    => 'tgr_unggulan',
					'meta_value'  => '1',
					'fields'      => 'ids',
				)
			);
			foreach ( $lainnya as $id_lain ) {
				update_post_meta( $id_lain, 'tgr_unggulan', '' );
			}
		}
	}
);

/* ── Album galeri ──────────────────────────────────────────────────── */

function tgr_kotak_album( $post ) {
	wp_nonce_field( 'tgr_simpan_meta', 'tgr_meta_nonce' );
	$foto = tgr_meta( $post->ID, 'tgr_foto', array() );
	$foto = is_array( $foto ) ? array_map( 'absint', $foto ) : array();
	?>
	<table class="form-table" role="presentation">
		<tbody>
			<tr>
				<th scope="row"><label for="tgr_kategori">Jenis kegiatan</label></th>
				<td>
					<input type="text" id="tgr_kategori" name="tgr_kategori" class="regular-text"
						value="<?php echo esc_attr( tgr_meta( $post->ID, 'tgr_kategori' ) ); ?>">
					<p class="description">Mis. Seminar, Bedah Buku, Diskusi. Kosong &rarr; tampil sebagai &ldquo;Kegiatan&rdquo;.</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="tgr_lokasi">Lokasi</label></th>
				<td>
					<input type="text" id="tgr_lokasi" name="tgr_lokasi" class="regular-text"
						value="<?php echo esc_attr( tgr_meta( $post->ID, 'tgr_lokasi' ) ); ?>">
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="tgr_tanggal">Tanggal kegiatan</label></th>
				<td>
					<input type="date" id="tgr_tanggal" name="tgr_tanggal"
						value="<?php echo esc_attr( tgr_meta( $post->ID, 'tgr_tanggal' ) ); ?>">
					<p class="description">Kosong &rarr; memakai tanggal terbit.</p>
				</td>
			</tr>
			<tr>
				<th scope="row">Foto album</th>
				<td>
					<input type="hidden" id="tgr_foto" name="tgr_foto"
						value="<?php echo esc_attr( implode( ',', $foto ) ); ?>">
					<ul id="tgr-foto-daftar" class="tgr-foto-daftar">
						<?php foreach ( $foto as $id_foto ) : ?>
							<li data-id="<?php echo esc_attr( $id_foto ); ?>">
								<?php echo wp_get_attachment_image( $id_foto, 'thumbnail' ); ?>
								<button type="button" class="tgr-foto-hapus button-link" aria-label="Hapus foto">&times;</button>
							</li>
						<?php endforeach; ?>
					</ul>
					<p>
						<button type="button" class="button" id="tgr-foto-pilih">Pilih foto</button>
						<span class="description">Urutan bisa digeser. Album tanpa foto tidak ditampilkan di situs.</span>
					</p>
					<style>
						.tgr-foto-daftar { display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 10px; }
						.tgr-foto-daftar li { position: relative; margin: 0; cursor: move; line-height: 0; }
						.tgr-foto-daftar img { width: 100px; height: 100px; object-fit: cover; border-radius: 4px; }
						.tgr-foto-hapus { position: absolute; top: -6px; right: -6px; width: 20px; height: 20px;
							border-radius: 50%; background: #b32d2e; color: #fff; line-height: 18px;
							text-align: center; text-decoration: none; font-size: 14px; border: 0; cursor: pointer; }
					</style>
					<script>
					jQuery(function ($) {
						var $daftar = $('#tgr-foto-daftar'), $nilai = $('#tgr_foto'), pemilih;

						function sinkron() {
							$nilai.val($daftar.children('li').map(function () {
								return $(this).data('id');
							}).get().join(','));
						}

						$daftar.sortable({ update: sinkron });

						$('#tgr-foto-pilih').on('click', function () {
							pemilih = pemilih || wp.media({
								title: 'Pilih foto album',
								button: { text: 'Masukkan ke album' },
								library: { type: 'image' },
								multiple: 'add'
							});
							pemilih.off('select').on('select', function () {
								pemilih.state().get('selection').each(function (berkas) {
									var id = berkas.id;
									if ($daftar.find('li[data-id="' + id + '"]').length) { return; }
									var ukuran = berkas.attributes.sizes || {};
									var src = (ukuran.thumbnail || ukuran.medium || ukuran.full || {}).url || '';
									$daftar.append(
										$('<li>').attr('data-id', id).append(
											$('<img>').attr('src', src).attr('alt', ''),
											$('<button type="button" class="tgr-foto-hapus button-link" aria-label="Hapus foto">&times;</button>')
										)
									);
								});
								sinkron();
							});
							pemilih.open();
						});

						$daftar.on('click', '.tgr-foto-hapus', function () {
							$(this).closest('li').remove();
							sinkron();
						});
					});
					</script>
				</td>
			</tr>
		</tbody>
	</table>
	<?php
}

add_action(
	'save_post_tgr_album',
	function ( $post_id ) {
		if ( ! tgr_boleh_simpan( $post_id ) ) {
			return;
		}
		update_post_meta( $post_id, 'tgr_kategori', tgr_kiriman_teks( 'tgr_kategori' ) );
		update_post_meta( $post_id, 'tgr_lokasi', tgr_kiriman_teks( 'tgr_lokasi' ) );
		update_post_meta( $post_id, 'tgr_tanggal', tgr_kiriman_tanggal( 'tgr_tanggal' ) );

		// Daftar ID lampiran: bilangan bulat positif, tanpa kembar, urutan
		// yang dipilih redaksi dipertahankan.
		$mentah = tgr_kiriman_teks( 'tgr_foto' );
		$foto   = array();
		foreach ( explode( ',', $mentah ) as $bagian ) {
			$id = absint( trim( $bagian ) );
			if ( $id > 0 && ! in_array( $id, $foto, true ) ) {
				$foto[] = $id;
			}
		}
		update_post_meta( $post_id, 'tgr_foto', $foto );
	}
);

/* ── Jajak pendapat ────────────────────────────────────────────────── */

function tgr_kotak_poll( $post ) {
	wp_nonce_field( 'tgr_simpan_meta', 'tgr_meta_nonce' );

	$artikel_id = absint( tgr_meta( $post->ID, 'tgr_artikel_id', 0 ) );
	$opsi       = tgr_meta( $post->ID, 'tgr_opsi', array() );
	$opsi       = is_array( $opsi ) ? $opsi : array();
	if ( empty( $opsi ) ) {
		$opsi = array( array(), array() ); // Dua baris kosong sebagai awalan.
	}

	$terbaru = get_posts(
		array(
			'post_type'   => 'post',
			'post_status' => 'publish',
			'numberposts' => 100,
			'fields'      => 'ids',
		)
	);
	// Artikel sumber yang sudah tersimpan mungkin lebih tua dari 100 terbaru;
	// tetap sertakan agar pilihan yang berlaku tidak hilang saat menyunting.
	if ( $artikel_id && ! in_array( $artikel_id, $terbaru, true ) ) {
		array_unshift( $terbaru, $artikel_id );
	}
	?>
	<table class="form-table" role="presentation">
		<tbody>
			<tr>
				<th scope="row"><label for="tgr_pertanyaan">Pertanyaan</label></th>
				<td>
					<input type="text" id="tgr_pertanyaan" name="tgr_pertanyaan" class="large-text"
						value="<?php echo esc_attr( tgr_meta( $post->ID, 'tgr_pertanyaan' ) ); ?>">
					<p class="description">Kosong &rarr; judul pos ini yang dipakai sebagai pertanyaan.</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="tgr_artikel_id">Artikel sumber</label></th>
				<td>
					<select id="tgr_artikel_id" name="tgr_artikel_id" style="max-width:100%;width:32rem">
						<option value="0">&mdash; belum dipilih &mdash;</option>
						<?php foreach ( $terbaru as $id_artikel ) : ?>
							<option value="<?php echo esc_attr( $id_artikel ); ?>"
								<?php selected( $id_artikel, $artikel_id ); ?>>
								<?php echo esc_html( get_the_title( $id_artikel ) ); ?>
							</option>
						<?php endforeach; ?>
					</select>
					<p class="description">Wajib: kartu jajak pendapat menautkan pembaca ke artikel ini. Tanpa artikel sumber, poll tidak ditampilkan.</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="tgr_tutup">Tanggal tutup</label></th>
				<td>
					<input type="date" id="tgr_tutup" name="tgr_tutup"
						value="<?php echo esc_attr( tgr_meta( $post->ID, 'tgr_tutup' ) ); ?>">
					<p class="description">Setelah tanggal ini pembaca hanya bisa melihat hasil. Kosong &rarr; tanpa batas waktu.</p>
				</td>
			</tr>
			<tr>
				<th scope="row">Pilihan jawaban</th>
				<td>
					<table class="widefat striped" id="tgr-opsi-tabel" style="max-width:44rem">
						<thead>
							<tr>
								<th>Jawaban</th>
								<th style="width:9rem">Suara awal</th>
								<th style="width:3rem"></th>
							</tr>
						</thead>
						<?php
						// Hasil nyata ditampilkan di luar tabel isian agar tidak
						// ikut terkirim saat menyimpan — angkanya milik pembaca,
						// bukan sesuatu yang disunting redaksi.
						?>
						<tbody>
							<?php foreach ( $opsi as $baris ) : ?>
								<tr>
									<td>
										<input type="hidden" name="tgr_opsi_id[]"
											value="<?php echo esc_attr( isset( $baris['id'] ) ? $baris['id'] : '' ); ?>">
										<input type="text" name="tgr_opsi_label[]" class="large-text"
											value="<?php echo esc_attr( isset( $baris['label'] ) ? $baris['label'] : '' ); ?>">
									</td>
									<td>
										<input type="number" name="tgr_opsi_base[]" min="0" step="1" class="small-text"
											value="<?php echo esc_attr( isset( $baris['base'] ) ? $baris['base'] : 0 ); ?>">
									</td>
									<td>
										<button type="button" class="button-link tgr-opsi-hapus" aria-label="Hapus pilihan">&times;</button>
									</td>
								</tr>
							<?php endforeach; ?>
						</tbody>
					</table>
					<p>
						<button type="button" class="button" id="tgr-opsi-tambah">Tambah pilihan</button>
						<span class="description">Minimal dua pilihan terisi. &ldquo;Suara awal&rdquo; adalah angka pembuka sebelum pembaca ikut memilih.</span>
					</p>

					<?php
					$hasil = tgr_hasil_suara( $post->ID );
					$total_suara = array_sum( $hasil );
					?>
					<h4 style="margin:1.5rem 0 .5rem">Suara pembaca</h4>
					<?php if ( 0 === $total_suara ) : ?>
						<p class="description">Belum ada pembaca yang memilih.</p>
					<?php else : ?>
						<table class="widefat striped" style="max-width:44rem">
							<thead>
								<tr>
									<th>Pilihan</th>
									<th style="width:8rem">Suara pembaca</th>
									<th style="width:8rem">Total tampil</th>
								</tr>
							</thead>
							<tbody>
								<?php foreach ( $opsi as $baris ) : ?>
									<?php
									if ( empty( $baris['id'] ) ) {
										continue;
									}
									$nyata = isset( $hasil[ $baris['id'] ] ) ? (int) $hasil[ $baris['id'] ] : 0;
									$awal  = isset( $baris['base'] ) ? (int) $baris['base'] : 0;
									?>
									<tr>
										<td><?php echo esc_html( isset( $baris['label'] ) ? $baris['label'] : $baris['id'] ); ?></td>
										<td><?php echo esc_html( $nyata ); ?></td>
										<td><?php echo esc_html( $nyata + $awal ); ?></td>
									</tr>
								<?php endforeach; ?>
							</tbody>
						</table>
						<p class="description">
							Total <?php echo esc_html( $total_suara ); ?> suara pembaca.
							Angka ini dihitung otomatis dari situs dan tidak bisa disunting di sini.
						</p>
					<?php endif; ?>
					<script>
					jQuery(function ($) {
						$('#tgr-opsi-tambah').on('click', function () {
							var $baris = $('#tgr-opsi-tabel tbody tr').last().clone();
							$baris.find('input[type="text"], input[type="hidden"]').val('');
							$baris.find('input[type="number"]').val(0);
							$('#tgr-opsi-tabel tbody').append($baris);
						});
						$('#tgr-opsi-tabel').on('click', '.tgr-opsi-hapus', function () {
							if ($('#tgr-opsi-tabel tbody tr').length > 1) {
								$(this).closest('tr').remove();
							}
						});
					});
					</script>
				</td>
			</tr>
		</tbody>
	</table>
	<?php
}

add_action(
	'save_post_tgr_poll',
	function ( $post_id ) {
		if ( ! tgr_boleh_simpan( $post_id ) ) {
			return;
		}
		update_post_meta( $post_id, 'tgr_pertanyaan', tgr_kiriman_teks( 'tgr_pertanyaan' ) );
		update_post_meta( $post_id, 'tgr_artikel_id', absint( tgr_kiriman_teks( 'tgr_artikel_id' ) ) );
		update_post_meta( $post_id, 'tgr_tutup', tgr_kiriman_tanggal( 'tgr_tutup' ) );

		$label_kiriman = isset( $_POST['tgr_opsi_label'] ) ? (array) wp_unslash( $_POST['tgr_opsi_label'] ) : array();
		$id_kiriman    = isset( $_POST['tgr_opsi_id'] ) ? (array) wp_unslash( $_POST['tgr_opsi_id'] ) : array();
		$base_kiriman  = isset( $_POST['tgr_opsi_base'] ) ? (array) wp_unslash( $_POST['tgr_opsi_base'] ) : array();

		$opsi   = array();
		$dipakai = array();
		foreach ( $label_kiriman as $i => $label_mentah ) {
			$label = sanitize_text_field( $label_mentah );
			if ( '' === $label ) {
				continue;
			}
			// Pertahankan id lama bila baris ini sudah pernah disimpan: suara
			// pembaca tersimpan per id, jadi menyusun ulang label tidak boleh
			// menghanguskan pilihan yang sudah masuk.
			$id = isset( $id_kiriman[ $i ] ) ? sanitize_key( $id_kiriman[ $i ] ) : '';
			if ( '' === $id ) {
				$id = sanitize_title( $label );
			}
			if ( '' === $id ) {
				$id = 'opsi-' . ( $i + 1 );
			}
			while ( in_array( $id, $dipakai, true ) ) {
				$id .= '-' . ( $i + 1 );
			}
			$dipakai[] = $id;

			$opsi[] = array(
				'id'    => $id,
				'label' => $label,
				'base'  => isset( $base_kiriman[ $i ] ) ? max( 0, absint( $base_kiriman[ $i ] ) ) : 0,
			);
		}
		update_post_meta( $post_id, 'tgr_opsi', $opsi );
	}
);

/* ── Sorotan judul (tulisan biasa) ─────────────────────────────────── */

function tgr_kotak_sorotan( $post ) {
	wp_nonce_field( 'tgr_simpan_meta', 'tgr_meta_nonce' );
	?>
	<p>
		<input type="text" id="tgr_sorotan" name="tgr_sorotan" class="widefat"
			value="<?php echo esc_attr( tgr_meta( $post->ID, 'tgr_sorotan' ) ); ?>"
			placeholder="mis. Poros Maritim">
	</p>
	<p class="description">
		Satu frasa <strong>dari judul</strong> yang diberi coretan penanda di
		situs baru. Kosongkan bila judulnya tidak perlu penanda.
	</p>
	<p class="description">
		Frasa yang tidak ada di judul dikosongkan saat disimpan &mdash; jadi
		kotak yang kembali kosong berarti frasanya belum cocok, bukan gagal
		tersimpan.
	</p>
	<?php if ( '' !== trim( (string) $post->post_title ) ) : ?>
		<p class="description">
			Judul saat ini: <em><?php echo esc_html( $post->post_title ); ?></em>
		</p>
	<?php endif; ?>
	<?php
}

/* ── Identitas buku (rubrik Bedah Buku) ────────────────────────────── */

/**
 * Kotak ini muncul di semua tulisan, bukan hanya yang berkategori Bedah
 * Buku: kategori baru dipilih saat menulis, jadi menyembunyikannya
 * berdasarkan kategori berarti kotaknya justru absen persis ketika
 * dibutuhkan. Dibiarkan kosong pada tulisan lain, tidak berpengaruh apa pun.
 */
function tgr_kotak_buku( $post ) {
	wp_nonce_field( 'tgr_simpan_meta', 'tgr_meta_nonce' );
	$sampul = (int) tgr_meta( $post->ID, 'tgr_buku_sampul', 0 );
	$baris  = array(
		'tgr_buku_judul'           => array( 'Judul buku', 'Kosong &rarr; memakai judul tulisan ini.' ),
		'tgr_buku_penulis'         => array( 'Penulis (ringkas)', 'Untuk baris kartu, mis. &ldquo;Hendrajit dkk.&rdquo;' ),
		'tgr_buku_penulis_lengkap' => array( 'Penulis (lengkap)', 'Opsional; daftar kontributor di halaman ulasan.' ),
		'tgr_buku_penerbit'        => array( 'Penerbit', '' ),
		'tgr_buku_tahun'           => array( 'Tahun terbit', '' ),
		'tgr_buku_isbn'            => array( 'ISBN', 'Opsional; disembunyikan bila kosong.' ),
		'tgr_buku_podcast'         => array( 'Slug podcast terkait', 'Opsional; menyematkan videonya di bawah ulasan.' ),
	);
	?>
	<table class="form-table" role="presentation">
		<tbody>
			<?php foreach ( $baris as $kunci => $isi ) : ?>
				<tr>
					<th scope="row"><label for="<?php echo esc_attr( $kunci ); ?>"><?php echo esc_html( $isi[0] ); ?></label></th>
					<td>
						<input type="text" id="<?php echo esc_attr( $kunci ); ?>" name="<?php echo esc_attr( $kunci ); ?>"
							class="regular-text" value="<?php echo esc_attr( tgr_meta( $post->ID, $kunci ) ); ?>">
						<?php if ( $isi[1] ) : ?>
							<p class="description"><?php echo wp_kses_post( $isi[1] ); ?></p>
						<?php endif; ?>
					</td>
				</tr>
			<?php endforeach; ?>
			<tr>
				<th scope="row">Buku pilihan sidebar</th>
				<td>
					<label>
						<input type="checkbox" name="tgr_buku_unggulan" value="1"
							<?php checked( '1', tgr_meta( $post->ID, 'tgr_buku_unggulan' ) ); ?>>
						Tampilkan di kartu &ldquo;Buku pilihan&rdquo; sidebar situs baru
					</label>
					<p class="description">Hanya satu yang bisa aktif &mdash; mencentang di sini melepas tanda dari buku lain.</p>
				</td>
			</tr>
			<tr>
				<th scope="row">Sampul buku</th>
				<td>
					<input type="hidden" id="tgr_buku_sampul" name="tgr_buku_sampul" value="<?php echo esc_attr( $sampul ); ?>">
					<div id="tgr-sampul-pratinjau" style="margin-bottom:8px;">
						<?php echo $sampul ? wp_get_attachment_image( $sampul, 'medium', false, array( 'style' => 'max-width:140px;height:auto;border-radius:4px;' ) ) : ''; ?>
					</div>
					<button type="button" class="button" id="tgr-sampul-pilih">Pilih sampul</button>
					<button type="button" class="button-link" id="tgr-sampul-hapus" style="margin-left:8px;">Hapus</button>
					<p class="description">
						Kosong &rarr; memakai Gambar Unggulan tulisan ini. Sampul buku
						sebaiknya potret (3:4), bukan gambar artikel biasa.
					</p>
					<script>
					jQuery(function ($) {
						var pemilih;
						$('#tgr-sampul-pilih').on('click', function () {
							pemilih = pemilih || wp.media({
								title: 'Pilih sampul buku',
								button: { text: 'Pakai sampul ini' },
								library: { type: 'image' },
								multiple: false
							});
							pemilih.off('select').on('select', function () {
								var berkas = pemilih.state().get('selection').first().toJSON();
								$('#tgr_buku_sampul').val(berkas.id);
								$('#tgr-sampul-pratinjau').html(
									$('<img>').attr('src', (berkas.sizes && berkas.sizes.medium ? berkas.sizes.medium.url : berkas.url))
										.css({ maxWidth: '140px', height: 'auto', borderRadius: '4px' })
								);
							});
							pemilih.open();
						});
						$('#tgr-sampul-hapus').on('click', function () {
							$('#tgr_buku_sampul').val(0);
							$('#tgr-sampul-pratinjau').empty();
						});
					});
					</script>
				</td>
			</tr>
		</tbody>
	</table>
	<?php
}

add_action(
	'save_post_post',
	function ( $post_id ) {
		if ( ! tgr_boleh_simpan( $post_id ) ) {
			return;
		}

		foreach ( array(
			'tgr_buku_judul',
			'tgr_buku_penulis',
			'tgr_buku_penulis_lengkap',
			'tgr_buku_penerbit',
			'tgr_buku_tahun',
			'tgr_buku_isbn',
		) as $kunci ) {
			update_post_meta( $post_id, $kunci, tgr_kiriman_teks( $kunci ) );
		}
		// Slug podcast diinterpolasi ke URL /podcast/{slug} di frontend.
		update_post_meta( $post_id, 'tgr_buku_podcast', sanitize_title( tgr_kiriman_teks( 'tgr_buku_podcast' ) ) );
		update_post_meta( $post_id, 'tgr_buku_sampul', absint( tgr_kiriman_teks( 'tgr_buku_sampul' ) ) );

		// Buku pilihan sidebar: tunggal-aktif, pola yang sama dengan
		// penampilan utama podcast.
		$buku_unggulan = isset( $_POST['tgr_buku_unggulan'] ) ? '1' : '';
		update_post_meta( $post_id, 'tgr_buku_unggulan', $buku_unggulan );
		if ( '1' === $buku_unggulan ) {
			$lainnya = get_posts(
				array(
					'post_type'   => 'post',
					'post_status' => 'any',
					'numberposts' => -1,
					'exclude'     => array( $post_id ),
					'meta_key'    => 'tgr_buku_unggulan',
					'meta_value'  => '1',
					'fields'      => 'ids',
				)
			);
			foreach ( $lainnya as $id_lain ) {
				update_post_meta( $id_lain, 'tgr_buku_unggulan', '' );
			}
		}

		$frasa = tgr_kiriman_teks( 'tgr_sorotan' );
		$judul = get_post_field( 'post_title', $post_id );

		// Frontend mencocokkan frasa ini persis di dalam judul; kalau meleset
		// satu huruf besar saja, judul dirender polos tanpa keluhan apa pun.
		// Beda kapitalisasi diperbaiki di sini — itu salah ketik yang paling
		// sering terjadi, dan menolaknya cuma memindahkan tebak-tebakan ke
		// redaksi.
		if ( '' !== $frasa && false === strpos( $judul, $frasa ) ) {
			$posisi = stripos( $judul, $frasa );
			$frasa  = false === $posisi ? '' : substr( $judul, $posisi, strlen( $frasa ) );
		}
		update_post_meta( $post_id, 'tgr_sorotan', $frasa );
	}
);

/* ── Kolom daftar admin ────────────────────────────────────────────── */

/**
 * Kolom "Sorotan" di daftar Tulisan.
 *
 * Field yang tidak terlihat tidak akan pernah diisi. Tanpa kolom ini,
 * satu-satunya cara mengetahui sebuah tulisan belum punya sorotan adalah
 * membuka layar suntingnya satu per satu — dan itu berarti tidak ada yang
 * akan melakukannya.
 */
add_filter(
	'manage_post_posts_columns',
	function ( $kolom ) {
		return array_slice( $kolom, 0, 2, true ) +
			array( 'tgr_sorotan' => 'Sorotan' ) +
			array_slice( $kolom, 2, null, true );
	}
);

add_action(
	'manage_post_posts_custom_column',
	function ( $kolom, $post_id ) {
		if ( 'tgr_sorotan' !== $kolom ) {
			return;
		}
		$frasa = tgr_meta( $post_id, 'tgr_sorotan' );
		echo $frasa
			? esc_html( $frasa )
			: '<span style="color:#a7aaad">&mdash;</span>';
	},
	10,
	2
);

add_filter(
	'manage_tgr_podcast_posts_columns',
	function ( $kolom ) {
		return array_slice( $kolom, 0, 2, true ) + array(
			'tgr_kanal'    => 'Kanal',
			'tgr_format'   => 'Format',
			'tgr_tayang'   => 'Tayang',
			'tgr_unggulan' => 'Utama',
		) + array_slice( $kolom, 2, null, true );
	}
);

add_action(
	'manage_tgr_podcast_posts_custom_column',
	function ( $kolom, $post_id ) {
		if ( 'tgr_unggulan' === $kolom ) {
			echo '1' === tgr_meta( $post_id, 'tgr_unggulan' ) ? '&#9733;' : '&mdash;';
			return;
		}
		if ( in_array( $kolom, array( 'tgr_kanal', 'tgr_format', 'tgr_tayang' ), true ) ) {
			echo esc_html( tgr_meta( $post_id, $kolom, '—' ) );
		}
	},
	10,
	2
);

add_filter(
	'manage_tgr_album_posts_columns',
	function ( $kolom ) {
		return array_slice( $kolom, 0, 2, true ) + array(
			'tgr_kategori' => 'Jenis',
			'tgr_lokasi'   => 'Lokasi',
			'tgr_tanggal'  => 'Tanggal',
			'tgr_foto'     => 'Foto',
		) + array_slice( $kolom, 2, null, true );
	}
);

add_action(
	'manage_tgr_album_posts_custom_column',
	function ( $kolom, $post_id ) {
		if ( 'tgr_foto' === $kolom ) {
			$foto = tgr_meta( $post_id, 'tgr_foto', array() );
			echo esc_html( is_array( $foto ) ? count( $foto ) : 0 );
			return;
		}
		if ( in_array( $kolom, array( 'tgr_kategori', 'tgr_lokasi', 'tgr_tanggal' ), true ) ) {
			echo esc_html( tgr_meta( $post_id, $kolom, '—' ) );
		}
	},
	10,
	2
);

add_filter(
	'manage_tgr_poll_posts_columns',
	function ( $kolom ) {
		return array_slice( $kolom, 0, 2, true ) + array(
			'tgr_pertanyaan' => 'Pertanyaan',
			'tgr_opsi'       => 'Pilihan',
			'tgr_artikel_id' => 'Artikel sumber',
			'tgr_tutup'      => 'Tutup',
		) + array_slice( $kolom, 2, null, true );
	}
);

add_action(
	'manage_tgr_poll_posts_custom_column',
	function ( $kolom, $post_id ) {
		if ( 'tgr_opsi' === $kolom ) {
			$opsi = tgr_meta( $post_id, 'tgr_opsi', array() );
			echo esc_html( is_array( $opsi ) ? count( $opsi ) : 0 );
			return;
		}
		if ( 'tgr_artikel_id' === $kolom ) {
			$id = absint( tgr_meta( $post_id, 'tgr_artikel_id', 0 ) );
			echo $id ? esc_html( get_the_title( $id ) ) : '&mdash;';
			return;
		}
		if ( in_array( $kolom, array( 'tgr_pertanyaan', 'tgr_tutup' ), true ) ) {
			echo esc_html( tgr_meta( $post_id, $kolom, '—' ) );
		}
	},
	10,
	2
);

/* ═══════════════════════════════════════════════════════════════════════
 * Suara jajak pendapat.
 *
 * Tiap pilihan punya penghitungnya sendiri (`tgr_suara_<id>`), bukan satu
 * larik berisi semua: menaikkan larik berarti baca-ubah-tulis, dan dua
 * pembaca yang memilih pada saat bersamaan akan saling menimpa. Dengan
 * satu baris meta per pilihan, kenaikannya bisa dilakukan sebagai satu
 * pernyataan UPDATE yang atomik di sisi basis data.
 *
 * "Suara awal" (tgr_opsi[].base) tetap milik redaksi dan tidak tersentuh —
 * frontend menjumlahkan keduanya.
 * ═══════════════════════════════════════════════════════════════════════ */

function tgr_kunci_suara( $opsi_id ) {
	return 'tgr_suara_' . sanitize_key( $opsi_id );
}

/** Rekap suara nyata sebuah jajak pendapat: [id pilihan => jumlah]. */
function tgr_hasil_suara( $post_id ) {
	$opsi  = get_post_meta( $post_id, 'tgr_opsi', true );
	$hasil = array();
	if ( ! is_array( $opsi ) ) {
		return $hasil;
	}
	foreach ( $opsi as $satu ) {
		if ( empty( $satu['id'] ) ) {
			continue;
		}
		$hasil[ $satu['id'] ] = (int) get_post_meta( $post_id, tgr_kunci_suara( $satu['id'] ), true );
	}
	return $hasil;
}

/** Rekap dibuka ke REST sebagai field baca-saja. */
add_action(
	'rest_api_init',
	function () {
		register_rest_field(
			'tgr_poll',
			'tgr_hasil',
			array(
				'get_callback' => function ( $pos ) {
					return tgr_hasil_suara( $pos['id'] );
				},
				'schema'       => array(
					'description' => 'Jumlah suara pembaca per pilihan.',
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
			)
		);

		register_rest_route(
			'tgr/v1',
			'/vote',
			array(
				'methods'             => 'POST',
				'permission_callback' => function ( $request ) {
					return tgr_secret_cocok( $request->get_header( 'x-tgr-secret' ) );
				},
				'callback'            => 'tgr_terima_suara',
				'args'                => array(
					'poll' => array( 'required' => true ),
					'opsi' => array( 'required' => true ),
				),
			)
		);
	}
);

function tgr_terima_suara( $request ) {
	global $wpdb;

	$post_id = absint( $request->get_param( 'poll' ) );
	$opsi_id = sanitize_key( (string) $request->get_param( 'opsi' ) );
	$pos     = $post_id ? get_post( $post_id ) : null;

	if ( ! $pos || 'tgr_poll' !== $pos->post_type || 'publish' !== $pos->post_status ) {
		return new WP_Error( 'tgr_poll_tidak_ada', 'Jajak pendapat tidak ditemukan.', array( 'status' => 404 ) );
	}

	// Pilihan wajib salah satu yang benar-benar terdaftar — bukan sembarang
	// teks, agar penghitung liar tidak bisa dibuat dari luar.
	$opsi = get_post_meta( $post_id, 'tgr_opsi', true );
	$sah  = false;
	if ( is_array( $opsi ) ) {
		foreach ( $opsi as $satu ) {
			if ( ! empty( $satu['id'] ) && $satu['id'] === $opsi_id ) {
				$sah = true;
				break;
			}
		}
	}
	if ( ! $sah ) {
		return new WP_Error( 'tgr_opsi_tidak_sah', 'Pilihan tidak dikenal.', array( 'status' => 400 ) );
	}

	$tutup = get_post_meta( $post_id, 'tgr_tutup', true );
	if ( $tutup && strtotime( $tutup . ' 23:59:59' ) < time() ) {
		return new WP_Error( 'tgr_poll_tutup', 'Jajak pendapat sudah ditutup.', array( 'status' => 409 ) );
	}

	// Satu suara per alamat IP per jajak pendapat. Bukan pengaman mutlak
	// (IP bisa berbagi atau berganti), melainkan penahan wajar — sama
	// seperti yang dilakukan hampir semua jajak pendapat tanpa login.
	$ip    = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	$sidik = 'tgr_vote_' . md5( $post_id . '|' . $ip . wp_salt() );
	if ( get_transient( $sidik ) ) {
		return array( 'tercatat' => false, 'hasil' => tgr_hasil_suara( $post_id ) );
	}
	set_transient( $sidik, 1, DAY_IN_SECONDS );

	$kunci = tgr_kunci_suara( $opsi_id );
	add_post_meta( $post_id, $kunci, 0, true );
	// Satu pernyataan UPDATE: tahan terhadap dua pemilih bersamaan, tidak
	// seperti pola get_post_meta lalu update_post_meta.
	$wpdb->query(
		$wpdb->prepare(
			"UPDATE {$wpdb->postmeta} SET meta_value = meta_value + 1 WHERE post_id = %d AND meta_key = %s",
			$post_id,
			$kunci
		)
	);
	wp_cache_delete( $post_id, 'post_meta' );

	return array( 'tercatat' => true, 'hasil' => tgr_hasil_suara( $post_id ) );
}

/** Kolom "Suara" di layar daftar jajak pendapat. */
add_filter(
	'manage_tgr_poll_posts_columns',
	function ( $kolom ) {
		$kolom['tgr_suara'] = 'Suara';
		return $kolom;
	},
	20
);

add_action(
	'manage_tgr_poll_posts_custom_column',
	function ( $kolom, $post_id ) {
		if ( 'tgr_suara' !== $kolom ) {
			return;
		}
		$hasil = tgr_hasil_suara( $post_id );
		echo esc_html( array_sum( $hasil ) );
	},
	20,
	2
);

/* ═══════════════════════════════════════════════════════════════════════
 * Pelanggan buletin.
 *
 * Disimpan sebagai tipe konten tersendiri supaya redaksi bisa melihat,
 * mencari, dan mengekspornya kapan saja dari wp-admin tanpa plugin lain.
 * Alamat email disimpan sebagai judul pos agar langsung tampil di daftar
 * dan ikut mesin pencarian bawaan.
 *
 * TIDAK diekspos ke REST (show_in_rest false): daftar alamat email adalah
 * data pribadi, dan endpoint wp/v2 situs ini terbuka untuk dibaca siapa pun.
 * ═══════════════════════════════════════════════════════════════════════ */

add_action(
	'init',
	function () {
		register_post_type(
			'tgr_subscriber',
			array(
				'labels'        => array(
					'name'          => 'Pelanggan Buletin',
					'singular_name' => 'Pelanggan',
					'all_items'     => 'Semua Pelanggan',
					'search_items'  => 'Cari Pelanggan',
				),
				'public'        => false,
				'show_ui'       => true,
				'show_in_menu'  => true,
				'show_in_rest'  => false,
				'menu_icon'     => 'dashicons-email-alt',
				'menu_position' => 24,
				'supports'      => array( 'title' ),
				'capabilities'  => array( 'create_posts' => 'do_not_allow' ),
				'map_meta_cap'  => true,
			)
		);

		foreach ( array( 'tgr_sumber', 'tgr_ip_hash' ) as $key ) {
			register_post_meta(
				'tgr_subscriber',
				$key,
				array(
					'type'              => 'string',
					'single'            => true,
					'default'           => '',
					'show_in_rest'      => false,
					'sanitize_callback' => 'sanitize_text_field',
					'auth_callback'     => function () {
						return current_user_can( 'edit_others_posts' );
					},
				)
			);
		}
	}
);

add_filter(
	'manage_tgr_subscriber_posts_columns',
	function ( $kolom ) {
		return array(
			'cb'         => isset( $kolom['cb'] ) ? $kolom['cb'] : '',
			'title'      => 'Email',
			'tgr_sumber' => 'Sumber',
			'date'       => 'Terdaftar',
		);
	}
);

add_action(
	'manage_tgr_subscriber_posts_custom_column',
	function ( $kolom, $post_id ) {
		if ( 'tgr_sumber' === $kolom ) {
			echo esc_html( tgr_meta( $post_id, 'tgr_sumber', '—' ) );
		}
	},
	10,
	2
);

/** Tombol ekspor di atas daftar pelanggan. */
add_action(
	'restrict_manage_posts',
	function ( $post_type ) {
		if ( 'tgr_subscriber' !== $post_type || ! current_user_can( 'edit_others_posts' ) ) {
			return;
		}
		$url = wp_nonce_url(
			admin_url( 'admin-post.php?action=tgr_ekspor_pelanggan' ),
			'tgr_ekspor_pelanggan'
		);
		printf(
			'<a href="%s" class="button" style="margin-left:8px">Unduh CSV</a>',
			esc_url( $url )
		);
	}
);

/**
 * Ekspor seluruh pelanggan sebagai CSV. Sengaja tanpa paginasi: daftarnya
 * memang dimaksudkan untuk diunduh utuh, dan hanya berisi tiga kolom.
 */
add_action(
	'admin_post_tgr_ekspor_pelanggan',
	function () {
		if ( ! current_user_can( 'edit_others_posts' ) ) {
			wp_die( 'Tidak punya izin mengekspor daftar pelanggan.', '', array( 'response' => 403 ) );
		}
		check_admin_referer( 'tgr_ekspor_pelanggan' );

		$pelanggan = get_posts(
			array(
				'post_type'   => 'tgr_subscriber',
				'post_status' => 'any',
				'numberposts' => -1,
				'orderby'     => 'date',
				'order'       => 'ASC',
			)
		);

		nocache_headers();
		header( 'Content-Type: text/csv; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename=pelanggan-buletin-' . gmdate( 'Y-m-d' ) . '.csv' );

		$keluaran = fopen( 'php://output', 'w' );
		fputcsv( $keluaran, array( 'email', 'terdaftar', 'sumber' ) );
		foreach ( $pelanggan as $satu ) {
			fputcsv(
				$keluaran,
				array(
					$satu->post_title,
					$satu->post_date,
					get_post_meta( $satu->ID, 'tgr_sumber', true ),
				)
			);
		}
		fclose( $keluaran );
		exit;
	}
);

/** Secret dibandingkan timing-safe; daftar dipisah koma agar bisa dirotasi. */
function tgr_secret_cocok( $dikirim ) {
	if ( ! defined( 'TGR_REVALIDATE_SECRET' ) || ! TGR_REVALIDATE_SECRET || ! $dikirim ) {
		return false;
	}
	foreach ( explode( ',', TGR_REVALIDATE_SECRET ) as $secret ) {
		$secret = trim( $secret );
		if ( '' !== $secret && hash_equals( $secret, $dikirim ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Penerima pendaftaran dari frontend. Bukan endpoint publik: frontend
 * meneruskannya dari server dengan secret yang sama seperti webhook
 * revalidasi, sehingga alamat ini tidak bisa dibanjiri langsung dari
 * peramban siapa pun.
 */
add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'tgr/v1',
			'/subscribe',
			array(
				'methods'             => 'POST',
				'permission_callback' => function ( $request ) {
					return tgr_secret_cocok( $request->get_header( 'x-tgr-secret' ) );
				},
				'callback'            => 'tgr_terima_pelanggan',
				'args'                => array(
					'email'  => array( 'required' => true ),
					'sumber' => array( 'required' => false ),
				),
			)
		);
	}
);

function tgr_terima_pelanggan( $request ) {
	$email = sanitize_email( (string) $request->get_param( 'email' ) );
	if ( ! $email || ! is_email( $email ) ) {
		return new WP_Error( 'tgr_email_tidak_sah', 'Alamat email tidak sah.', array( 'status' => 400 ) );
	}

	// Rem sederhana per alamat IP; frontend juga membatasi, ini lapis kedua
	// bila secret bocor.
	$ip    = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	$sidik = 'tgr_sub_' . md5( $ip . wp_salt() );
	$hitung = (int) get_transient( $sidik );
	if ( $hitung >= 10 ) {
		return new WP_Error( 'tgr_terlalu_sering', 'Terlalu banyak percobaan, coba lagi nanti.', array( 'status' => 429 ) );
	}
	set_transient( $sidik, $hitung + 1, HOUR_IN_SECONDS );

	$sudah_ada = get_posts(
		array(
			'post_type'              => 'tgr_subscriber',
			'post_status'            => 'any',
			'title'                  => $email,
			'numberposts'            => 1,
			'fields'                 => 'ids',
			'no_found_rows'          => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
		)
	);
	if ( ! empty( $sudah_ada ) ) {
		// Sengaja 200: pendaftar tidak perlu tahu alamat mana yang sudah
		// terdaftar, dan pengalaman di sisi pembaca tetap sama.
		return array( 'terdaftar' => true, 'baru' => false );
	}

	$id = wp_insert_post(
		array(
			'post_type'   => 'tgr_subscriber',
			'post_status' => 'publish',
			'post_title'  => $email,
		),
		true
	);
	if ( is_wp_error( $id ) ) {
		return new WP_Error( 'tgr_gagal_simpan', 'Gagal menyimpan pendaftaran.', array( 'status' => 500 ) );
	}

	update_post_meta( $id, 'tgr_sumber', sanitize_text_field( (string) $request->get_param( 'sumber' ) ) );
	// IP disimpan sebagai sidik, bukan apa adanya: cukup untuk menelusuri
	// penyalahgunaan, tanpa menyimpan data pribadi yang tidak diperlukan.
	update_post_meta( $id, 'tgr_ip_hash', $ip ? wp_hash( $ip ) : '' );

	return array( 'terdaftar' => true, 'baru' => true );
}

/* ═══════════════════════════════════════════════════════════════════════
 * Pengurus & Redaksi (tgr_orang).
 *
 * Satu tipe konten untuk dua halaman: Pengurus GFI (kelompok "pengurus")
 * dan masthead Susunan Redaksi (kelompok "redaksi"). Nama = judul pos,
 * foto = Gambar Unggulan, urutan tampil = kotak Atribut bawaan
 * (menu_order) sehingga bisa diubah cepat lewat Quick Edit.
 *
 * Jabatan dan bio berpasangan dua bahasa (situs punya pohon /en); kolom EN
 * yang kosong jatuh kembali ke bahasa Indonesia di frontend.
 * ═══════════════════════════════════════════════════════════════════════ */

add_action(
	'init',
	function () {
		register_post_type(
			'tgr_orang',
			array(
				'labels'        => array(
					'name'          => 'Pengurus & Redaksi',
					'singular_name' => 'Profil',
					'add_new_item'  => 'Tambah Profil',
					'edit_item'     => 'Sunting Profil',
					'all_items'     => 'Semua Profil',
				),
				'public'        => false,
				'show_ui'       => true,
				'menu_icon'     => 'dashicons-groups',
				'menu_position' => 25,
				'supports'      => array( 'title', 'thumbnail', 'page-attributes' ),
				'show_in_rest'  => true,
				'rest_base'     => 'orang',
			)
		);

		register_post_meta(
			'tgr_orang',
			'tgr_kelompok',
			array(
				'type'              => 'string',
				'single'            => true,
				'default'           => 'pengurus',
				'show_in_rest'      => true,
				'sanitize_callback' => function ( $nilai ) {
					return in_array( $nilai, array( 'pengurus', 'redaksi' ), true ) ? $nilai : 'pengurus';
				},
				'auth_callback'     => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);

		foreach ( array( 'tgr_jabatan', 'tgr_jabatan_en' ) as $key ) {
			register_post_meta(
				'tgr_orang',
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

		foreach ( array( 'tgr_bio', 'tgr_bio_en' ) as $key ) {
			register_post_meta(
				'tgr_orang',
				$key,
				array(
					'type'              => 'string',
					'single'            => true,
					'default'           => '',
					'show_in_rest'      => true,
					'sanitize_callback' => 'sanitize_textarea_field',
					'auth_callback'     => function () {
						return current_user_can( 'edit_posts' );
					},
				)
			);
		}
	}
);

add_action(
	'add_meta_boxes_tgr_orang',
	function () {
		add_meta_box( 'tgr_isi_orang', 'Detail Profil', 'tgr_kotak_orang', 'tgr_orang', 'normal', 'high' );
	}
);

function tgr_kotak_orang( $post ) {
	wp_nonce_field( 'tgr_simpan_meta', 'tgr_meta_nonce' );
	$kelompok = tgr_meta( $post->ID, 'tgr_kelompok', 'pengurus' );
	?>
	<table class="form-table" role="presentation">
		<tbody>
			<tr>
				<th scope="row">Kelompok</th>
				<td>
					<label style="margin-right:16px">
						<input type="radio" name="tgr_kelompok" value="pengurus"
							<?php checked( 'pengurus', $kelompok ); ?>>
						Pengurus GFI
					</label>
					<label>
						<input type="radio" name="tgr_kelompok" value="redaksi"
							<?php checked( 'redaksi', $kelompok ); ?>>
						Susunan Redaksi
					</label>
					<p class="description">
						Pengurus tampil di halaman Pengurus GFI (butuh foto, jabatan, dan bio);
						Susunan Redaksi tampil di halaman Redaksi (cukup jabatan/peran).
					</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="tgr_jabatan">Jabatan</label></th>
				<td>
					<input type="text" id="tgr_jabatan" name="tgr_jabatan" class="large-text"
						value="<?php echo esc_attr( tgr_meta( $post->ID, 'tgr_jabatan' ) ); ?>">
					<p class="description">Mis. &ldquo;Direktur Eksekutif&rdquo; atau peran redaksi &ldquo;Pemimpin Redaksi&rdquo;.</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="tgr_jabatan_en">Jabatan (EN)</label></th>
				<td>
					<input type="text" id="tgr_jabatan_en" name="tgr_jabatan_en" class="large-text"
						value="<?php echo esc_attr( tgr_meta( $post->ID, 'tgr_jabatan_en' ) ); ?>">
					<p class="description">Untuk halaman /en. Kosong &rarr; memakai versi Indonesia.</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="tgr_bio">Bio</label></th>
				<td>
					<textarea id="tgr_bio" name="tgr_bio" class="large-text" rows="5"><?php
						echo esc_textarea( tgr_meta( $post->ID, 'tgr_bio' ) );
					?></textarea>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="tgr_bio_en">Bio (EN)</label></th>
				<td>
					<textarea id="tgr_bio_en" name="tgr_bio_en" class="large-text" rows="5"><?php
						echo esc_textarea( tgr_meta( $post->ID, 'tgr_bio_en' ) );
					?></textarea>
					<p class="description">Kosong &rarr; memakai versi Indonesia.</p>
				</td>
			</tr>
		</tbody>
	</table>
	<p class="description">
		Foto profil diatur lewat kotak <strong>Gambar Unggulan</strong> di kanan;
		urutan tampil lewat kotak <strong>Atribut &rarr; Urutan</strong> (angka kecil
		tampil lebih dulu). Pengurus tanpa foto tidak ditampilkan di situs.
	</p>
	<?php
}

add_action(
	'save_post_tgr_orang',
	function ( $post_id ) {
		if ( ! tgr_boleh_simpan( $post_id ) ) {
			return;
		}
		$kelompok = tgr_kiriman_teks( 'tgr_kelompok' );
		update_post_meta(
			$post_id,
			'tgr_kelompok',
			in_array( $kelompok, array( 'pengurus', 'redaksi' ), true ) ? $kelompok : 'pengurus'
		);
		update_post_meta( $post_id, 'tgr_jabatan', tgr_kiriman_teks( 'tgr_jabatan' ) );
		update_post_meta( $post_id, 'tgr_jabatan_en', tgr_kiriman_teks( 'tgr_jabatan_en' ) );
		update_post_meta( $post_id, 'tgr_bio', tgr_kiriman_teks_panjang( 'tgr_bio' ) );
		update_post_meta( $post_id, 'tgr_bio_en', tgr_kiriman_teks_panjang( 'tgr_bio_en' ) );
	}
);

add_filter(
	'manage_tgr_orang_posts_columns',
	function ( $kolom ) {
		return array_slice( $kolom, 0, 2, true ) + array(
			'tgr_kelompok' => 'Kelompok',
			'tgr_jabatan'  => 'Jabatan',
			'menu_order'   => 'Urutan',
		) + array_slice( $kolom, 2, null, true );
	}
);

add_action(
	'manage_tgr_orang_posts_custom_column',
	function ( $kolom, $post_id ) {
		if ( 'menu_order' === $kolom ) {
			echo esc_html( (string) get_post_field( 'menu_order', $post_id ) );
			return;
		}
		if ( 'tgr_kelompok' === $kolom ) {
			echo 'redaksi' === tgr_meta( $post_id, 'tgr_kelompok' ) ? 'Redaksi' : 'Pengurus';
			return;
		}
		if ( 'tgr_jabatan' === $kolom ) {
			echo esc_html( tgr_meta( $post_id, 'tgr_jabatan', '—' ) );
		}
	},
	10,
	2
);

/* ═══════════════════════════════════════════════════════════════════════
 * Pesan masuk (formulir kontak situs).
 *
 * Pola yang sama dengan Pelanggan Buletin: tersimpan sebagai tipe konten
 * agar bisa dibaca, dicari, dan diekspor dari wp-admin — plus satu email
 * pemberitahuan ke redaksi supaya pesan tidak menunggu dibuka dulu.
 *
 * TIDAK diekspos ke REST (show_in_rest false): nama, email, dan isi pesan
 * adalah data pribadi, dan endpoint wp/v2 situs ini terbuka dibaca publik.
 * ═══════════════════════════════════════════════════════════════════════ */

/** Pilihan subjek yang sah — cermin opsi <select> di formulir situs. */
function tgr_daftar_subjek() {
	return array( 'Redaksi & Hak Jawab', 'Kerja Sama & Kemitraan', 'Pertanyaan Umum', 'Lainnya' );
}

add_action(
	'init',
	function () {
		register_post_type(
			'tgr_pesan',
			array(
				'labels'        => array(
					'name'          => 'Pesan Masuk',
					'singular_name' => 'Pesan',
					'all_items'     => 'Semua Pesan',
					'search_items'  => 'Cari Pesan',
				),
				'public'        => false,
				'show_ui'       => true,
				'show_in_menu'  => true,
				'show_in_rest'  => false,
				'menu_icon'     => 'dashicons-email',
				'menu_position' => 26,
				'supports'      => array( 'title' ),
				'capabilities'  => array( 'create_posts' => 'do_not_allow' ),
				'map_meta_cap'  => true,
			)
		);

		foreach ( array( 'tgr_email', 'tgr_telepon', 'tgr_subjek', 'tgr_sumber', 'tgr_ip_hash', 'tgr_email_terkirim' ) as $key ) {
			register_post_meta(
				'tgr_pesan',
				$key,
				array(
					'type'              => 'string',
					'single'            => true,
					'default'           => '',
					'show_in_rest'      => false,
					'sanitize_callback' => 'sanitize_text_field',
					'auth_callback'     => function () {
						return current_user_can( 'edit_others_posts' );
					},
				)
			);
		}
	}
);

/** Detail pesan, baca-saja: isinya milik pengirim, bukan untuk disunting. */
add_action(
	'add_meta_boxes_tgr_pesan',
	function () {
		add_meta_box( 'tgr_isi_pesan', 'Isi Pesan', 'tgr_kotak_pesan', 'tgr_pesan', 'normal', 'high' );
	}
);

function tgr_kotak_pesan( $post ) {
	$email = tgr_meta( $post->ID, 'tgr_email' );
	$baris = array(
		'Telepon' => tgr_meta( $post->ID, 'tgr_telepon', '—' ),
		'Subjek'  => tgr_meta( $post->ID, 'tgr_subjek', '—' ),
		'Halaman' => tgr_meta( $post->ID, 'tgr_sumber', '—' ),
	);
	?>
	<table class="form-table" role="presentation">
		<tbody>
			<tr>
				<th scope="row">Email</th>
				<td>
					<?php if ( $email ) : ?>
						<a href="<?php echo esc_url( 'mailto:' . $email ); ?>"><?php echo esc_html( $email ); ?></a>
					<?php else : ?>
						&mdash;
					<?php endif; ?>
				</td>
			</tr>
			<?php foreach ( $baris as $label => $nilai ) : ?>
				<tr>
					<th scope="row"><?php echo esc_html( $label ); ?></th>
					<td><?php echo esc_html( $nilai ); ?></td>
				</tr>
			<?php endforeach; ?>
			<tr>
				<th scope="row">Notifikasi email</th>
				<td><?php echo '1' === tgr_meta( $post->ID, 'tgr_email_terkirim' ) ? 'Terkirim ke redaksi' : 'Gagal terkirim — baca di sini'; ?></td>
			</tr>
			<tr>
				<th scope="row">Pesan</th>
				<td>
					<div style="max-width:44rem;padding:12px 14px;background:#fff;border:1px solid #dcdcde;border-radius:4px;line-height:1.6">
						<?php echo nl2br( esc_html( $post->post_content ) ); ?>
					</div>
				</td>
			</tr>
		</tbody>
	</table>
	<?php
}

add_filter(
	'manage_tgr_pesan_posts_columns',
	function ( $kolom ) {
		return array(
			'cb'                 => isset( $kolom['cb'] ) ? $kolom['cb'] : '',
			'title'              => 'Nama',
			'tgr_email'          => 'Email',
			'tgr_subjek'         => 'Subjek',
			'tgr_email_terkirim' => 'Notifikasi',
			'date'               => 'Diterima',
		);
	}
);

add_action(
	'manage_tgr_pesan_posts_custom_column',
	function ( $kolom, $post_id ) {
		if ( 'tgr_email_terkirim' === $kolom ) {
			echo '1' === tgr_meta( $post_id, 'tgr_email_terkirim' ) ? '&#10003;' : '&mdash;';
			return;
		}
		if ( in_array( $kolom, array( 'tgr_email', 'tgr_subjek' ), true ) ) {
			echo esc_html( tgr_meta( $post_id, $kolom, '—' ) );
		}
	},
	10,
	2
);

/** Tombol ekspor di atas daftar pesan. */
add_action(
	'restrict_manage_posts',
	function ( $post_type ) {
		if ( 'tgr_pesan' !== $post_type || ! current_user_can( 'edit_others_posts' ) ) {
			return;
		}
		$url = wp_nonce_url(
			admin_url( 'admin-post.php?action=tgr_ekspor_pesan' ),
			'tgr_ekspor_pesan'
		);
		printf(
			'<a href="%s" class="button" style="margin-left:8px">Unduh CSV</a>',
			esc_url( $url )
		);
	}
);

/**
 * Sel CSV yang diawali karakter formula dinetralkan dengan tanda kutip:
 * isi pesan diketik orang luar, dan Excel/Sheets mengeksekusi sel berawalan
 * "=" begitu berkasnya dibuka.
 */
function tgr_csv_teks( $nilai ) {
	$nilai = (string) $nilai;
	return preg_match( '/^[=+\-@]/', $nilai ) ? "'" . $nilai : $nilai;
}

add_action(
	'admin_post_tgr_ekspor_pesan',
	function () {
		if ( ! current_user_can( 'edit_others_posts' ) ) {
			wp_die( 'Tidak punya izin mengekspor daftar pesan.', '', array( 'response' => 403 ) );
		}
		check_admin_referer( 'tgr_ekspor_pesan' );

		$pesan = get_posts(
			array(
				'post_type'   => 'tgr_pesan',
				'post_status' => 'any',
				'numberposts' => -1,
				'orderby'     => 'date',
				'order'       => 'ASC',
			)
		);

		nocache_headers();
		header( 'Content-Type: text/csv; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename=pesan-masuk-' . gmdate( 'Y-m-d' ) . '.csv' );

		$keluaran = fopen( 'php://output', 'w' );
		fputcsv( $keluaran, array( 'nama', 'email', 'telepon', 'subjek', 'pesan', 'halaman', 'diterima' ) );
		foreach ( $pesan as $satu ) {
			fputcsv(
				$keluaran,
				array(
					tgr_csv_teks( $satu->post_title ),
					tgr_csv_teks( get_post_meta( $satu->ID, 'tgr_email', true ) ),
					tgr_csv_teks( get_post_meta( $satu->ID, 'tgr_telepon', true ) ),
					get_post_meta( $satu->ID, 'tgr_subjek', true ),
					tgr_csv_teks( $satu->post_content ),
					tgr_csv_teks( get_post_meta( $satu->ID, 'tgr_sumber', true ) ),
					$satu->post_date,
				)
			);
		}
		fclose( $keluaran );
		exit;
	}
);

/**
 * Penerima formulir kontak dari frontend — pola yang sama dengan
 * tgr/v1/subscribe: hanya server frontend yang memegang secret-nya, jadi
 * endpoint ini tidak bisa dibanjiri langsung dari peramban.
 */
add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'tgr/v1',
			'/contact',
			array(
				'methods'             => 'POST',
				'permission_callback' => function ( $request ) {
					return tgr_secret_cocok( $request->get_header( 'x-tgr-secret' ) );
				},
				'callback'            => 'tgr_terima_pesan',
				'args'                => array(
					'nama'  => array( 'required' => true ),
					'email' => array( 'required' => true ),
					'pesan' => array( 'required' => true ),
				),
			)
		);
	}
);

function tgr_terima_pesan( $request ) {
	$nama  = mb_substr( sanitize_text_field( (string) $request->get_param( 'nama' ) ), 0, 120 );
	$email = sanitize_email( (string) $request->get_param( 'email' ) );
	$pesan = mb_substr( sanitize_textarea_field( (string) $request->get_param( 'pesan' ) ), 0, 5000 );
	if ( '' === $nama ) {
		return new WP_Error( 'tgr_nama_kosong', 'Nama wajib diisi.', array( 'status' => 400 ) );
	}
	if ( ! $email || ! is_email( $email ) ) {
		return new WP_Error( 'tgr_email_tidak_sah', 'Alamat email tidak sah.', array( 'status' => 400 ) );
	}
	if ( '' === $pesan ) {
		return new WP_Error( 'tgr_pesan_kosong', 'Pesan wajib diisi.', array( 'status' => 400 ) );
	}

	$telepon = mb_substr(
		preg_replace( '/[^0-9+()\s.\-]/', '', (string) $request->get_param( 'telepon' ) ),
		0,
		40
	);
	// Subjek di luar daftar dianggap "Lainnya", bukan diteruskan mentah:
	// nilainya ikut menjadi judul email pemberitahuan.
	$subjek = (string) $request->get_param( 'subjek' );
	if ( ! in_array( $subjek, tgr_daftar_subjek(), true ) ) {
		$subjek = 'Lainnya';
	}

	// Rem per IP, lapis kedua setelah pembatas frontend — 5 pesan per jam
	// sudah lebih dari cukup untuk pengirim yang sungguhan.
	$ip     = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	$sidik  = 'tgr_msg_' . md5( $ip . wp_salt() );
	$hitung = (int) get_transient( $sidik );
	if ( $hitung >= 5 ) {
		return new WP_Error( 'tgr_terlalu_sering', 'Terlalu banyak percobaan, coba lagi nanti.', array( 'status' => 429 ) );
	}
	set_transient( $sidik, $hitung + 1, HOUR_IN_SECONDS );

	// SIMPAN DULU, email belakangan: pesan yang gagal terkirim ke inbox
	// redaksi tetap utuh di wp-admin.
	$id = wp_insert_post(
		array(
			'post_type'    => 'tgr_pesan',
			'post_status'  => 'publish',
			'post_title'   => $nama,
			'post_content' => $pesan,
		),
		true
	);
	if ( is_wp_error( $id ) ) {
		return new WP_Error( 'tgr_gagal_simpan', 'Gagal menyimpan pesan.', array( 'status' => 500 ) );
	}

	update_post_meta( $id, 'tgr_email', $email );
	update_post_meta( $id, 'tgr_telepon', $telepon );
	update_post_meta( $id, 'tgr_subjek', $subjek );
	update_post_meta( $id, 'tgr_sumber', sanitize_text_field( (string) $request->get_param( 'sumber' ) ) );
	update_post_meta( $id, 'tgr_ip_hash', $ip ? wp_hash( $ip ) : '' );

	// Tujuan bisa dipindah tanpa menyentuh kode: define('TGR_KONTAK_EMAIL', …)
	// di wp-config.php; tanpa itu jatuh ke email admin situs.
	$tujuan = ( defined( 'TGR_KONTAK_EMAIL' ) && TGR_KONTAK_EMAIL )
		? TGR_KONTAK_EMAIL
		: get_option( 'admin_email' );

	// Judul dari subjek ber-whitelist + nama hasil sanitize_text_field —
	// keduanya bebas CR/LF. Satu-satunya header dinamis adalah Reply-To
	// dengan alamat yang sudah lolos is_email, jadi tidak ada celah
	// menyisipkan header tambahan.
	$judul = sprintf( '[TGR] %s — %s', $subjek, $nama );
	$badan = sprintf(
		"Pesan baru dari formulir kontak situs.\n\nNama    : %s\nEmail   : %s\nTelepon : %s\nSubjek  : %s\n\n%s\n\n—\nBalas email ini untuk menjawab langsung ke pengirim.\nArsip lengkap: %s",
		$nama,
		$email,
		$telepon ? $telepon : '—',
		$subjek,
		$pesan,
		admin_url( 'edit.php?post_type=tgr_pesan' )
	);
	$terkirim = wp_mail( $tujuan, $judul, $badan, array( 'Reply-To: ' . $email ) );
	update_post_meta( $id, 'tgr_email_terkirim', $terkirim ? '1' : '' );

	return array( 'terkirim' => true );
}

/* ═══════════════════════════════════════════════════════════════════════
 * Isi halaman statis situs baru.
 *
 * Teks halaman Tentang, Pengurus, dan Hubungi Kami disimpan sebagai meta
 * pada Laman yang memang sudah ada di WordPress — bukan mem-parse isi
 * editor lama (HTML tema lama, rapuh) dan bukan halaman opsi tersendiri
 * (tanpa revisi, butuh plumbing REST sendiri). Webhook tgr-revalidate
 * sudah meneruskan penyimpanan Laman ke frontend.
 *
 * PENTING — peta memakai ID, bukan slug: slug Laman lama saling tertukar
 * (id 574 ber-slug "tentang-gfi" padahal judulnya "Tentang The Global
 * Review", sementara id 576 ber-slug "tentang-gfi-2").
 * ═══════════════════════════════════════════════════════════════════════ */

/** Laman yang punya kotak isi + rute frontend yang membacanya. */
function tgr_halaman_konfig() {
	return array(
		574 => '/tentang-tgr',
		576 => '/tentang-gfi',
		572 => '/hubungi-kami',
		611 => '/pengurus-gfi',
	);
}

/**
 * Deskriptor field per Laman: [kunci, label, jenis(input|textarea), petunjuk].
 * Kunci ber-akhiran _en adalah versi Inggris untuk pohon /en; kosong →
 * frontend memakai versi Indonesia.
 */
function tgr_halaman_field( $post_id ) {
	$lead = array(
		array( 'tgr_lead', 'Lead', 'input', 'Kalimat pembuka di bawah judul halaman.' ),
		array( 'tgr_lead_en', 'Lead (EN)', 'input', '' ),
	);
	switch ( $post_id ) {
		case 574: // /tentang-tgr
			return array_merge(
				$lead,
				array(
					array( 'tgr_paragraf', 'Paragraf isi', 'textarea', 'Satu paragraf per baris.' ),
					array( 'tgr_paragraf_en', 'Paragraf isi (EN)', 'textarea', '' ),
				)
			);
		case 576: // /tentang-gfi
			return array_merge(
				$lead,
				array(
					array( 'tgr_paragraf', 'Paragraf pembuka', 'textarea', 'Satu paragraf per baris.' ),
					array( 'tgr_paragraf_en', 'Paragraf pembuka (EN)', 'textarea', '' ),
					array( 'tgr_isu_judul', 'Judul bagian isu', 'input', '' ),
					array( 'tgr_isu_judul_en', 'Judul bagian isu (EN)', 'input', '' ),
					array( 'tgr_isu_intro', 'Pengantar isu', 'textarea', '' ),
					array( 'tgr_isu_intro_en', 'Pengantar isu (EN)', 'textarea', '' ),
					array( 'tgr_isu_butir', 'Butir isu pokok', 'textarea', 'Satu butir per baris.' ),
					array( 'tgr_isu_butir_en', 'Butir isu pokok (EN)', 'textarea', '' ),
					array( 'tgr_visi', 'Kutipan visi', 'input', '' ),
					array( 'tgr_visi_en', 'Kutipan visi (EN)', 'input', '' ),
					array( 'tgr_visi_label', 'Keterangan visi', 'input', 'Mis. "Visi Global Future Institute".' ),
					array( 'tgr_visi_label_en', 'Keterangan visi (EN)', 'input', '' ),
					array( 'tgr_misi_butir', 'Butir misi', 'textarea', 'Satu butir per baris.' ),
					array( 'tgr_misi_butir_en', 'Butir misi (EN)', 'textarea', '' ),
					array( 'tgr_fokus_intro', 'Pengantar fokus kegiatan', 'textarea', '' ),
					array( 'tgr_fokus_intro_en', 'Pengantar fokus kegiatan (EN)', 'textarea', '' ),
					array( 'tgr_fokus_butir', 'Butir fokus kegiatan', 'textarea', 'Satu butir per baris.' ),
					array( 'tgr_fokus_butir_en', 'Butir fokus kegiatan (EN)', 'textarea', '' ),
					array( 'tgr_fokus_penutup', 'Penutup fokus kegiatan', 'textarea', '' ),
					array( 'tgr_fokus_penutup_en', 'Penutup fokus kegiatan (EN)', 'textarea', '' ),
				)
			);
		case 572: // /hubungi-kami
			return array_merge(
				$lead,
				array(
					array( 'tgr_alamat', 'Alamat kantor', 'textarea', 'Satu baris alamat per baris teks.' ),
					array( 'tgr_jam', 'Jam operasional', 'input', 'Mis. "Senin–Jumat · 09.00–17.00 WIB".' ),
					array( 'tgr_jam_en', 'Jam operasional (EN)', 'input', '' ),
					array( 'tgr_peta_q', 'Lokasi peta Google', 'input', 'Alamat yang dicari peta, mis. "Jl. Iskandarsyah Raya No. 7, Kebayoran Baru".' ),
				)
			);
		case 611: // /pengurus-gfi
			return array_merge(
				$lead,
				array(
					array( 'tgr_paragraf', 'Paragraf pengantar', 'textarea', 'Satu paragraf per baris.' ),
					array( 'tgr_paragraf_en', 'Paragraf pengantar (EN)', 'textarea', '' ),
				)
			);
	}
	return array();
}

/** Seluruh kunci meta halaman (gabungan semua deskriptor, tanpa kembar). */
function tgr_halaman_semua_kunci() {
	$kunci = array();
	foreach ( array_keys( tgr_halaman_konfig() ) as $id ) {
		foreach ( tgr_halaman_field( $id ) as $field ) {
			$kunci[ $field[0] ] = $field[2];
		}
	}
	return $kunci; // kunci => jenis input.
}

add_action(
	'init',
	function () {
		foreach ( tgr_halaman_semua_kunci() as $key => $jenis ) {
			register_post_meta(
				'page',
				$key,
				array(
					'type'              => 'string',
					'single'            => true,
					'default'           => '',
					'show_in_rest'      => true,
					'sanitize_callback' => 'textarea' === $jenis
						? 'sanitize_textarea_field'
						: 'sanitize_text_field',
					'auth_callback'     => function () {
						return current_user_can( 'edit_pages' );
					},
				)
			);
		}
	}
);

add_action(
	'add_meta_boxes_page',
	function ( $post ) {
		if ( ! array_key_exists( $post->ID, tgr_halaman_konfig() ) ) {
			return;
		}
		add_meta_box( 'tgr_isi_halaman', 'Isi Halaman — Situs Baru', 'tgr_kotak_halaman', 'page', 'normal', 'high' );
	}
);

function tgr_kotak_halaman( $post ) {
	wp_nonce_field( 'tgr_simpan_meta', 'tgr_meta_nonce' );
	$rute = tgr_halaman_konfig()[ $post->ID ];
	?>
	<p class="description">
		Field di bawah ini mengisi halaman <code><?php echo esc_html( $rute ); ?></code>
		di situs baru. Isi editor lama di bawah TIDAK dipakai situs baru.
		Field EN yang kosong memakai versi Indonesia.
	</p>
	<table class="form-table" role="presentation">
		<tbody>
			<?php foreach ( tgr_halaman_field( $post->ID ) as $field ) : ?>
				<?php list( $kunci, $label, $jenis, $petunjuk ) = $field; ?>
				<tr>
					<th scope="row"><label for="<?php echo esc_attr( $kunci ); ?>"><?php echo esc_html( $label ); ?></label></th>
					<td>
						<?php if ( 'textarea' === $jenis ) : ?>
							<textarea id="<?php echo esc_attr( $kunci ); ?>" name="<?php echo esc_attr( $kunci ); ?>"
								class="large-text" rows="5"><?php
								echo esc_textarea( tgr_meta( $post->ID, $kunci ) );
							?></textarea>
						<?php else : ?>
							<input type="text" id="<?php echo esc_attr( $kunci ); ?>" name="<?php echo esc_attr( $kunci ); ?>"
								class="large-text" value="<?php echo esc_attr( tgr_meta( $post->ID, $kunci ) ); ?>">
						<?php endif; ?>
						<?php if ( $petunjuk ) : ?>
							<p class="description"><?php echo esc_html( $petunjuk ); ?></p>
						<?php endif; ?>
					</td>
				</tr>
			<?php endforeach; ?>
		</tbody>
	</table>
	<?php
}

add_action(
	'save_post_page',
	function ( $post_id ) {
		if ( ! array_key_exists( $post_id, tgr_halaman_konfig() ) || ! tgr_boleh_simpan( $post_id ) ) {
			return;
		}
		foreach ( tgr_halaman_field( $post_id ) as $field ) {
			list( $kunci, , $jenis ) = $field;
			$nilai = 'textarea' === $jenis
				? tgr_kiriman_teks_panjang( $kunci )
				: tgr_kiriman_teks( $kunci );
			update_post_meta( $post_id, $kunci, $nilai );
		}
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
