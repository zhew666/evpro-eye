import Link from "next/link";
import { getAllArticles } from "@/lib/articles";

const features = [
  {
    title: "窮舉法計算",
    description:
      "不是統計、不是 AI，是精確計算所有剩餘牌面組合。每一手的 EV 都是數學事實。",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    title: "即時 EV 推播",
    description:
      "每手更新，+EV 出現時即時通知。讓你不必盯盤，數學自己會說話。",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: "13 桌同步監控",
    description: "覆蓋全場，不漏任何機會。系統 24 小時運作，比你更勤奮。",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
];

const stats = [
  { value: "1,000+", label: "每日處理手數" },
  { value: "13", label: "同步監控桌數" },
  { value: "100%", label: "數學精確計算" },
];

// Blog posts pulled from real articles at build time

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-bg via-primary to-bg py-24 sm:py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            用數學，
            <span className="text-accent">看穿每一手牌</span>
          </h1>
          <p className="text-text-muted text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            百家之眼以窮舉法即時計算百家樂期望值，告訴你每一手的真實
            EV。不預測、不帶單，只給你數學。
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

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            為什麼選擇<span className="text-accent">百家之眼</span>？
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="bg-bg-card border border-white/5 rounded-xl p-8 hover:border-accent/30 transition-colors"
              >
                <div className="text-accent mb-4">{feat.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feat.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-primary/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">
            系統每日處理超過 1,000 手牌面數據
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl sm:text-5xl font-bold text-accent mb-2">
                  {stat.value}
                </p>
                <p className="text-text-muted text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Data Preview */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            即時<span className="text-accent">數據監控</span>
          </h2>
          <p className="text-text-muted text-lg mb-8 max-w-2xl mx-auto">
            24 小時監控 13 桌百家樂，每手計算精確 EV。最新 3 手數據已遮蔽，加入 LINE Bot 查看完整資訊。
          </p>
          <Link
            href="/live-data"
            className="inline-flex items-center px-6 py-3 bg-bg-card border border-accent/30 text-accent font-bold rounded-lg hover:bg-primary-light transition-colors"
          >
            查看即時數據
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* Blog preview — dynamic from real articles */}
      <section className="py-20 px-4 bg-primary/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            百家樂<span className="text-accent">數學研究</span>
          </h2>
          <p className="text-text-muted text-center mb-12">
            用數學看懂百家樂的每一個面向
          </p>

          {/* Pillar page highlight */}
          {(() => {
            const articles = getAllArticles();
            const pillar = articles.find(
              (a) => a.slug === "baccarat-math-complete-guide"
            );
            const satellites = articles
              .filter((a) => a.slug !== "baccarat-math-complete-guide")
              .slice(0, 3);

            return (
              <>
                {pillar && (
                  <Link
                    href={`/blog/${pillar.slug}`}
                    className="block bg-bg-card border border-accent/30 rounded-xl p-8 mb-8 hover:border-accent/50 transition-colors group"
                  >
                    <span className="inline-block px-3 py-1 bg-accent/20 text-accent text-xs font-bold rounded-full mb-3">
                      完整指南
                    </span>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-text-muted text-sm leading-relaxed">
                      {pillar.meta_description}
                    </p>
                  </Link>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {satellites.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className="block bg-bg-card border border-white/5 rounded-xl p-6 hover:border-accent/30 transition-colors group"
                    >
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-accent transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-text-muted text-sm leading-relaxed">
                        {post.meta_description.length > 80
                          ? post.meta_description.slice(0, 80) + "..."
                          : post.meta_description}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            );
          })()}

          <div className="text-center mt-10">
            <Link
              href="/blog"
              className="inline-flex items-center text-accent hover:text-accent-hover font-medium transition-colors"
            >
              查看全部文章
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-bg to-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            準備好用數學改變你的
            <span className="text-accent">百家樂體驗</span>？
          </h2>
          <p className="text-text-muted text-lg mb-10">
            加入 LINE 好友，輸入推薦碼即可體驗百家之眼的數學分析服務。
          </p>
          <a
            href="https://lin.ee/PGaRsrg"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-4 bg-accent text-primary font-bold text-lg rounded-lg hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
          >
            加入 LINE 好友，立即體驗
          </a>
          <p className="mt-4 text-text-muted text-sm">
            加入後輸入推薦碼 <code className="text-accent font-bold">LUCKY777</code> 即可開始體驗
          </p>
        </div>
      </section>
    </>
  );
}
