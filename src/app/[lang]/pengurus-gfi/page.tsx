import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/PageHeader";
import { CompassDivider } from "@/components/Ornaments";

export const metadata: Metadata = {
  title: "Pengurus GFI",
  description: "Susunan Dewan Eksekutif Global Future Institute.",
};

const pengurus = [
  {
    nama: "Hendrajit",
    jabatan: "Direktur Eksekutif",
    foto: "/images/hendrajit-direktur-eksekutif-gfi.jpg",
    bio: "Lahir di Jakarta 1963. Alumnus Fakultas Sosial Politik Universitas Nasional Jakarta. Mantan wartawan Tabloid Detik (1992-1994), ikut merintis Tabloid Detak (1998) hingga menjabat Wakil Pemimpin Redaksi. Memprakarsai berdirinya GFI pada 11 Oktober 2007. Menerbitkan tiga buku, di antaranya Perang Asimetris & Skema Penjajahan Gaya Baru (2019). Kerap menjadi narasumber di SESKO TNI, Lemhanas, dan Kementerian Pertahanan.",
  },
  {
    nama: "Rusman Rusli",
    jabatan:
      "Wakil Direktur Eksekutif bidang Manajemen Perkantoran, Teknologi Informasi dan Keamanan Siber",
    foto: "/images/rusman-direktur-teknologi-informasi-gfi.jpg",
    bio: "Lahir di Jakarta, Juli 1972. Bergabung dengan GFI sejak 2008 sebagai salah satu perintis. Alumnus Fakultas Ekonomi Universitas Nasional, wartawan tabloid DeTAK (1999-2001), jurnalis terbaik versi Yayasan KEHATI dan Lembaga Pers Dr. Supomo (2000). Mengelola berbagai media dan menjalankan bisnis teknologi informasi serta konsultan media.",
  },
  {
    nama: "Harry Samputra Agus",
    jabatan: "Direktur Pengembangan Bisnis dan Pendidikan berbasis Multi-Media",
    foto: "/images/placeholder-pengurus-gfi-pria-1.jpg",
    bio: "Lahir di Jakarta, 1 Oktober 1973. Ketua Dewan Pembina GFI sejak 2009. Founder dan CEO PT Kabarindo Media Utama Internasional serta FAST LAW Coaching Indonesia. Lulusan Fakultas Hukum Universitas Indonesia, aktif sebagai pembicara pelatihan hubungan internasional dan jurnalistik.",
  },
  {
    nama: "Andrianto",
    jabatan: "Direktur Diplomasi Kebudayaan Antar-Bangsa dan Ekspatriat",
    foto: "/images/placeholder-pengurus-gfi-pria-2.jpg",
    bio: "Lahir di Jakarta, 1 Desember 1973. Sarjana Hubungan Internasional Universitas Nasional Jakarta. General Manager International Language Center (ILC) Semarang dan dosen bahasa Inggris di berbagai kampus di Semarang.",
  },
  {
    nama: "M Arief Pranoto",
    jabatan: "Direktur Pengkajian Geopolitik dan Studi Kewilayahan",
    foto: "/images/placeholder-pengurus-gfi-pria-3.jpg",
    bio: "Lahir di Ngawi, Januari 1963. Menggeluti dunia tulis-menulis sejak 1990-an. Bergabung dengan GFI sejak 2009 sebagai Research Associate, dan sejak 2015 memimpin Program Studi Geopolitik dan Kawasan. Aktif di Forum KENARI.",
  },
  {
    nama: "Murniatun Margono",
    jabatan: "Direktur Pengkajian Hukum, Hak-Hak Asasi Manusia dan Kesehatan Global",
    foto: "/images/placeholder-pengurus-gfi-perempuan.jpg",
    bio: "Lulusan Penerbitan Jurnalistik Politeknik Negeri Jakarta (2013), Mahasiswa Berprestasi 2012, dan sarjana hukum Universitas Al Azhar Indonesia (cumlaude). Berpengalaman sebagai reporter di berbagai majalah dan aktif di PMI Jakarta Selatan dan Tangerang Selatan.",
  },
  {
    nama: "Halim Hutagalung",
    jabatan: "Direktur Pengkajian Kearifan Lokal, Lingkungan Hidup dan Pariwisata",
    foto: "/images/placeholder-pengurus-gfi-pria-1.jpg",
    bio: "Lahir di Jakarta, 10 November. Bergabung dengan GFI sejak 2015. Aktif di Relawan Kesehatan Indonesia dan sejak 2021 turut membangun ekosistem wisata di kawasan situs megalitikum Gunung Padang, Cianjur.",
  },
  {
    nama: "Neisya Aulia",
    jabatan: "Direktur Diplomasi Publik dan Pemberdayaan Ekonomi Kreatif",
    foto: "/images/placeholder-pengurus-gfi-perempuan.jpg",
    bio: "Profesional muda, Direktur PT Agro Tani Abadi yang bergerak di ekspor produk pertanian. Lulusan Hubungan Internasional BINUS University. Fokus pada penguatan produk lokal Indonesia di pasar global dan pemberdayaan petani lokal.",
  },
];

const [ketua, ...anggota] = pengurus;

export default function PengurusGfiPage() {
  return (
    <>
      <PageHeader
        title="Pengurus GFI"
        lead="Susunan Dewan Eksekutif Global Future Institute."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 pb-20">
        <div className="mx-auto max-w-[75ch] space-y-5">
          <p className="text-base leading-relaxed">
            Menyadari konstelasi dan dinamika global, regional dan nasional
            yang berkembang dan bergerak dalam skala yang semakin cepat dan tak
            terduga, serta menimbang betapa strategis peran Global Future
            Institute sebagai lembaga think-tank dan kelompok kerja perumus
            kebijakan strategis nasional dan internasional, GFI menata ulang
            dan melakukan penyegaran komposisi Dewan Eksekutif sebagai berikut.
          </p>
        </div>

        <CompassDivider className="mt-10" />

        {/* Sorotan: Direktur Eksekutif */}
        <article className="mt-10 grid overflow-hidden rounded-2xl border border-line bg-surface md:grid-cols-[minmax(0,340px)_1fr]">
          <div className="relative aspect-[4/5] md:aspect-auto">
            <Image
              src={ketua.foto}
              alt={`Potret ${ketua.nama}`}
              fill
              sizes="(min-width: 768px) 340px, 100vw"
              className="object-cover object-top grayscale-[0.15]"
              priority
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-surface/10"
            />
          </div>
          <div className="p-6 md:p-9">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
              Dewan Eksekutif
            </p>
            <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
              {ketua.nama}
            </h2>
            <p className="mt-1.5 text-sm font-semibold text-accent">
              {ketua.jabatan}
            </p>
            <p className="mt-4 text-[15px] leading-relaxed">{ketua.bio}</p>
          </div>
        </article>

        {/* Anggota lainnya */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {anggota.map((p) => (
            <article
              key={p.nama}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={p.foto}
                  alt={`Potret ${p.nama}`}
                  fill
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover object-top grayscale-[0.15] transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
                />
                <h2 className="absolute inset-x-0 bottom-0 p-4 font-display text-lg font-bold leading-tight text-white">
                  {p.nama}
                </h2>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-sm font-semibold text-accent">{p.jabatan}</p>
                <p className="mt-2.5 text-sm leading-relaxed">{p.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
