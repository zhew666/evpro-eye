"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RoadsPanel, type ApiHand as RoadApiHand } from "@/components/BaccaratRoads";

/* ─── 型別 ─── */

interface ShoeSummary {
  id: number;
  table_id: string;
  platform: string;
  shoe: number;
  shoe_started_at: string;
  ended_at: string | null;
  is_complete: boolean;
  total_hands: number;
  banker_wins: number;
  player_wins: number;
  tie_wins: number;
  super6_count: number;
  super6_natural_count: number;
  super6_draw_count: number;
  pair_p_count: number;
  pair_b_count: number;
  natural_count: number;
  winner_sequence: string;
  longest_banker_streak: number;
  longest_player_streak: number;
  banker_dragon_count: number;
  player_dragon_count: number;
  has_long_dragon: boolean;
  big_eye_longest_run: number;
  big_eye_longest_alt: number;
  small_road_longest_run: number;
  small_road_longest_alt: number;
  cockroach_longest_run: number;
  cockroach_longest_alt: number;
}

interface ApiResponse {
  summary: ShoeSummary;
  hands: RoadApiHand[];
}

/* ─── 工具 ─── */

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("zh-TW", { dateStyle: "short", timeStyle: "short" });
}

function isRedSuit(card: string): boolean {
  return card.includes("\u2665") || card.includes("\u2666");
}

function CardSpan({ card }: { card: string | null | undefined }) {
  if (!card || card === "") return null;
  return (
    <span className={`mr-1 font-mono ${isRedSuit(card) ? "text-red-400" : "text-text"}`}>
      {card}
    </span>
  );
}

function ResultBadge({ winner }: { winner: "banker" | "player" | "tie" }) {
  const map = {
    banker: { label: "莊", cls: "text-red-400" },
    player: { label: "閒", cls: "text-blue-400" },
    tie: { label: "和", cls: "text-green-400" },
  };
  const { label, cls } = map[winner];
  return <span className={`text-xs font-bold ${cls}`}>{label}</span>;
}

function InfoCard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className="bg-bg-card border border-white/5 rounded-xl p-3">
      <div className="text-[10px] text-text-muted">{label}</div>
      <div className={`text-base font-bold ${accent ? "text-accent" : "text-text"}`}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-text-muted">{sub}</div>}
    </div>
  );
}

/* ─── 主 ─── */

