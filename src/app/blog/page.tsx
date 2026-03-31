import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "百家樂數學研究 | 部落格",
  description:
    "百家樂算牌、期望值、破解迷思...用數學看懂百家樂的每一個面向。",
  alternates: { canonical: "https://evpro-eye.com/blog" },
  openGraph: {
    title: "百家樂數學研究 | 部落格",
    description:
      "百家樂算牌、期望值、破解迷思...用數學看懂百家樂的每一個面向。",
    url: "https://evpro-eye.com/blog",
  },
};

export default function BlogListPage() {
  const articles = getAllArticles();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Breadcrumb */}
      <nav className="text-sm text-text-muted mb-8">
        <Link href="/" className="hover:text-text transition-colors">
          首頁
        </Link>
        <span className="mx-2">&gt;</span>
        <span className="text-text">部落格</span>
      </nav>

      <h1 className="text-4xl font-bold mb-4 text-text">百家樂數學研究</h1>
      <p className="text-text-muted mb-12 text-lg">
        用數學看懂百家樂的每一個面向。算牌、期望值、破解迷思——這裡只講數據和邏輯。
      </p>

      <div className="space-y-8">
        {articles.map((article) => {
          const isPillar = article.slug === "baccarat-math-complete-guide";
          return (
            <article
              key={article.slug}
              className={`rounded-lg p-6 hover:border-accent/50 transition-colors bg-bg-card border ${
                isPillar ? "border-accent/30" : "border-primary-light"
              }`}
            >
              <Link href={`/blog/${article.slug}`} className="block group">
                {isPillar && (
                  <span className="inline-block px-3 py-1 bg-accent/20 text-accent text-xs font-bold rounded-full mb-3">
                    完整指南
                  </span>
                )}
                <h2 className="text-xl font-semibold text-text group-hover:text-accent transition-colors mb-3">
                  {article.title}
                </h2>
                <p className="text-text-muted text-sm mb-4 leading-relaxed">
                  {article.meta_description.length > 100
                    ? article.meta_description.slice(0, 100) + "..."
                    : article.meta_description}
                </p>
              </Link>
              <div className="flex flex-wrap gap-2">
                {article.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs px-2 py-1 bg-primary text-text-muted rounded"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
