import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const articlesDirectory = path.join(process.cwd(), "content");

export interface ArticleMeta {
  title: string;
  slug: string;
  meta_description: string;
  keywords: string[];
  created_date: string;
}

export interface Article extends ArticleMeta {
  content: string; // HTML content
}

export function getAllArticles(): ArticleMeta[] {
  const fileNames = fs
    .readdirSync(articlesDirectory)
    .filter((f) => f.endsWith(".md") && f !== "SEO_ARTICLE_PLAN.md");

  const articles = fileNames.map((fileName) => {
    const fullPath = path.join(articlesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(fileContents);

    return {
      title: data.title,
      slug: data.slug,
      meta_description: data.meta_description,
      keywords: data.keywords || [],
      created_date: data.created_date
        ? String(data.created_date)
        : "2026-01-01",
    } as ArticleMeta;
  });

  // Sort by created_date descending
  articles.sort(
    (a, b) =>
      new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
  );

  return articles;
}

export async function getArticleBySlug(
  slug: string
): Promise<Article | null> {
  const articles = getAllArticles();
  const meta = articles.find((a) => a.slug === slug);
  if (!meta) return null;

  // Find the file by matching slug in frontmatter
  const fileNames = fs
    .readdirSync(articlesDirectory)
    .filter((f) => f.endsWith(".md") && f !== "SEO_ARTICLE_PLAN.md");

  for (const fileName of fileNames) {
    const fullPath = path.join(articlesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    if (data.slug === slug) {
      const processedContent = await remark().use(html).process(content);
      let htmlContent = processedContent.toString();

      // Convert internal relative links to /blog/ paths
      // Handles both (slug-name) and (slug-name.md) formats
      htmlContent = htmlContent.replace(
        /href="(baccarat-[a-z0-9-]+?)(?:\.md)?"/g,
        'href="/blog/$1"'
      );

      return {
        ...meta,
        content: htmlContent,
      };
    }
  }

  return null;
}
