import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { CompassDivider, CompassPoint } from "@/components/Ornaments";

export const metadata: Metadata = {
  title: "Tentang Global Future Institute",
  description:
    "Global Future Institute (GFI) adalah lembaga pengkajian global dan politik luar negeri yang didirikan 11 Oktober 2007.",
};

const isuPokok = [
  "Pergeseran Politik Luar Negeri Amerika Serikat dari Waktu ke Waktu.",
  "Bangkitnya Cina sebagai Kekuatan Adidaya Baru.",
  "Kemunculan Shanghai Cooperation Organization (SCO) yang dimotori Cina dan Rusia.",
  "Kemunculan India sebagai Kekuatan Baru di Asia.",
  "Berbagai Konflik Daerah Perbatasan yang terjadi di kawasan ASEAN.",
  "Lemahnya Posisi Tawar Indonesia di ASEAN.",
  "Belum Selarasnya Kebijakan Luar Negeri dan Diplomasi.",
  "Potensi Ancaman dari Asia Timur yang muncul dari Jepang dan Cina.",
];

const misi = [
  "Membangun kesadaran publik tentang situasi global beserta ekses-eksesnya, sehingga masyarakat Indonesia memiliki peta dan gambaran yang jelas dalam rangka upayanya untuk memainkan peran dirinya sebagai pemain kunci dalam persaingan global.",
  "Menjadikan GFI sebagai rujukan dan model dalam memahami konstalasi global, sekaligus solusi agar bisa memposisikan diri sebagai pemain yang setara dalam menjalin kerjasama internasional dengan kekuatan-kekuatan adidaya.",
  "Secara bertahap akan menyediakan sumber-sumber kepustakaan maupun akses informasi berkenaan dengan perkembangan dinamika negara-negara adidaya maupun hubungan negara-negara adidaya dengan berbagai negara di beberapa kawasan regional.",
  "Mendorong berbagai program kegiatan yang bertujuan meningkatkan kesadaran masyarakat Indonesia maupun dunia internasional, terhadap berbagai konspirasi dan skenario yang disusun dan dirancang oleh berbagai kekuatan global.",
  "Memanfaatkan dan mendayagunakan teknologi informasi dan komunikasi, khususnya website, untuk mensosialisasikan dan menerbitkan berbagai riset, kajian, analisis, maupun liputan yang menjadi fokus perhatian GFI sebagai lembaga think-tank.",
  "Mendorong terselenggaranya pendidikan non-formal seperti kursus-kursus dan ketrampilan di bidang diplomasi, studi-studi strategis dan hubungan internasional, intelijen, bahasa-bahasa asing, dan lain sebagainya.",
  "Membangun jaringan dan komunitas peminat politik luar negeri dan masalah-masalah internasional, serta membangun jaringan dan komunitas bisnis global.",
];

const fokusKegiatan = [
  "Program penyelenggaraan berbagai seri pertemuan baik internal maupun eksternal (Meetings Program).",
  "Program Studi (Studies Program).",
  "Program Korporasi (Corporate Program).",
  "Program Penggalangan Dana dan Pengembangan Bisnis.",
  "Program Rekrutmen Fellow Expert dan Network Associate.",
  "Program Administrasi Kelembagaan dan Keanggotaan.",
];

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-14 font-display text-xl font-extrabold tracking-tight text-ink">
      {children}
    </h2>
  );
}

