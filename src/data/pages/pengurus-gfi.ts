import type { Lang } from "@/lib/locale-routing";

/**
 * Copy halaman Pengurus GFI. Nama dan foto sama di kedua bahasa; jabatan
 * dan bio diterjemahkan per orang lewat Record<Lang, …> di tiap entri.
 */
export interface PengurusTeks {
  jabatan: string;
  bio: string;
}

export interface Pengurus {
  nama: string;
  foto: string;
  teks: Record<Lang, PengurusTeks>;
}

export interface PengurusGfiCopy {
  metaTitle: string;
  metaDescription: string;
  title: string;
  lead: string;
  pengantar: string;
  dewanLabel: string;
  potretAltPrefix: string;
}

export const pengurusGfiCopy: Record<Lang, PengurusGfiCopy> = {
  id: {
    metaTitle: "Pengurus GFI",
    metaDescription: "Susunan Dewan Eksekutif Global Future Institute.",
    title: "Pengurus GFI",
    lead: "Susunan Dewan Eksekutif Global Future Institute.",
    pengantar:
      "Menyadari konstelasi dan dinamika global, regional dan nasional yang berkembang dan bergerak dalam skala yang semakin cepat dan tak terduga, serta menimbang betapa strategis peran Global Future Institute sebagai lembaga think-tank dan kelompok kerja perumus kebijakan strategis nasional dan internasional, GFI menata ulang dan melakukan penyegaran komposisi Dewan Eksekutif sebagai berikut.",
    dewanLabel: "Dewan Eksekutif",
    potretAltPrefix: "Potret",
  },
  en: {
    metaTitle: "GFI Board",
    metaDescription: "The Executive Board of the Global Future Institute.",
    title: "GFI Board",
    lead: "The Executive Board of the Global Future Institute.",
    pengantar:
      "Recognizing that the global, regional, and national constellation is evolving at an ever faster and less predictable pace, and considering the strategic role of the Global Future Institute as a think tank and working group shaping national and international strategic policy, GFI has restructured and refreshed the composition of its Executive Board as follows.",
    dewanLabel: "Executive Board",
    potretAltPrefix: "Portrait of",
  },
};

