import type { MetadataRoute } from "next";
import { site } from "@/data/site";

/**
 * Padanan apple-icon untuk Android: tanpa manifest, ikon pintasan layar utama
 * diambil asal-asalan dari favicon dan tampak buram.
 *
 * `theme_color`/`background_color` sengaja tidak diisi — keduanya mewarnai
 * chrome peramban di ponsel, dan tampilan situs sudah final.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.tagline}`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "browser",
    icons: [
      { src: "/tgr-ikon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/tgr-ikon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/tgr-ikon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
