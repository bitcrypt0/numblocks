import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://numberblocks.example";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/mint`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE}/swap`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE}/explore`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
