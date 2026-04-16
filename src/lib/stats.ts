// ================================================================
// 百家之眼：歷史統計數據型別定義
// ================================================================

export type Period = "7d" | "30d";

/** EV 訊號統計（來源：positive_ev_log） */
export interface EvSignalStats {
  total: number;
  by_bet: {
    banker: number;
    player: number;
    tie: number;
    super6: number;
    pair_p: number;
    pair_b: number;
  };
  by_platform: { MT: number; DG: number };
  peak_ev: number | null;
  avg_ev: number | null;
  super6_signals: number;
  banker_signals: number;
  player_signals: number;
  pair_p_signals: number;
  pair_b_signals: number;
}

/** 單一注區命中率 */
export interface HitStat {
  signals: number;
  hits: number;
  /** 0-100 的百分比值，如 45.86 */
  rate: number | null;
}

/** Super6 命中率（細分賠率） */
export interface Super6HitStat extends HitStat {
  /** 命中且是自然S6（20倍）的次數 */
  hits_natural: number;
  /** 命中且是補牌S6（12倍）的次數 */
  hits_draw: number;
}

/** +EV 命中率統計（來源：positive_ev_log JOIN hand_results） */
export interface EvHitRates {
  banker: HitStat;
  player: HitStat;
  super6: Super6HitStat;
  pair_p: HitStat;
  pair_b: HitStat;
  tie: HitStat;
}

/** 牌局結果統計（來源：hand_results，需 Migration 004+005） */
export interface HandStats {
  total_hands: number;
  banker_wins: number;
  player_wins: number;
  ties: number;
  /** Super6 整體（任何賠率） */
  super6_count: number;
  /** Super6 自然（莊兩張牌6點勝，20倍） */
  super6_natural_count: number;
  /** Super6 補牌（莊補牌後6點勝，12倍） */
  super6_draw_count: number;
  natural_count: number;
  pair_p_count: number;
  pair_b_count: number;
  by_platform: { MT: number; DG: number };
}

/** /api/stats 回傳格式 */
export interface StatsResponse {
  period: string;
  generated_at: string;
  ev_signals: EvSignalStats;
  hand_stats: HandStats | null;
  ev_hit_rates: EvHitRates | null;
  has_hand_data: boolean;
  error?: string;
}

/** 從 HandStats 計算衍生比率 */
export function deriveHandRates(hs: HandStats) {
  const total = hs.total_hands || 1;
  return {
    banker_rate:       hs.banker_wins / total,
    player_rate:       hs.player_wins / total,
    tie_rate:          hs.ties / total,
    super6_rate:       hs.super6_count / total,
    natural_rate:      hs.natural_count / total,
    pair_p_rate:       hs.pair_p_count / total,
    pair_b_rate:       hs.pair_b_count / total,
  };
}

export function fmtPct(rate: number, decimals = 2): string {
  return (rate * 100).toFixed(decimals) + "%";
}

export function fmtNum(n: number): string {
  return n.toLocaleString("zh-TW");
}

/** 格式化命中率（rate 已是 0-100 的數字，如 45.86） */
export function fmtHitRate(rate: number | null): string {
  if (rate == null) return "—";
  return rate.toFixed(2) + "%";
}
