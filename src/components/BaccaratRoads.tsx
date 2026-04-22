"use client";

/**
 * 百家樂五路渲染組件（珠盤/大路/大眼仔/小路/蟑螂）
 * 對齊 MT 實際顯示，所有尺寸與符號規範見 feedback_roads_algo.md。
 *
 * 主要匯出：
 *   - RoadsPanel：五路完整組合（大路常駐、其餘可展開）
 *   - 另有獨立組件 BigRoad / BeadPlate / DerivedRoadDot / DerivedRoadSlash
 */

import { useState } from "react";
import {
  buildRoads,
  type BeadPlateCell,
  type BigRoadCell,
  type DerivedRoadCell,
  type HandResult,
  type Roads,
} from "@/lib/roads";

/* ─── 型別 ──────────────────────────────── */

export interface ApiHand {
  hand_num: number;
  winner: "banker" | "player" | "tie";
  player_score: number;
  banker_score: number;
  is_super6: boolean;
  is_super6_natural?: boolean | null;
  is_pair_p: boolean;
  is_pair_b: boolean;
  p1?: string | null;
  p2?: string | null;
  p3?: string | null;
  b1?: string | null;
  b2?: string | null;
  b3?: string | null;
  ev_banker?: number | null;
  ev_player?: number | null;
  ev_tie?: number | null;
  ev_super6?: number | null;
  ev_pair_p?: number | null;
  ev_pair_b?: number | null;
}

/* ─── 尺寸規範（MT 緊湊版） ──────────────── */

const CELL_PX = 26; // 珠盤路
const CELL_PX_BIG = 18; // 大路（常駐、緊湊）
const CELL_PX_SMALL = 22; // 下三路（展開時放大，比大路稍大）
const MAX_ROWS = 6;

/* ─── Utility ────────────────────────────── */

export function toHandResults(apiHands: ApiHand[]): HandResult[] {
  return apiHands.map((h) => ({
    winner: h.winner === "banker" ? "B" : h.winner === "player" ? "P" : "T",
    is_super6: h.is_super6,
    is_pair_p: h.is_pair_p,
    is_pair_b: h.is_pair_b,
    hand_num: h.hand_num,
    score:
      h.winner === "banker"
        ? h.banker_score
        : h.winner === "player"
          ? h.player_score
          : h.player_score,
  }));
}

function gridMaxCol<T extends { col: number }>(cells: T[], minCols = 1) {
  if (cells.length === 0) return minCols;
  return Math.max(minCols, ...cells.map((c) => c.col)) + 1;
}

/* ─── 路的外框 ───────────────────────────── */

