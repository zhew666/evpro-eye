"use client";

import { useState, useEffect, useCallback } from "react";
import type { StatsResponse, Period } from "@/lib/stats";
import { deriveHandRates, fmtPct, fmtNum } from "@/lib/stats";

// ── 小工具元件 ──────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-bg-card border border-white/5 rounded-xl p-5 flex flex-col gap-1">
      <p className="text-xs text-text-muted">{label}</p>
      <p
        className={`text-2xl font-bold ${accent ? "text-accent" : "text-text"}`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-text-muted">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
      {children}
    </h2>
  );
}

function BetBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-muted w-12 shrink-0">{label}</span>
      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${pct.toFixed(1)}%` }}
        />
      </div>
      <span className="text-xs text-text-muted w-16 text-right shrink-0">
        {fmtNum(count)} ({pct.toFixed(1)}%)
      </span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {[0, 1].map((i) => (
        <div key={i}>
          <div className="h-5 w-40 bg-white/10 rounded mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, j) => (
              <div key={j} className="bg-bg-card rounded-xl p-5 h-24" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MigrationBanner() {
  return (
    <div className="bg-bg-card border border-accent/20 rounded-xl p-5 text-center">
      <p className="text-text-muted text-sm mb-1">
        牌局結果統計（莊/閒勝率、Super6 命中率）
      </p>
      <p className="text-accent font-bold text-base mb-2">數據累積中</p>
      <p className="text-text-muted text-xs">
        此功能依賴 Migration 004 建立的 hand_results 表，
        <br />
        執行後將從下一局起開始累積歷史數據。
      </p>
    </div>
  );
}

// ── 主元件 ──────────────────────────────────────────────────

export default function StatsClient() {
  const [period, setPeriod] = useState<Period>("7d");
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stats?period=${p}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: StatsResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(period);
  }, [period, fetchStats]);

  const periodLabel = period === "7d" ? "近 7 天" : "近 30 天";

  return (
    <div className="space-y-10">
      {/* Period toggle */}
      <div className="flex items-center gap-2">
        <span className="text-text-muted text-sm mr-2">統計區間</span>
        {(["7d", "30d"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              period === p
                ? "bg-accent text-primary"
                : "bg-bg-card text-text-muted hover:text-text border border-white/10"
            }`}
          >
            {p === "7d" ? "近一週" : "近一個月"}
          </button>
        ))}
      </div>

      {loading && <LoadingSkeleton />}

      {error && (
        <div className="bg-bg-card border border-red-500/20 rounded-xl p-5 text-center text-text-muted">
          載入失敗：{error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* ── 區塊 1：牌局結果統計 ── */}
          <div>
            <SectionTitle>
              <span className="w-2 h-5 bg-accent rounded inline-block" />
              牌局結果統計
              <span className="text-xs font-normal text-text-muted ml-1">
                （{periodLabel}）
              </span>
            </SectionTitle>

            {!data.has_hand_data ? (
              <MigrationBanner />
            ) : (
              (() => {
                const hs = data.hand_stats!;
                const rates = deriveHandRates(hs);
                return (
                  <div className="space-y-6">
                    {/* 勝率卡片 */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      <StatCard
                        label="總局數"
                        value={fmtNum(hs.total_hands)}
                        sub={periodLabel}
                      />
                      <StatCard
                        label="莊勝率"
                        value={fmtPct(rates.banker_rate)}
                        sub={`${fmtNum(hs.banker_wins)} 局`}
                        accent
                      />
                      <StatCard
                        label="閒勝率"
                        value={fmtPct(rates.player_rate)}
                        sub={`${fmtNum(hs.player_wins)} 局`}
                      />
                      <StatCard
                        label="和局率"
                        value={fmtPct(rates.tie_rate)}
                        sub={`${fmtNum(hs.ties)} 局`}
                      />
                      <StatCard
                        label="Super6 出現次數"
                        value={fmtNum(hs.super6_count)}
                        sub={`出現率 ${fmtPct(rates.super6_rate)}`}
                        accent
                      />
                      <StatCard
                        label="自然牌率"
                        value={fmtPct(rates.natural_rate)}
                        sub={`${fmtNum(hs.natural_count)} 局`}
                      />
                      <StatCard
                        label="閒對子次數"
                        value={fmtNum(hs.pair_p_count)}
                        sub={`出現率 ${fmtPct(rates.pair_p_rate)}`}
                      />
                      <StatCard
                        label="莊對子次數"
                        value={fmtNum(hs.pair_b_count)}
                        sub={`出現率 ${fmtPct(rates.pair_b_rate)}`}
                      />
                    </div>

                    {/* 平台分布 */}
                    <div className="bg-bg-card border border-white/5 rounded-xl p-5">
                      <p className="text-xs text-text-muted mb-3">平台分布</p>
                      <div className="space-y-2">
                        <BetBar
                          label="MT"
                          count={hs.by_platform.MT}
                          total={hs.total_hands}
                          color="bg-accent"
                        />
                        <BetBar
                          label="DG"
                          count={hs.by_platform.DG}
                          total={hs.total_hands}
                          color="bg-blue-400"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* ── 區塊 2：正EV訊號統計 ── */}
          <div>
            <SectionTitle>
              <span className="w-2 h-5 bg-blue-400 rounded inline-block" />
              正EV訊號統計
              <span className="text-xs font-normal text-text-muted ml-1">
                （{periodLabel}）
              </span>
            </SectionTitle>

            {(() => {
              const ev = data.ev_signals;
              const total = ev.total || 1;
              return (
                <div className="space-y-6">
                  {/* 訊號總覽卡片 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <StatCard
                      label="正EV訊號總次數"
                      value={fmtNum(ev.total)}
                      sub={periodLabel}
                      accent
                    />
                    <StatCard
                      label="Super6 提示次數"
                      value={fmtNum(ev.super6_signals)}
                      sub={`佔 ${fmtPct(ev.super6_signals / total)}`}
                    />
                    <StatCard
                      label="莊注提示次數"
                      value={fmtNum(ev.banker_signals)}
                      sub={`佔 ${fmtPct(ev.banker_signals / total)}`}
                    />
                    <StatCard
                      label="閒注提示次數"
                      value={fmtNum(ev.player_signals)}
                      sub={`佔 ${fmtPct(ev.player_signals / total)}`}
                    />
                    <StatCard
                      label="最高 EV 值"
                      value={ev.peak_ev != null ? ev.peak_ev.toFixed(4) : "—"}
                      sub="期間峰值"
                      accent
                    />
                    <StatCard
                      label="平均 EV 值"
                      value={ev.avg_ev != null ? ev.avg_ev.toFixed(4) : "—"}
                      sub="正EV局均值"
                    />
                    <StatCard
                      label="MT 訊號"
                      value={fmtNum(ev.by_platform.MT)}
                      sub={`佔 ${fmtPct(ev.by_platform.MT / total)}`}
                    />
                    <StatCard
                      label="DG 訊號"
                      value={fmtNum(ev.by_platform.DG)}
                      sub={`佔 ${fmtPct(ev.by_platform.DG / total)}`}
                    />
                  </div>

                  {/* 最佳注區分布長條 */}
                  <div className="bg-bg-card border border-white/5 rounded-xl p-5">
                    <p className="text-xs text-text-muted mb-3">
                      最佳注區分布（以 best_bet 計）
                    </p>
                    <div className="space-y-2">
                      {[
                        {
                          label: "莊",
                          count: ev.by_bet.banker,
                          color: "bg-accent",
                        },
                        {
                          label: "閒",
                          count: ev.by_bet.player,
                          color: "bg-blue-400",
                        },
                        {
                          label: "S6",
                          count: ev.by_bet.super6,
                          color: "bg-purple-400",
                        },
                        {
                          label: "閒對",
                          count: ev.by_bet.pair_p,
                          color: "bg-pink-400",
                        },
                        {
                          label: "莊對",
                          count: ev.by_bet.pair_b,
                          color: "bg-orange-400",
                        },
                        {
                          label: "和",
                          count: ev.by_bet.tie,
                          color: "bg-green-400",
                        },
                      ].map((item) => (
                        <BetBar
                          key={item.label}
                          label={item.label}
                          count={item.count}
                          total={ev.total}
                          color={item.color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 更新時間 */}
          <p className="text-xs text-text-muted text-right">
            更新時間：{new Date(data.generated_at).toLocaleString("zh-TW")}
            （每 5 分鐘刷新）
          </p>
        </>
      )}
    </div>
  );
}