export default function TentangGfiPage() {
  return (
    <>
      <PageHeader
        title="Tentang Global Future Institute"
        lead="Lembaga pengkajian global dan politik luar negeri, berdiri 11 Oktober 2007."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 pb-20">
        <div className="mx-auto max-w-[75ch] space-y-5">
          <p className="drop-cap text-base leading-relaxed">
            Global Future Institute, yang untuk seterusnya kami sebut GFI,
            didirikan pada tanggal 11 Oktober 2007. GFI berdiri atas prakarsa
            lima orang anggota pendiri: Hendrajit, Harri Samputra Agus,
            Adriyanto, Joko Wiyono, dan Hamzah Fansyuri.
          </p>
          <p className="text-base leading-relaxed">
            Gagasan yang melatarbelakangi berdirinya GFI adalah karena saat ini
            dirasa perlu untuk memberdayakan politik luar negeri Indonesia di
            tengah-tengah semakin menajamnya persaingan berskala global di
            antara negara-negara adidaya seperti Amerika Serikat, Republik
            Rakyat Cina, Uni Eropa, dan Rusia.
          </p>
          <p className="text-base leading-relaxed">
            Sebagai negara yang sejak awal kemerdekaan menganut politik luar
            negeri yang bebas dan aktif, GFI beranggapan sudah selayaknya bagi
            Indonesia untuk mampu mengantisipasi perubahan-perubahan global di
            kemudian hari. Maka, GFI bertekad melalui program dan
            kegiatan-kegiatan yang dilakukan, menciptakan suatu situasi yang
            kondusif agar politik luar negeri Indonesia bisa ikut mempengaruhi
            perkembangan pada skala global dengan memobilisasi seluruh
            sumberdaya nasional yang kita miliki.
          </p>
          <p className="text-base leading-relaxed">
            Dengan demikian, GFI sebagai lembaga non-partisan dan nirlaba,
            menaruh prioritas program kegiatannya untuk melibatkan jaringan
            pemikir strategis yang berbasis di berbagai sektor strategis baik
            pemerintah maupun swasta. Antara lain, kalangan departemen luar
            negeri, perguruan tinggi negeri dan swasta, lembaga-lembaga
            think-tank yang bergerak dalam pengkajian strategis dan hubungan
            internasional, partai politik, organisasi massa, tokoh-tokoh
            berbasis keagamaan, media massa, dan lembaga swadaya masyarakat
            pada umumnya.
          </p>

          <SubHeading>Isu-Isu Pokok yang Menjadi Fokus Utama GFI</SubHeading>
          <p className="text-base leading-relaxed">
            Dalam rangka memberdayakan politik luar negeri Indonesia, maka
            mutlak perlu untuk menguasai wawasan dan pemahaman yang mendalam
            mengenai konstalasi dan dinamika hubungan antar negara-negara
            adidaya maupun situasi keamanan regional, khususnya di kawasan Asia
            Tenggara (ASEAN) di mana negara kita merupakan salah satu motor
            penggerak utama.
          </p>
          <ul className="space-y-2.5">
            {isuPokok.map((isu) => (
              <li key={isu} className="flex gap-3 text-base leading-relaxed">
                <CompassPoint />
                {isu}
              </li>
            ))}
          </ul>

          <figure className="py-6">
            <CompassDivider />
            <blockquote className="mx-auto mt-8 max-w-xl text-center text-2xl italic leading-snug text-ink md:text-[28px]">
              Indonesia sebagai poros dan solusi masa depan global.
            </blockquote>
            <figcaption className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-meta">
              Visi Global Future Institute
            </figcaption>
            <CompassDivider className="mt-8" />
          </figure>

          <SubHeading>Misi</SubHeading>
          <ul className="space-y-3">
            {misi.map((m) => (
              <li key={m} className="flex gap-3 text-base leading-relaxed">
                <CompassPoint />
                {m}
              </li>
            ))}
          </ul>

          <SubHeading>Fokus Kegiatan</SubHeading>
          <p className="text-base leading-relaxed">
            Untuk mencapai visi dan misi tersebut, GFI menitikberatkan
            kegiatannya pada beberapa program utama:
          </p>
          <ul className="space-y-2.5">
            {fokusKegiatan.map((f) => (
              <li key={f} className="flex gap-3 text-base leading-relaxed">
                <CompassPoint />
                {f}
              </li>
            ))}
          </ul>
          <p className="text-base leading-relaxed">
            Agar tercapai tujuan jangka pendek dari rangkaian kegiatan tersebut
            di atas, maka GFI meluncurkan website www.theglobal-review.com
            sebagai sarana untuk menerbitkan semua output dari kegiatan-kegiatan
            GFI seperti seminar, hasil riset dan studi, maupun
            kegiatan-kegiatan lainnya.
          </p>
        </div>
      </div>
    </>
  );
}
