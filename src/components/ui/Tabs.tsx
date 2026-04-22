"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabSize = "sm" | "md";
export type TabVariant = "pill" | "segment";

export interface TabItem<T extends string = string> {
  key: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface TabsProps<T extends string = string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (next: T) => void;
  variant?: TabVariant;
  size?: TabSize;
  /** 可選：tablist 的 aria-label，建議提供 */
  ariaLabel?: string;
  className?: string;
  /** 可選：tab 與外部面板的聯繫，若 panel 有自己的 id */
  getPanelId?: (key: T) => string | undefined;
}

const pillSize: Record<TabSize, string> = {
  sm: "px-3 py-1 text-xs rounded-full",
  md: "px-4 py-1.5 text-sm rounded-full",
};

const segmentSize: Record<TabSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

/**
 * 統一的分段／Pill 切換器。
 * - `pill`  變體：互相獨立、gap-2；/stats 的統計區間、/hands 排序
 * - `segment` 變體：連體、共享邊框；/live-data 平台切換
 */
export function Tabs<T extends string = string>({
  items,
  value,
  onChange,
  variant = "pill",
  size = "md",
  ariaLabel,
  className,
  getPanelId,
}: TabsProps<T>) {
  if (variant === "segment") {
    return (
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          "inline-flex rounded-lg border border-[color:var(--color-border-strong)] bg-bg-card overflow-hidden",
          className
        )}
      >
        {items.map((item, i) => {
          const selected = item.key === value;
          return (
            <button
              key={item.key}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={getPanelId?.(item.key)}
              disabled={item.disabled}
              onClick={() => !item.disabled && onChange(item.key)}
              className={cn(
                "font-medium transition-colors duration-[var(--duration-base)]",
                segmentSize[size],
                i > 0 && "border-l border-[color:var(--color-border-strong)]",
                selected
                  ? "bg-accent text-primary"
                  : "text-text-muted hover:text-text hover:bg-[color:var(--color-surface-1)]",
                "focus-visible:outline-none focus-visible:relative focus-visible:z-10 " +
                  "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 " +
                  "focus-visible:ring-offset-[color:var(--color-bg)]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  // pill
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {items.map((item) => {
        const selected = item.key === value;
        return (
          <button
            key={item.key}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={getPanelId?.(item.key)}
            disabled={item.disabled}
            onClick={() => !item.disabled && onChange(item.key)}
            className={cn(
              "font-medium transition-colors duration-[var(--duration-base)]",
              pillSize[size],
              selected
                ? "bg-accent text-primary"
                : "bg-bg-card text-text-muted border border-[color:var(--color-border-strong)] hover:text-text hover:border-accent/30",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
                "focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
