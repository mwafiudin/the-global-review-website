import type { Lang } from "@/lib/locale-routing";

/**
 * Copy halaman Redaksi. Ikon pedoman tetap di page file (di-zip lewat
 * indeks) supaya modul ini murni teks.
 */
export interface RedaksiCopy {
  metaTitle: string;
  metaDescription: string;
  title: string;
  lead: string;
  silangA: string;
  silangTebal1: string;
  silangB: string;
  silangTebal2: string;
  susunanHeading: string;
  masthead: { peran: string; nama: string }[];
  kontributorHeading: string;
  beat: Record<string, string>;
  beatFallback: string;
  tulisanLabel: string;
  pedomanHeading: string;
  pedoman: { judul: string; teks: string }[];
  ctaKicker: string;
  ctaHeading: string;
  ctaTeks: string;
  ctaKirim: string;
  subjekKiriman: string;
}

export const redaksiCopy: Record<Lang, RedaksiCopy> = {
  id: {
    metaTitle: "Redaksi",
    metaDescription:
      "Ruang redaksi The Global Review: susunan redaksi, kontributor, pedoman jurnalistik, dan kontak newsroom.",
    title: "Redaksi",
    lead: "Ruang kerja jurnalistik di balik The Global Review — bertanggung jawab atas peliputan, kurasi, penyuntingan, dan penerbitan setiap analisis di kanal ini.",
    silangA: "Halaman ini memuat struktur",
    silangTebal1: "keredaksian media",
    silangB: ". Untuk susunan dewan eksekutif lembaga penerbit, lihat",
    silangTebal2: "Pengurus Global Future Institute",
    susunanHeading: "Susunan Redaksi",
    masthead: [
      { peran: "Pemimpin Redaksi", nama: "Hendrajit" },
      { peran: "Pemimpin Perusahaan", nama: "Rusman" },
      { peran: "Dewan Redaksi", nama: "Rachmat Adlani" },
      { peran: "Redaktur", nama: "Yudi Kobo" },
      { peran: "Redaktur Tamu", nama: "Harri Samputra Agus" },
    ],
    kontributorHeading: "Kontributor",
    beat: {
      hendrajit: "Pengkaji Geopolitik",
      "m-arief-pranoto": "Kontributor Geopolitik",
      rusman: "Media & Teknologi",
      "yudi-kobo": "Redaktur",
      redaksi: "Tim Redaksi",
    },
    beatFallback: "Kontributor",
    tulisanLabel: "tulisan",
    pedomanHeading: "Pedoman Redaksi",
    pedoman: [
      {
        judul: "Independen",
        teks: "Bebas dari kepentingan politik dan pemodal; tunduk pada kepentingan publik.",
      },
      {
        judul: "Verifikasi Berlapis",
        teks: "Setiap klaim dan data diperiksa dari lebih dari satu sumber sebelum tayang.",
      },
      {
        judul: "Hak Jawab & Ralat",
        teks: "Terbuka pada koreksi; kesalahan diralat secara terbuka dan tepat waktu.",
      },
      {
        judul: "Perlindungan Narasumber",
        teks: "Identitas narasumber yang rentan dijaga demi keselamatan dan kepercayaan.",
      },
    ],
    ctaKicker: "Hubungi Redaksi",
    ctaHeading: "Punya gagasan atau ingin menulis di The Global Review?",
    ctaTeks:
      "Kami menerima kiriman opini, analisis, dan tanggapan dari para pengkaji masalah internasional dan geopolitik. Sampaikan hak jawab, koreksi, atau usulan liputan melalui surel redaksi.",
    ctaKirim: "Kirim Tulisan",
    subjekKiriman: "Kiriman Tulisan — The Global Review",
  },
  en: {
    metaTitle: "Editorial",
    metaDescription:
      "The Global Review newsroom: the editorial masthead, contributors, journalistic guidelines, and newsroom contacts.",
    title: "Editorial",
    lead: "The journalistic workroom behind The Global Review — responsible for the reporting, curation, editing, and publication of every analysis on this channel.",
    silangA: "This page lists the media's",
    silangTebal1: "editorial structure",
    silangB: ". For the executive board of the publishing institution, see",
    silangTebal2: "the Global Future Institute Board",
    susunanHeading: "Masthead",
    masthead: [
      { peran: "Editor-in-Chief", nama: "Hendrajit" },
      { peran: "General Manager", nama: "Rusman" },
      { peran: "Editorial Board", nama: "Rachmat Adlani" },
      { peran: "Editor", nama: "Yudi Kobo" },
      { peran: "Guest Editor", nama: "Harri Samputra Agus" },
    ],
    kontributorHeading: "Contributors",
    beat: {
      hendrajit: "Geopolitics Analyst",
      "m-arief-pranoto": "Geopolitics Contributor",
      rusman: "Media & Technology",
      "yudi-kobo": "Editor",
      redaksi: "Editorial Team",
    },
    beatFallback: "Contributor",
    tulisanLabel: "articles",
    pedomanHeading: "Editorial Guidelines",
    pedoman: [
      {
        judul: "Independent",
        teks: "Free from political and financial interests; answerable to the public interest.",
      },
      {
        judul: "Layered Verification",
        teks: "Every claim and data point is checked against more than one source before publication.",
      },
      {
        judul: "Right of Reply & Corrections",
        teks: "Open to correction; errors are corrected openly and promptly.",
      },
      {
        judul: "Source Protection",
        teks: "The identities of vulnerable sources are protected for their safety and trust.",
      },
    ],
    ctaKicker: "Contact the Editors",
    ctaHeading: "Have an idea, or want to write for The Global Review?",
    ctaTeks:
      "We welcome opinion pieces, analyses, and responses from scholars of international affairs and geopolitics. Send your right of reply, corrections, or coverage suggestions to the editorial email.",
    ctaKirim: "Submit an Article",
    subjekKiriman: "Article Submission — The Global Review",
  },
};
