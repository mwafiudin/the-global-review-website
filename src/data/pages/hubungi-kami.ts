import type { Lang } from "@/lib/locale-routing";

/**
 * Copy halaman Hubungi Kami. Ikon kanal tetap di page file (di-zip lewat
 * indeks); subjek surel ikut bahasa supaya email yang masuk mudah dipilah.
 */
export interface HubungiKamiCopy {
  metaTitle: string;
  metaDescription: string;
  title: string;
  lead: string;
  kanal: { judul: string; teks: string; aksi: string; subjek?: string }[];
  kirimHeading: string;
  petaTitle: string;
  alamatLabel: string;
  surelLabel: string;
  jamLabel: string;
  jamTeks: string;
  ikutiLabel: string;
}

/** Alamat kantor (tak diterjemahkan), satu baris tampilan per baris teks. */
export const alamatKantor =
  "DARIA Building, Suite 402\nJl. Iskandarsyah Raya No. 7\nKebayoran Baru, Jakarta Selatan";

/** Lokasi yang dicari iframe peta Google. */
export const petaQuery =
  "Jl. Iskandarsyah Raya No. 7, Kebayoran Baru, Jakarta Selatan";

export const hubungiKamiCopy: Record<Lang, HubungiKamiCopy> = {
  id: {
    metaTitle: "Hubungi Kami",
    metaDescription:
      "Hubungi redaksi The Global Review — kiriman tulisan, hak jawab, kerja sama, dan pertanyaan umum.",
    title: "Hubungi Kami",
    lead: "Pilih kanal yang sesuai agar pesan Anda langsung sampai ke tim yang tepat.",
    kanal: [
      {
        judul: "Redaksi & Hak Jawab",
        teks: "Kiriman opini dan analisis, koreksi, atau hak jawab atas pemberitaan.",
        aksi: "Surel redaksi",
        subjek: "Redaksi & Hak Jawab — The Global Review",
      },
      {
        judul: "Kerja Sama & Kemitraan",
        teks: "Kolaborasi riset, penyelenggaraan acara, dan kemitraan media.",
        aksi: "Ajukan kerja sama",
        subjek: "Kerja Sama & Kemitraan — The Global Review",
      },
      {
        judul: "Pertanyaan Umum",
        teks: "Pertanyaan lain seputar The Global Review dan Global Future Institute.",
        aksi: "Isi formulir",
      },
    ],
    kirimHeading: "Kirim Pesan",
    petaTitle: "Lokasi kantor Global Future Institute",
    alamatLabel: "Alamat",
    surelLabel: "Surel",
    jamLabel: "Jam Operasional",
    jamTeks: "Senin–Jumat · 09.00–17.00 WIB",
    ikutiLabel: "Ikuti Kami",
  },
  en: {
    metaTitle: "Contact",
    metaDescription:
      "Contact The Global Review editors — article submissions, right of reply, partnerships, and general inquiries.",
    title: "Contact",
    lead: "Choose the right channel so your message reaches the right team straight away.",
    kanal: [
      {
        judul: "Editorial & Right of Reply",
        teks: "Opinion and analysis submissions, corrections, or a right of reply to our reporting.",
        aksi: "Email the editors",
        subjek: "Editorial & Right of Reply — The Global Review",
      },
      {
        judul: "Cooperation & Partnership",
        teks: "Research collaborations, event organization, and media partnerships.",
        aksi: "Propose a partnership",
        subjek: "Cooperation & Partnership — The Global Review",
      },
      {
        judul: "General Inquiry",
        teks: "Other questions about The Global Review and the Global Future Institute.",
        aksi: "Fill in the form",
      },
    ],
    kirimHeading: "Send a Message",
    petaTitle: "Global Future Institute office location",
    alamatLabel: "Address",
    surelLabel: "Email",
    jamLabel: "Office Hours",
    jamTeks: "Monday–Friday · 09.00–17.00 WIB (GMT+7)",
    ikutiLabel: "Follow Us",
  },
};
