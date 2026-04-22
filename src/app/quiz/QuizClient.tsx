"use client";

/**
 * QuizClient — /quiz 主 state machine client component（v3 · 雙模式）
 *
 * 兩種模式：
 *  - sequential：同一靴連續 10 題。每題 visible = all_hands.slice(0, start-1+idx)
 *  - random：10 靴各 1 題。每題 visible = questions[i].visible_hands
 *
 * 狀態：idle | loading | playing | reviewing | finished
 * 進度持久化於 localStorage (QUIZ_STORAGE_KEY)；URL `?seed=&mode=` 為 source of truth
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { RoadsPanel } from "@/components/BaccaratRoads";
import { Card, Badge, Button } from "@/components/ui";
import {
  QUIZ_QUESTION_COUNT,
  QUIZ_STORAGE_KEY,
  RANDOM_BANKER_RATE,
  SYSTEM_HIT_RATE_PLACEHOLDER,
  choiceLabel,
  getInsight,
  modeLabel,
  scoreQuiz,
  winnerLabel,
  type QuizAnswer,
  type QuizChoice,
  type QuizHand,
  type QuizLocalState,
  type QuizMode,
  type QuizRandomQuestion,
  type QuizResponse,
  type QuizShoe,
} from "@/lib/quiz";

type Phase = "idle" | "loading" | "playing" | "reviewing" | "finished";

/** 名字輸入用的 localStorage key；跟 quiz state 分開 */
const QUIZ_NAME_STORAGE_KEY = "evpro-quiz-name";
const QUIZ_NAME_MAX_LEN = 30;

/** 存下完整 response 配合 mode 分支；discriminated by `mode` */
type FetchedQuiz =
  | {
      mode: "sequential";
      seed: string;
      source_window_days: 7 | 14;
      shoe: QuizShoe;
      answers: Array<"banker" | "player" | "tie">;
    }
  | {
      mode: "random";
      seed: string;
      source_window_days: 7 | 14;
      questions: QuizRandomQuestion[];
      answers: Array<"banker" | "player" | "tie">;
    };

/* ─── 小元件：進度 dots ───────────────────────── */

