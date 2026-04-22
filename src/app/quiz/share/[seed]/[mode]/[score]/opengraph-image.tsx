import { ImageResponse } from "next/og";
import {
  QUIZ_QUESTION_COUNT,
  RANDOM_BANKER_RATE,
  SYSTEM_HIT_RATE_PLACEHOLDER,
  getInsight,
  type QuizMode,
} from "@/lib/quiz";

export const alt = "看路科學測驗分享卡 — 百家之眼";
export const size = { width: 1080, height: 1080 };
export const contentType = "image/png";

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@900&display=swap",
    );
    const css = await res.text();
    const match = css.match(/src: url\((.+?)\)/);
    if (!match) return null;
    const fontRes = await fetch(match[1]);
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

function clampScore(raw: string): number {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(QUIZ_QUESTION_COUNT, n));
}

function parseMode(raw: string): QuizMode {
  return raw === "random" ? "random" : "sequential";
}

export default async function Image({
  params,
}: {
  params: Promise<{ seed: string; mode: string; score: string }>;
}) {
  const { mode: modeRaw, score: scoreRaw } = await params;
  const mode = parseMode(modeRaw);
  const score = clampScore(scoreRaw);
  const rate = (score / QUIZ_QUESTION_COUNT) * 100;
  const insight = getInsight(rate, SYSTEM_HIT_RATE_PLACEHOLDER);
  const fontData = await loadFont();

  const modeTagline =
    mode === "random"
      ? "隨機抽 10 靴 · 跨靴看路挑戰"
      : "同一靴連續 10 手 · 真實歷史牌路";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)",
          position: "relative",
          overflow: "hidden",
          padding: "40px",
          fontFamily: "Noto Sans TC, sans-serif",
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            opacity: 0.06,
            backgroundImage:
              "linear-gradient(#d4af37 1px, transparent 1px), linear-gradient(90deg, #d4af37 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* 金色內縮框 */}
        <div
          style={{
            position: "absolute",
            inset: "32px",
            border: "4px solid #d4af37",
            borderRadius: "24px",
            display: "flex",
          }}
        />

        {/* Glow corner */}
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            right: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "250px",
            background:
              "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* 主卡片內部 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            flex: 1,
            padding: "72px 60px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "54px",
                height: "54px",
                borderRadius: "27px",
                border: "2px solid #d4af37",
                fontSize: "26px",
                color: "#d4af37",
              }}
            >
              👁
            </div>
            <div
              style={{
                fontSize: "32px",
                color: "#d4af37",
                fontWeight: 900,
                display: "flex",
              }}
            >
              百家之眼
            </div>
            <div
              style={{
                fontSize: "24px",
                color: "#9999b3",
                display: "flex",
                marginLeft: "8px",
              }}
            >
              · 看路科學測驗
            </div>
          </div>

          {/* 大字分數 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "20px",
                color: "#d4af37",
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              <span style={{ fontSize: "280px", display: "flex" }}>{score}</span>
              <span
                style={{
                  fontSize: "120px",
                  color: "#e8e8f0",
                  display: "flex",
                }}
              >
                / {QUIZ_QUESTION_COUNT}
              </span>
            </div>
            <div
              style={{
                fontSize: "42px",
                color: "#e8e8f0",
                fontWeight: 900,
                marginTop: "16px",
                display: "flex",
              }}
            >
              命中率 {rate.toFixed(0)}%
            </div>
            <div
              style={{
                fontSize: "22px",
                color: "#9999b3",
                fontWeight: 900,
                marginTop: "10px",
                display: "flex",
              }}
            >
              {modeTagline}
            </div>
          </div>

          {/* 三欄對比 */}
          <div
            style={{
              display: "flex",
              gap: "40px",
              marginTop: "24px",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ComparisonCell label="你" value={`${rate.toFixed(0)}%`} accent />
            <ComparisonCell label="隨機" value={`${RANDOM_BANKER_RATE}%`} />
            <ComparisonCell label="系統" value={`${SYSTEM_HIT_RATE_PLACEHOLDER}%`} />
          </div>

          {/* Insight */}
          <div
            style={{
              display: "flex",
              maxWidth: "820px",
              textAlign: "center",
              fontSize: "28px",
              color: "#e8e8f0",
              fontWeight: 900,
              lineHeight: 1.5,
              marginTop: "24px",
              justifyContent: "center",
            }}
          >
            「{insight}」
          </div>

          {/* footer */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: "12px",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                color: "#9999b3",
                display: "flex",
                fontWeight: 900,
              }}
            >
              evpro-eye.com/quiz
            </div>
            <div
              style={{
                fontSize: "32px",
                color: "#d4af37",
                fontWeight: 900,
                display: "flex",
                marginTop: "8px",
              }}
            >
              推薦碼 LUCKY777
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "Noto Sans TC", data: fontData, weight: 900 as const }]
        : undefined,
    },
  );
}

function ComparisonCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 32px",
        borderRadius: "16px",
        border: accent
          ? "2px solid #d4af37"
          : "2px solid rgba(255,255,255,0.12)",
        background: accent ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          fontSize: "24px",
          color: accent ? "#d4af37" : "#9999b3",
          fontWeight: 900,
          display: "flex",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "56px",
          color: accent ? "#d4af37" : "#e8e8f0",
          fontWeight: 900,
          display: "flex",
          lineHeight: 1,
          marginTop: "8px",
        }}
      >
        {value}
      </div>
    </div>
  );
}
