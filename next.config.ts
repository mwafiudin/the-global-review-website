import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // picsum.photos sudah dicabut: gambar pengganti kini aset lokal
    // (lib/articles.ts placeholderImage) — foto stok acak tampil seolah
    // foto editorial, dan ketergantungan pihak ketiganya tidak perlu.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      // Featured image artikel dari WordPress. cms.* adalah alamat WordPress
      // sejak cutover domain; host lama dibiarkan sampai peralihan terbukti
      // stabil (runbook docs/peralihan-domain.md tahap 5d).
      {
        protocol: "https",
        hostname: "cms.theglobal-review.com",
        pathname: "/wp-content/uploads/**",
      },
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
  async rewrites() {
    return [
      // Gambar yang disisipkan di badan artikel memakai URL absolut domain
      // lama (±1 dari 5 artikel). Setelah domain utama dilayani Vercel, path
      // uploads diteruskan ke WordPress di cms.* apa adanya — tanpa bedah
      // basis data, dan tautan gambar yang telanjur beredar tetap hidup.
      {
        source: "/wp-content/uploads/:path*",
        destination:
          "https://cms.theglobal-review.com/wp-content/uploads/:path*",
      },
    ];
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
      // Umpan RSS era WordPress: pelanggan feed lama (agregator, pembaca
      // RSS) masih menembak variasi URL-nya — semuanya dipulangkan ke satu
      // umpan situs baru di /feed alih-alih soft-404.
      {
        source: "/comments/feed",
        destination: "/feed",
        permanent: true,
      },
      {
        source: "/category/:path*/feed",
        destination: "/feed",
        permanent: true,
      },
      {
        source: "/:slug/feed",
        destination: "/feed",
        permanent: true,
      },
      // Bookmark lama redaksi: apex kini dilayani Vercel, wp-admin pindah ke
      // cms.*. Temporary (307), bukan permanent — alamat admin tidak layak
      // dipatri di cache browser selamanya.
      {
        source: "/wp-admin/:path*",
        destination: "https://cms.theglobal-review.com/wp-admin/:path*",
        permanent: false,
      },
      {
        source: "/wp-login.php",
        destination: "https://cms.theglobal-review.com/wp-login.php",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
