import type { MetadataRoute } from "next";

const routes = [
  "",
  "/dashboard",
  "/product",
  "/security",
  "/how-it-works",
  "/pricing",
  "/company",
  "/legal/terms",
  "/legal/privacy",
  "/legal/disclosures"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://neobank.example";
  const now = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7
  }));
}
