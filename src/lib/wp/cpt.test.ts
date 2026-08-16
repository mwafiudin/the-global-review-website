import { describe, expect, it } from "vitest";
import { isoDate } from "./map";
import { parseYoutubeId, wpPodcastToPodcast } from "./podcasts";
import { wpAlbumToAlbum, wpAttachmentToPhoto } from "./gallery";
import { wpPollOptions, wpPollToPoll } from "./polls";
import { wpPostToBook } from "./books";
import { bookByline } from "@/data/books";

/**
 * Seluruh mapper CPT murni: payload disuplai langsung, tidak ada satu pun
 * request ke WordPress.
 */

describe("wpPodcastToPodcast", () => {
  const item = {
    slug: "jaya-suprana-show",
    date: "2026-08-01T10:00:00",
    title: { rendered: "Bedah Perang Asimetris &#8211; Bagian 1" },
    content: { rendered: "<p>Paragraf satu.</p>\n<p>Paragraf dua.</p>" },
    meta: {
      tgr_kanal: "Jaya Suprana Show",
      tgr_narasumber: "Hendrajit",
      tgr_format: "Talkshow",
      tgr_video_id: "XSTDZI3vKDc",
      tgr_tayang: "2024-01-17",
    },
  };

  it("memetakan seluruh field podcast", () => {
    const p = wpPodcastToPodcast(item);
    expect(p).toMatchObject({
      slug: "jaya-suprana-show",
      headline: "Bedah Perang Asimetris – Bagian 1",
      media: "Jaya Suprana Show",
      narasumber: "Hendrajit",
      format: "Talkshow",
      tanggal: "2024-01-17",
      videoId: "XSTDZI3vKDc",
      ringkasan: ["Paragraf satu.", "Paragraf dua."],
    });
    expect(p?.featured).toBeUndefined();
  });

  it("tgr_tayang kosong atau bukan tanggal jatuh ke tanggal pos", () => {
    expect(
      wpPodcastToPodcast({ ...item, meta: { ...item.meta, tgr_tayang: "" } })
        ?.tanggal
    ).toBe("2026-08-01");
    expect(
      wpPodcastToPodcast({
        ...item,
        meta: { ...item.meta, tgr_tayang: "17 Januari 2024" },
      })?.tanggal
    ).toBe("2026-08-01");
  });

  it("tgr_unggulan '1' menjadi featured", () => {
    const p = wpPodcastToPodcast({
      ...item,
      meta: { ...item.meta, tgr_unggulan: "1" },
    });
    expect(p?.featured).toBe(true);
  });

  it("tanpa video ID tidak dirender (null)", () => {
    expect(
      wpPodcastToPodcast({ ...item, meta: { ...item.meta, tgr_video_id: "" } })
    ).toBeNull();
  });

  it("URL YouTube yang ditempel redaksi tetap diterima, nilai liar ditolak", () => {
    expect(parseYoutubeId("XSTDZI3vKDc")).toBe("XSTDZI3vKDc");
    expect(parseYoutubeId("https://youtu.be/XSTDZI3vKDc")).toBe("XSTDZI3vKDc");
    expect(
      parseYoutubeId("https://www.youtube.com/watch?list=PL1&v=XSTDZI3vKDc")
    ).toBe("XSTDZI3vKDc");
    expect(parseYoutubeId("https://www.youtube.com/shorts/XSTDZI3vKDc")).toBe(
      "XSTDZI3vKDc"
    );
    expect(parseYoutubeId("../..//evil.example?x=1")).toBeNull();
    expect(parseYoutubeId("https://evil.example/watch?v=abc")).toBeNull();
  });

  it("konten kosong jatuh ke excerpt sebagai ringkasan", () => {
    const p = wpPodcastToPodcast({
      ...item,
      content: { rendered: "" },
      excerpt: { rendered: "<p>Ringkasan singkat. [&hellip;]</p>" },
    });
    expect(p?.ringkasan).toEqual(["Ringkasan singkat.…"]);
  });
});

describe("isoDate", () => {
  it("menerima YYYY-MM-DD dan memotong awalan waktu", () => {
    expect(isoDate("2024-01-17")).toBe("2024-01-17");
    expect(isoDate(" 2024-01-17 10:30 ")).toBe("2024-01-17");
    expect(isoDate("2024-01-17T10:30:00")).toBe("2024-01-17");
  });

  it("menolak teks bebas dan tanggal yang tidak ada", () => {
    expect(isoDate("17 Januari 2024")).toBeNull();
    expect(isoDate("17/01/2024")).toBeNull();
    expect(isoDate("2026-02-30")).toBeNull();
    expect(isoDate("")).toBeNull();
    expect(isoDate(undefined)).toBeNull();
  });
});

