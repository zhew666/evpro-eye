import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "game-banker"
  | "game-player"
  | "game-tie"
  | "game-super6"
  | "game-pair"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type BadgeVariant = "solid" | "soft" | "outline" | "dot";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  size?: BadgeSize;
  children?: ReactNode;
}

// tone → { fg, dotBg, solidBg, softBg, border } 映射
// 所有色彩都來自 Phase 1 token；不直接 bg-<tone>/15 以避免動態 class purge 問題。
interface ToneStyles {
  fg: string;
  dotBg: string;
  solidBg: string;
  softBg: string;
  border: string;
}

const toneStyles: Record<BadgeTone, ToneStyles> = {
  neutral: {
    fg: "text-text-muted",
    dotBg: "bg-[color:var(--color-text-muted)]",
    solidBg: "bg-[color:var(--color-surface-2)] text-text",
    softBg: "bg-[color:var(--color-surface-2)]",
    border: "border-[color:var(--color-border-strong)]",
  },
  brand: {
    fg: "text-accent",
    dotBg: "bg-accent",
    solidBg: "bg-accent text-primary",
    softBg: "bg-accent/15",
    border: "border-accent/40",
  },
  "game-banker": {
    fg: "text-[color:var(--color-banker)]",
    dotBg: "bg-[color:var(--color-banker)]",
    solidBg: "bg-[color:var(--color-banker)] text-white",
    softBg: "bg-[color:var(--color-banker)]/15",
    border: "border-[color:var(--color-banker)]/40",
  },
  "game-player": {
    fg: "text-[color:var(--color-player)]",
    dotBg: "bg-[color:var(--color-player)]",
    solidBg: "bg-[color:var(--color-player)] text-white",
    softBg: "bg-[color:var(--color-player)]/15",
    border: "border-[color:var(--color-player)]/40",
  },
  "game-tie": {
    fg: "text-[color:var(--color-tie)]",
    dotBg: "bg-[color:var(--color-tie)]",
    solidBg: "bg-[color:var(--color-tie)] text-primary",
    softBg: "bg-[color:var(--color-tie)]/15",
    border: "border-[color:var(--color-tie)]/40",
  },
  "game-super6": {
    fg: "text-[color:var(--color-super6)]",
    dotBg: "bg-[color:var(--color-super6)]",
    solidBg: "bg-[color:var(--color-super6)] text-primary",
    softBg: "bg-[color:var(--color-super6)]/15",
    border: "border-[color:var(--color-super6)]/40",
  },
  "game-pair": {
    fg: "text-[color:var(--color-pair)]",
    dotBg: "bg-[color:var(--color-pair)]",
    solidBg: "bg-[color:var(--color-pair)] text-primary",
    softBg: "bg-[color:var(--color-pair)]/15",
    border: "border-[color:var(--color-pair)]/40",
  },
  success: {
    fg: "text-[color:var(--color-success)]",
    dotBg: "bg-[color:var(--color-success)]",
    solidBg: "bg-[color:var(--color-success)] text-primary",
    softBg: "bg-[color:var(--color-success)]/15",
    border: "border-[color:var(--color-success)]/40",
  },
  warning: {
    fg: "text-[color:var(--color-warning)]",
    dotBg: "bg-[color:var(--color-warning)]",
    solidBg: "bg-[color:var(--color-warning)] text-primary",
    softBg: "bg-[color:var(--color-warning)]/15",
    border: "border-[color:var(--color-warning)]/40",
  },
  danger: {
    fg: "text-[color:var(--color-error)]",
    dotBg: "bg-[color:var(--color-error)]",
    solidBg: "bg-[color:var(--color-error)] text-white",
    softBg: "bg-[color:var(--color-error)]/15",
    border: "border-[color:var(--color-error)]/40",
  },
  info: {
    fg: "text-[color:var(--color-info)]",
    dotBg: "bg-[color:var(--color-info)]",
    solidBg: "bg-[color:var(--color-info)] text-primary",
    softBg: "bg-[color:var(--color-info)]/15",
    border: "border-[color:var(--color-info)]/40",
  },
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "text-2xs px-1.5 py-0.5 rounded-sm gap-1",
  md: "text-xs px-2 py-1 rounded-md gap-1.5",
};

export function Badge({
  tone = "neutral",
  variant = "soft",
  size = "sm",
  className,
  children,
  ...rest
}: BadgeProps) {
  const styles = toneStyles[tone];

  let variantClass = "";
  switch (variant) {
    case "solid":
      variantClass = styles.solidBg;
      break;
    case "soft":
      variantClass = cn(styles.softBg, styles.fg);
      break;
    case "outline":
      variantClass = cn("bg-transparent border", styles.border, styles.fg);
      break;
    case "dot":
      variantClass = cn(styles.fg);
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold whitespace-nowrap",
        sizeClasses[size],
        variantClass,
        className
      )}
      {...rest}
    >
      {variant === "dot" && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", styles.dotBg)} />
      )}
      {children}
    </span>
  );
}

export default Badge;
