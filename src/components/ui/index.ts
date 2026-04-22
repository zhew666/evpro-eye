export { default as Card } from "./Card";
export type { CardProps, CardVariant } from "./Card";

export { default as Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";

export { default as Badge } from "./Badge";
export type {
  BadgeProps,
  BadgeTone,
  BadgeVariant,
  BadgeSize,
} from "./Badge";

export { default as Tabs } from "./Tabs";
export type { TabsProps, TabItem, TabVariant, TabSize } from "./Tabs";

export { default as ScopeBanner } from "./ScopeBanner";
export type { ScopeBannerProps, ScopeBannerVariant } from "./ScopeBanner";

// ── Narrative Visualization primitives（Phase 4b） ─────────────
export { TheoryBar, DialChart, BreakevenGauge, FlowCard } from "./viz";
export type {
  TheoryBarProps,
  TheoryBarTone,
  DialChartProps,
  DialTone,
  BreakevenGaugeProps,
  FlowCardProps,
  FlowStep,
  FlowStepTone,
  FlowCardTotal,
} from "./viz";