function RoadFrame({
  title,
  cols,
  cellPx = CELL_PX,
  hideTitle = false,
  children,
}: {
  title: string;
  cols: number;
  cellPx?: number;
  hideTitle?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      {!hideTitle && (
        <h3 className="text-[11px] font-bold text-text-muted mb-1">{title}</h3>
      )}
      <div className="overflow-x-auto border border-white/10 rounded bg-primary/40 p-1">
        <div
          className="grid relative"
          style={{
            gridTemplateRows: `repeat(${MAX_ROWS}, ${cellPx}px)`,
            gridTemplateColumns: `repeat(${cols}, ${cellPx}px)`,
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: `${cellPx}px ${cellPx}px`,
            minWidth: `${cols * cellPx}px`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── 珠盤路 ─────────────────────────────── */

export function BeadPlate({ cells }: { cells: BeadPlateCell[] }) {
  const cols = gridMaxCol(cells);
  return (
    <RoadFrame title="珠盤路" cols={cols}>
      {cells.map((c) => (
        <div
          key={`bp-${c.hand_num}`}
          className="flex items-center justify-center"
          style={{
            gridRow: c.row + 1,
            gridColumn: c.col + 1,
            width: CELL_PX,
            height: CELL_PX,
          }}
          title={`手 ${c.hand_num} / ${c.side === "B" ? "莊" : c.side === "P" ? "閒" : "和"}`}
        >
          <div
            className="rounded-full flex items-center justify-center text-white text-[11px] font-bold relative"
            style={{
              width: CELL_PX - 6,
              height: CELL_PX - 6,
              backgroundColor:
                c.side === "B"
                  ? "#dc2626"
                  : c.side === "P"
                    ? "#2563eb"
                    : "#16a34a",
            }}
          >
            {c.side === "B" ? "莊" : c.side === "P" ? "閒" : "和"}
            {c.is_pair_b && (
              <span
                className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#dc2626" }}
              />
            )}
            {c.is_pair_p && (
              <span
                className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#2563eb" }}
              />
            )}
            {c.is_super6 && (
              <span
                className="absolute inset-0 flex items-center justify-center text-[8px] text-yellow-300 font-bold"
                style={{ textShadow: "0 0 2px black" }}
              >
                6
              </span>
            )}
          </div>
        </div>
      ))}
    </RoadFrame>
  );
}

/* ─── 大路 ───────────────────────────────── */

export function BigRoad({
  cells,
  hideTitle = false,
}: {
  cells: BigRoadCell[];
  hideTitle?: boolean;
}) {
  const cols = gridMaxCol(cells);
  return (
    <RoadFrame title="大路" cols={cols} cellPx={CELL_PX_BIG} hideTitle={hideTitle}>
      {cells.map((c) => {
        const color = c.side === "B" ? "#dc2626" : "#2563eb";
        return (
          <div
            key={`br-${c.hand_num}-${c.col}-${c.row}`}
            className="flex items-center justify-center relative"
            style={{
              gridRow: c.row + 1,
              gridColumn: c.col + 1,
              width: CELL_PX_BIG,
              height: CELL_PX_BIG,
            }}
            title={`手 ${c.hand_num} / ${c.side === "B" ? "莊" : "閒"} ${c.score} 點${c.ties ? ` (含 ${c.ties} 和)` : ""}`}
          >
            <div
              className="rounded-full flex items-center justify-center relative"
              style={{
                width: CELL_PX_BIG - 4,
                height: CELL_PX_BIG - 4,
                border: `1.5px solid ${color}`,
                backgroundColor: "transparent",
              }}
            >
              <span
                className="text-[9px] font-bold leading-none"
                style={{ color }}
              >
                {c.score}
              </span>
              {c.ties > 0 && (
                <svg
                  className="absolute inset-0"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  style={{ width: "100%", height: "100%", pointerEvents: "none" }}
                >
                  <line
                    x1="15"
                    y1="85"
                    x2="85"
                    y2="15"
                    stroke="#16a34a"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {c.ties > 1 && (
                <span
                  className="absolute -top-1 -right-1 text-[7px] font-bold leading-none"
                  style={{ color: "#16a34a" }}
                >
                  {c.ties}
                </span>
              )}
              {c.is_pair_b && (
                <span
                  className="absolute top-0 left-0 rounded-full"
                  style={{ width: 4, height: 4, backgroundColor: "#dc2626" }}
                />
              )}
              {c.is_pair_p && (
                <span
                  className="absolute bottom-0 right-0 rounded-full"
                  style={{ width: 4, height: 4, backgroundColor: "#2563eb" }}
                />
              )}
            </div>
          </div>
        );
      })}
    </RoadFrame>
  );
}

/* ─── 下三路：實心圓（大眼仔/小路） ───────── */

export function DerivedRoadDot({
  title,
  cells,
  hollow = false,
}: {
  title: string;
  cells: DerivedRoadCell[];
  hollow?: boolean;
}) {
  const cols = gridMaxCol(cells);
  return (
    <RoadFrame title={title} cols={cols} cellPx={CELL_PX_SMALL}>
      {cells.map((c, i) => {
        const color = c.color === "R" ? "#dc2626" : "#2563eb";
        return (
          <div
            key={`${title}-${i}`}
            className="flex items-center justify-center"
            style={{
              gridRow: c.row + 1,
              gridColumn: c.col + 1,
              width: CELL_PX_SMALL,
              height: CELL_PX_SMALL,
            }}
            title={c.color === "R" ? "齊（紅）" : "不齊（藍）"}
          >
            <div
              className="rounded-full"
              style={{
                width: CELL_PX_SMALL - 4,
                height: CELL_PX_SMALL - 4,
                backgroundColor: hollow ? "transparent" : color,
                border: hollow ? `2px solid ${color}` : "none",
              }}
            />
          </div>
        );
      })}
    </RoadFrame>
  );
}

/* ─── 下三路：斜線（蟑螂路） ───────────── */

export function DerivedRoadSlash({
  title,
  cells,
}: {
  title: string;
  cells: DerivedRoadCell[];
}) {
  const cols = gridMaxCol(cells);
  return (
    <RoadFrame title={title} cols={cols} cellPx={CELL_PX_SMALL}>
      {cells.map((c, i) => (
        <div
          key={`${title}-${i}`}
          className="flex items-center justify-center"
          style={{
            gridRow: c.row + 1,
            gridColumn: c.col + 1,
            width: CELL_PX_SMALL,
            height: CELL_PX_SMALL,
          }}
          title={c.color === "R" ? "齊（紅）" : "不齊（藍）"}
        >
          <svg
            width={CELL_PX_SMALL - 2}
            height={CELL_PX_SMALL - 2}
            viewBox="0 0 100 100"
            style={{ display: "block" }}
          >
            <line
              x1="15"
              y1="85"
              x2="85"
              y2="15"
              stroke={c.color === "R" ? "#dc2626" : "#2563eb"}
              strokeWidth="18"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ))}
    </RoadFrame>
  );
}

/* ─── 五路面板（大路常駐、其餘展開） ──────── */

export function RoadsPanel({ hands }: { hands: ApiHand[] }) {
  const [expanded, setExpanded] = useState(false);

  if (hands.length === 0) {
    return (
      <div className="text-text-muted text-sm py-4 text-center">
        此靴目前無資料
      </div>
    );
  }

  const results = toHandResults(hands);
  const roads: Roads = buildRoads(results);

  return (
    <div>
      {/* 大路常駐 + 展開按鈕 */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <BigRoad cells={roads.bigRoad} />
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs px-2 py-1 rounded bg-white/5 text-text-muted hover:bg-white/10 hover:text-accent whitespace-nowrap shrink-0"
          type="button"
        >
          {expanded ? "▼ 收起" : "▶ 展開五路"}
        </button>
      </div>

      {/* 展開：珠盤 + 大眼仔 + 小路 + 蟑螂 */}
      {expanded && (
        <div className="mt-3 flex flex-wrap gap-3 items-start">
          <div className="flex-shrink-0">
            <BeadPlate cells={roads.beadPlate} />
          </div>
          <div className="flex flex-wrap gap-3 items-start">
            <DerivedRoadDot title="大眼仔路" cells={roads.bigEye} hollow />
            <DerivedRoadDot title="小路" cells={roads.smallRoad} />
            <DerivedRoadSlash title="蟑螂路" cells={roads.cockroach} />
          </div>
        </div>
      )}

      {/* 統計列 */}
      <div className="mt-2 text-[11px] text-text-muted flex gap-3 flex-wrap">
        <span>總手 {roads.totalHands}</span>
        <span>莊 {roads.bankerWins}</span>
        <span>閒 {roads.playerWins}</span>
        <span>和 {roads.tieWins}</span>
      </div>
    </div>
  );
}
