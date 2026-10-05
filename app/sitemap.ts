import type { MetadataRoute } from "next";

const publicRoutes = ["", "/login", "/help"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((path, index) => ({
    url: `https://sitlearning.uz${path}`,
    lastModified,
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : index === 1 ? 0.9 : 0.6,
  }));
}
