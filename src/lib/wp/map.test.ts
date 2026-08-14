import { describe, expect, it } from "vitest";
import type { WpPost, WpUser } from "./client";
import { feAuthorFromUsers, wpPostToArticle } from "./map";

/**
 * Yang diuji adalah jalur murni wpPostToArticle: users + category disuplai
 * pemanggil (mode daftar), jadi tidak ada satu pun request ke WordPress.
 */

const users: WpUser[] = [
  { id: 7, slug: "yudikobo", name: "Yudi Kobo" },
  { id: 9, slug: "writer", name: "Writer" },
];

const post = (over: Partial<WpPost> = {}): WpPost => ({
  id: 1,
  slug: "contoh-artikel",
  date: "2026-08-13T08:59:16",
  author: 7,
  title: { rendered: "Judul" },
  ...over,
});

const toArticle = (over: Partial<WpPost> = {}, withBody = false) =>
  wpPostToArticle(post(over), { users, category: "analisis", withBody });

describe("feAuthorFromUsers", () => {
  it("memetakan user WP ke slug penulis FE", () => {
    expect(feAuthorFromUsers(users, 7)).toBe("yudi-kobo");
  });

  it("memetakan akun kolektif writer ke profil redaksi", () => {
    expect(feAuthorFromUsers(users, 9)).toBe("redaksi");
  });

  it("jatuh ke redaksi untuk user yang tidak dikenal", () => {
    expect(feAuthorFromUsers(users, 404)).toBe("redaksi");
  });
});

describe("wpPostToArticle", () => {
  it("men-decode entity HTML pada judul", async () => {
    const article = await toArticle({
      title: { rendered: "Dolar &amp; Rupiah &#8217;26 &hellip;" },
    });
    expect(article.title).toBe("Dolar & Rupiah ’26 …");
  });

  it("membersihkan artefak […] dari excerpt WordPress", async () => {
    const article = await toArticle({
      excerpt: { rendered: "<p>Ringkasan singkat redaksi [&hellip;]</p>" },
    });
    expect(article.excerpt).toBe("Ringkasan singkat redaksi…");
  });

  it("memotong date jadi tanggal saja, dateTime tetap utuh", async () => {
    // formatDate() menambahkan "T00:00:00" sendiri.
    const article = await toArticle();
    expect(article.date).toBe("2026-08-13");
    expect(article.dateTime).toBe("2026-08-13T08:59:16");
  });

  it("menerjemahkan sticky menjadi featured", async () => {
    expect((await toArticle({ sticky: true })).featured).toBe(true);
    expect((await toArticle({ sticky: false })).featured).toBeUndefined();
  });

  it("membulatkan readMinutes minimal 1 menit", async () => {
    const article = await toArticle({ content: { rendered: "<p>Dua kata.</p>" } });
    expect(article.readMinutes).toBe(1);
  });

  it("mengambil ukuran large dari featured media", async () => {
    const article = await toArticle({
      _embedded: {
        "wp:featuredmedia": [
          {
            source_url: "https://x.test/full.jpg",
            media_details: { sizes: { large: { source_url: "https://x.test/large.jpg" } } },
          },
        ],
      },
    });
    expect(article.imageUrl).toBe("https://x.test/large.jpg");
  });

  it("mengosongkan excerpt otomatis WP agar lead tidak tampil dua kali", async () => {
    // Tanpa excerpt sendiri, excerpt dibangkitkan dari awal konten — kalau
    // ditampilkan sebagai lead, paragraf pertama muncul dua kali.
    const rendered =
      "<p>Pemerintah menegaskan kebijakan energi baru akan diumumkan pada kuartal " +
      "berikutnya setelah seluruh pemangku kepentingan menyampaikan masukan resmi " +
      "kepada kementerian terkait dalam rangkaian konsultasi publik yang berlangsung " +
      "selama tiga pekan penuh di sembilan kota besar dan diikuti perwakilan " +
      "industri, akademisi, serta organisasi masyarakat sipil dari berbagai daerah.</p>";
    const article = await toArticle({ content: { rendered } }, true);
    expect(article.excerpt).toBe("");
    expect(article.bodyHtml).toContain("<p>Pemerintah menegaskan");
  });

  it("mempertahankan excerpt yang ditulis redaksi sendiri", async () => {
    const article = await toArticle(
      {
        content: { rendered: "<p>Isi lengkap artikel yang panjang.</p>" },
        excerpt: { rendered: "<p>Ringkasan yang ditulis redaksi.</p>" },
      },
      true
    );
    expect(article.excerpt).toBe("Ringkasan yang ditulis redaksi.");
  });
});
