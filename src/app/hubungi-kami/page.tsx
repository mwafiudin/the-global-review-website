import type { Metadata } from "next";
import {
  ArrowRight,
  ChatCircleText,
  Clock,
  EnvelopeSimple,
  FacebookLogo,
  Handshake,
  MapPin,
  Newspaper,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/PageHeader";
import { ContactForm } from "@/components/ContactForm";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Hubungi Kami",
  description:
    "Hubungi redaksi The Global Review — kiriman tulisan, hak jawab, kerja sama, dan pertanyaan umum.",
};

const mail = (subjek: string) =>
  `mailto:${site.email}?subject=${encodeURIComponent(subjek)}`;

const kanal = [
  {
    icon: Newspaper,
    judul: "Redaksi & Hak Jawab",
    teks: "Kiriman opini dan analisis, koreksi, atau hak jawab atas pemberitaan.",
    aksi: "Surel redaksi",
    href: mail("Redaksi & Hak Jawab — The Global Review"),
  },
  {
    icon: Handshake,
    judul: "Kerja Sama & Kemitraan",
    teks: "Kolaborasi riset, penyelenggaraan acara, dan kemitraan media.",
    aksi: "Ajukan kerja sama",
    href: mail("Kerja Sama & Kemitraan — The Global Review"),
  },
  {
    icon: ChatCircleText,
    judul: "Pertanyaan Umum",
    teks: "Pertanyaan lain seputar The Global Review dan Global Future Institute.",
    aksi: "Isi formulir",
    href: "#form",
  },
];

const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
  "Jl. Iskandarsyah Raya No. 7, Kebayoran Baru, Jakarta Selatan"
)}&z=15&output=embed`;

export default function HubungiKamiPage() {
  return (
    <>
      <PageHeader
        title="Hubungi Kami"
        icon={ChatCircleText}
        lead="Pilih kanal yang sesuai agar pesan Anda langsung sampai ke tim yang tepat."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 pb-20">
        {/* Kanal per tujuan */}
        <div className="grid gap-4 sm:grid-cols-3">
          {kanal.map((k) => {
            const Icon = k.icon;
            return (
              <a
                key={k.judul}
                href={k.href}
                className="group flex flex-col rounded-2xl border border-line bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-accent ring-1 ring-inset ring-line">
                  <Icon size={20} weight="regular" />
                </span>
                <p className="mt-4 font-display text-base font-bold text-ink">
                  {k.judul}
                </p>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-body">
                  {k.teks}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                  {k.aksi}
                  <ArrowRight
                    size={13}
                    weight="bold"
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </a>
            );
          })}
        </div>

        {/* Form + info */}
        <div
          id="form"
          className="mt-12 grid scroll-mt-24 gap-12 lg:grid-cols-[1fr_380px]"
        >
          <div>
            <h2 className="mb-6 border-b border-line pb-4 text-xs font-bold uppercase tracking-[0.16em] text-ink md:text-sm">
              Kirim Pesan
            </h2>
            <ContactForm />
          </div>

          <aside className="space-y-4">
            {/* Peta lokasi */}
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <iframe
                src={mapSrc}
                title="Lokasi kantor Global Future Institute"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="aspect-[4/3] w-full grayscale-[0.3]"
              />
            </div>

            {/* Alamat */}
            <div className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
              <MapPin size={20} weight="regular" className="shrink-0 text-brand" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink">
                  Alamat
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-body">
                  DARIA Building, Suite 402
                  <br />
                  Jl. Iskandarsyah Raya No. 7
                  <br />
                  Kebayoran Baru, Jakarta Selatan
                </p>
              </div>
            </div>

            {/* Surel */}
            <div className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
              <EnvelopeSimple
                size={20}
                weight="regular"
                className="shrink-0 text-brand"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink">
                  Surel
                </p>
                <a
                  href={`mailto:${site.email}`}
                  className="mt-1.5 block break-all text-sm text-body transition-colors hover:text-accent"
                >
                  {site.email}
                </a>
              </div>
            </div>

            {/* Jam operasional */}
            <div className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
              <Clock size={20} weight="regular" className="shrink-0 text-brand" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink">
                  Jam Operasional
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-body">
                  Senin&ndash;Jumat &middot; 09.00&ndash;17.00 WIB
                </p>
              </div>
            </div>

            {/* Sosial */}
            <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink">
                Ikuti Kami
              </p>
              <div className="flex items-center gap-1">
                {[
                  {
                    href: site.social.facebook,
                    Icon: FacebookLogo,
                    label: "Facebook",
                  },
                  { href: site.social.twitter, Icon: XLogo, label: "X" },
                  {
                    href: site.social.youtube,
                    Icon: YoutubeLogo,
                    label: "YouTube",
                  },
                ].map(({ href, Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-meta transition-colors hover:bg-canvas hover:text-accent"
                  >
                    <Icon size={17} weight="regular" />
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
