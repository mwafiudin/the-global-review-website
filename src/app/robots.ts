import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Endpoint internal (search/subscribe/vote/revalidate) — bukan konten.
      disallow: "/api/",
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
