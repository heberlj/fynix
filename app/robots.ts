import type { MetadataRoute } from "next";
import { urlBaseSeo } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = urlBaseSeo();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
