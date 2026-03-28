import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "常見問題 FAQ",
  description:
    "百家之眼常見問題：什麼是百家之眼、EV 怎麼算、免費試用限制、支援平台等。",
};

const faqs = [
  {
    question: "百家之眼是什麼？",
    answer:
      "百家之眼是一套百家樂 EV（期望值）即時分析系統。我們使用窮舉法精確計算每一手牌的 EV，並透過 LINE Bot 即時推播數據給使用者。簡單來說，我們用數學幫你看懂每一手牌的真實價值。",
  },
  {
    question: "EV 期望值怎麼算的？",
    answer:
      "我們採用窮舉法（Exhaustive Enumeration）。系統會根據牌靴中剩餘的牌，計算所有可能的發牌組合，精確得出莊贏、閒贏、和局的機率，再據此算出每個下注選項的 EV。這不是統計推測，是把所有可能性都算完的精確結果。",
  },
  {
    question: "免費試用有什麼限制？",
    answer:
      "免費試用期間你可以使用核心功能，包括仙人指路（查詢最高 EV 桌台）和基本的 EV 查詢。進階功能如即時跟隨、空投掃描等需要訂閱。試用期間不需要信用卡，加 LINE 好友即可開始。",
  },
  {
    question: "需要下載 APP 嗎？",
    answer:
      "不需要。百家之眼目前透過 LINE Bot 提供服務，只要有 LINE 就能使用。未來我們也會推出 PWA 網頁版，讓你直接在瀏覽器使用，同樣不需要安裝任何程式。",
  },
  {
    question: "百家之眼能保證贏錢嗎？",
    answer:
      "不能，我們也不會做這樣的保證。百家之眼提供的是精確的數學數據，幫助你做出更有依據的判斷。EV 是長期概念，短期任何結果都可能發生。我們相信透明的數學比虛假的保證更有價值。",
  },
  {
    question: "支援哪些平台？",
    answer:
      "目前支援 LINE（iOS/Android/電腦版皆可）。系統監控的是線上百家樂平台的牌面數據，即時計算並推播。未來將推出 PWA 網頁版，支援任何有瀏覽器的裝置。",
  },
  {
    question: "如何開始使用？",
    answer:
      "三步驟就能開始：1) 掃碼或點擊連結加入百家之眼 LINE 好友；2) 在聊天室輸入推廣碼「LUCKY777」獲得 6 小時免費試用；3) 開始使用指令查詢 EV 數據。整個過程不到一分鐘。",
  },
  {
    question: "推薦碼是什麼？",
    answer:
      "推薦碼是我們的推薦獎勵機制。每位用戶都有專屬推薦碼，當你的朋友透過你的推薦碼加入並訂閱，你和你的朋友都能獲得額外的使用天數。詳情請在 LINE Bot 中輸入相關指令查詢。",
  },
];

// JSON-LD structured data for FAQPage
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function FaqPage() {
  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-bg via-primary to-bg py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            常見問題 <span className="text-accent">FAQ</span>
          </h1>
          <p className="text-text-muted text-lg leading-relaxed">
            關於百家之眼，你可能想知道的一切。
          </p>
        </div>
      </section>

      {/* FAQ Items */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group bg-bg-card border border-white/5 rounded-xl overflow-hidden hover:border-accent/30 transition-colors"
            >
              <summary className="flex items-center justify-between cursor-pointer p-6 sm:p-8 list-none">
                <h2 className="text-lg font-semibold pr-4">{faq.question}</h2>
                <span className="shrink-0 text-accent text-xl transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="px-6 pb-6 sm:px-8 sm:pb-8 -mt-2">
                <p className="text-text-muted leading-relaxed">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-bg to-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">還有其他問題？</h2>
          <p className="text-text-muted mb-8">
            歡迎直接在 LINE 上詢問我們，真人客服為你解答。
          </p>
          <Link
            href="/join"
            className="inline-flex items-center px-8 py-4 bg-accent text-primary font-bold text-lg rounded-lg hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
          >
            加入 LINE 好友
          </Link>
        </div>
      </section>
    </>
  );
}
