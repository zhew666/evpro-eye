import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "立即加入 — 免費體驗百家之眼",
  description:
    "三步驟加入百家之眼：掃碼加好友、輸入活動碼 evpro、開始免費試用 EV 即時分析。",
};

const LINE_URL = "https://lin.ee/PGaRsrg";

const steps = [
  {
    step: "1",
    title: "掃碼加好友",
    description: "點擊下方按鈕或掃描 QR Code，加入百家之眼 LINE 官方帳號。",
  },
  {
    step: "2",
    title: "輸入活動碼",
    description: "在聊天室中輸入活動碼開通免費試用資格。",
  },
  {
    step: "3",
    title: "開始免費試用",
    description:
      "立即使用仙人指路、EV 查詢等功能，體驗數學分析的力量。",
  },
];

export default function JoinPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-bg via-primary to-bg py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            加入<span className="text-accent">百家之眼</span>
          </h1>
          <p className="text-text-muted text-lg sm:text-xl leading-relaxed mb-10">
            用數學取代直覺，讓每一手都有依據。
          </p>

          {/* LINE Button */}
          <a
            href={LINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 bg-[#06C755] text-white font-bold text-xl rounded-xl hover:bg-[#05b34c] transition-colors shadow-lg shadow-[#06C755]/20"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-7 h-7"
            >
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            LINE 加好友
          </a>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            三步驟，<span className="text-accent">一分鐘開始</span>
          </h2>

          <div className="space-y-8">
            {steps.map((s) => (
              <div
                key={s.step}
                className="flex items-start gap-6 bg-bg-card border border-white/5 rounded-xl p-8 hover:border-accent/30 transition-colors"
              >
                <div className="shrink-0 w-12 h-12 bg-accent text-primary rounded-full flex items-center justify-center text-xl font-bold">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                  <p className="text-text-muted leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Activation code */}
          <div className="mt-12 bg-bg-card border border-accent/30 rounded-xl p-8 text-center">
            <p className="text-text-muted text-sm mb-3">免費試用活動碼</p>
            <div className="inline-block bg-primary px-8 py-4 rounded-lg">
              <code className="text-accent text-3xl sm:text-4xl font-bold font-mono tracking-widest">
                evpro
              </code>
            </div>
            <p className="text-text-muted text-sm mt-4">
              加入好友後，在聊天室中輸入此活動碼即可啟動免費試用
            </p>
          </div>
        </div>
      </section>

      {/* QR Code placeholder */}
      <section className="py-16 px-4 bg-primary/50">
        <div className="max-w-md mx-auto text-center">
          <p className="text-text-muted text-sm mb-6">
            或直接掃描 QR Code
          </p>
          <div className="bg-white rounded-2xl p-8 inline-block">
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-400 text-xs text-center px-4">
                LINE QR Code<br />即將放置
              </p>
            </div>
          </div>
          <p className="text-text-muted text-xs mt-4">
            掃碼後自動跳轉至 LINE 加好友頁面
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">
            數學不騙人，<span className="text-accent">現在就開始</span>
          </h2>
          <p className="text-text-muted mb-8">
            已有超過數百位玩家使用百家之眼的 EV 數據輔助決策。
          </p>
          <a
            href={LINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-4 bg-accent text-primary font-bold text-lg rounded-lg hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
          >
            立即加入百家之眼
          </a>
        </div>
      </section>
    </>
  );
}
