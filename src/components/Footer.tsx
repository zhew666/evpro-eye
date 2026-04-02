import Link from "next/link";

const navItems = [
  { label: "首頁", href: "/" },
  { label: "EV教學", href: "/ev-guide" },
  { label: "功能介紹", href: "/features" },
  { label: "即時數據", href: "/live-data" },
  { label: "部落格", href: "/blog" },
  { label: "FAQ", href: "/faq" },
];

export default function Footer() {
  return (
    <footer className="bg-primary border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand + intro */}
          <div>
            <p className="text-accent font-bold text-lg mb-2">百家之眼</p>
            <p className="text-text-muted text-sm leading-relaxed">
              以窮舉法即時計算百家樂期望值，用數學取代玄學。透過 LINE Bot
              提供即時分析服務。
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-text font-semibold mb-3">網站導覽</p>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-text-muted hover:text-accent text-sm transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* LINE + Contact */}
          <div>
            <p className="text-text font-semibold mb-3">加入我們</p>
            <a
              href="https://lin.ee/PGaRsrg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-primary text-sm font-bold rounded hover:bg-accent-hover transition-colors"
            >
              LINE 加好友
            </a>
            <p className="text-text-muted text-xs mt-2">
              推薦碼：<code className="text-accent font-bold">LUCKY777</code>
            </p>
          </div>
        </div>

        {/* Disclaimer + Copyright */}
        <div className="mt-10 pt-6 border-t border-white/10 text-center">
          <p className="text-text-muted text-xs mb-2">
            本站僅供數學研究與教學用途，不構成任何投注建議。
          </p>
          <p className="text-text-muted text-xs">
            &copy; 2026 百家之眼 EVpro Eye. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
