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
        bio: "Lahir di Jakarta pada 1963. Alumnus Fakultas Sosial Politik Universitas Nasional Jakarta ini menumbuhkan minat pada hubungan internasional dan politik luar negeri sejak bergabung dengan ISAFIS pada 1986. Wartawan Tabloid Detik (1992-1994) di bawah Eros Djarot, lalu Tabloid Simponi dan Tabloid Target setelah Detik dibredel. Pada 1996 mulai meluaskan kegiatannya ke bidang akademik sebagai staf peneliti Lembaga Pengkajian Strategis Indonesia; tulisannya dimuat di sejumlah harian terkemuka, termasuk The Jakarta Post. Ikut merintis Tabloid Detak pada 1998 sebagai editor politik dan militer, kemudian Wakil Pemimpin Redaksi hingga 2002. Memprakarsai berdirinya GFI pada 11 Oktober 2007 di bawah naungan Yayasan Global Masa Depan. Bersama penulis lain menerbitkan Tangan-Tangan Amerika (2010), Japanese Militarism & Its War Crimes in Asia Pacific Region (2011), dan Perang Asimetris & Skema Penjajahan Gaya Baru (2019). Kerap diundang sebagai narasumber di SESKO TNI, Lemhanas, Kementerian Pertahanan, dan berbagai perguruan tinggi.",
      },
      en: {
        jabatan: "Executive Director",
        bio: "Born in Jakarta in 1963. A graduate of the Faculty of Social and Political Sciences at Universitas Nasional Jakarta, he developed an interest in international relations and foreign policy after joining ISAFIS in 1986. A journalist at Tabloid Detik (1992-1994) under Eros Djarot, then at Tabloid Simponi and Tabloid Target after Detik was banned. In 1996 he moved into academic work as a research fellow at the Indonesian Institute for Strategic Studies; his articles appeared in leading dailies, including The Jakarta Post. He co-founded Tabloid Detak in 1998 as its politics and military editor, later serving as Deputy Editor-in-Chief until 2002. He initiated the founding of GFI on 11 October 2007 under the Global Masa Depan Foundation. With other authors he has published Tangan-Tangan Amerika (2010), Japanese Militarism & Its War Crimes in Asia Pacific Region (2011), and Perang Asimetris & Skema Penjajahan Gaya Baru (2019). He is a frequent guest speaker at SESKO TNI, Lemhanas, the Ministry of Defense, and universities across Indonesia.",
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
        bio: "Lahir di Jakarta, Juli 1972. Bergabung dengan GFI sejak 2008 dan menjadi satu di antara perintis lembaga ini. Semasa kuliah di Fakultas Ekonomi Universitas Nasional ia aktif di pers kampus dan menjadi pemimpin redaksi BILIK. Wartawan tabloid DeTAK (1999-2001) pimpinan Eros Djarot, lalu penulis lepas di sejumlah media Jakarta dan Bandung. Pada 2000 terpilih sebagai satu dari sepuluh jurnalis terbaik untuk penulisan tema lingkungan hidup oleh Yayasan KEHATI dan Lembaga Pers Dr. Supomo, sekaligus masuk tim penulis buku Keanekaragaman Hayati Taman Nasional di Indonesia. Pada 2009-2011 bergabung dengan kantor Staf Khusus Presiden bidang Bantuan Sosial dan Bencana. Pernah mengelola nefosnews.com, majalah GREENOLA, dan tabloid Nusantara, serta memimpin redaksi geraknews.id pada 2024. Menjalankan usaha di bidang teknologi informasi, konsultan media, dan konsultan wisata; aktif pula sebagai Ketua Umum IKAFENAS.",
      },
      en: {
        jabatan:
          "Deputy Executive Director for Office Management, Information Technology, and Cyber Security",
        bio: "Born in Jakarta in July 1972. He joined GFI in 2008 and is one of the institute's founding members. While studying at the Faculty of Economics, Universitas Nasional, he was active in the campus press and served as editor-in-chief of BILIK. A journalist at the tabloid DeTAK (1999-2001) under Eros Djarot, he later wrote freelance for media in Jakarta and Bandung. In 2000 he was named one of ten best journalists for environmental writing by the KEHATI Foundation and the Dr. Supomo Press Institute, and joined the writing team for the book Keanekaragaman Hayati Taman Nasional di Indonesia. From 2009 to 2011 he worked at the office of the Presidential Special Staff for Social Assistance and Disaster Relief. He has managed nefosnews.com, GREENOLA magazine, and the tabloid Nusantara, and was editor-in-chief of geraknews.id in 2024. He runs businesses in information technology, media consulting, and tourism consulting, and chairs IKAFENAS.",
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
        bio: "Lahir di Jakarta, 1 Oktober 1973. Ketua Dewan Pembina Global Future Institute sejak 2009 dan Ketua Dewan Pengurus Yayasan Inayah sejak 2016. Founder sekaligus CEO PT Kabarindo Media Utama Internasional (2019) dan FAST LAW Coaching Indonesia, FAST Group Internasional (2004). Lulusan Fakultas Hukum Universitas Indonesia, program kekhususan Hukum Kesejahteraan Masyarakat dan Pembangunan; semasa kuliah menjadi Presidium Senat Mahasiswa UI, Ketua Umum ISAFIS, dan Manager di ALSA. Penerima beasiswa pertukaran pelajar AFS ke Australia. Aktif di Pusat Kajian Hukum dan Pembangunan Peradaban Berkelanjutan, serta menjadi pembicara pada pelatihan Uni Eropa di Kementerian Luar Negeri, pelatihan jurnalistik internasional GFI-ISAFIS (2019), dan SISBAC setiap tahun.",
      },
      en: {
        jabatan:
          "Director of Business Development and Multimedia-based Education",
        bio: "Born in Jakarta on 1 October 1973. Chair of the Global Future Institute Board of Trustees since 2009 and chair of the Inayah Foundation since 2016. Founder and CEO of PT Kabarindo Media Utama Internasional (2019) and of FAST LAW Coaching Indonesia, FAST Group Internasional (2004). A graduate of the Faculty of Law, University of Indonesia, specializing in Social Welfare and Development Law; during his studies he served on the UI Student Senate Presidium, chaired ISAFIS, and was a manager at ALSA. He held an AFS exchange scholarship to Australia. He is active at the Center for Legal Studies and Sustainable Civilization Development, and has spoken at European Union training at the Ministry of Foreign Affairs, the GFI-ISAFIS international journalism training (2019), and the annual SISBAC course.",
      },
    },
  },
  {
    nama: "Andrianto",
    foto: "/images/placeholder-pengurus-gfi-pria-2.jpg",
    teks: {
      id: {
        jabatan: "Direktur Diplomasi Kebudayaan Antar-Bangsa dan Ekspatriat",
        bio: "Lahir di Jakarta, 1 Desember 1973. Sarjana Hubungan Internasional Universitas Nasional Jakarta lulusan 1998. Selain menjabat di GFI, ia menjadi General Manager International Language Center (ILC) di Kota Semarang. Pernah mengajar bahasa Inggris di Akademi Keperawatan Widya Husada Semarang (2009-2019), LP3I Semarang (2008-2022), ASMI Stansa Semarang (2016-2021), Universitas PGRI Semarang (2023), dan Universitas Negeri Semarang (2021-2023). Menjadi narasumber sejumlah lokakarya penyusunan dan evaluasi soal tes kemahiran bahasa Inggris yang diselenggarakan UPT Bahasa Universitas Siliwangi, Tasikmalaya, pada 2022.",
      },
      en: {
        jabatan: "Director of Intercultural Diplomacy and Expatriate Affairs",
        bio: "Born in Jakarta on 1 December 1973. He graduated in International Relations from Universitas Nasional Jakarta in 1998. Alongside his role at GFI, he is General Manager of the International Language Center (ILC) in Semarang. He has taught English at Widya Husada Nursing Academy Semarang (2009-2019), LP3I Semarang (2008-2022), ASMI Stansa Semarang (2016-2021), Universitas PGRI Semarang (2023), and Semarang State University (2021-2023). In 2022 he was a resource person for several workshops on designing and evaluating English proficiency test items held by the Language Unit of Universitas Siliwangi, Tasikmalaya.",
      },
    },
  },
  {
    nama: "M Arief Pranoto",
    foto: "/images/placeholder-pengurus-gfi-pria-3.jpg",
    teks: {
      id: {
        jabatan: "Direktur Pengkajian Geopolitik dan Studi Kewilayahan",
        bio: "Dilahirkan di Ngawi, Januari 1963, dan menggeluti dunia tulis-menulis sejak 1990-an. Sebelumnya aktif menulis tentang dinamika sosial dan hukum di sejumlah media lokal Kalimantan Timur, Sumatera Barat, Lampung, Riau, serta beberapa majalah instansi. Menyelesaikan S-1 di Jakarta dan S-2 di Universitas Winaya Mukti, Bandung. Bergabung dengan GFI sejak 2009 sebagai Research Associate, dan pada 2015 ditunjuk sebagai Direktur Program Studi Geopolitik dan Kawasan. Kerap menjadi pembicara pada seminar dan sarasehan GFI, serta mengikuti diskusi di Setwapres RI, Kementerian Luar Negeri, dan Dewan Ketahanan Nasional, juga di Forum KENARI pimpinan ahli geopolitik Dirgo D Purbo.",
      },
      en: {
        jabatan: "Director of Geopolitical Studies and Regional Affairs",
        bio: "Born in Ngawi in January 1963, he has been writing since the 1990s. He previously wrote on social and legal affairs for local media in East Kalimantan, West Sumatra, Lampung, and Riau, as well as several institutional magazines. He completed his undergraduate studies in Jakarta and a master's degree at Universitas Winaya Mukti, Bandung. He joined GFI in 2009 as a Research Associate and was appointed Director of the Geopolitics and Regional Studies Program in 2015. A frequent speaker at GFI seminars and forums, he has also taken part in discussions at the Office of the Vice President, the Ministry of Foreign Affairs, and the National Resilience Council, as well as the KENARI Forum led by geopolitics expert Dirgo D Purbo.",
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
        bio: "Lulusan Penerbitan Jurnalistik Politeknik Negeri Jakarta (2013) dan Mahasiswa Berprestasi Jurnalistik 2012. Memulai karier menulis semasa kuliah sebagai reporter lepas Majalah Tapal Batas, lalu menjadi tim reporter Majalah Greenola dan magang di Majalah Travelxpose. Pada 2013 tergabung dalam tim media internal Musyawarah Nasional ARSADA dan tim riset penerbitan buku biografi pendiri Inacraft. Sebelumnya aktif dalam komunitas diskusi hubungan internasional GFI. Menyelesaikan S-1 Fakultas Hukum Ekonomi dan Teknologi Universitas Al Azhar Indonesia dengan predikat cumlaude setelah hampir sepuluh tahun bekerja di perbankan syariah. Juara ketiga Antologi Tulisan Peran Jakarta Islamic Centre (2014) dan aktif di Palang Merah Indonesia Jakarta Selatan serta Tangerang Selatan.",
      },
      en: {
        jabatan: "Director of Legal Studies, Human Rights, and Global Health",
        bio: "A 2013 graduate in Journalism Publishing from Politeknik Negeri Jakarta and its Outstanding Journalism Student of 2012. She began writing as a freelance reporter for Majalah Tapal Batas while still at university, later joining the reporting team at Greenola magazine and interning at Travelxpose. In 2013 she was part of the internal media team for the ARSADA National Congress and the research team for a biography of the founder of Inacraft. She was previously active in GFI's international relations discussion circle. She completed a law degree cum laude at Al Azhar University Indonesia after nearly a decade working in Islamic banking. She placed third in the Jakarta Islamic Centre writing anthology (2014) and is active in the Indonesian Red Cross in South Jakarta and South Tangerang.",
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
        bio: "Lahir di Jakarta, 10 November. Pada 2000 bergabung dengan Poros Indonesia pimpinan Eros Djarot, dan pada tahun yang sama mendirikan Study Club Indonesia Raya bersama Budi Djarot — wadah diskusi isu ekonomi, sosial, budaya, politik, serta pertahanan dan keamanan. Sejak 2014 aktif di lembaga analisis Djoko Santoso Center, dan bergabung dengan Global Future Institute pada 2015. Aktif pula sebagai Relawan Kesehatan Indonesia, lembaga swadaya masyarakat yang bergerak di advokasi kesehatan. Sejak 2021 bergabung dengan Langit Indonesia Adventure bersama Rusman Rusli, membangun ekosistem di situs megalitikum Gunung Padang, Cianjur, agar kebudayaan setempat terangkat sebagai daerah wisata yang bernilai ekonomi bagi masyarakatnya.",
      },
      en: {
        jabatan: "Director of Local Wisdom, Environment, and Tourism Studies",
        bio: "Born in Jakarta on 10 November. In 2000 he joined Poros Indonesia under Eros Djarot and, in the same year, co-founded Study Club Indonesia Raya with Budi Djarot as a forum for debating economic, social, cultural, political, and defense issues. He has been active at the Djoko Santoso Center, a policy analysis body, since 2014, and joined the Global Future Institute in 2015. He also volunteers with Relawan Kesehatan Indonesia, a civil society organization working on health advocacy. Since 2021 he has worked with Langit Indonesia Adventure alongside Rusman Rusli, building an ecosystem around the Gunung Padang megalithic site in Cianjur so that local culture is recognized as a destination that brings economic value to the surrounding community.",
      },
    },
  },
  {
    nama: "Neisya Aulia",
    foto: "/images/placeholder-pengurus-gfi-perempuan.jpg",
    teks: {
      id: {
        jabatan: "Direktur Diplomasi Publik dan Pemberdayaan Ekonomi Kreatif",
        bio: "Profesional muda yang menjabat sebagai Direktur PT Agro Tani Abadi, perusahaan yang bergerak di bidang ekspor produk pertanian. Lulusan jurusan Hubungan Internasional BINUS University dengan pemahaman pada perdagangan internasional, strategi ekspor, dan pengelolaan hubungan bisnis lintas negara. Sebelum menempati posisi tersebut ia magang sebagai jurnalis di GFI, tempat ia mempelajari dinamika global di bidang politik, ekonomi, dan perdagangan — pengalaman yang memperkaya perspektifnya menghadapi regulasi internasional. Memimpin sejumlah inisiatif pengembangan mutu produk ekspor dan perluasan jaringan mitra dagang, dengan komitmen memberdayakan petani lokal melalui akses yang lebih luas ke pasar ekspor.",
      },
      en: {
        jabatan:
          "Director of Public Diplomacy and Creative Economy Empowerment",
        bio: "A young professional serving as Director of PT Agro Tani Abadi, a company working in agricultural exports. A graduate in International Relations from BINUS University, she brings an understanding of international trade, export strategy, and managing cross-border business relationships. Before taking up the role she interned as a journalist at GFI, where she studied global dynamics in politics, economics, and trade — experience that sharpened her perspective on international regulation. She leads initiatives to improve export product quality and widen the network of trading partners, with a commitment to empowering local farmers through broader access to export markets.",
      },
    },
  },
];
