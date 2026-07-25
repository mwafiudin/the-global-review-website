import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/PageHeader";
import { EndMark } from "@/components/Ornaments";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Tentang The Global Review",
  description:
    "The Global Review merupakan media online yang dimiliki Global Future Institute.",
};

const paragraphs = [
  "The Global Review merupakan media online yang dimiliki Global Future Institute. Kehadiran The Global Review dengan alamat www.theglobal-review.com mendukung dalam menyebarkan ide-ide terhadap isu-isu yang menjadi kajian dari Global Future Institute.",
  "Website The Global Review merupakan sarana menginformasikan kegiatan-kegiatan GFI seperti seminar, hasil riset dan studi, maupun kegiatan-kegiatan lainnya.",
  "Dasar pemikirannya adalah, bahwa semua rangkaian kegiatan tersebut, pada akhirnya harus bermuara pada dihasilkannya produk-produk penerbitan buku, jurnal, monograf, maupun sarana publikasi lainnya.",
  "Untuk menjembatani itu semua, maka website GFI www.theglobal-review.com untuk sementara akan kami jadikan sebagai basis data maupun informasi, yang mana seluruh lapisan masyarakat baik di Indonesia maupun mancanegara, bisa mengakses secara langsung informasi maupun kajian-kajian yang dibuat oleh GFI.",
  "Sehingga seluruh hasil seri pertemuan, riset dan studi, maupun liputan-liputan yang bersifat analisis berita mengenai perkembangan dan dinamika global dan regional, bisa kami sosialisasikan secepat mungkin kepada masyarakat luas melalui situs kami. Dan terdokumentasikan secara sistematis baik melalui situs theglobal-review.com baik melalui rubrik-rubrik yang ada didalamnya maupun yang terdapat dalam rubrik arsip.",
];

export default function TentangTgrPage() {
  return (
    <>
      <PageHeader
        title="Tentang The Global Review"
        lead="Pemandu informasi perkembangan dunia sejak 2008."
      />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          <div>
            <Image
              src="/images/the-global-review-brand-stationery.jpg"
              alt="Identitas brand The Global Review: jurnal navy, kompas kuningan, dan koran"
              width={1402}
              height={1122}
              priority
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="mb-8 aspect-[4/3] w-full rounded-xl object-cover"
            />
            <div className="space-y-5">
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  className={`max-w-[70ch] text-base leading-relaxed ${i === 0 ? "drop-cap" : ""}`}
                >
                  {p}
                </p>
              ))}
            </div>
            <EndMark className="pt-4" />
          </div>
          <Sidebar />
        </div>
      </div>
    </>
  );
}
