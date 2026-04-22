/**
 * /api/quiz/_lib — 共用 helpers（shoes 與 submit 兩個 route 共用）
 *
 * shoes route 原本的 buildSequentialQuiz / buildRandomQuiz / parseMode 等 helpers
 * 抽到這裡。submit route 需要同一組邏輯重算正解答案，防止 client 偽造 correct_count。
 */

import {
  fnv1a,
  mulberry32,
  shuffleDeterministic,
  QUIZ_QUESTION_COUNT,
  QUIZ_MIN_START,
  QUIZ_MIN_HANDS,
  QUIZ_MAX_HANDS,
  type QuizHand,
  type QuizMode,
  type QuizRandomQuestion,
  type QuizShoe,
  type QuizSourceWindowDays,
} from "@/lib/quiz";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

export interface ShoeSummaryLite {
  id: number;
  table_id: string;
  platform: string;
  shoe: number;
  shoe_started_at: string;
  total_hands: number;
}

export interface HandRowLite {
  hand_num: number;
  winner: "banker" | "player" | "tie";
  player_score: number;
  banker_score: number;
  is_super6: boolean;
  is_super6_natural: boolean | null;
  is_pair_p: boolean;
  is_pair_b: boolean;
  p1: string | null;
  p2: string | null;
  p3: string | null;
  b1: string | null;
  b2: string | null;
  b3: string | null;
}

async function supabaseGet<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

function isoNDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function fetchEligibleShoes(
  days: QuizSourceWindowDays,
): Promise<ShoeSummaryLite[]> {
  const since = isoNDaysAgo(days);
  const select = "id,table_id,platform,shoe,shoe_started_at,total_hands";
  const query =
    `shoe_summaries?select=${select}` +
    `&is_complete=eq.true` +
    `&total_hands=gte.${QUIZ_MIN_HANDS}` +
    `&total_hands=lte.${QUIZ_MAX_HANDS}` +
    `&shoe_started_at=gte.${encodeURIComponent(since)}` +
    `&order=shoe_started_at.desc` +
    `&limit=300`;
  return supabaseGet<ShoeSummaryLite[]>(query);
}

export async function fetchAllHandsForShoe(
  tableId: string,
  shoeStartedAt: string,
): Promise<HandRowLite[]> {
  const select =
    "hand_num,winner,player_score,banker_score," +
    "is_super6,is_super6_natural,is_pair_p,is_pair_b," +
    "p1,p2,p3,b1,b2,b3";
  const query =
    `hand_results?select=${select}` +
    `&table_id=eq.${encodeURIComponent(tableId)}` +
    `&shoe_started_at=eq.${encodeURIComponent(shoeStartedAt)}` +
    `&order=hand_num.asc`;
  return supabaseGet<HandRowLite[]>(query);
}

export function toQuizHand(h: HandRowLite): QuizHand {
  return {
    hand_num: h.hand_num,
    winner: h.winner,
    player_score: h.player_score,
    banker_score: h.banker_score,
    is_super6: h.is_super6,
    is_super6_natural: h.is_super6_natural,
    is_pair_p: h.is_pair_p,
    is_pair_b: h.is_pair_b,
    p1: h.p1,
    p2: h.p2,
    p3: h.p3,
    b1: h.b1,
    b2: h.b2,
    b3: h.b3,
  };
}

export async function fetchPool(minShoes: number): Promise<{
  shoes: ShoeSummaryLite[];
  window: QuizSourceWindowDays;
}> {
  let window: QuizSourceWindowDays = 7;
  let shoes = await fetchEligibleShoes(7);
  if (shoes.length < minShoes) {
    window = 14;
    shoes = await fetchEligibleShoes(14);
  }
  if (shoes.length < minShoes) {
    throw new Error("insufficient_pool");
  }
  return { shoes, window };
}

