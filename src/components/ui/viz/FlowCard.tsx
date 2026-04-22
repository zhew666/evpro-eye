"use client";

import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type FlowStepTone =
  | "banker"
  | "player"
  | "super6"
  | "pair"
  | "neutral"
  | "accent";

export interface FlowStep {
  label: string;
  value: number;
  tone?: FlowStepTone;
}

export interface FlowCardTotal {
  label: string;
  value: number;
  accent?: boolean;
}

export interface FlowCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** 步驟列表（由上到下堆疊）*/
  steps: FlowStep[];
  /** 合計列 */
  total: FlowCardTotal;
  /** 格式化數字，預設 + 號前綴 + toLocaleString */
  fmtValue?: (n: number) => string;
  /** 標題（小字） */
  title?: string;
}

const toneDotMap: Record<FlowStepTone, string> = {
  banker: "bg-[color:var(--color-banker)]",
  player: "bg-[color:var(--color-player)]",
  super6: "bg-[color:var(--color-super6)]",
  pair: "bg-[color:var(--color-pair)]",
  neutral: "bg-[color:var(--color-text-muted)]",
  accent: "bg-accent",
};

function defaultFmt(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return sign + n.toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

/**
 * FlowCard — 反水計算洋蔥圖
 *
 * 垂直列表：每 step 一個 row
 *   [dot] label —— [bar]────── value
 * steps 之間淡化分隔線
 * 最後「合計」row 粗體大字
 *
 * Hover 個別 row：目標 row 全亮，其他 row 淡化至 40% opacity（透過 group/peer CSS）。
 * 數值用 transition-[width,color] 順暢變化。
 */
const FlowCard = forwardRef<HTMLDivElement, FlowCardProps>(function FlowCard(
  { steps, total, fmtValue = defaultFmt, title, className, ...rest },
  ref
) {
  // bar 寬度歸一：取所有 step value 絕對值最大
  const maxAbs = Math.max(
    1,
    ...steps.map((s) => Math.abs(s.value)),
    Math.abs(total.value) * 0.8
  );

  return (
    <div
      ref={ref}
      className={cn(
        "bg-bg-card border border-[color:var(--color-border)] rounded-xl p-5",
        "flex flex-col gap-2",
        className
      )}
      {...rest}
    >
      {title && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-muted font-medium">
            {title}
          </span>
          <span className="text-2xs text-text-dim">
            （hover 查看各層貢獻）
          </span>
        </div>
      )}

      {/* Steps — use a group so hovered row stays full opacity, non-hovered fade */}
      <div className="flex flex-col gap-1.5 group/flow">
        {steps.map((step, idx) => {
          const tone = step.tone ?? "neutral";
          const barPct = (Math.abs(step.value) / maxAbs) * 100;
          const valueColor =
            step.value > 0
              ? "text-[color:var(--color-success)]"
              : step.value < 0
              ? "text-[color:var(--color-error)]"
              : "text-text-muted";
          return (
            <div
              key={`${step.label}-${idx}`}
              className={cn(
                "flex items-center gap-2.5 py-1.5 px-1 rounded-md transition-opacity duration-200",
                // 當 group 內有 row 被 hover 時，非 hover 的 row 淡化
                "group-hover/flow:opacity-40 hover:!opacity-100"
              )}
            >
              {/* dot + label */}
              <div className="flex items-center gap-2 w-24 shrink-0">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    toneDotMap[tone]
                  )}
                />
                <span className="text-xs text-text truncate">
                  {step.label}
                </span>
              </div>

              {/* bar — diverging（中心軸雙向）：正往右走 success，負往左走 error */}
              <div className="flex-1 relative h-2 bg-[color:var(--color-surface-1)] rounded-full">
                {/* 中心軸 0 位置標記 */}
                <div
                  className="absolute top-[-2px] bottom-[-2px] left-1/2 w-px bg-[color:var(--color-border-strong)]"
                  aria-hidden
                />
                {step.value > 0 ? (
                  // 正值：從中心往右長
                  <div
                    className="absolute top-0 h-full bg-[color:var(--color-success)]/75 rounded-r-full transition-[width] duration-300 ease-out"
                    style={{
                      left: "50%",
                      width: `${(barPct / 2).toFixed(2)}%`,
                    }}
                    aria-hidden
                  />
                ) : step.value < 0 ? (
                  // 負值：從中心往左長
                  <div
                    className="absolute top-0 h-full bg-[color:var(--color-error)]/75 rounded-l-full transition-[width] duration-300 ease-out"
                    style={{
                      right: "50%",
                      width: `${(barPct / 2).toFixed(2)}%`,
                    }}
                    aria-hidden
                  />
                ) : null}
              </div>

              {/* value */}
              <span
                className={cn(
                  "text-sm font-mono font-bold w-24 text-right shrink-0 tabular-nums transition-colors",
                  valueColor
                )}
              >
                {fmtValue(step.value)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-[color:var(--color-border)] my-2" />

      {/* Total */}
      <div
        className={cn(
          "flex items-center gap-2.5 py-2 px-1 rounded-md",
          total.accent && "bg-accent/5"
        )}
      >
        <div className="flex items-center gap-2 w-24 shrink-0">
          <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
          <span className="text-sm font-bold text-text">{total.label}</span>
        </div>
        <div className="flex-1" />
        <span
          className={cn(
            "text-2xl font-mono font-bold tabular-nums transition-colors",
            total.value > 0
              ? "text-[color:var(--color-success)]"
              : total.value < 0
              ? "text-[color:var(--color-error)]"
              : "text-text"
          )}
        >
          {fmtValue(total.value)}
        </span>
      </div>
    </div>
  );
});

export default FlowCard;
