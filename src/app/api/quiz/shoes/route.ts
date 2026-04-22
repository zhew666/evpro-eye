/**
 * GET /api/quiz/shoes — 組測驗資料（v3 · 兩種模式）
 *
 * Query params：
 *   - seed: string, 3+ 字英數，省略則自動生成
 *   - mode: "sequential" | "random"（預設 sequential，保留 backward compat）
 *   - count 相容參數（忽略，固定 10 題）
 *
 * 實作細節拆到 `../_lib.ts`，供 `/api/quiz/submit` 共用重算邏輯。
 */

import { generateSeed, type QuizResponse } from "@/lib/quiz";
import {
  buildRandomQuiz,
  buildSequentialQuiz,
  parseMode,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "../_lib";

export const revalidate = 60;

export async function GET(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return Response.json({ error: "Server configuration missing" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);

    const seedRaw = searchParams.get("seed");
    const seed = seedRaw && /^[a-z0-9]{3,20}$/.test(seedRaw) ? seedRaw : generateSeed();
    const mode = parseMode(searchParams.get("mode"));

    if (mode === "random") {
      const { questions, answers, window } = await buildRandomQuiz(seed);
      const payload: QuizResponse = {
        mode: "random",
        seed,
        generated_at: new Date().toISOString(),
        source_window_days: window,
        questions,
        answers,
      };
      return Response.json(payload);
    }

    const { shoe, answers, window } = await buildSequentialQuiz(seed);
    const payload: QuizResponse = {
      mode: "sequential",
      seed,
      generated_at: new Date().toISOString(),
      source_window_days: window,
      shoe,
      answers,
    };
    return Response.json(payload);
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    if (msg.includes("insufficient_pool") || msg.includes("insufficient_usable_shoes")) {
      return Response.json(
        { error: "insufficient_pool", detail: "資料更新中，請稍後再試" },
        { status: 503 },
      );
    }
    return Response.json(
      { error: "Internal server error", detail: msg },
      { status: 500 },
    );
  }
}