describe("wpAttachmentToPhoto", () => {
  it("memilih ukuran large lalu jatuh ke source_url", () => {
    expect(
      wpAttachmentToPhoto({
        id: 5,
        source_url: "https://situs/full.jpg",
        media_details: {
          sizes: { large: { source_url: "https://situs/large.jpg" } },
        },
        caption: { rendered: "<p>Sesi diskusi</p>" },
      })
    ).toEqual({ seed: "5", caption: "Sesi diskusi", src: "https://situs/large.jpg" });

    expect(
      wpAttachmentToPhoto({ id: 6, source_url: "https://situs/full.jpg" })
    ).toMatchObject({ src: "https://situs/full.jpg", caption: "" });
  });

  it("caption kosong jatuh ke alt_text; tanpa URL → null", () => {
    expect(
      wpAttachmentToPhoto({ id: 7, source_url: "https://s/a.jpg", alt_text: "Foto bersama" })
    ).toMatchObject({ caption: "Foto bersama" });
    expect(wpAttachmentToPhoto({ id: 8 })).toBeNull();
  });
});

describe("wpAlbumToAlbum", () => {
  const foto = [{ seed: "5", caption: "Sesi diskusi", src: "https://s/a.jpg" }];
  const item = {
    slug: "seminar-indo-pasifik",
    date: "2026-05-18T09:00:00",
    title: { rendered: "Seminar Geopolitik Indo-Pasifik" },
    excerpt: { rendered: "<p>Seminar bertema persaingan kawasan.</p>" },
    meta: { tgr_lokasi: "Jakarta", tgr_tanggal: "2026-05-18", tgr_kategori: "Seminar" },
  };

  it("memetakan album lengkap", () => {
    expect(wpAlbumToAlbum(item, foto)).toMatchObject({
      slug: "seminar-indo-pasifik",
      judul: "Seminar Geopolitik Indo-Pasifik",
      kategori: "Seminar",
      tanggal: "2026-05-18",
      lokasi: "Jakarta",
      ringkasan: "Seminar bertema persaingan kawasan.",
      foto,
    });
  });

  it("kategori kosong jatuh ke label default", () => {
    expect(
      wpAlbumToAlbum({ ...item, meta: { ...item.meta, tgr_kategori: "" } }, foto)
        ?.kategori
    ).toBe("Kegiatan");
  });

  it("album tanpa foto tidak dirender (null)", () => {
    expect(wpAlbumToAlbum(item, [])).toBeNull();
  });
});

describe("wpPollOptions / wpPollToPoll", () => {
  const slugById = new Map([[25933, "program-nuklir-as-arab-saudi"]]);
  const item = {
    id: 12,
    slug: "poll-indo-pasifik",
    date: "2026-07-07T08:00:00",
    title: { rendered: "Poll Indo-Pasifik" },
    meta: {
      tgr_pertanyaan: "Bagaimana sebaiknya Indonesia bersikap?",
      tgr_artikel_id: 25933,
      tgr_tutup: "2026-08-07",
      tgr_opsi: [
        { id: "netral", label: "Netral aktif", base: 428 },
        { id: "asean", label: "Perkuat ASEAN", base: 356 },
      ],
    },
  };

  it("membuang opsi tak lengkap dan menjinakkan base liar", () => {
    expect(
      wpPollOptions([
        { id: "a", label: "A", base: 3.7 },
        { id: "b", label: "B", base: -5 },
        { id: "", label: "Tanpa id" },
        { id: "c", label: "" },
      ])
    ).toEqual([
      { id: "a", label: "A", base: 3, suara: 0 },
      { id: "b", label: "B", base: 0, suara: 0 },
    ]);
  });

  it("menyertakan suara pembaca dari rekap WordPress", () => {
    expect(
      wpPollOptions(
        [
          { id: "a", label: "A", base: 10 },
          { id: "b", label: "B", base: 5 },
        ],
        { a: 7, b: -3 }
      )
    ).toEqual([
      { id: "a", label: "A", base: 10, suara: 7 },
      // Rekap liar dijinakkan sama seperti suara awal.
      { id: "b", label: "B", base: 5, suara: 0 },
    ]);
  });

  it("memetakan poll lengkap dengan slug artikel ter-resolve", () => {
    expect(wpPollToPoll(item, slugById)).toMatchObject({
      id: "poll-indo-pasifik",
      articleSlug: "program-nuklir-as-arab-saudi",
      question: "Bagaimana sebaiknya Indonesia bersikap?",
      date: "2026-07-07",
      closesAt: "2026-08-07",
    });
  });

  it("tanggal tutup yang tak terbaca dianggap tanpa batas waktu", () => {
    const p = wpPollToPoll(
      { ...item, meta: { ...item.meta, tgr_tutup: "7 Agustus 2026" } },
      slugById
    );
    expect(p?.closesAt).toBeUndefined();
  });

  it("artikel sumber tak ter-resolve atau opsi < 2 → null", () => {
    expect(wpPollToPoll({ ...item, meta: { ...item.meta, tgr_artikel_id: 999 } }, slugById)).toBeNull();
    expect(
      wpPollToPoll(
        { ...item, meta: { ...item.meta, tgr_opsi: [{ id: "a", label: "A", base: 1 }] } },
        slugById
      )
    ).toBeNull();
  });

  it("pertanyaan kosong jatuh ke judul pos", () => {
    const p = wpPollToPoll(
      { ...item, meta: { ...item.meta, tgr_pertanyaan: "" } },
      slugById
    );
    expect(p?.question).toBe("Poll Indo-Pasifik");
  });
});

