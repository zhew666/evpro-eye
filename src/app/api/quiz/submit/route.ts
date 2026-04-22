/**
 * POST /api/quiz/submit — 紀錄使用者 /quiz 作答結果到 Supabase。
 *
 * 安全性：**不信任 client 送來的 correct_count**。
 * Server 用同一個 seed + mode 重跑 buildSequentialQuiz / buildRandomQuiz，
 * 拿到正解答案序列，比對使用者 answers 算出真正的 correct_count。
 *
 * Request body:
 *   {
 *     seed: string,
 *     mode: "sequential" | "random",
 *     name?: string,                          // optional, trim, max 30
 *     answers: Array<"banker"|"player"|"tie"|"skip">  // len 10
 *   }
 *
 * Response:
 *   200 { ok: true, id: number, correct_count: number }
 *   400 { error: "invalid_request", detail }
 *   503 { error: "insufficient_pool", detail }
 *   500 { error, detail }
 */

import { QUIZ_QUESTION_COUNT, type QuizChoice, type QuizMode } from "@/lib/quiz";
import {
  buildRandomQuiz,
  buildSequentialQuiz,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_ANSWER_SET: ReadonlySet<string> = new Set([
  "banker",
  "player",
  "tie",
  "skip",
]);

type AnswerChoice = QuizChoice;

interface SubmitBody {
  seed: string;
  mode: QuizMode;
  name?: string;
  answers: AnswerChoice[];
}

function parseBody(raw: unknown): { ok: true; body: SubmitBody } | { ok: false; detail: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, detail: "body must be object" };
  }
  const obj = raw as Record<string, unknown>;

  const seed = obj.seed;
  if (typeof seed !== "string" || !/^[a-z0-9]{3,20}$/.test(seed)) {
    return { ok: false, detail: "invalid seed" };
  }

  const mode = obj.mode;
  if (mode !== "sequential" && mode !== "random") {
    return { ok: false, detail: "invalid mode" };
  }

  const answers = obj.answers;
  if (!Array.isArray(answers) || answers.length !== QUIZ_QUESTION_COUNT) {
    return { ok: false, detail: `answers must be array of length ${QUIZ_QUESTION_COUNT}` };
  }
  const validated: AnswerChoice[] = [];
  for (const a of answers) {
    if (typeof a !== "string" || !VALID_ANSWER_SET.has(a)) {
      return { ok: false, detail: `invalid answer value: ${String(a)}` };
    }
    validated.push(a as AnswerChoice);
  }

  let name: string | undefined;
  if (obj.name !== undefined && obj.name !== null) {
    if (typeof obj.name !== "string") {
      return { ok: false, detail: "name must be string" };
    }
    name = obj.name;
  }

  return {
    ok: true,
    body: { seed, mode, name, answers: validated },
  };
}

/**
 * 依優先順序抽 client IP。Vercel 部署環境下 x-forwarded-for 是主要來源。
 * 回傳值可能是 null（local dev、或 header 都沒填）。
 */
function extractIp(headers: Headers): string | null {
  const candidates = [
    headers.get("x-forwarded-for"),
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
    headers.get("x-vercel-forwarded-for"),
    headers.get("fly-client-ip"),
    headers.get("true-client-ip"),
  ];
  for (const c of candidates) {
    if (!c) continue;
    // x-forwarded-for 可能是 "a, b, c" — 取第一段
    const first = c.split(",")[0]?.trim();
    if (first) return first;
  }
  return null;
}

function normalizeName(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 30);
}

/** 把 server 重算的正解跟使用者答案比對，算 correct_count / skipped_count */
function scoreAgainstTruth(
  userAnswers: AnswerChoice[],
  truth: Array<"banker" | "player" | "tie">,
): { correct: number; skipped: number } {
  let correct = 0;
  let skipped = 0;
  for (let i = 0; i < userAnswers.length; i++) {
    const u = userAnswers[i];
    if (u === "skip") {
      skipped++;
      continue;
    }
    if (u === truth[i]) correct++;
  }
  return { correct, skipped };
}

interface InsertRow {
  name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  seed: string;
  mode: QuizMode;
  shoe_id: number | null;
  shoe_ids: number[] | null;
  start_hand: number | null;
  answers: AnswerChoice[];
  correct_count: number;
  skipped_count: number;
  total_questions: number;
  correct_rate: number | null;
  referrer: string | null;
}

async function supabaseInsertAttempt(row: InsertRow): Promise<number> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/quiz_attempts`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase insert ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as Array<{ id: number }>;
  if (!Array.isArray(data) || data.length === 0 || typeof data[0]?.id !== "number") {
    throw new Error("insert returned no id");
  }
  return data[0].id;
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return Response.json({ error: "Server configuration missing" }, { status: 500 });
  }

  // 1) parse body
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json(
      { error: "invalid_request", detail: "body is not valid JSON" },
      { status: 400 },
    );
  }
  const parsed = parseBody(raw);
  if (!parsed.ok) {
    return Response.json(
      { error: "invalid_request", detail: parsed.detail },
      { status: 400 },
    );
  }
  const { seed, mode, name, answers } = parsed.body;

  // 2) server-side 重算正解 → 拿到 truth、shoe_id(s)、start
  let truth: Array<"banker" | "player" | "tie">;
  let shoe_id: number | null = null;
  let shoe_ids: number[] | null = null;
  let start_hand: number | null = null;

  try {
    if (mode === "sequential") {
      const built = await buildSequentialQuiz(seed);
      truth = built.answers;
      shoe_id = built.shoe.shoe_id;
      start_hand = built.shoe.start;
    } else {
      const built = await buildRandomQuiz(seed);
      truth = built.answers;
      shoe_ids = built.questions.map((q) => q.shoe_id);
    }
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    if (msg.includes("insufficient_pool") || msg.includes("insufficient_usable_shoes")) {
      return Response.json(
        { error: "insufficient_pool", detail: "資料更新中，請稍後再試" },
        { status: 503 },
      );
    }
    return Response.json(
      { error: "server_error", detail: msg },
      { status: 500 },
    );
  }

  if (!Array.isArray(truth) || truth.length !== QUIZ_QUESTION_COUNT) {
    return Response.json(
      { error: "server_error", detail: "truth length mismatch" },
      { status: 500 },
    );
  }

  // 3) score
  const { correct, skipped } = scoreAgainstTruth(answers, truth);
  const denom = QUIZ_QUESTION_COUNT - skipped;
  const correct_rate = denom > 0 ? Math.round((correct / denom) * 10000) / 100 : null;

  // 4) meta
  const ip_address = extractIp(request.headers);
  const user_agent = request.headers.get("user-agent")?.slice(0, 500) ?? null;
  const referrer = request.headers.get("referer")?.slice(0, 500) ?? null;
  const cleanName = normalizeName(name);

  // 5) insert
  try {
    const id = await supabaseInsertAttempt({
      name: cleanName,
      ip_address,
      user_agent,
      seed,
      mode,
      shoe_id,
      shoe_ids,
      start_hand,
      answers,
      correct_count: correct,
      skipped_count: skipped,
      total_questions: QUIZ_QUESTION_COUNT,
      correct_rate,
      referrer,
    });
    return Response.json({ ok: true, id, correct_count: correct });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    return Response.json(
      { error: "db_error", detail: msg },
      { status: 500 },
    );
  }
}
