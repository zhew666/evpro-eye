/**
 * /quiz — 看路科學測驗
 * 共用型別、常數、seeded PRNG、insight 文案、localStorage 結構。
 *
 * 不依賴 React / Next，可在 server / client / route handler 共用。
 */

import type { ApiHand } from "@/components/BaccaratRoads";

/* ─── 題目資料結構（v3 · 兩種模式） ──────────────────────────────── */

/** 玩家可見 / 該靴完整 hand 的欄位最小集（`RoadsPanel` 需要） */
export type QuizHand = ApiHand;

/** 舊名相容：QuizVisibleHand 仍為 `ApiHand` 別名 */
export type QuizVisibleHand = ApiHand;

/** 測驗模式：sequential = 同靴連續 10 手；random = 10 靴各 1 題 */
export type QuizMode = "sequential" | "random";

/** Sequential 模式：一整靴 + 切點 start，前端 visible 隨 q 遞增 */
export interface QuizSequentialShoe {
  /** DB 內部 shoe_summaries.id，用於結果頁 `/hands/[id]` 連結 */
  shoe_id: number;
  platform: string;
  /** 顯示用 e.g. "MT 靴 #13046"（以 shoe 本身 id 基礎、不暴露 table_id / 時間） */
  shoe_label: string;
  /** 第 1 題猜的 hand_num（切點起點） */
  start: number;
  /** 該靴完整所有 hand（hand_num 遞增） */
  all_hands: QuizHand[];
}

/** 舊名相容：QuizShoe 仍為 QuizSequentialShoe 別名 */
export type QuizShoe = QuizSequentialShoe;

/** Random 模式：單題。visible_hands = 切點前全部可見手 */
export interface QuizRandomQuestion {
  /** DB 內部 shoe_summaries.id，用於該題「看那靴」連結 */
  shoe_id: number;
  platform: string;
  /** 顯示用 e.g. "MT 靴 #13046" */
  shoe_label: string;
  /** 該題要猜的 hand_num */
  cutoff_hand_num: number;
  /** 切點之前（1..cutoff_hand_num - 1）全部可見 */
  visible_hands: QuizHand[];
}

export type QuizSourceWindowDays = 7 | 14;

/** Sequential 模式 response */
export interface QuizSequentialResponse {
  mode: "sequential";
  seed: string;
  generated_at: string;
  source_window_days: QuizSourceWindowDays;
  shoe: QuizSequentialShoe;
  /** 長度 10，對應 start..start+9 的真實 winner */
  answers: Array<"banker" | "player" | "tie">;
}

/** Random 模式 response */
export interface QuizRandomResponse {
  mode: "random";
  seed: string;
  generated_at: string;
  source_window_days: QuizSourceWindowDays;
  /** 長度 10，每題一靴 */
  questions: QuizRandomQuestion[];
  /** 長度 10，對應 questions[i].cutoff_hand_num 的真實 winner */
  answers: Array<"banker" | "player" | "tie">;
}

/** Discriminated union by `mode` */
export type QuizResponse = QuizSequentialResponse | QuizRandomResponse;

/* ─── 作答資料結構 ──────────────────────────────── */

export type QuizChoice = "banker" | "player" | "tie" | "skip";

export interface QuizAnswer {
  q: number;
  choice: QuizChoice;
  /** 跳過時為 null */
  correct: boolean | null;
  /** 那題的正解（方便 result 渲染） */
  answer: "banker" | "player" | "tie";
}

export interface QuizLocalState {
  seed: string;
  /** v3 新增：測驗模式。舊資料缺此欄位時視為 sequential（向下相容） */
  mode?: QuizMode;
  startedAt: number;
  currentQ: number; // 1-based，目前題號
  phase: "playing" | "reviewing" | "finished";
  answers: QuizAnswer[];
}

