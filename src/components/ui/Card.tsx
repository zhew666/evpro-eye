import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CardVariant = "default" | "accent" | "numeric" | "compact";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children?: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  // 一般卡片容器
  default:
    "bg-bg-card border border-[color:var(--color-border)] rounded-xl p-5",
  // 金色描邊強調
  accent:
    "bg-bg-card border border-accent/30 rounded-xl p-5",
  // StatCard：三段式 label / value / sub
  numeric:
    "bg-bg-card border border-[color:var(--color-border)] rounded-xl p-5 flex flex-col gap-1",
  // 密集列表用（如 /hands grid）
  compact:
    "bg-bg-card border border-[color:var(--color-border)] rounded-xl p-4",
};

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "default", className, children, ...rest },
  ref
) {
  return (
    <div ref={ref} className={cn(variantClasses[variant], className)} {...rest}>
      {children}
    </div>
  );
});

export default Card;
