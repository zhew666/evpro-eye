import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import { notFound } from "next/navigation";

const PILLAR_SLUG = "baccarat-math-complete-guide";

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: "文章不存在" };
  }

  return {
    title: article.title,
    description: article.meta_description,
    keywords: article.keywords,
    alternates: {
      canonical: `https://evpro-eye.com/blog/${slug}`,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const allArticles = getAllArticles();
  const isPillar = slug === PILLAR_SLUG;

  // For pillar page: show all satellite articles
  // For satellite pages: show pillar + 4 related
  const relatedArticles = isPillar
    ? allArticles.filter((a) => a.slug !== slug)
    : [
        ...allArticles.filter((a) => a.slug === PILLAR_SLUG),
        ...allArticles
          .filter((a) => a.slug !== slug && a.slug !== PILLAR_SLUG)
          .slice(0, 4),
      ];

  // Article JSON-LD
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.meta_description,
    datePublished: article.created_date,
    author: {
      "@type": "Organization",
      name: "百家之眼 EVpro Eye",
      url: "https://evpro-eye.com",
    },
    publisher: {
      "@type": "Organization",
      name: "百家之眼 EVpro Eye",
    },
    mainEntityOfPage: `https://evpro-eye.com/blog/${slug}`,
    keywords: article.keywords.join(", "),
  };

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "首頁",
        item: "https://evpro-eye.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "部落格",
        item: "https://evpro-eye.com/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `https://evpro-eye.com/blog/${slug}`,
      },
    ],
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="text-sm text-text-muted mb-8">
        <Link href="/" className="hover:text-text transition-colors">
          首頁
        </Link>
        <span className="mx-2">&gt;</span>
        <Link href="/blog" className="hover:text-text transition-colors">
          部落格
        </Link>
        <span className="mx-2">&gt;</span>
        <span className="text-text">{article.title}</span>
      </nav>

      {/* Pillar badge */}
      {isPillar && (
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-accent/20 text-accent text-xs font-bold rounded-full">
            完整指南
          </span>
        </div>
      )}

      {/* Back to pillar link for satellite pages */}
      {!isPillar && (
        <div className="mb-6">
          <Link
            href={`/blog/${PILLAR_SLUG}`}
            className="inline-flex items-center text-sm text-accent hover:text-accent-hover transition-colors"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            百家樂數學完整指南
          </Link>
        </div>
      )}

      {/* Article Header */}
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-text mb-4 leading-tight">
          {article.title}
        </h1>
        <div className="flex flex-wrap gap-2 mb-4">
          {article.keywords.map((kw) => (
            <span
              key={kw}
              className="text-xs px-2 py-1 bg-primary text-text-muted rounded"
            >
              {kw}
            </span>
          ))}
        </div>
        <time className="text-sm text-text-muted">{article.created_date}</time>
      </header>

      {/* Article Content */}
      <article
        className="prose prose-invert prose-lg max-w-none
          prose-headings:text-text
          prose-p:text-text-muted
          prose-a:text-accent prose-a:no-underline hover:prose-a:underline
          prose-strong:text-text
          prose-blockquote:border-l-accent prose-blockquote:text-text-muted
          prose-code:text-accent prose-code:bg-primary prose-code:px-1 prose-code:rounded
          prose-hr:border-primary-light
          prose-li:text-text-muted
          prose-th:text-text
          prose-td:text-text-muted"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* CTA */}
      <div className="mt-12 p-6 bg-primary/50 border border-accent/20 rounded-xl text-center">
        <p className="text-text mb-3 font-semibold">
          想即時接收 +EV 訊號？
        </p>
        <p className="text-text-muted text-sm mb-4">
          百家之眼 24 小時監控 13 桌，數學幫你做決策。
        </p>
        <a
          href="https://lin.ee/PGaRsrg"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 bg-accent text-primary font-bold rounded-lg hover:bg-accent-hover transition-colors"
        >
          免費加入 LINE Bot
        </a>
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="mt-16 pt-10 border-t border-primary-light">
          <h2 className="text-2xl font-bold text-text mb-6">
            {isPillar ? "系列文章" : "相關文章"}
          </h2>
          <div className="space-y-4">
            {relatedArticles.map((related) => (
              <Link
                key={related.slug}
                href={`/blog/${related.slug}`}
                className={`block p-4 border rounded-lg hover:border-accent/50 transition-colors bg-bg-card ${
                  related.slug === PILLAR_SLUG
                    ? "border-accent/30"
                    : "border-primary-light"
                }`}
              >
                {related.slug === PILLAR_SLUG && (
                  <span className="inline-block px-2 py-0.5 bg-accent/20 text-accent text-xs font-bold rounded mb-2">
                    完整指南
                  </span>
                )}
                <h3 className="text-lg font-semibold text-text hover:text-accent transition-colors">
                  {related.title}
                </h3>
                <p className="text-text-muted text-sm mt-1">
                  {related.meta_description.length > 80
                    ? related.meta_description.slice(0, 80) + "..."
                    : related.meta_description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
