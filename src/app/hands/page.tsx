import type { Metadata } from "next";
import HandsClient from "./HandsClient";
import { cn } from "@/lib/cn";

const heroPrimaryCta = cn(
  "inline-flex items-center justify-center gap-1.5 font-bold",
  "transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)]",
  "px-6 py-3 text-base rounded-lg",
  "bg-accent text-primary hover:bg-accent-hover shadow-[var(--shadow-1)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]",
  "active:translate-y-px"
);

export const metadata: Metadata = {
  title: "歷史牌局查詢 — 每靴完整牌面與 EV",
  description:
    "查詢百家之眼 MT + DG 歷史牌局資料，依日期、平台、桌號篩選，顯示每靴完整牌面、點數、勝負、正EV 訊號。公開透明，驗證演算法與實戰表現。",
  keywords: [
    "百家樂歷史牌局",
    "百家樂牌局查詢",
    "百家樂EV資料",
    "百家樂牌路歷史",
    "MT百家樂歷史",
    "DG百家樂歷史",
    "百家樂靴歷史",
  ],
  alternates: { canonical: "https://evpro-eye.com/hands" },
  openGraph: {
    title: "歷史牌局查詢 — 百家之眼 EV 分析",
    description: "百家之眼歷史牌局完整資料，每靴牌面、EV 訊號、五路圖一次看。",
    url: "https://evpro-eye.com/hands",
  },
};

export default function HandsPage() {
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
        name: "歷史牌局",
        item: "https://evpro-eye.com/hands",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <section className="bg-gradient-to-b from-bg via-primary to-bg py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            歷史<span className="text-accent">牌局查詢</span>
          </h1>
          <p className="text-text-muted text-base sm:text-lg max-w-2xl mx-auto">
            每靴完整牌面、五路圖、EV 訊號。支援依平台、桌號、日期篩選。
          </p>
        </div>
      </section>

      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <HandsClient />
        </div>
      </section>

      <section className="py-12 px-4 bg-gradient-to-b from-bg to-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">
            想在<span className="text-accent">正 EV 出現的當下</span>收到通知？
          </h2>
          <p className="text-text-muted mb-6 text-sm">
            百家之眼即時監控 27 桌，正 EV 訊號出現即 LINE 推播。
          </p>
          <a
            href="https://lin.ee/PGaRsrg"
            target="_blank"
            rel="noopener noreferrer"
            className={heroPrimaryCta}
          >
            加入 LINE
          </a>
          <p className="mt-3 text-text-muted text-xs">
            推薦碼：<code className="text-accent font-bold">LUCKY777</code>
          </p>
        </div>
      </section>
    </>
  );
}
