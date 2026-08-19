import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      // Featured image artikel dari WordPress. Saat WordPress pindah ke
      // subdomain (cms.*) pada fase cutover, tambahkan host barunya di sini.
      {
        protocol: "https",
        hostname: "theglobal-review.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "www.theglobal-review.com",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
  async redirects() {
    return [
      // Pola URL lama prototype; artikel kini di akar mengikuti permalink
      // WordPress produksi (/{slug}/) agar 5.678 URL terindeks tidak putus.
      {
        source: "/artikel/:slug",
        destination: "/:slug",
        permanent: true,
      },
      // /halaman/1 = duplikat URL dasar rubrik; satu bentuk kanonis saja.
      // Di sini (bukan di page.tsx) supaya jawabannya 308 sungguhan, bukan
      // redirect in-band yang menuntut JavaScript.
      {
        source: "/category/:path*/halaman/1",
        destination: "/category/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
