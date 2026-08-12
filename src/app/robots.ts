import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/jobs", "/jobs/*", "/companies", "/companies/*", "/about", "/pricing", "/help", "/cookies", "/privacy", "/terms"],
      disallow: [
        "/api/",
        "/403",
        "/admin",
        "/admin/*",
        "/recruiter",
        "/recruiter/*",
        "/dashboard",
        "/dashboard/*",
        "/applications",
        "/applications/*",
        "/profile",
        "/profile/*",
        "/messages",
        "/messages/*",
        "/resume-studio",
        "/resume-studio/*",
        "/settings",
        "/settings/*",
      ],
    },
    sitemap: "https://www.nexthire.cloud/sitemap.xml",
  };
}
