"use client";

import { forwardRef, useEffect, useState } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type DialTone =
  | "game-banker"
  | "game-player"
  | "game-super6"
  | "game-pair";

export interface DialChartProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** 主 label */
  label: string;
  /** 實際值 0-100 */
  value: number;
  /** 損平點 0-100，arc 上會有一條金色 tick */
  breakeven: number;
  /** tone，決定 arc 顏色 */
  tone: DialTone;
  /** 是否打敗損平點；若未提供會用 value >= breakeven 推導 */
  beat?: boolean;
  /** 下方次 label，例如「推 424 中 218」 */
  sublabel?: string;
  /** Arc 顯示範圍下限（預設 0）。用來放大差距，例如莊閒設 40 就能把 45-55 攤開 */
  min?: number;
  /** Arc 顯示範圍上限（預設 100） */
  max?: number;
}

// tone → arc stroke color token
const toneColorMap: Record<DialTone, string> = {
  "game-banker": "var(--color-banker)",
  "game-player": "var(--color-player)",
  "game-super6": "var(--color-super6)",
  "game-pair": "var(--color-pair)",
};

/**
 * DialChart — 半圓儀表（180°）
 *
 * SVG viewBox 120×70，arc stroke-width 8，rounded cap。
 * - 灰底 arc（surface-2）
 * - value arc (tone color) 透過 stroke-dasharray 動畫 0 → value
 * - 金色 breakeven tick（6px 短線跨圓弧）
 * - 中心大字 value%
 */
const DialChart = forwardRef<HTMLDivElement, DialChartProps>(function DialChart(
  {
    label,
    value,
    breakeven,
    tone,
    beat,
    sublabel,
    min = 0,
    max = 100,
    className,
    ...rest
  },
  ref
) {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const range = hi - lo || 1;
  // Arc 位置：把 value/breakeven 從 [lo, hi] 映射到 [0, 100]
  const toArc = (v: number) => Math.max(0, Math.min(100, ((v - lo) / range) * 100));
  const isBeat = beat ?? value >= breakeven;
  const valueOnArc = toArc(value);
  const beOnArc = toArc(breakeven);

  // Arc geometry: 中心 (60, 60)，半徑 50，從 180° 掃到 360°（上半圓）
  const cx = 60;
  const cy = 60;
  const r = 50;
  // 半圓周長
  const circumference = Math.PI * r; // ≈ 157.08

  // Animation：進場時從 0 掃到 value
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setProgress(valueOnArc);
    });
    return () => cancelAnimationFrame(raf);
  }, [valueOnArc]);

  const valueLength = (progress / 100) * circumference;

  // 將 breakeven 角度轉為 x,y 座標（180° → 360°）
  // θ 角度：180° 對應左端 (10, 60)，270° 對應頂端 (60, 10)，360° 對應右端 (110, 60)
  const beAngleDeg = 180 + (beOnArc / 100) * 180;
  const beAngleRad = (beAngleDeg * Math.PI) / 180;
  const beX = cx + r * Math.cos(beAngleRad);
  const beY = cy + r * Math.sin(beAngleRad);
  // 短線方向：沿半徑方向，內外各 4px
  const beInnerX = cx + (r - 5) * Math.cos(beAngleRad);
  const beInnerY = cy + (r - 5) * Math.sin(beAngleRad);
  const beOuterX = cx + (r + 5) * Math.cos(beAngleRad);
  const beOuterY = cy + (r + 5) * Math.sin(beAngleRad);

  const arcColor = toneColorMap[tone];

  const centerTextColor = isBeat
    ? "var(--color-success)"
    : "var(--color-text-muted)";

  const tooltip = `${label}：${value.toFixed(2)}%（損平 ${breakeven.toFixed(2)}%）`;

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center gap-1 select-none",
        className
      )}
      title={tooltip}
      {...rest}
    >
      <div className="relative w-[160px] sm:w-[200px] md:w-[220px] lg:w-[240px] aspect-[12/7]">
        <svg
          viewBox="0 0 120 70"
          width="100%"
          height="100%"
          className="overflow-visible"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          {/* 背景 arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="var(--color-surface-2)"
            strokeWidth={8}
            strokeLinecap="round"
          />

          {/* 實際值 arc（有 tone 色、從 0 掃到 value） */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={arcColor}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${valueLength} ${circumference}`}
            style={{
              transition:
                "stroke-dasharray 700ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />

          {/* 損平點 tick（金色短線跨 arc） */}
          <line
            x1={beInnerX}
            y1={beInnerY}
            x2={beOuterX}
            y2={beOuterY}
            stroke="var(--color-accent)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>

        {/* 中心大字 */}
        <div
          className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-1"
        >
          <span
            className="text-3xl md:text-4xl lg:text-5xl font-bold tabular-nums leading-none"
            style={{ color: centerTextColor }}
          >
            {value.toFixed(1)}
            <span className="text-lg md:text-xl lg:text-2xl">%</span>
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="flex flex-col items-center gap-1 mt-1">
        <span className="text-base md:text-lg font-bold text-text leading-tight">
          {label}
        </span>
        {sublabel && (
          <span className="text-xs md:text-sm text-text-muted leading-tight">
            {sublabel}
          </span>
        )}
        <span
          className={cn(
            "text-xs md:text-sm font-medium tabular-nums",
            isBeat
              ? "text-[color:var(--color-success)]"
              : "text-[color:var(--color-text-muted)]"
          )}
        >
          損平 {breakeven.toFixed(2)}%
          {isBeat ? " · 達標" : " · 未達標"}
        </span>
      </div>
    </div>
  );
});

export default DialChart;