/** Sequential：給定 seed 組一份「同一靴 10 連問」題組 */
export async function buildSequentialQuiz(seed: string): Promise<{
  shoe: QuizShoe;
  answers: Array<"banker" | "player" | "tie">;
  window: QuizSourceWindowDays;
}> {
  const { shoes, window } = await fetchPool(1);

  const seedHash = fnv1a(seed);
  const rng = mulberry32(seedHash);

  const picked = shuffleDeterministic(shoes, rng);
  const qCount = QUIZ_QUESTION_COUNT;

  let lastErr: unknown = null;
  for (let i = 0; i < Math.min(picked.length, 5); i++) {
    const shoe = picked[i];
    const rawMax = shoe.total_hands - qCount + 1; // 最大 start = total_hands - 9
    const max = Math.max(QUIZ_MIN_START, rawMax);
    const min = QUIZ_MIN_START;
    const range = Math.max(1, max - min + 1);
    const start = Math.min(max, Math.max(min, min + Math.floor(rng() * range)));

    try {
      const rows = await fetchAllHandsForShoe(shoe.table_id, shoe.shoe_started_at);

      const byNum = new Map<number, HandRowLite>();
      for (const r of rows) byNum.set(r.hand_num, r);
      let complete = true;
      for (let k = 0; k < qCount; k++) {
        if (!byNum.has(start + k)) {
          complete = false;
          break;
        }
      }
      if (!complete) {
        lastErr = new Error(`missing_answer_hands shoe=${shoe.id} start=${start}`);
        continue;
      }

      const all_hands: QuizHand[] = rows.map(toQuizHand);
      const answers: Array<"banker" | "player" | "tie"> = [];
      for (let k = 0; k < qCount; k++) {
        const row = byNum.get(start + k);
        if (!row) throw new Error("unreachable");
        answers.push(row.winner);
      }

      const shoeOut: QuizShoe = {
        shoe_id: shoe.id,
        platform: shoe.platform,
        shoe_label: `${shoe.platform} 靴 #${shoe.id}`,
        start,
        all_hands,
      };

      return { shoe: shoeOut, answers, window };
    } catch (e) {
      lastErr = e;
      continue;
    }
  }

  throw lastErr ?? new Error("no_usable_shoe");
}

/** Random：給定 seed 組一份「10 靴各 1 題」題組 */
export async function buildRandomQuiz(seed: string): Promise<{
  questions: QuizRandomQuestion[];
  answers: Array<"banker" | "player" | "tie">;
  window: QuizSourceWindowDays;
}> {
  const qCount = QUIZ_QUESTION_COUNT;
  const { shoes, window } = await fetchPool(qCount);

  const seedHash = fnv1a(seed);
  const rng = mulberry32(seedHash);

  const picked = shuffleDeterministic(shoes, rng);
  // 最多嘗試 2x 候選靴：容忍少量 hand_results 不完整
  const maxAttempts = Math.min(picked.length, qCount * 2);

  const questions: QuizRandomQuestion[] = [];
  const answers: Array<"banker" | "player" | "tie"> = [];
  let lastErr: unknown = null;

  for (let i = 0; i < maxAttempts && questions.length < qCount; i++) {
    const shoe = picked[i];
    // cutoff ∈ [30, total_hands]（至少 30 才有可讀的大路 + 下三路）
    const max = shoe.total_hands;
    const min = Math.min(QUIZ_MIN_START, max);
    const range = Math.max(1, max - min + 1);
    const cutoff = Math.min(max, Math.max(min, min + Math.floor(rng() * range)));

    try {
      const rows = await fetchAllHandsForShoe(shoe.table_id, shoe.shoe_started_at);

      const byNum = new Map<number, HandRowLite>();
      for (const r of rows) byNum.set(r.hand_num, r);

      // 需要 cutoff 這手存在才能當答案
      const target = byNum.get(cutoff);
      if (!target) {
        lastErr = new Error(`missing_cutoff_hand shoe=${shoe.id} cutoff=${cutoff}`);
        continue;
      }

      // visible = 1..cutoff-1
      const visible: QuizHand[] = [];
      for (let k = 1; k < cutoff; k++) {
        const r = byNum.get(k);
        if (r) visible.push(toQuizHand(r));
      }
      // 可見數太少（資料缺太多）就跳過這靴
      if (visible.length < QUIZ_MIN_START - 1) {
        lastErr = new Error(`too_few_visible shoe=${shoe.id} cutoff=${cutoff}`);
        continue;
      }

      questions.push({
        shoe_id: shoe.id,
        platform: shoe.platform,
        shoe_label: `${shoe.platform} 靴 #${shoe.id}`,
        cutoff_hand_num: cutoff,
        visible_hands: visible,
      });
      answers.push(target.winner);
    } catch (e) {
      lastErr = e;
      continue;
    }
  }

  if (questions.length < qCount) {
    throw lastErr ?? new Error("insufficient_usable_shoes");
  }

  return { questions, answers, window };
}

export function parseMode(raw: string | null): QuizMode {
  if (raw === "random") return "random";
  // 預設 sequential（backward compat）
  return "sequential";
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };
