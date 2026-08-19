import type { Metadata } from "next";
import { Cardo, Montserrat } from "next/font/google";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BackToTop } from "@/components/BackToTop";
import { RouteTransition } from "@/components/RouteTransition";
import { SearchProvider } from "@/components/Search";
import { LanguageProvider } from "@/lib/i18n";
import { tFor } from "@/lib/dictionary/ui";
import { LANGS, isLocale } from "@/lib/locale-routing";
import { site } from "@/data/site";
import "../globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const cardo = Cardo({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-cardo",
  display: "swap",
});

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = tFor(isLocale(lang) ? lang : "id");
  const judul = `${site.name} | ${t(site.tagline)}`;
  const deskripsi = t(site.description);
  return {
    metadataBase: new URL(site.url),
    title: {
      default: judul,
      template: `%s | ${site.name}`,
    },
    description: deskripsi,
    openGraph: {
      title: judul,
      description: deskripsi,
      type: "website",
      locale: lang === "en" ? "en_US" : "id_ID",
      siteName: site.name,
      images: [
        {
          url: "/images/the-global-review-brand-stationery.jpg",
          width: 1402,
          height: 1122,
          alt: t("The Global Review — jurnalisme independen, analisis mendalam"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: judul,
      description: deskripsi,
      images: ["/images/the-global-review-brand-stationery.jpg"],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  // Proxy menjamin nilainya id/en; guard ini menjaga akses langsung yang aneh.
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* Anti-kedip dark mode: skrip statis blocking (disengaja, sebelum paint). */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/theme-init.js" />
      </head>
      <body className={`${montserrat.variable} ${cardo.variable} antialiased`}>
        {/* Tekstur kertas: sentuhan material halus di seluruh halaman */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-40 bg-[url('/images/tekstur-kertas-editorial.jpg')] bg-cover bg-center opacity-[0.22] mix-blend-multiply dark:opacity-[0.06]"
        />
        <LanguageProvider lang={lang}>
          <SearchProvider>
            <SiteHeader />
            <main>
              <RouteTransition>{children}</RouteTransition>
            </main>
            <SiteFooter />
            <BackToTop />
          </SearchProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