export default function ShoeDetailClient({ id }: { id: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/hands/${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        setData(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "載入失敗");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-bg-card border border-red-500/20 rounded-xl p-8 text-center">
        <p className="text-text-muted">{error || "資料不存在"}</p>
        <Link href="/hands" className="inline-block mt-4 text-accent text-sm hover:underline">
          ← 回到列表
        </Link>
      </div>
    );
  }

  const { summary, hands } = data;
  const reversedHands = [...hands].reverse(); // 最新的顯示在上面

  return (
    <div className="space-y-5">
      {/* 麵包屑 */}
      <div className="text-sm">
        <Link href="/hands" className="text-text-muted hover:text-accent">← 回到列表</Link>
      </div>

      {/* 靴標題 */}
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            summary.platform === "MT" ? "bg-red-500/20 text-red-300" : "bg-blue-500/20 text-blue-300"
          }`}>
            {summary.platform}
          </span>
          <span className="font-mono text-lg font-bold text-text">{summary.table_id}</span>
          <span className="text-sm text-text-muted">靴 #{summary.shoe}</span>
          {!summary.is_complete && (
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300">
              進行中
            </span>
          )}
        </div>
        <div className="text-xs text-text-muted">
          {fmtDateTime(summary.shoe_started_at)}
          {summary.ended_at && ` → ${fmtDateTime(summary.ended_at)}`}
          <span className="mx-2">·</span>
          共 {summary.total_hands} 手
        </div>
      </div>

      {/* 統計概覽 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoCard
          label="莊贏"
          value={`${summary.banker_wins} 場`}
          sub={summary.total_hands > 0 ? `${(summary.banker_wins / summary.total_hands * 100).toFixed(1)}%` : "—"}
          accent
        />
        <InfoCard
          label="閒贏"
          value={`${summary.player_wins} 場`}
          sub={summary.total_hands > 0 ? `${(summary.player_wins / summary.total_hands * 100).toFixed(1)}%` : "—"}
        />
        <InfoCard
          label="和局"
          value={`${summary.tie_wins} 場`}
          sub={summary.total_hands > 0 ? `${(summary.tie_wins / summary.total_hands * 100).toFixed(1)}%` : "—"}
        />
        <InfoCard
          label="Super6 / 對子"
          value={`${summary.super6_count} / ${summary.pair_p_count + summary.pair_b_count}`}
          sub={`S6 自${summary.super6_natural_count} 補${summary.super6_draw_count}`}
        />
      </div>

      {/* 牌路分析 */}
      {summary.total_hands >= 3 && (
        <div className="bg-bg-card border border-white/5 rounded-xl p-3 text-xs">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-text-muted">
            <span>最長連莊 <span className="text-text font-bold">{summary.longest_banker_streak}</span></span>
            <span>最長連閒 <span className="text-text font-bold">{summary.longest_player_streak}</span></span>
            <span>龍 (≥4) <span className="text-text font-bold">莊{summary.banker_dragon_count} 閒{summary.player_dragon_count}</span></span>
            <span>大眼仔雙跳 <span className="text-text font-bold">{summary.big_eye_longest_alt}</span></span>
            <span>小路雙跳 <span className="text-text font-bold">{summary.small_road_longest_alt}</span></span>
            {summary.has_long_dragon && (
              <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold">
                含長龍
              </span>
            )}
          </div>
        </div>
      )}

      {/* 五路 */}
      <div className="bg-bg-card border border-white/5 rounded-xl p-3">
        <RoadsPanel hands={hands} />
      </div>

      {/* 每手牌面 + EV */}
      <div className="bg-bg-card border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/5 bg-primary/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-text">開牌記錄</h3>
          <span className="text-xs text-text-muted">新的在上</span>
        </div>
        <div className="divide-y divide-white/5">
          {reversedHands.map((h) => {
            const pCards = [h.p1, h.p2, h.p3].filter((c) => c && c !== "");
            const bCards = [h.b1, h.b2, h.b3].filter((c) => c && c !== "");
            const hasEv =
              h.ev_banker != null || h.ev_player != null || h.ev_tie != null;
            return (
              <div key={h.hand_num} className="px-4 py-2.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-text-muted w-8 shrink-0 font-mono">#{h.hand_num}</span>
                  <span className="text-sm">
                    {pCards.map((c, i) => <CardSpan key={`p${i}`} card={c} />)}
                  </span>
                  <span className="text-text-muted text-xs mx-0.5">|</span>
                  <span className="text-sm">
                    {bCards.map((c, i) => <CardSpan key={`b${i}`} card={c} />)}
                  </span>
                  <span className="text-xs text-text-muted ml-auto">
                    {h.player_score} : {h.banker_score}
                  </span>
                  <ResultBadge winner={h.winner} />
                  {h.is_super6 && (
                    <span className="text-[10px] text-yellow-400 font-bold">S6</span>
                  )}
                  {h.is_pair_b && (
                    <span className="text-[10px] text-red-400">莊對</span>
                  )}
                  {h.is_pair_p && (
                    <span className="text-[10px] text-blue-400">閒對</span>
                  )}
                </div>
                {hasEv && (
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 ml-8 text-[10px] font-mono text-text-muted">
                    {[
                      { label: "莊", val: h.ev_banker },
                      { label: "閒", val: h.ev_player },
                      { label: "和", val: h.ev_tie },
                      { label: "S6", val: h.ev_super6 },
                      { label: "閒對", val: h.ev_pair_p },
                      { label: "莊對", val: h.ev_pair_b },
                    ].map(({ label, val }) => {
                      if (val == null) return null;
                      return (
                        <span key={label}>
                          {label}
                          <span className={val > 0 ? "text-green-400" : ""}>
                            {val > 0 ? "+" : ""}{val.toFixed(4)}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