export const pengurus: Pengurus[] = [
  {
    nama: "Hendrajit",
    foto: "/images/hendrajit-direktur-eksekutif-gfi.jpg",
    teks: {
      id: {
        jabatan: "Direktur Eksekutif",
        bio: "Lahir di Jakarta 1963. Alumnus Fakultas Sosial Politik Universitas Nasional Jakarta. Mantan wartawan Tabloid Detik (1992-1994), ikut merintis Tabloid Detak (1998) hingga menjabat Wakil Pemimpin Redaksi. Memprakarsai berdirinya GFI pada 11 Oktober 2007. Menerbitkan tiga buku, di antaranya Perang Asimetris & Skema Penjajahan Gaya Baru (2019). Kerap menjadi narasumber di SESKO TNI, Lemhanas, dan Kementerian Pertahanan.",
      },
      en: {
        jabatan: "Executive Director",
        bio: "Born in Jakarta in 1963. A graduate of the Faculty of Social and Political Sciences, Universitas Nasional Jakarta. Former journalist at Tabloid Detik (1992-1994), co-founded Tabloid Detak (1998) and served as its Deputy Editor-in-Chief. Initiated the founding of GFI on 11 October 2007. Has published three books, including Perang Asimetris & Skema Penjajahan Gaya Baru (2019). A frequent speaker at SESKO TNI, Lemhanas, and the Ministry of Defense.",
      },
    },
  },
  {
    nama: "Rusman Rusli",
    foto: "/images/rusman-direktur-teknologi-informasi-gfi.jpg",
    teks: {
      id: {
        jabatan:
          "Wakil Direktur Eksekutif bidang Manajemen Perkantoran, Teknologi Informasi dan Keamanan Siber",
        bio: "Lahir di Jakarta, Juli 1972. Bergabung dengan GFI sejak 2008 sebagai salah satu perintis. Alumnus Fakultas Ekonomi Universitas Nasional, wartawan tabloid DeTAK (1999-2001), jurnalis terbaik versi Yayasan KEHATI dan Lembaga Pers Dr. Supomo (2000). Mengelola berbagai media dan menjalankan bisnis teknologi informasi serta konsultan media.",
      },
      en: {
        jabatan:
          "Deputy Executive Director for Office Management, Information Technology, and Cybersecurity",
        bio: "Born in Jakarta, July 1972. One of the pioneers of GFI, joining in 2008. A graduate of the Faculty of Economics, Universitas Nasional; journalist at the tabloid DeTAK (1999-2001); named best journalist by the KEHATI Foundation and the Dr. Supomo Press Institute (2000). Has managed various media outlets and runs an information technology business and media consultancy.",
      },
    },
  },
  {
    nama: "Harry Samputra Agus",
    foto: "/images/placeholder-pengurus-gfi-pria-1.jpg",
    teks: {
      id: {
        jabatan:
          "Direktur Pengembangan Bisnis dan Pendidikan berbasis Multi-Media",
        bio: "Lahir di Jakarta, 1 Oktober 1973. Ketua Dewan Pembina GFI sejak 2009. Founder dan CEO PT Kabarindo Media Utama Internasional serta FAST LAW Coaching Indonesia. Lulusan Fakultas Hukum Universitas Indonesia, aktif sebagai pembicara pelatihan hubungan internasional dan jurnalistik.",
      },
      en: {
        jabatan: "Director of Business Development and Multimedia-based Education",
        bio: "Born in Jakarta, 1 October 1973. Chair of the GFI Board of Trustees since 2009. Founder and CEO of PT Kabarindo Media Utama Internasional and FAST LAW Coaching Indonesia. A graduate of the Faculty of Law, University of Indonesia, and an active trainer and speaker on international relations and journalism.",
      },
    },
  },
  {
    nama: "Andrianto",
    foto: "/images/placeholder-pengurus-gfi-pria-2.jpg",
    teks: {
      id: {
        jabatan: "Direktur Diplomasi Kebudayaan Antar-Bangsa dan Ekspatriat",
        bio: "Lahir di Jakarta, 1 Desember 1973. Sarjana Hubungan Internasional Universitas Nasional Jakarta. General Manager International Language Center (ILC) Semarang dan dosen bahasa Inggris di berbagai kampus di Semarang.",
      },
      en: {
        jabatan: "Director of Intercultural Diplomacy and Expatriate Affairs",
        bio: "Born in Jakarta, 1 December 1973. Holds a degree in International Relations from Universitas Nasional Jakarta. General Manager of the International Language Center (ILC) Semarang and an English lecturer at several campuses in Semarang.",
      },
    },
  },
  {
    nama: "M Arief Pranoto",
    foto: "/images/placeholder-pengurus-gfi-pria-3.jpg",
    teks: {
      id: {
        jabatan: "Direktur Pengkajian Geopolitik dan Studi Kewilayahan",
        bio: "Lahir di Ngawi, Januari 1963. Menggeluti dunia tulis-menulis sejak 1990-an. Bergabung dengan GFI sejak 2009 sebagai Research Associate, dan sejak 2015 memimpin Program Studi Geopolitik dan Kawasan. Aktif di Forum KENARI.",
      },
      en: {
        jabatan: "Director of Geopolitical Studies and Regional Affairs",
        bio: "Born in Ngawi, January 1963. A writer since the 1990s. Joined GFI in 2009 as a Research Associate and has led the Geopolitics and Regional Studies Program since 2015. Active in the KENARI Forum.",
      },
    },
  },
  {
    nama: "Murniatun Margono",
    foto: "/images/placeholder-pengurus-gfi-perempuan.jpg",
    teks: {
      id: {
        jabatan:
          "Direktur Pengkajian Hukum, Hak-Hak Asasi Manusia dan Kesehatan Global",
        bio: "Lulusan Penerbitan Jurnalistik Politeknik Negeri Jakarta (2013), Mahasiswa Berprestasi 2012, dan sarjana hukum Universitas Al Azhar Indonesia (cumlaude). Berpengalaman sebagai reporter di berbagai majalah dan aktif di PMI Jakarta Selatan dan Tangerang Selatan.",
      },
      en: {
        jabatan: "Director of Legal Studies, Human Rights, and Global Health",
        bio: "A graduate in Journalism Publishing from Politeknik Negeri Jakarta (2013), Outstanding Student of 2012, and holder of a law degree (cum laude) from Al Azhar University Indonesia. Experienced as a reporter at several magazines and active in the Indonesian Red Cross in South Jakarta and South Tangerang.",
      },
    },
  },
  {
    nama: "Halim Hutagalung",
    foto: "/images/placeholder-pengurus-gfi-pria-1.jpg",
    teks: {
      id: {
        jabatan:
          "Direktur Pengkajian Kearifan Lokal, Lingkungan Hidup dan Pariwisata",
        bio: "Lahir di Jakarta, 10 November. Bergabung dengan GFI sejak 2015. Aktif di Relawan Kesehatan Indonesia dan sejak 2021 turut membangun ekosistem wisata di kawasan situs megalitikum Gunung Padang, Cianjur.",
      },
      en: {
        jabatan: "Director of Local Wisdom, Environment, and Tourism Studies",
        bio: "Born in Jakarta on 10 November. Joined GFI in 2015. Active in the Indonesian Health Volunteers, and since 2021 has helped build the tourism ecosystem around the Gunung Padang megalithic site in Cianjur.",
      },
    },
  },
  {
    nama: "Neisya Aulia",
    foto: "/images/placeholder-pengurus-gfi-perempuan.jpg",
    teks: {
      id: {
        jabatan: "Direktur Diplomasi Publik dan Pemberdayaan Ekonomi Kreatif",
        bio: "Profesional muda, Direktur PT Agro Tani Abadi yang bergerak di ekspor produk pertanian. Lulusan Hubungan Internasional BINUS University. Fokus pada penguatan produk lokal Indonesia di pasar global dan pemberdayaan petani lokal.",
      },
      en: {
        jabatan:
          "Director of Public Diplomacy and Creative Economy Empowerment",
        bio: "A young professional and Director of PT Agro Tani Abadi, an agricultural export company. A graduate in International Relations from BINUS University. Focuses on strengthening Indonesian local products in global markets and empowering local farmers.",
      },
    },
  },
];
