import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/403"],
    },
    sitemap: "https://www.nexthire.cloud/sitemap.xml",
  };
}