/**
 * v2 — schema bump（同一靴 10 連問）。v1 的本地資料會自動失效不兼容。
 * v3 同 key：新增 `mode`，缺欄位預設 sequential（backward compat）。
 */
export const QUIZ_STORAGE_KEY = "evpro-quiz-v2";

/** Mode label for UI（繁中） */
export function modeLabel(mode: QuizMode): string {
  return mode === "random" ? "隨機抽 10 靴" : "同靴 10 連問";
}

/* ─── 常數 ──────────────────────────────── */

/** 長期莊勝率（扣掉和）—— 用於「隨機/全押莊」對比 */
export const RANDOM_BANKER_RATE = 45.86;
/** 百家之眼系統命中率占位值，未串接 /api/stats 之前用此 */
export const SYSTEM_HIT_RATE_PLACEHOLDER = 52.3;

export const QUIZ_QUESTION_COUNT = 10;
/** 第 1 題至少從第 30 手開始（保證有可讀的大路 + 下三路） */
export const QUIZ_MIN_START = 30;
/** 靴最少 44 手：保證 start 可以落在 30 而第 10 題 (start+9 = 39) 也有 5 手尾部可讓切點 clamp 到 35 */
export const QUIZ_MIN_HANDS = 44;
export const QUIZ_MAX_HANDS = 120;

/* ─── Seeded PRNG: FNV-1a + mulberry32 ─────── */

/** 32-bit FNV-1a，把字串 seed 打成 uint32 */
export function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    // multiply by FNV prime 16777619，避開 Math.imul 不在乎的情境
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32：純函數 seeded PRNG，output [0, 1) */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates with seeded rng（deterministic） */
export function shuffleDeterministic<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** seed 字串生成：12 字英數 */
export function generateSeed(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 12; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

/** 靴編號遮蔽：不暴露真實 id */
export function maskShoeNumber(id: number, seedHash: number): number {
  return ((id * 37 + seedHash) >>> 0) % 9999;
}

/* ─── 評分 / 敘事 ──────────────────────────────── */

export interface QuizScore {
  correct: number;
  wrong: number;
  skipped: number;
  /** 扣除 skip 的分母 */
  denom: number;
  /** 百分比 0–100，無有效題時為 null */
  rate: number | null;
}

export function scoreQuiz(answers: QuizAnswer[]): QuizScore {
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  for (const a of answers) {
    if (a.choice === "skip") skipped++;
    else if (a.correct) correct++;
    else wrong++;
  }
  const denom = correct + wrong;
  const rate = denom > 0 ? (correct / denom) * 100 : null;
  return { correct, wrong, skipped, denom, rate };
}

/**
 * 個人化 insight。`correctRate` 是 0–100 百分比；`systemRate` 同樣為百分比。
 * 若 rate 為 null（全部跳過），回傳特殊文案。
 */
export function getInsight(correctRate: number | null, systemRate: number): string {
  if (correctRate === null) {
    return "你把所有題都跳過了，這不是科學驗證，這叫閉眼。";
  }
  const diff = correctRate - RANDOM_BANKER_RATE;
  if (correctRate >= systemRate) {
    return "驚人地接近系統表現，但還是沒用對 EV。";
  }
  if (diff >= 15) {
    return "比隨機高 15 點，運氣好，但小心把運氣當實力。";
  }
  if (diff >= 5) {
    return "略高於隨機，在統計噪音範圍內。";
  }
  if (diff >= -5) {
    return "你的命中率接近隨機，看路法幫不了你。";
  }
  return "低於隨機？看路反而誤導你了。";
}

/* ─── Label 工具 ──────────────────────────────── */

export function choiceLabel(choice: QuizChoice): string {
  switch (choice) {
    case "banker":
      return "莊";
    case "player":
      return "閒";
    case "tie":
      return "和";
    case "skip":
      return "跳過";
  }
}

export function winnerLabel(winner: "banker" | "player" | "tie"): string {
  return choiceLabel(winner);
}