describe("wpPostToBook", () => {
  const media = new Map([
    [11, "https://cms.example/sampul.jpg"],
    [22, "https://cms.example/unggulan.jpg"],
  ]);

  const berbuku = {
    id: 1,
    slug: "tangan-tangan-amerika",
    date: "2026-07-25T09:00:00",
    title: { rendered: "Tangan-Tangan Amerika" },
    excerpt: { rendered: "<p>Menelusuri jejak operasi AS. [&hellip;]</p>" },
    content: { rendered: "<p>Paragraf satu.</p>\n<p>Paragraf dua.</p>" },
    featured_media: 22,
    meta: {
      tgr_buku_judul: "Tangan-Tangan Amerika: Kisah Operasi AS",
      tgr_buku_penulis: "Hendrajit dkk.",
      tgr_buku_penerbit: "Global Future Institute",
      tgr_buku_tahun: "2010",
      tgr_buku_isbn: "978-602-97209-0-7",
      tgr_buku_sampul: 11,
    },
  };

  it("memetakan identitas buku dan memakai sampul khusus", () => {
    expect(wpPostToBook(berbuku, media)).toMatchObject({
      slug: "tangan-tangan-amerika",
      judul: "Tangan-Tangan Amerika: Kisah Operasi AS",
      penulis: "Hendrajit dkk.",
      penerbit: "Global Future Institute",
      tahun: "2010",
      isbn: "978-602-97209-0-7",
      cover: "https://cms.example/sampul.jpg",
      ulasan: ["Paragraf satu.", "Paragraf dua."],
    });
  });

  it("ulasan biasa tanpa identitas buku tetap utuh, sampul dari gambar unggulan", () => {
    const b = wpPostToBook(
      { ...berbuku, meta: {}, title: { rendered: "Membaca &#8220;Defensive Nationalism&#8221;" } },
      media
    );
    // Penerbit kosong bukan "undefined" di layar: bylinenya ikut menyusut.
    expect(b.penerbit).toBe("");
    expect(b.tahun).toBeUndefined();
    expect(b.isbn).toBeUndefined();
    expect(b.judul).toBe("Membaca “Defensive Nationalism”");
    expect(b.penulis).toBe("Redaksi");
    expect(b.cover).toBe("https://cms.example/unggulan.jpg");
    expect(bookByline(b)).toBe("Redaksi");
  });

  it("tanpa sampul maupun gambar unggulan → seed, bukan alamat kosong", () => {
    const b = wpPostToBook({ ...berbuku, meta: {}, featured_media: 0 }, media);
    expect(b.cover).toContain("tangan-tangan-amerika");
  });

  it("byline menggabungkan penulis dan imprint bila keduanya ada", () => {
    expect(bookByline(wpPostToBook(berbuku, media))).toBe(
      "Hendrajit dkk., Global Future Institute (2010)"
    );
  });
});
