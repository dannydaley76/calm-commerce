import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.calmcommerce.net";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/scout",
        "/_next/static/",
        "/brand/",
        "/favicon.ico",
      ],
      disallow: [
        "/scout/connect",
        "/api/",
        "/account",
        "/ideas",
        "/lean-canvas",
        "/metrics",
        "/program",
        "/resume",
        "/signup",
        "/login",
        "/forgot-password",
        "/reset-password",
        "/upgrade",
        "/privacy",
        "/paid-test",
        "/dev",
        "/",
      ],
    },
    host: siteUrl,
  };
}
