import type { Metadata } from "next";
import StatsClient from "./StatsClient";
import { cn } from "@/lib/cn";

const heroPrimaryCta = cn(
  "inline-flex items-center justify-center gap-1.5 font-bold",
  "transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)]",
  "px-8 py-4 text-lg rounded-lg",
  "bg-accent text-primary hover:bg-accent-hover shadow-lg shadow-accent/20",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]",
  "active:translate-y-px"
);

export const metadata: Metadata = {
  title: "歷史統計數據 — 莊閒勝率、Super6 命中、EV 訊號分析",
  description:
    "查看百家之眼監控的 MT + DG 百家樂歷史統計：莊閒勝率、和局率、Super6 出現頻率、正EV訊號分布，支援近一週 / 近一個月切換。",
  keywords: [
    "百家樂勝率統計",
    "莊閒勝率",
    "Super6命中率",
    "百家樂歷史數據",
    "百家樂EV分析",
    "百家樂統計",
    "和局率",
    "對子出現率",
  ],
  alternates: { canonical: "https://evpro-eye.com/stats" },
  openGraph: {
    title: "歷史統計數據 — 百家之眼 EV 分析",
    description:
      "MT + DG 百家樂莊閒勝率、Super6 命中、正EV訊號歷史統計，一週/一個月切換。",
    url: "https://evpro-eye.com/stats",
  },
};

export default function StatsPage() {
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
        name: "歷史統計",
        item: "https://evpro-eye.com/stats",
      },
    ],
  };

  const datasetJsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "百家之眼百家樂歷史統計數據",
    description:
      "MT + DG 平台百家樂牌局勝率、Super6 出現率、正EV訊號頻率等統計數據，每5分鐘更新",
    creator: {
      "@type": "Organization",
      name: "百家之眼 EVpro Eye",
    },
    temporalCoverage: "2026/..",
    variableMeasured: [
      "莊家勝率",
      "閒家勝率",
      "和局率",
      "Super6 出現率",
      "正EV訊號次數",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-bg via-primary to-bg py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            歷史<span className="text-accent">統計數據</span>
          </h1>
          <p className="text-text-muted text-lg max-w-2xl mx-auto mb-2">
            MT + DG 百家樂牌局統計，包含莊閒勝率、Super6 命中、正EV訊號分布。
          </p>
          <p className="text-text-muted text-sm">
            數據每 5 分鐘更新，不包含個人下注紀錄
          </p>
        </div>
      </section>

      {/* Stats content */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <StatsClient />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-b from-bg to-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            想在<span className="text-accent">正EV出現當下</span>即時收到通知？
          </h2>
          <p className="text-text-muted mb-8">
            百家之眼即時監控 27 桌，正EV訊號出現時 LINE 直接推播，不用盯著數據頁。
          </p>
          <a
            href="https://lin.ee/PGaRsrg"
            target="_blank"
            rel="noopener noreferrer"
            className={heroPrimaryCta}
          >
            加入 LINE
          </a>
          <p className="mt-4 text-text-muted text-sm">
            加入後輸入推薦碼{" "}
            <code className="text-accent font-bold">LUCKY777</code> 即可開始體驗
          </p>
        </div>
      </section>
    </>
  );
}
