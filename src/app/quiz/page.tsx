import type { Metadata } from "next";
import QuizClient from "./QuizClient";

export const metadata: Metadata = {
  title: "看路科學測驗 — 真實牌局 10 題驗證你的看路準確率",
  description:
    "用百家之眼資料庫近 7 天真實牌局抽 10 題，測驗你看路法的準確率，和隨機基準 45.86%、系統命中率比較。看路是科學還是玄學，10 題見真章。",
  keywords: [
    "看路法",
    "百家樂測驗",
    "看路準確率",
    "百家樂科學驗證",
    "百家樂牌路分析",
    "大路下三路",
    "百家樂隨機",
    "看路迷思",
  ],
  alternates: { canonical: "https://evpro-eye.com/quiz" },
  openGraph: {
    title: "看路科學測驗 — 百家之眼 10 題見真章",
    description:
      "真實牌局 10 題，測你的看路準確率 vs 隨機 vs 系統。你看得懂路嗎？",
    url: "https://evpro-eye.com/quiz",
  },
};

export default function QuizPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首頁", item: "https://evpro-eye.com" },
      { "@type": "ListItem", position: 2, name: "看路測驗", item: "https://evpro-eye.com/quiz" },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "這個測驗用的是真實牌局嗎？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "是。題目來自百家之眼資料庫近 7 天已結束的真實靴（MT + DG 平台），每題從該靴裡隨機挑一手作為題目點，讓你先看大路與下三路再猜下一手。",
        },
      },
      {
        "@type": "Question",
        name: "隨機基準 45.86% 是怎麼來的？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "長期統計下，百家樂莊家勝率約 45.86%、閒家 44.62%、和局 9.52%。若你每題都選莊，命中率的期望值就是 45.86%。這是用來驗證看路法是否真的比隨機好的對照組。",
        },
      },
      {
        "@type": "Question",
        name: "我答的結果會被儲存嗎？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "作答紀錄只存在你自己的瀏覽器 localStorage，不會上傳到伺服器。重新整理可恢復進度，點「再玩一次」則清除重來。",
        },
      },
      {
        "@type": "Question",
        name: "為什麼我的分數接近隨機？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "因為百家樂牌局是獨立事件，過往結果不影響下一手。看路法雖然能整理歷史資訊，但無法預測下一手 — 這就是我們做正 EV 推播的原因：用真實期望值決策，而不是看路型。",
        },
      },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <QuizClient />
    </>
  );
}
