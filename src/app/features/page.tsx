import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "功能介紹 — 百家之眼的五大核心功能",
  description:
    "仙人指路、即時跟隨、空投掃描、13 桌同步監控、窮舉法精確計算。了解百家之眼如何用數學幫你找到 +EV 機會。",
  alternates: { canonical: "https://evpro-eye.com/features" },
  openGraph: {
    title: "功能介紹 — 百家之眼的五大核心功能",
    description:
      "仙人指路、即時跟隨、空投掃描、13 桌同步監控、窮舉法精確計算。了解百家之眼如何用數學幫你找到 +EV 機會。",
    url: "https://evpro-eye.com/features",
  },
};

const features = [
  {
    icon: "🧭",
    title: "仙人指路",
    subtitle: "一鍵查詢全場最高 EV",
    description:
      "不知道該看哪桌？仙人指路幫你從 13 桌中找出目前 EV 最高的桌台。一個指令，省去逐桌比較的時間，直接鎖定最有利的機會。",
    highlight: "一鍵找出最佳機會",
  },
  {
    icon: "👁",
    title: "即時跟隨",
    subtitle: "跟隨任一桌台，每手推播 EV",
    description:
      "選定目標桌台後，系統每手自動推播 EV 數據到你的 LINE。莊 EV、閒 EV、牌靴剩餘張數一目了然，不用反覆查詢。",
    highlight: "每手自動推播",
  },
  {
    icon: "🎯",
    title: "空投掃描",
    subtitle: "自動偵測 +EV 並即時通知",
    description:
      "系統 24 小時監控所有桌台，一旦偵測到正 EV（+EV）機會，立即推播通知。你只需要等待通知，不必盯盤。這是最輕鬆的使用方式。",
    highlight: "+EV 自動通知",
  },
  {
    icon: "🖥",
    title: "13 桌同步監控",
    subtitle: "全場覆蓋，不漏任何機會",
    description:
      "百家之眼同時監控 13 張百家樂桌台的牌面變化，即時追蹤每桌的牌靴狀態與 EV 數據。系統不休息，比你更勤奮。",
    highlight: "24 小時全場監控",
  },
  {
    icon: "🔢",
    title: "窮舉法精確計算",
    subtitle: "數學事實，不是猜測",
    description:
      "每一手的 EV 都是透過窮舉法——計算剩餘牌的所有可能組合——得出的精確數學結果。不是統計推測、不是 AI 預測，是把所有可能性都算完的確定答案。",
    highlight: "100% 數學精確",
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-bg via-primary to-bg py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            五大<span className="text-accent">核心功能</span>
          </h1>
          <p className="text-text-muted text-lg leading-relaxed">
            從一鍵查詢到全自動通知，百家之眼提供完整的 EV 分析工具鏈。
          </p>
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {features.map((feat, index) => (
            <div
              key={feat.title}
              className="bg-bg-card border border-white/5 rounded-xl p-8 sm:p-10 hover:border-accent/30 transition-colors"
            >
              <div className="flex items-start gap-6">
                {/* Icon */}
                <div className="shrink-0 w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-3xl">
                  {feat.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-accent text-xs font-mono">
                      0{index + 1}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold">
                      {feat.title}
                    </h2>
                  </div>
                  <p className="text-accent text-sm mb-4">{feat.subtitle}</p>
                  <p className="text-text-muted leading-relaxed mb-4">
                    {feat.description}
                  </p>
                  <span className="inline-block bg-accent/10 text-accent text-xs font-semibold px-3 py-1 rounded-full">
                    {feat.highlight}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-bg to-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            準備好體驗了嗎？
          </h2>
          <p className="text-text-muted text-lg mb-10">
            加入 LINE 好友，輸入推薦碼即可體驗所有功能。
          </p>
          <Link
            href="/join"
            className="inline-flex items-center px-8 py-4 bg-accent text-primary font-bold text-lg rounded-lg hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
          >
            立即體驗
          </Link>
        </div>
      </section>
    </>
  );
}
