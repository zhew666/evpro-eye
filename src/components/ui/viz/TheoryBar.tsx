"use client";

import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type TheoryBarTone = "game-banker" | "game-player" | "game-tie";

export interface TheoryBarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** 左側 label（莊贏/閒贏/和局 等）*/
  label: string;
  /** 實際百分比 0-100 */
  actual: number;
  /** 理論百分比 0-100 */
  theory: number;
  /** 次數（場/次）*/
  count: number;
  /** 總場次（for sub 顯示）*/
  total: number;
  /** tone，決定 solid bar 顏色 */
  tone: TheoryBarTone;
  /** 單位，預設「場」*/
  unit?: string;
}

// tone → solid bar 顏色（使用 token）
const toneBgMap: Record<TheoryBarTone, string> = {
  "game-banker": "bg-[color:var(--color-banker)]",
  "game-player": "bg-[color:var(--color-player)]",
  "game-tie": "bg-[color:var(--color-tie)]",
};

/**
 * TheoryBar
 * 長條 + 理論值對比
 *
 * Anatomy：
 *   [label 14字寬] [軌道：ghost 理論 bar + solid 實際 bar + 金色 tick] [count / actual% + delta 28字寬]
 */
const TheoryBar = forwardRef<HTMLDivElement, TheoryBarProps>(function TheoryBar(
  {
    label,
    actual,
    theory,
    count,
    total,
    tone,
    unit = "場",
    className,
    ...rest
  },
  ref
) {
  const actualClamped = Math.max(0, Math.min(100, actual));
  const theoryClamped = Math.max(0, Math.min(100, theory));
  const delta = actual - theory;
  const absDelta = Math.abs(delta);

  // delta < 0.5% 視為灰
  let deltaColor = "text-[color:var(--color-text-dim)]";
  let deltaSymbol = "≈";
  if (absDelta >= 0.5) {
    if (delta > 0) {
      deltaColor = "text-[color:var(--color-success)]";
      deltaSymbol = "▲";
    } else {
      deltaColor = "text-[color:var(--color-error)]";
      deltaSymbol = "▼";
    }
  }

  const deltaFormatted =
    (delta >= 0 ? "+" : "") + delta.toFixed(1) + "%";

  const tooltip = `實際 ${actual.toFixed(2)}% vs 理論 ${theory.toFixed(2)}%，差 ${deltaFormatted}`;

  const countFormatted = count.toLocaleString("zh-TW");
  const totalFormatted = total.toLocaleString("zh-TW");

  return (
    <div
      ref={ref}
      role="meter"
      aria-label={`${label}：實際 ${actual.toFixed(2)}%，理論 ${theory.toFixed(2)}%`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Number(actual.toFixed(2))}
      title={tooltip}
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 group",
        className
      )}
      {...rest}
    >
      {/* 第一行（mobile）/ 左段（sm+）：Label + Track */}
      <div className="flex items-center gap-2 sm:gap-3 sm:contents">
        {/* Label */}
        <span className="text-xs text-text-muted w-10 sm:w-14 shrink-0">{label}</span>

        {/* Track */}
        <div className="flex-1 relative h-2.5">
          {/* 背景 track */}
          <div className="absolute inset-0 bg-[color:var(--color-surface-1)] rounded-full" />

          {/* Ghost bar：理論值，半透明 */}
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-white/15 transition-[width] duration-500 ease-out"
            style={{ width: `${theoryClamped.toFixed(2)}%` }}
            aria-hidden
          />

          {/* Solid bar：實際值 */}
          <div
            className={cn(
              "absolute top-0 left-0 h-full rounded-full transition-[width] duration-500 ease-out",
              toneBgMap[tone]
            )}
            style={{ width: `${actualClamped.toFixed(2)}%` }}
            aria-hidden
          />

          {/* 理論值垂直標記（金色豎線） */}
          <div
            className="absolute -top-0.5 -bottom-0.5 w-[2px] bg-accent rounded-full shadow-[0_0_6px_rgba(212,175,55,0.6)]"
            style={{
              left: `calc(${theoryClamped.toFixed(2)}% - 1px)`,
            }}
            aria-hidden
          />
        </div>
      </div>

      {/* 第二行（mobile）/ 右段（sm+）：Stats */}
      <div className="w-full sm:w-32 shrink-0 text-right flex flex-col leading-tight">
        <span className="text-2xs text-text-dim">
          {countFormatted} / {totalFormatted} {unit}
        </span>
        <span className="text-xs flex items-baseline justify-end gap-1">
          <span className="font-bold text-text tabular-nums">
            {actual.toFixed(2)}%
          </span>
          <span className={cn("font-medium tabular-nums", deltaColor)}>
            {deltaSymbol} {deltaFormatted}
          </span>
        </span>
      </div>
    </div>
  );
});

export default TheoryBar;
