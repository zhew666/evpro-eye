"use client";

import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface BreakevenGaugeProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** 實際命中率 0-100 */
  actual: number;
  /** 損平點 0-100 */
  breakeven: number;
  /**
   * X 軸最大值，用來決定 scale（否則損平在 8% 時整條圖會擠在左邊）。
   * 預設 max(breakeven * 2.5, actual * 1.2, 10)。
   */
  maxScale?: number;
  /** 軌道寬度 px，預設 100 */
  width?: number;
}

/**
 * BreakevenGauge — inline 損平點指針
 *
 * 小尺寸水平 track（h-1.5），給表格 cell 用。
 *  ├────████─│────┤
 *  0   actual BE  max
 *
 *  - 實際值條：tone 依 beat 結果（beat → success、else → danger）
 *  - 損平點：金色豎線 tick
 *  - label「損平 X%」在 tick 下方
 */
const BreakevenGauge = forwardRef<HTMLDivElement, BreakevenGaugeProps>(
  function BreakevenGauge(
    { actual, breakeven, maxScale, width = 100, className, ...rest },
    ref
  ) {
    const beat = actual >= breakeven;
    const autoMax = Math.max(breakeven * 2.5, actual * 1.2, 10);
    const scale = maxScale ?? autoMax;

    const actualPct = Math.max(0, Math.min(100, (actual / scale) * 100));
    const bePct = Math.max(0, Math.min(100, (breakeven / scale) * 100));

    const barColor = beat
      ? "bg-[color:var(--color-success)]"
      : "bg-[color:var(--color-error)]";

    const title = `實際 ${actual.toFixed(2)}% vs 損平 ${breakeven.toFixed(2)}%`;

    return (
      <div
        ref={ref}
        className={cn("inline-flex flex-col gap-1.5", className)}
        title={title}
        {...rest}
      >
        <div
          className="relative h-1.5"
          style={{ width: `${width}px` }}
        >
          {/* 背景 track */}
          <div className="absolute inset-0 bg-[color:var(--color-surface-1)] rounded-full" />

          {/* 實際值條 */}
          <div
            className={cn(
              "absolute top-0 left-0 h-full rounded-full transition-[width] duration-500 ease-out",
              barColor
            )}
            style={{ width: `${actualPct.toFixed(2)}%` }}
            aria-hidden
          />

          {/* 損平點 tick（金色） */}
          <div
            className="absolute -top-0.5 -bottom-0.5 w-[2px] bg-accent rounded-full"
            style={{
              left: `calc(${bePct.toFixed(2)}% - 1px)`,
            }}
            aria-hidden
          />
        </div>

        {/* Breakeven label */}
        <div
          className="relative text-[10px] text-text-dim"
          style={{ width: `${width}px` }}
        >
          <span
            className="absolute -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${bePct.toFixed(2)}%` }}
          >
            損平 {breakeven.toFixed(2)}%
          </span>
        </div>
      </div>
    );
  }
);

export default BreakevenGauge;
