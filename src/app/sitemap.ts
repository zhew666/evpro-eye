import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";

const BASE_URL = "https://evpro-eye.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/live-data`,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/ev-guide`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/features`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/join`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // Blog article pages
  let articlePages: MetadataRoute.Sitemap = [];
  try {
    const articles = getAllArticles();
    articlePages = articles.map((article) => ({
      url: `${BASE_URL}/blog/${article.slug}`,
      lastModified: new Date(article.created_date),
      changeFrequency: "monthly" as const,
      priority:
        article.slug === "baccarat-math-complete-guide" ? 0.9 : 0.6,
    }));
  } catch {
    // seo-articles directory may not exist yet
  }

  return [...staticPages, ...articlePages];
}
