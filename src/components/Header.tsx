import Link from "next/link";
import Image from "next/image";
import MobileMenu from "./MobileMenu";
import { cn } from "@/lib/cn";

const navItems = [
  { label: "首頁", href: "/" },
  { label: "EV教學", href: "/ev-guide" },
  { label: "功能介紹", href: "/features" },
  { label: "即時數據", href: "/live-data" },
  { label: "近期戰報", href: "/stats" },
  { label: "歷史牌局", href: "/hands" },
  { label: "挑戰題庫", href: "/quiz" },
  { label: "部落格", href: "/blog" },
  { label: "FAQ", href: "/faq" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-primary/95 backdrop-blur-sm border-b border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo.png"
              alt="百家之眼"
              width={36}
              height={36}
              className="rounded-full"
            />
            <span className="text-accent font-bold text-xl tracking-tight">
              百家之眼
            </span>
            <span className="text-text-muted text-sm hidden sm:inline">
              EVpro Eye
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
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

          {/* Desktop CTA */}
          <a
            href="https://lin.ee/PGaRsrg"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "hidden md:inline-flex items-center justify-center gap-1.5 font-bold",
              "transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)]",
              "px-4 py-2 text-sm rounded-lg",
              "bg-accent text-primary hover:bg-accent-hover shadow-[var(--shadow-1)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]",
              "active:translate-y-px"
            )}
          >
            立即體驗
            <span className="text-primary/70 font-mono text-xs">LUCKY777</span>
          </a>

          {/* Mobile menu */}
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
