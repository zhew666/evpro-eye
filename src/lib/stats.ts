// ================================================================
// 百家之眼：歷史統計數據型別定義
// ================================================================

export type Period = "7d" | "30d";

/** EV 訊號統計（來源：positive_ev_log） */
export interface EvSignalStats {
  /** 期間內正EV訊號總次數 */
  total: number;
  /** 各注區訊號次數 */
  by_bet: {
    banker: number;
    player: number;
    tie: number;
    super6: number;
    pair_p: number;
    pair_b: number;
  };
  /** 各平台訊號次數 */
  by_platform: {
    MT: number;
    DG: number;
  };
  /** 期間最高 EV 值 */
  peak_ev: number | null;
  /** 平均 EV 值 */
  avg_ev: number | null;
  /** ev_super6 > 0 的局數（Super6 提示次數） */
  super6_signals: number;
  /** ev_banker > 0 的局數 */
  banker_signals: number;
  /** ev_player > 0 的局數 */
  player_signals: number;
}

/** 牌局結果統計（來源：hand_results，需 Migration 004 後才有數據） */
export interface HandStats {
  /** 期間總局數 */
  total_hands: number;
  /** 莊勝局數 */
  banker_wins: number;
  /** 閒勝局數 */
  player_wins: number;
  /** 和局數 */
  ties: number;
  /** Super6 出現次數（莊以6點勝） */
  super6_count: number;
  /** 自然牌局數（任一方首兩張 = 8/9） */
  natural_count: number;
  /** 閒對子出現次數 */
  pair_p_count: number;
  /** 莊對子出現次數 */
  pair_b_count: number;
  /** 平台分布 */
  by_platform: {
    MT: number;
    DG: number;
  };
}

/** /api/stats 回傳格式 */
export interface StatsResponse {
  period: string;
  generated_at: string;
  ev_signals: EvSignalStats;
  hand_stats: HandStats | null;
  /** hand_results 是否有數據（Migration 後才有） */
  has_hand_data: boolean;
  error?: string;
}

/** 從 HandStats 計算衍生比率，避免前端重複計算 */
export function deriveHandRates(hs: HandStats) {
  const total = hs.total_hands || 1; // 防除零
  return {
    banker_rate: hs.banker_wins / total,
    player_rate: hs.player_wins / total,
    tie_rate: hs.ties / total,
    super6_rate: hs.super6_count / total,
    natural_rate: hs.natural_count / total,
    pair_p_rate: hs.pair_p_count / total,
    pair_b_rate: hs.pair_b_count / total,
  };
}

/** 格式化為百分比字串，如 "45.86%" */
export function fmtPct(rate: number, decimals = 2): string {
  return (rate * 100).toFixed(decimals) + "%";
}

/** 格式化大數字，如 1234 → "1,234" */
export function fmtNum(n: number): string {
  return n.toLocaleString("zh-TW");
}