function ProgressDots({
  total,
  currentIdx,
  answers,
}: {
  total: number;
  currentIdx: number;
  answers: QuizAnswer[];
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        {Array.from({ length: total }).map((_, i) => {
          const a = answers.find((x) => x.q === i + 1);
          const isCurrent = i === currentIdx;
          let bg = "bg-white/10";
          let ring = "";
          if (a) {
            if (a.choice === "skip") bg = "bg-text-muted/40";
            else if (a.correct) bg = "bg-[color:var(--color-success)]";
            else bg = "bg-[color:var(--color-error)]";
          }
          if (isCurrent) ring = "ring-2 ring-accent ring-offset-2 ring-offset-[color:var(--color-bg)]";
          return (
            <span
              key={i}
              aria-label={`第 ${i + 1} 題${a ? (a.correct ? "（對）" : a.choice === "skip" ? "（跳過）" : "（錯）") : ""}`}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${bg} ${ring}`}
            />
          );
        })}
      </div>
      <div className="text-xs text-text-muted whitespace-nowrap">
        {currentIdx + 1} / {total}
      </div>
    </div>
  );
}

/* ─── 小元件：四顆選項按鈕 ───────────────────── */

function ChoiceButton({
  choice,
  onClick,
  disabled,
  isYours,
  isAnswer,
  phase,
}: {
  choice: QuizChoice;
  onClick: () => void;
  disabled: boolean;
  isYours: boolean;
  isAnswer: boolean;
  phase: "playing" | "reviewing";
}) {
  const toneBase: Record<QuizChoice, string> = {
    banker:
      "bg-[color:var(--color-banker)]/15 text-[color:var(--color-banker)] border-[color:var(--color-banker)]/40 hover:bg-[color:var(--color-banker)]/25",
    player:
      "bg-[color:var(--color-player)]/15 text-[color:var(--color-player)] border-[color:var(--color-player)]/40 hover:bg-[color:var(--color-player)]/25",
    tie: "bg-[color:var(--color-tie)]/15 text-[color:var(--color-tie)] border-[color:var(--color-tie)]/40 hover:bg-[color:var(--color-tie)]/25",
    skip: "bg-white/5 text-text-muted border-white/15 hover:bg-white/10 hover:text-text",
  };

  const isReviewing = phase === "reviewing";
  const highlightAnswer = isReviewing && isAnswer ? "ring-2 ring-accent animate-pulse" : "";
  const dimmed = isReviewing && !isYours && !isAnswer ? "opacity-40" : "";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex-1 min-w-[64px]",
        "inline-flex items-center justify-center font-bold",
        "px-4 py-4 text-lg rounded-lg border",
        "transition-colors duration-[var(--duration-base)]",
        "disabled:cursor-not-allowed",
        toneBase[choice],
        highlightAnswer,
        dimmed,
      ].join(" ")}
    >
      {choiceLabel(choice)}
    </button>
  );
}

/* ─── URL mode 解析（舊連結缺 mode 預設 sequential） ───────────────── */

function parseModeParam(raw: string | null | undefined): QuizMode {
  return raw === "random" ? "random" : "sequential";
}

/* ─── 主元件 ──────────────────────────────── */

export default function QuizClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [data, setData] = useState<FetchedQuiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0); // 0-based 題目索引
  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState<string>(""); // 使用者暱稱 / 代理代號，可空
  const bootstrappedRef = useRef(false);

  // hydrate 名字（獨立 key，跟 quiz state 分開；下次來還在）
  useEffect(() => {
    try {
      const saved = localStorage.getItem(QUIZ_NAME_STORAGE_KEY);
      if (saved) setName(saved.slice(0, QUIZ_NAME_MAX_LEN));
    } catch {
      /* ignore */
    }
  }, []);

  function handleNameChange(next: string) {
    const trimmed = next.slice(0, QUIZ_NAME_MAX_LEN);
    setName(trimmed);
    try {
      localStorage.setItem(QUIZ_NAME_STORAGE_KEY, trimmed);
    } catch {
      /* ignore */
    }
  }

  /* ── 初始化：讀 localStorage / URL ── */
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    setHydrated(true);

    const url = new URL(window.location.href);
    const urlSeed = url.searchParams.get("seed");
    const urlMode = parseModeParam(url.searchParams.get("mode"));

    let local: QuizLocalState | null = null;
    try {
      const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (raw) local = JSON.parse(raw) as QuizLocalState;
    } catch {
      local = null;
    }

    // URL seed 與 local seed 不符 → URL 為準、清掉 local
    if (urlSeed && local && local.seed !== urlSeed) {
      try {
        localStorage.removeItem(QUIZ_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      local = null;
    }

    if (urlSeed) {
      void startQuiz(urlSeed, urlMode, local);
    } else if (local && local.seed && local.answers.length > 0 && local.phase !== "finished") {
      // 僅恢復 UI 狀態（尚未 fetch），等使用者按「繼續上次」才真正 fetch
      setAnswers(local.answers);
      setCurrentIdx(Math.max(0, local.currentQ - 1));
    } else if (local && local.phase === "finished" && local.seed) {
      setAnswers(local.answers);
      setCurrentIdx(local.answers.length - 1);
      const resumeMode: QuizMode = local.mode ?? "sequential";
      void resumeFinished(local.seed, resumeMode, local.answers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(next: Partial<QuizLocalState> & { seed: string; mode: QuizMode }) {
    try {
      const prevRaw = localStorage.getItem(QUIZ_STORAGE_KEY);
      const prev = prevRaw ? (JSON.parse(prevRaw) as QuizLocalState) : null;
      const merged: QuizLocalState = {
        seed: next.seed,
        mode: next.mode,
        startedAt: next.startedAt ?? prev?.startedAt ?? Date.now(),
        currentQ: next.currentQ ?? prev?.currentQ ?? 1,
        phase: next.phase ?? prev?.phase ?? "playing",
        answers: next.answers ?? prev?.answers ?? [],
      };
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      /* ignore */
    }
  }

  async function startQuiz(
    seed: string | null,
    mode: QuizMode,
    resumeFrom?: QuizLocalState | null,
  ) {
    setPhase("loading");
    setError(null);
    try {
      const params = new URLSearchParams();
      if (seed) params.set("seed", seed);
      params.set("mode", mode);
      const res = await fetch(`/api/quiz/shoes?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        const body: { error?: string; detail?: string } = await res.json().catch(() => ({}));
        if (res.status === 503) {
          throw new Error(body.detail || "資料更新中，請稍後再試");
        }
        throw new Error(body.error || `伺服器錯誤 ${res.status}`);
      }
      const payload = (await res.json()) as QuizResponse;

      // 以 discriminator 分派
      const fetched: FetchedQuiz =
        payload.mode === "random"
          ? {
              mode: "random",
              seed: payload.seed,
              source_window_days: payload.source_window_days,
              questions: payload.questions,
              answers: payload.answers,
            }
          : {
              mode: "sequential",
              seed: payload.seed,
              source_window_days: payload.source_window_days,
              shoe: payload.shoe,
              answers: payload.answers,
            };
      setData(fetched);

      // 更新 URL（replaceState）
      const url = new URL(window.location.href);
      url.searchParams.set("seed", payload.seed);
      url.searchParams.set("mode", payload.mode);
      window.history.replaceState(null, "", url.toString());

      // 同 seed + 同 mode 才恢復作答；否則當作新局
      const resumable =
        resumeFrom &&
        resumeFrom.seed === payload.seed &&
        (resumeFrom.mode ?? "sequential") === payload.mode;

      if (resumable && resumeFrom) {
        setAnswers(resumeFrom.answers);
        const nextIdx = Math.max(0, resumeFrom.currentQ - 1);
        setCurrentIdx(nextIdx);
        if (resumeFrom.answers.length >= QUIZ_QUESTION_COUNT) {
          setPhase("finished");
        } else {
          setPhase("playing");
        }
      } else {
        setAnswers([]);
        setCurrentIdx(0);
        setPhase("playing");
        persist({
          seed: payload.seed,
          mode: payload.mode,
          startedAt: Date.now(),
          currentQ: 1,
          phase: "playing",
          answers: [],
        });
      }
    } catch (e) {
      setError((e as Error).message || "載入題目失敗");
      setPhase("idle");
    }
  }

  async function resumeFinished(
    seed: string,
    mode: QuizMode,
    savedAnswers: QuizAnswer[],
  ) {
    setPhase("loading");
    try {
      const params = new URLSearchParams();
      params.set("seed", seed);
      params.set("mode", mode);
      const res = await fetch(`/api/quiz/shoes?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("resume-failed");
      const payload = (await res.json()) as QuizResponse;
      const fetched: FetchedQuiz =
        payload.mode === "random"
          ? {
              mode: "random",
              seed: payload.seed,
              source_window_days: payload.source_window_days,
              questions: payload.questions,
              answers: payload.answers,
            }
          : {
              mode: "sequential",
              seed: payload.seed,
              source_window_days: payload.source_window_days,
              shoe: payload.shoe,
              answers: payload.answers,
            };
      setData(fetched);
      setAnswers(savedAnswers);
      setPhase("finished");
    } catch {
      setPhase("idle");
    }
  }

  /* ── 題目衍生狀態（依 mode 分支） ── */

  /** 當前這題的 visible hands / 題號 / shoe_label / 要猜的 hand_num */
  const derived = useMemo(() => {
    if (!data) return null;
    if (data.mode === "sequential") {
      const shoe = data.shoe;
      const visibleCount = shoe.start - 1 + currentIdx;
      const visibleHands: QuizHand[] = shoe.all_hands.slice(0, visibleCount);
      const targetHandNum = shoe.start + currentIdx;
      return {
        mode: "sequential" as const,
        visibleHands,
        visibleCount,
        targetHandNum,
        shoeLabel: shoe.shoe_label,
        platform: shoe.platform,
      };
    }
    // random
    const q = data.questions[currentIdx];
    return {
      mode: "random" as const,
      visibleHands: q.visible_hands,
      visibleCount: q.visible_hands.length,
      targetHandNum: q.cutoff_hand_num,
      shoeLabel: q.shoe_label,
      platform: q.platform,
    };
  }, [data, currentIdx]);

  function getCorrectForIdx(d: FetchedQuiz, idx: number): "banker" | "player" | "tie" {
    return d.answers[idx];
  }

  function handleChoose(choice: QuizChoice) {
    if (!data) return;
    if (phase !== "playing") return;

    const correctWinner = getCorrectForIdx(data, currentIdx);
    const qIndex = currentIdx + 1;

    const isSkip = choice === "skip";
    const correct = isSkip ? null : choice === correctWinner;

    const newAnswer: QuizAnswer = {
      q: qIndex,
      choice,
      correct,
      answer: correctWinner,
    };
    const nextAnswers = [...answers.filter((a) => a.q !== qIndex), newAnswer].sort(
      (a, b) => a.q - b.q,
    );
    setAnswers(nextAnswers);

    if (isSkip) {
      const nextIdx = currentIdx + 1;
      if (nextIdx >= QUIZ_QUESTION_COUNT) {
        setPhase("finished");
        persist({
          seed: data.seed,
          mode: data.mode,
          currentQ: QUIZ_QUESTION_COUNT,
          phase: "finished",
          answers: nextAnswers,
        });
      } else {
        setCurrentIdx(nextIdx);
        persist({
          seed: data.seed,
          mode: data.mode,
          currentQ: nextIdx + 1,
          phase: "playing",
          answers: nextAnswers,
        });
      }
    } else {
      setPhase("reviewing");
      persist({
        seed: data.seed,
        mode: data.mode,
        currentQ: qIndex,
        phase: "reviewing",
        answers: nextAnswers,
      });
    }
  }

  function handleNext() {
    if (!data) return;
    const nextIdx = currentIdx + 1;
    if (nextIdx >= QUIZ_QUESTION_COUNT) {
      setPhase("finished");
      persist({
        seed: data.seed,
        mode: data.mode,
        currentQ: QUIZ_QUESTION_COUNT,
        phase: "finished",
        answers,
      });
      return;
    }
    setCurrentIdx(nextIdx);
    setPhase("playing");
    persist({
      seed: data.seed,
      mode: data.mode,
      currentQ: nextIdx + 1,
      phase: "playing",
      answers,
    });
  }

  function handleRestart() {
    try {
      localStorage.removeItem(QUIZ_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("seed");
    url.searchParams.delete("mode");
    window.history.replaceState(null, "", url.toString());
    setAnswers([]);
    setCurrentIdx(0);
    setData(null);
    setError(null);
    setPhase("idle");
  }

  function handleStartMode(mode: QuizMode) {
    void startQuiz(null, mode);
  }

  function handleResume() {
    let local: QuizLocalState | null = null;
    try {
      const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (raw) local = JSON.parse(raw) as QuizLocalState;
    } catch {
      local = null;
    }
    if (!local?.seed) {
      // 沒有可恢復資料，預設開 sequential
      void startQuiz(null, "sequential");
      return;
    }
    const resumeMode: QuizMode = local.mode ?? "sequential";
    void startQuiz(local.seed, resumeMode, local);
  }

  const resumable = useMemo(() => {
    if (!hydrated) return null;
    try {
      const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (!raw) return null;
      const local = JSON.parse(raw) as QuizLocalState;
      if (!local.seed || local.phase === "finished" || local.answers.length === 0) return null;
      return {
        mode: (local.mode ?? "sequential") as QuizMode,
      };
    } catch {
      return null;
    }
  }, [hydrated, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ──────────────── 渲染 ──────────────── */

  if (phase === "idle") {
    return (
      <IdleView
        onStartMode={handleStartMode}
        onResume={handleResume}
        resumable={resumable}
        error={error}
        name={name}
        onNameChange={handleNameChange}
      />
    );
  }

  if (phase === "loading" || !data || !derived) {
    return <LoadingView />;
  }

  if (phase === "finished") {
    return (
      <FinishedView data={data} answers={answers} name={name} onRestart={handleRestart} />
    );
  }

  const qIndex = currentIdx + 1;
  const correctWinner = getCorrectForIdx(data, currentIdx);
  const myAnswer = answers.find((a) => a.q === qIndex) ?? null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      <ProgressDots total={QUIZ_QUESTION_COUNT} currentIdx={currentIdx} answers={answers} />

      {/* 桌資訊條 */}
      <Card variant="compact" className="flex items-center gap-3">
        <Badge tone={derived.platform === "DG" ? "info" : "brand"} variant="soft">
          {derived.platform}
        </Badge>
        <span className="text-text-muted text-sm font-mono">{derived.shoeLabel}</span>
        <span className="ml-auto text-text-muted text-xs">
          {data.mode === "random" ? "本題獨立一靴" : `已看 ${derived.visibleCount} 手`}
        </span>
      </Card>

      {/* 大路 + 下三路 */}
      <Card variant="default">
        <RoadsPanel hands={derived.visibleHands} defaultExpanded />
      </Card>

      {/* 題幹 */}
      <div className="text-center py-2">
        <h2 className="text-xl sm:text-2xl font-bold text-accent">
          第 <span className="text-3xl sm:text-4xl">{derived.targetHandNum}</span> 手會開什麼？
        </h2>
      </div>

      {/* 選項或翻牌回饋 */}
      {phase === "playing" && (
        <div className="grid grid-cols-4 gap-2">
          {(["banker", "player", "tie", "skip"] as const).map((c) => (
            <ChoiceButton
              key={c}
              choice={c}
              onClick={() => handleChoose(c)}
              disabled={false}
              isYours={false}
              isAnswer={false}
              phase="playing"
            />
          ))}
        </div>
      )}

      {phase === "reviewing" && myAnswer && (
        <div className="space-y-4">
          <Card variant="accent" className="text-center py-4">
            <div className="flex items-center justify-center gap-4 text-base sm:text-lg font-bold">
              <span className="text-text">
                你選：<span className="text-accent">{choiceLabel(myAnswer.choice)}</span>
                {myAnswer.correct === true && (
                  <span className="ml-2 text-[color:var(--color-success)]">✓</span>
                )}
                {myAnswer.correct === false && (
                  <span className="ml-2 text-[color:var(--color-error)]">✗</span>
                )}
              </span>
              <span className="text-text-muted">·</span>
              <span className="text-text">
                正解：<span className="text-accent">{winnerLabel(correctWinner)}</span>
              </span>
            </div>
          </Card>

          <div className="grid grid-cols-4 gap-2">
            {(["banker", "player", "tie", "skip"] as const).map((c) => (
              <ChoiceButton
                key={c}
                choice={c}
                onClick={() => {
                  /* disabled */
                }}
                disabled
                isYours={myAnswer.choice === c}
                isAnswer={correctWinner === c}
                phase="reviewing"
              />
            ))}
          </div>

          <Button variant="primary" size="lg" className="w-full" onClick={handleNext}>
            {qIndex === QUIZ_QUESTION_COUNT ? "看我的結果 →" : "下一題 →"}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Sub views ──────────────────────────────── */

function ModeCard({
  title,
  icon,
  subtitle,
  bullets,
  onStart,
}: {
  title: string;
  icon: string;
  subtitle: string;
  bullets: string[];
  onStart: () => void;
}) {
  return (
    <Card
      variant="accent"
      className="flex flex-col gap-3 text-left hover:border-accent transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          {icon}
        </span>
        <h3 className="text-lg sm:text-xl font-bold text-accent">{title}</h3>
      </div>
      <p className="text-text text-sm sm:text-base">{subtitle}</p>
      <ul className="list-disc list-inside text-text-muted text-xs sm:text-sm space-y-1">
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <Button variant="primary" size="lg" className="w-full mt-2" onClick={onStart}>
        開始 →
      </Button>
    </Card>
  );
}

function IdleView({
  onStartMode,
  onResume,
  resumable,
  error,
  name,
  onNameChange,
}: {
  onStartMode: (mode: QuizMode) => void;
  onResume: () => void;
  resumable: { mode: QuizMode } | null;
  error: string | null;
  name: string;
  onNameChange: (next: string) => void;
}) {
  const inputClass = [
    "w-full px-3 py-2 bg-primary/50 rounded-md text-sm text-text",
    "border border-[color:var(--color-border-strong)]",
    "focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30",
    "transition-colors duration-[var(--duration-fast)]",
  ].join(" ");

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16 text-center">
      <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">
        看路法真的有用嗎？
        <br />
        <span className="text-accent">10 題見真章</span>
      </h1>
      <p className="text-text-muted text-base sm:text-lg max-w-xl mx-auto mb-8">
        用我們資料庫的真實歷史靴，選一種測驗模式，看
        <span className="text-accent">牌路</span>是否讓你命中率更高。
      </p>

      {/* 名字輸入：排在模式 Card 上方 */}
      <div className="max-w-2xl mx-auto mb-6 text-left">
        <label
          htmlFor="quiz-name-input"
          className="block text-sm font-semibold text-text mb-1"
        >
          你的名字 / 暱稱 / 代理代號（可留白）
        </label>
        <input
          id="quiz-name-input"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={QUIZ_NAME_MAX_LEN}
          placeholder="例：K哥 / 代理007 / 匿名"
          autoComplete="off"
          className={inputClass}
        />
        <p className="text-xs text-text-muted mt-1">
          留著讓你在排行榜可查；也可匿名。
        </p>
      </div>

      {/* 模式選擇：兩張 Card 並排 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
        <ModeCard
          icon="🔗"
          title="同靴 10 連問"
          subtitle="同一靴的連續 10 手，看著牌路長出來。"
          bullets={["牌路演進戲劇感", "可事後回看整靴"]}
          onStart={() => onStartMode("sequential")}
        />
        <ModeCard
          icon="🎲"
          title="隨機抽 10 靴"
          subtitle="10 個不同靴、各猜 1 手。"
          bullets={["跨靴挑戰", "範圍更廣"]}
          onStart={() => onStartMode("random")}
        />
      </div>

      <Card
        variant="compact"
        className="text-left text-sm space-y-2 max-w-2xl mx-auto mb-8"
      >
        <div className="font-bold text-accent mb-2">共通規則</div>
        <ul className="list-disc list-inside text-text-muted space-y-1">
          <li>題目來自近 7 天已結束的真實靴</li>
          <li>每題從第 30 手（含）之後出題，確保大路＋下三路可讀</li>
          <li>4 選項：莊 / 閒 / 和 / 跳過（跳過不計分母）</li>
          <li>結果會和隨機基準、系統命中率對比</li>
        </ul>
        <div className="pt-2 text-text-muted italic">準備好被數字打臉了嗎？</div>
      </Card>

      {error && (
        <div className="max-w-xl mx-auto mb-4 px-4 py-2 rounded border border-[color:var(--color-error)]/40 bg-[color:var(--color-error)]/10 text-[color:var(--color-error)] text-sm">
          {error}
        </div>
      )}

      {resumable && (
        <div className="flex justify-center">
          <Button variant="secondary" size="lg" onClick={onResume}>
            繼續上次（{modeLabel(resumable.mode)}）
          </Button>
        </div>
      )}

      <p className="text-xs text-text-muted mt-10 max-w-xl mx-auto">
        測驗結果會匿名記錄用於統計分析（含 IP 粗略位置）。留名可選。
      </p>
    </div>
  );
}

function LoadingView() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {Array.from({ length: QUIZ_QUESTION_COUNT }).map((_, i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-full bg-white/10 animate-pulse" />
          ))}
        </div>
        <div className="text-xs text-text-muted">載入中…</div>
      </div>
      <div className="h-24 rounded-xl bg-bg-card border border-white/10 animate-pulse" />
      <div className="h-64 rounded-xl bg-bg-card border border-white/10 animate-pulse" />
      <div className="h-16 rounded-xl bg-bg-card border border-white/10 animate-pulse" />
    </div>
  );
}

/* ─── 結果頁 ──────────────────────────────── */

function FinishedView({
  data,
  answers,
  name,
  onRestart,
}: {
  data: FetchedQuiz;
  answers: QuizAnswer[];
  name: string;
  onRestart: () => void;
}) {
  const score = scoreQuiz(answers);
  const systemRate = SYSTEM_HIT_RATE_PLACEHOLDER;
  const insight = getInsight(score.rate, systemRate);
  const [copied, setCopied] = useState(false);

  // submit 成績到 /api/quiz/submit（server 重算 correct_count，不信任 client）
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (submitted || submitting) return;
    // 拼 answer payload：以 q 順序、長度 10，缺的題補 "skip"
    const answerPayload: Array<"banker" | "player" | "tie" | "skip"> = [];
    for (let i = 1; i <= QUIZ_QUESTION_COUNT; i++) {
      const a = answers.find((x) => x.q === i);
      answerPayload.push(a ? a.choice : "skip");
    }
    setSubmitting(true);
    fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seed: data.seed,
        mode: data.mode,
        name: name ? name : undefined,
        answers: answerPayload,
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(() => setSubmitted(true))
      .catch((e) => setSubmitError(String((e as Error)?.message ?? e)))
      .finally(() => setSubmitting(false));
    // 只跑一次即可（data.seed/mode 是常數在此 view lifetime 內）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareUrl = useMemo(() => {
    const origin =
      typeof window === "undefined"
        ? "https://evpro-eye.com"
        : window.location.origin || "https://evpro-eye.com";
    return `${origin}/quiz?seed=${encodeURIComponent(data.seed)}&mode=${data.mode}`;
  }, [data.seed, data.mode]);

  // share card：path 加 mode → /quiz/share/[seed]/[mode]/[score]
  const shareCardUrl = `/quiz/share/${encodeURIComponent(data.seed)}/${data.mode}/${score.correct}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14 space-y-8">
      {/* submit 狀態（淡淡的、不阻塞 UX） */}
      <div className="text-center text-xs h-4">
        {submitting && <span className="text-text-muted">成績送出中⋯</span>}
        {submitted && !submitError && (
          <span className="text-text-muted">✓ 成績已記錄</span>
        )}
        {submitError && (
          <span className="text-[color:var(--color-error)]/80">
            ⚠ 送出失敗，但不影響你繼續
          </span>
        )}
      </div>

      {/* 大字分數 */}
      <div className="text-center">
        <div className="text-text-muted text-base sm:text-lg mb-1">你答對</div>
        <div className="text-6xl sm:text-7xl font-black text-accent leading-none">
          {score.correct}{" "}
          <span className="text-text-muted text-4xl sm:text-5xl font-bold">
            / {QUIZ_QUESTION_COUNT}
          </span>
        </div>
        <div className="text-text-muted text-sm mt-2">
          {score.rate === null
            ? "全部跳過，沒有有效分母"
            : `命中率 ${score.rate.toFixed(1)}%（扣除 ${score.skipped} 題跳過）`}
        </div>
        <div className="text-text-muted text-xs mt-3">
          {data.mode === "sequential" ? (
            <>
              本次測驗靴：
              <span className="text-text font-mono">{data.shoe.shoe_label}</span>
              <span className="text-text-muted">
                （第 {data.shoe.start} - {data.shoe.start + QUIZ_QUESTION_COUNT - 1} 手）
              </span>
            </>
          ) : (
            <>本次測驗：10 靴各 1 手</>
          )}
        </div>
      </div>

      {/* 作答紀錄 */}
      <div>
        <h2 className="text-lg font-bold mb-3 text-text">作答紀錄</h2>
        <div className="grid gap-2">
          {Array.from({ length: QUIZ_QUESTION_COUNT }).map((_, i) => {
            const qIndex = i + 1;
            const a = answers.find((x) => x.q === qIndex);
            const correctWinner = data.answers[i];
            const handNum =
              data.mode === "sequential"
                ? data.shoe.start + i
                : data.questions[i].cutoff_hand_num;
            const rowShoeId =
              data.mode === "sequential" ? data.shoe.shoe_id : data.questions[i].shoe_id;
            const rowShoeLabel =
              data.mode === "sequential" ? data.shoe.shoe_label : data.questions[i].shoe_label;
            return (
              <Card
                key={qIndex}
                variant="compact"
                className="flex items-center gap-3 py-2.5 text-sm flex-wrap"
              >
                <span className="font-mono text-text-muted w-10">#{qIndex}</span>
                <span className="text-text-muted text-xs font-mono">手 {handNum}</span>
                <span className="text-text-muted ml-2">你選：</span>
                <span className="font-bold text-text min-w-[2rem]">
                  {a ? choiceLabel(a.choice) : "—"}
                </span>
                <span className="text-text-muted">正解：</span>
                <span className="font-bold text-accent min-w-[2rem]">
                  {winnerLabel(correctWinner)}
                </span>
                <span className="ml-auto flex items-center gap-3">
                  {data.mode === "random" && (
                    <a
                      href={`/hands/${rowShoeId}`}
                      className="text-text-muted text-[11px] font-mono hover:text-accent hover:underline underline-offset-2"
                    >
                      {rowShoeLabel} →
                    </a>
                  )}
                  {!a || a.choice === "skip" ? (
                    <span className="text-text-muted">—</span>
                  ) : a.correct ? (
                    <span className="text-[color:var(--color-success)] text-lg font-bold">✓</span>
                  ) : (
                    <span className="text-[color:var(--color-error)] text-lg font-bold">✗</span>
                  )}
                </span>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 對比三欄 */}
      <div>
        <h2 className="text-lg font-bold mb-3 text-text">對比</h2>
        <div className="grid grid-cols-3 gap-3">
          <Card variant="numeric">
            <span className="text-text-muted text-xs">你</span>
            <span className="text-2xl sm:text-3xl font-bold text-accent">
              {score.rate === null ? "—" : `${score.rate.toFixed(0)}%`}
            </span>
            <span className="text-text-muted text-xs">
              {score.rate === null ? "無分母" : "你的命中率"}
            </span>
          </Card>
          <Card variant="numeric">
            <span className="text-text-muted text-xs">隨機</span>
            <span className="text-2xl sm:text-3xl font-bold text-text">{RANDOM_BANKER_RATE}%</span>
            <span className="text-text-muted text-xs">若都選莊</span>
          </Card>
          <Card variant="numeric">
            <span className="text-text-muted text-xs">系統</span>
            <span className="text-2xl sm:text-3xl font-bold text-[color:var(--color-success)]">
              {systemRate}%
            </span>
            <span className="text-text-muted text-xs">百家之眼推播</span>
          </Card>
        </div>
        <p className="text-text-muted text-sm mt-4 text-center italic">「{insight}」</p>
      </div>

      {/* CTA */}
      <Card variant="accent" className="text-center space-y-3 shadow-[var(--shadow-accent)]">
        <h3 className="text-xl sm:text-2xl font-bold">
          加入 LINE 看<span className="text-accent">即時正 EV 推播</span>
        </h3>
        <p className="text-text-muted text-sm">
          推薦碼 <code className="text-accent font-bold">LUCKY777</code>
        </p>
        <a
          href="https://lin.ee/PGaRsrg"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 font-bold w-full sm:w-auto px-8 py-3 text-base rounded-lg bg-accent text-primary hover:bg-accent-hover shadow-[var(--shadow-1)]"
        >
          加入 LINE
        </a>
      </Card>

      {/* 分享 / 挑戰 / 看完整靴 */}
      <div className="grid sm:grid-cols-3 gap-3">
        {data.mode === "sequential" ? (
          <a
            href={`/hands/${data.shoe.shoe_id}`}
            className="inline-flex items-center justify-center gap-1.5 font-bold px-4 py-3 text-sm rounded-lg bg-accent/15 text-accent border border-accent/40 hover:bg-accent/25"
          >
            看那靴完整牌路 →
          </a>
        ) : (
          <div className="inline-flex items-center justify-center gap-1.5 font-bold px-4 py-3 text-sm rounded-lg bg-bg-card text-text-muted border border-[color:var(--color-border)]">
            10 靴連結見上方紀錄
          </div>
        )}
        <a
          href={shareCardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 font-bold px-4 py-3 text-sm rounded-lg bg-bg-card text-text border border-[color:var(--color-border-strong)] hover:border-accent/50 hover:text-accent"
        >
          截圖分享（開啟分享卡）
        </a>
        <Button variant="secondary" size="lg" onClick={copyLink}>
          {copied ? "已複製" : "挑戰朋友（複製連結）"}
        </Button>
      </div>

      <div className="text-center">
        <Button variant="link" size="md" onClick={onRestart}>
          再玩一次
        </Button>
      </div>
    </div>
  );
}

