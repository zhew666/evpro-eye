import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ScopeBannerVariant = "all" | "push" | "theory";

export interface ScopeBannerProps {
  variant: ScopeBannerVariant;
  title: ReactNode;
  description: ReactNode;
  /** 覆寫左上角的「資料範圍：XXX」標籤文字；預設依 variant 取值 */
  label?: ReactNode;
  className?: string;
}

interface VariantStyles {
  wrap: string;
  chip: string;
  icon: string;
  defaultLabel: string;
}

const variantStyles: Record<ScopeBannerVariant, VariantStyles> = {
  all: {
    wrap: "bg-[color:var(--color-warning)]/10 border-[color:var(--color-warning)]/30",
    chip:
      "bg-[color:var(--color-warning)]/20 text-[color:var(--color-warning)]",
    icon: "🔭",
    defaultLabel: "資料範圍：全部牌局",
  },
  push: {
    wrap: "bg-[color:var(--color-info)]/10 border-[color:var(--color-info)]/30",
    chip: "bg-[color:var(--color-info)]/20 text-[color:var(--color-info)]",
    icon: "📡",
    defaultLabel: "資料範圍：LINE 推播",
  },
  theory: {
    wrap: "bg-accent/10 border-accent/30",
    chip: "bg-accent/20 text-accent",
    icon: "📐",
    defaultLabel: "資料範圍：長期理論",
  },
};

/**
 * 告訴讀者目前區塊看的是「全部牌局」「LINE 推播」還是「長期理論」。
 */
export function ScopeBanner({
  variant,
  title,
  description,
  label,
  className,
}: ScopeBannerProps) {
  const v = variantStyles[variant];
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 mb-4 flex items-center gap-3",
        v.wrap,
        className
      )}
    >
      <span className="text-lg shrink-0" aria-hidden="true">
        {v.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span
            className={cn(
              "text-2xs font-bold px-1.5 py-0.5 rounded-sm",
              v.chip
            )}
          >
            {label ?? v.defaultLabel}
          </span>
          <span className="text-sm font-bold text-text">{title}</span>
        </div>
        <p className="text-xs text-text-muted leading-snug">{description}</p>
      </div>
    </div>
  );
}

export default ScopeBanner;
