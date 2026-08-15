<?php
/**
 * Plugin Name:  TGR Headless — Tipe Konten & Field
 * Description:  Mendaftarkan tipe konten khusus (Podcast, Album Galeri, Jajak
 *               Pendapat) dan field tambahan Bedah Buku, seluruhnya terekspos
 *               ke REST API untuk dikonsumsi frontend Next.js.
 * Version:      2.2.0
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
		if ( $layar && 'tgr_album' === $layar->post_type ) {
			wp_enqueue_media();
			wp_enqueue_script( 'jquery-ui-sortable' );
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

add_action(
	'save_post_post',
	function ( $post_id ) {
		if ( ! tgr_boleh_simpan( $post_id ) ) {
			return;
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
