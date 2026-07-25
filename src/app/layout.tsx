import type { Metadata } from "next";
import { Cardo, Montserrat } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BackToTop } from "@/components/BackToTop";
import { RouteTransition } from "@/components/RouteTransition";
import { SearchProvider } from "@/components/Search";
import { LanguageProvider } from "@/lib/i18n";
import { site } from "@/data/site";
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    default: `${site.name} | ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    type: "website",
    locale: "id_ID",
    siteName: site.name,
    images: [
      {
        url: "/images/the-global-review-brand-stationery.jpg",
        width: 1402,
        height: 1122,
        alt: "The Global Review — jurnalisme independen, analisis mendalam",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    images: ["/images/the-global-review-brand-stationery.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
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
        <LanguageProvider>
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
