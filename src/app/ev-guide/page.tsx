import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "什麼是 EV 期望值？百家樂 EV 完整教學",
  description:
    "用白話解釋 EV（期望值）在百家樂中的意義，了解窮舉法如何精確計算每一手的真實期望值。",
  alternates: { canonical: "https://evpro-eye.com/ev-guide" },
  openGraph: {
    title: "什麼是 EV 期望值？百家樂 EV 完整教學",
    description:
      "用白話解釋 EV（期望值）在百家樂中的意義，了解窮舉法如何精確計算每一手的真實期望值。",
    url: "https://evpro-eye.com/ev-guide",
  },
};

const sections = [
  {
    id: "what-is-ev",
    title: "什麼是 EV（期望值）？",
    content: [
      "EV 是 Expected Value 的縮寫，中文叫「期望值」。簡單來說，它代表你每次下注時，長期平均能賺到（或虧損）多少錢。",
      "假設你投注 100 元，EV 為 +2%，代表長期來看，平均每次下注你會賺 2 元。反過來，EV 為 -2% 就代表每次平均虧 2 元。",
      "EV 是數學概念，不是玄學，不是預測。它告訴你的是「機率加權後的平均結果」。",
    ],
  },
  {
    id: "ev-in-baccarat",
    title: "百家樂中的 EV",
    content: [
      "在標準 8 副牌百家樂中，莊家的庄優勢約 1.06%，閒家約 1.24%。這是所有牌都在牌靴裡時的「初始 EV」。",
      "但隨著每一手牌發出，牌靴中的牌組成會改變。某些牌被移除後，莊閒的勝率會產生變化——這就是 EV 會「浮動」的原因。",
      "當剩餘牌的組成使得某一方的 EV 變成正值（+EV），代表此時下注該方在數學上是有利的。這種機會雖然不常見，但確實存在。",
    ],
  },
  {
    id: "exhaustive-method",
    title: "窮舉法：最精確的計算方式",
    content: [
      "窮舉法的原理很直觀：把剩餘牌的「所有可能組合」都算一遍，得出每種結果（莊贏、閒贏、和局）的精確機率。",
      "舉例：如果牌靴中還剩 200 張牌，系統會計算所有可能的發牌組合，算出莊贏的機率是多少、閒贏是多少、和局是多少，然後用這些機率算出 EV。",
      "這和「統計法」或「AI 預測」完全不同。統計法是根據歷史資料推測，有誤差；窮舉法是把所有可能性都算完，結果是精確的。",
    ],
  },
  {
    id: "how-to-read",
    title: "如何看懂 EV 數據？",
    content: [
      "百家之眼會顯示三個數值：莊 EV、閒 EV、和 EV。",
      "當你看到「閒 EV: +1.5%」，代表此時下注閒家，每 100 元長期平均能賺 1.5 元。這就是一個正 EV 機會。",
      "一般來說，EV 在 -1% 到 -2% 之間是正常的（因為賭場本來就有莊優勢）。但當 EV 翻正，就是數學上值得關注的時刻。",
    ],
  },
  {
    id: "important-notes",
    title: "重要觀念",
    content: [
      "EV 是長期概念，不是「這一手一定贏」。即使 EV 是 +3%，這一手你仍然可能輸。但如果你只在 +EV 時下注，長期數學站在你這邊。",
      "百家之眼不預測結果、不帶單、不保證贏錢。我們做的是把數學事實攤在你面前，決策權永遠在你手上。",
      "把 EV 當作「天氣預報」——它告訴你下雨的機率，但不保證一定下雨。你要做的是根據機率做出合理的準備。",
    ],
  },
];

export default function EvGuidePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-bg via-primary to-bg py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            什麼是 <span className="text-accent">EV 期望值</span>？
          </h1>
          <p className="text-text-muted text-lg leading-relaxed">
            用最白話的方式，帶你理解百家樂中最重要的數學概念。
          </p>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <nav className="bg-bg-card border border-white/5 rounded-xl p-6">
            <p className="text-sm font-semibold text-accent mb-3">
              目錄
            </p>
            <ul className="space-y-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-text-muted hover:text-accent text-sm transition-colors"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 px-4">
        <div className="max-w-3xl mx-auto space-y-16">
          {sections.map((section) => (
            <article key={section.id} id={section.id}>
              <h2 className="text-2xl font-bold mb-6 text-accent">
                {section.title}
              </h2>
              <div className="space-y-4">
                {section.content.map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-text-muted leading-relaxed"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          ))}

          {/* Chart placeholder */}
          <div className="bg-bg-card border border-white/5 rounded-xl p-10 text-center">
            <p className="text-text-muted text-sm mb-2">
              [EV 變化示意圖 — 即將上線]
            </p>
            <div className="h-48 bg-primary/50 rounded-lg flex items-center justify-center">
              <p className="text-text-muted text-xs">
                顯示牌靴進行中，莊/閒 EV 的即時變化曲線
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-primary to-bg-card border border-accent/20 rounded-xl p-10 text-center">
            <h3 className="text-2xl font-bold mb-4">
              想即時取得 EV 數據？
            </h3>
            <p className="text-text-muted mb-8">
              加入百家之眼 LINE，輸入推薦碼即可體驗即時預期收益分析。
            </p>
            <Link
              href="/join"
              className="inline-flex items-center px-8 py-4 bg-accent text-primary font-bold text-lg rounded-lg hover:bg-accent-hover transition-colors"
            >
              立即體驗
            </Link>
            <p className="text-text-muted text-sm mt-4">
              推薦碼：<code className="text-accent font-bold">LUCKY777</code>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
