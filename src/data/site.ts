export const site = {
  name: "The Global Review",
  tagline: "Pemandu Informasi Perkembangan Dunia",
  description:
    "Media online yang dimiliki Global Future Institute. The Global Review portal berita politik dan geopolitik terpercaya di Indonesia.",
  owner: "Global Future Institute (GFI)",
  email: "redaksi.theglobalreview@gmail.com",
  address:
    "DARIA Building, Suite 402, Jl. Iskandarsyah Raya No. 7, Kebayoran Baru, Jakarta Selatan",
  social: {
    facebook: "https://www.facebook.com/theglobalreviewcom/",
    twitter: "https://twitter.com/GlobalReview07",
    youtube: "https://www.youtube.com/results?search_query=global+review+channel",
    rss: "/feed",
  },
  copyright: `Copyright © 2008-${new Date().getFullYear()} The Global Review`,
};

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export const topBarMenu: NavItem[] = [
  { label: "Tentang Kami", href: "/tentang-tgr" },
  { label: "Bedah Buku", href: "/bedah-buku" },
  { label: "Redaksi", href: "/redaksi" },
  { label: "Galeri", href: "/gallery" },
  { label: "Podcast", href: "/podcast" },
  { label: "Hubungi Kami", href: "/hubungi-kami" },
];

export const mainMenu: NavItem[] = [
  { label: "Analisis", href: "/category/analisis" },
  {
    label: "Internasional",
    href: "/category/internasional",
    children: [
      { label: "Asia Tenggara", href: "/category/internasional/asia-tenggara" },
      { label: "Asia Timur", href: "/category/internasional/asia-timur" },
      { label: "Asia Selatan", href: "/category/internasional/asia-selatan" },
      { label: "Asia Tengah", href: "/category/internasional/asia-tengah" },
      { label: "Australia", href: "/category/internasional/australia" },
      { label: "Timur Tengah", href: "/category/internasional/timur-tengah" },
      { label: "Afrika", href: "/category/internasional/afrika" },
      { label: "Amerika Latin", href: "/category/internasional/amerika-latin" },
    ],
  },
  { label: "Geopolitik", href: "/category/geopolitik" },
  { label: "Politik-Keamanan", href: "/category/politik-keamanan" },
  { label: "Ekonomi & Bisnis", href: "/category/ekonomi-bisnis" },
];

/** Isi menu "Lainnya", ditata dalam kelompok agar tidak tersembunyi. */
export const lainnyaGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Isu",
    items: [
      { label: "Diplomasi", href: "/category/diplomasi" },
      { label: "Hukum", href: "/category/hukum" },
      { label: "Sosial", href: "/category/sosial" },
      { label: "Budaya", href: "/category/budaya" },
      { label: "Lingkungan Hidup", href: "/category/lingkungan-hidup" },
      { label: "Sains & Teknologi", href: "/category/sains-teknologi" },
      { label: "Kesehatan", href: "/category/kesehatan" },
    ],
  },
  {
    label: "Liputan Khusus",
    items: [
      { label: "Sorot Tokoh", href: "/category/sorot-tokoh" },
      { label: "Features", href: "/category/features" },
      { label: "Media", href: "/category/media" },
    ],
  },
  {
    label: "Kanal",
    items: [
      { label: "Bedah Buku", href: "/bedah-buku" },
      { label: "Podcast", href: "/podcast" },
      { label: "Galeri", href: "/gallery" },
    ],
  },
];

export const categoryNames: Record<string, string> = {
  analisis: "Analisis",
  internasional: "Internasional",
  "internasional/asia-tenggara": "Asia Tenggara",
  "internasional/asia-timur": "Asia Timur",
  "internasional/asia-selatan": "Asia Selatan",
  "internasional/asia-tengah": "Asia Tengah",
  "internasional/australia": "Australia",
  "internasional/timur-tengah": "Timur Tengah",
  "internasional/afrika": "Afrika",
  "internasional/amerika-latin": "Amerika Latin",
  diplomasi: "Diplomasi",
  "politik-keamanan": "Politik-Keamanan",
  hukum: "Hukum",
  geopolitik: "Geopolitik",
  "ekonomi-bisnis": "Ekonomi & Bisnis",
  sosial: "Sosial",
  budaya: "Budaya",
  "lingkungan-hidup": "Lingkungan Hidup",
  "sains-teknologi": "Sains & Teknologi",
  kesehatan: "Kesehatan",
  "sorot-tokoh": "Sorot Tokoh",
  features: "Features",
  media: "Media",
};

export const partnerLinksIndonesia = [
  { label: "Kemlu.go.id", href: "https://kemlu.go.id" },
  { label: "Kemhan.go.id", href: "https://kemhan.go.id" },
  { label: "NU.or.id", href: "https://nu.or.id" },
  { label: "Kompas.com", href: "https://kompas.com" },
  { label: "The Jakarta Post", href: "https://thejakartapost.com" },
  { label: "Obsession News", href: "https://obsessionnews.com" },
  { label: "Opini Indonesia", href: "https://opiniindonesia.com" },
  { label: "Pena Merah Putih", href: "https://penamerahputih.com" },
];

export const partnerLinksInternational = [
  { label: "Strategic Culture", href: "https://strategic-culture.org" },
  { label: "Global Research", href: "https://globalresearch.ca" },
  { label: "The Duran", href: "https://theduran.com" },
  { label: "Consortium News", href: "https://consortiumnews.com" },
  { label: "Journal NEO", href: "https://journal-neo.org" },
  { label: "Voltaire Network", href: "https://voltairenet.org" },
  { label: "MintPress News", href: "https://mintpressnews.com" },
  { label: "Oriental Review", href: "https://orientalreview.org" },
  { label: "Antiwar.com", href: "https://antiwar.com" },
  { label: "Countercurrents", href: "https://countercurrents.org" },
];
