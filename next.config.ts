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
    ];
  },
};

export default nextConfig;
