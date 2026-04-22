import type { Metadata } from "next";
import {
  QUIZ_QUESTION_COUNT,
  RANDOM_BANKER_RATE,
  SYSTEM_HIT_RATE_PLACEHOLDER,
  getInsight,
  modeLabel,
  type QuizMode,
} from "@/lib/quiz";

interface Params {
  seed: string;
  mode: string;
  score: string;
}

function parseScore(raw: string): number {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(QUIZ_QUESTION_COUNT, n));
}

function parseMode(raw: string): QuizMode {
  return raw === "random" ? "random" : "sequential";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { seed, mode: modeRaw, score: scoreRaw } = await params;
  const mode = parseMode(modeRaw);
  const score = parseScore(scoreRaw);
  const rate = (score / QUIZ_QUESTION_COUNT) * 100;
  const title = `我 ${score}/${QUIZ_QUESTION_COUNT} — 看路科學測驗`;
  const modeDesc =
    mode === "random"
      ? "隨機抽 10 靴 · 跨靴看路挑戰"
      : "同一靴連續 10 手 · 真實歷史牌路";
  const desc = `命中率 ${rate.toFixed(0)}% vs 隨機 ${RANDOM_BANKER_RATE}% vs 系統 ${SYSTEM_HIT_RATE_PLACEHOLDER}% · ${modeDesc}，來挑戰你看不看得懂路`;
  const url = `https://evpro-eye.com/quiz/share/${seed}/${mode}/${score}`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { seed, mode: modeRaw, score: scoreRaw } = await params;
  const mode = parseMode(modeRaw);
  const score = parseScore(scoreRaw);
  const rate = (score / QUIZ_QUESTION_COUNT) * 100;
  const rateDisplay = rate.toFixed(0);
  const insight = getInsight(rate, SYSTEM_HIT_RATE_PLACEHOLDER);
  const quizUrl = `https://evpro-eye.com/quiz?seed=${encodeURIComponent(
    seed,
  )}&mode=${mode}`;

  const imgUrl = `/quiz/share/${encodeURIComponent(seed)}/${mode}/${score}/opengraph-image`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14 space-y-6 text-center">
      <h1 className="text-2xl sm:text-3xl font-bold">
        我{" "}
        <span className="text-accent">
          {score}/{QUIZ_QUESTION_COUNT}
        </span>
      </h1>
      <p className="text-text-muted">
        命中率 {rateDisplay}% · 隨機 {RANDOM_BANKER_RATE}% · 系統 {SYSTEM_HIT_RATE_PLACEHOLDER}%
      </p>
      <p className="text-text-muted text-sm">模式：{modeLabel(mode)}</p>

      {/* 分享卡預覽（用 OG endpoint） */}
      <div className="rounded-xl overflow-hidden border border-accent/30 bg-bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgUrl} alt="看路科學測驗分享卡" className="w-full h-auto block" />
      </div>

      <p className="text-text-muted text-sm italic">「{insight}」</p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={quizUrl}
          className="inline-flex items-center justify-center gap-1.5 font-bold px-6 py-3 text-base rounded-lg bg-accent text-primary hover:bg-accent-hover shadow-[var(--shadow-1)]"
        >
          挑戰相同題目
        </a>
        <a
          href="/quiz"
          className="inline-flex items-center justify-center gap-1.5 font-bold px-6 py-3 text-base rounded-lg bg-bg-card text-text border border-[color:var(--color-border-strong)] hover:border-accent/50 hover:text-accent"
        >
          我也要測
        </a>
      </div>

      <p className="text-text-muted text-xs pt-4">
        長按圖片儲存，或右鍵另存新檔，即可分享到 Threads / LINE / IG
      </p>
    </div>
  );
}
