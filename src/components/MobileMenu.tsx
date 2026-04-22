"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type NavItem = { label: string; href: string };

const primaryNav: NavItem[] = [
  { label: "首頁", href: "/" },
  { label: "即時數據", href: "/live-data" },
  { label: "近期戰報", href: "/stats" },
  { label: "歷史牌局", href: "/hands" },
  { label: "挑戰題庫", href: "/quiz" },
];

const resourceNav: NavItem[] = [
  { label: "EV教學", href: "/ev-guide" },
  { label: "功能介紹", href: "/features" },
  { label: "部落格", href: "/blog" },
  { label: "FAQ", href: "/faq" },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  // Body scroll lock while drawer open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label="開啟選單"
        aria-expanded={open}
        className="text-text p-2"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {open ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 top-16 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* Drawer */}
          <div className="absolute top-full left-0 right-0 bg-primary border-t border-white/10 shadow-lg z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="flex flex-col px-4 py-2">
              <div className="text-[10px] uppercase tracking-wider text-text-dim pt-2 pb-1">
                主要功能
              </div>
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="py-3 text-text-muted hover:text-accent border-b border-white/5 transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              <div className="text-[10px] uppercase tracking-wider text-text-dim pt-4 pb-1">
                資源
              </div>
              {resourceNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="py-3 text-text-muted hover:text-accent border-b border-white/5 transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              <a
                href="https://lin.ee/PGaRsrg"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="my-3 py-2 px-4 bg-accent text-primary font-bold rounded text-center hover:bg-accent-hover transition-colors"
              >
                立即體驗（推薦碼：LUCKY777）
              </a>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
