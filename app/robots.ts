import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/teacher/",
        "/my-courses/",
        "/assignments/",
        "/assessments/",
        "/attendance/",
        "/calendar/",
        "/certificates/",
        "/integrations/",
        "/notifications/",
        "/payments/",
        "/results/",
        "/users/",
      ],
    },
    sitemap: "https://sitlearning.uz/sitemap.xml",
    host: "https://sitlearning.uz",
  };
}
