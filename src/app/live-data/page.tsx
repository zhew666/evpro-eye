import type { Metadata } from "next";
import LiveDataClient from "./LiveDataClient";

export const metadata: Metadata = {
  title: "即時牌局數據 — MT 13桌 + DG 14桌 百家樂 EV 監控",
  description:
    "即時查看 MT 13 桌 + DG 14 桌百家樂牌局數據與 EV 期望值分析。加入 LINE Bot 查看完整即時 EV 資訊。",
  keywords: [
    "百家樂即時數據",
    "百家樂EV監控",
    "百家樂期望值",
    "百家樂算牌程式",
    "百家樂數據分析",
    "DG百家樂",
    "MT百家樂",
  ],
  alternates: { canonical: "https://evpro-eye.com/live-data" },
  openGraph: {
    title: "即時牌局數據 — MT 13桌 + DG 14桌 百家樂 EV 監控",
    description:
      "即時查看 MT 13 桌 + DG 14 桌百家樂牌局數據與 EV 期望值分析。加入 LINE Bot 查看完整即時 EV 資訊。",
    url: "https://evpro-eye.com/live-data",
  },
};

export default function LiveDataPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首頁", item: "https://evpro-eye.com" },
      { "@type": "ListItem", position: 2, name: "即時數據", item: "https://evpro-eye.com/live-data" },
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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "百家之眼即時數據監控",
            applicationCategory: "UtilityApplication",
            operatingSystem: "Web",
            description:
              "即時監控 MT 13 桌 + DG 14 桌百家樂牌局，以窮舉法計算每手 EV 期望值",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "TWD",
              description: "加入 LINE Bot 體驗",
            },
          }),
        }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-bg via-primary to-bg py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            即時牌局<span className="text-accent">數據監控</span>
          </h1>
          <p className="text-text-muted text-lg max-w-2xl mx-auto mb-2">
            MT 13 桌 + DG 14 桌百家樂牌局即時更新，每手計算 EV 期望值。
          </p>
          <p className="text-accent text-sm">
            EV 數據加入 LINE Bot 即可查看完整資訊
          </p>
        </div>
      </section>

      {/* Live data */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <LiveDataClient />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-b from-bg to-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            想看完整<span className="text-accent">即時 EV 數據</span>？
          </h2>
          <p className="text-text-muted mb-8">
            加入百家之眼 LINE Bot，即時接收 27 桌完整 EV
            數據、+EV 訊號推播，讓數學幫你做決策。
          </p>
          <a
            href="https://lin.ee/PGaRsrg"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-4 bg-accent text-primary font-bold text-lg rounded-lg hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
          >
            加入 LINE Bot
          </a>
          <p className="mt-4 text-text-muted text-sm">
            加入後輸入推薦碼 <code className="text-accent font-bold">LUCKY777</code> 即可開始體驗
          </p>
        </div>
      </section>
    </>
  );
}
