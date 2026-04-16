"use client";

import { useState, useEffect, useCallback } from "react";
import type { StatsResponse, Period, HitStat, Super6HitStat } from "@/lib/stats";
import { deriveHandRates, fmtPct, fmtNum, fmtHitRate } from "@/lib/stats";

// ── 小工具元件 ──────────────────────────────────────────────

function StatCard({
  label, value, sub, accent,
}: {
  label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className="bg-bg-card border border-white/5 rounded-xl p-5 flex flex-col gap-1">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-accent" : "text-text"}`}>
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

function BetBar({ label, count, total, color }: {
  label: string; count: number; total: number; color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-muted w-12 shrink-0">{label}</span>
      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct.toFixed(1)}%` }} />
      </div>
      <span className="text-xs text-text-muted w-20 text-right shrink-0">
        {fmtNum(count)} ({pct.toFixed(1)}%)
      </span>
    </div>
  );
}

/** 命中率列：訊號次數 / 命中次數 / 命中率 */
function HitRow({ label, stat, extra }: {
  label: string;
  stat: HitStat;
  extra?: React.ReactNode;
}) {
  const rateColor = stat.rate != null
    ? stat.rate >= 50 ? "text-accent" : stat.rate >= 40 ? "text-yellow-400" : "text-text-muted"
    : "text-text-muted";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-text w-20 shrink-0">{label}</span>
      <span className="text-xs text-text-muted w-24 shrink-0">
        訊號 {fmtNum(stat.signals)} 次
      </span>
      <span className="text-xs text-text-muted w-24 shrink-0">
        命中 {fmtNum(stat.hits)} 次
      </span>
      <span className={`text-sm font-bold ${rateColor} w-20 shrink-0`}>
        {fmtHitRate(stat.rate)}
      </span>
      {extra && <span className="text-xs text-text-muted">{extra}</span>}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <div className="h-5 w-40 bg-white/10 rounded mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="bg-bg-card rounded-xl p-5 h-24" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MigrationBanner({ text }: { text: string }) {
  return (
    <div className="bg-bg-card border border-accent/20 rounded-xl p-5 text-center">
      <p className="text-accent font-bold mb-1">數據累積中</p>
      <p className="text-text-muted text-xs">{text}</p>
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
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(period); }, [period, fetchStats]);

  const periodLabel = period === "7d" ? "近 7 天" : "近 30 天";

  return (
    <div className="space-y-12">
      {/* Period toggle */}
      <div className="flex items-center gap-2">
        <span className="text-text-muted text-sm mr-2">統計區間</span>
        {(["7d", "30d"] as Period[]).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              period === p
                ? "bg-accent text-primary"
                : "bg-bg-card text-text-muted hover:text-text border border-white/10"
            }`}>
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
              <span className="text-xs font-normal text-text-muted ml-1">（{periodLabel}）</span>
            </SectionTitle>

            {!data.has_hand_data ? (
              <MigrationBanner text="需執行 Migration 004+005 後才開始累積，執行後從下一局起自動記錄。" />
            ) : (() => {
              const hs = data.hand_stats!;
              const rates = deriveHandRates(hs);
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <StatCard label="總局數" value={fmtNum(hs.total_hands)} sub={periodLabel} />
                    <StatCard label="莊勝率" value={fmtPct(rates.banker_rate)} sub={`${fmtNum(hs.banker_wins)} 局`} accent />
                    <StatCard label="閒勝率" value={fmtPct(rates.player_rate)} sub={`${fmtNum(hs.player_wins)} 局`} />
                    <StatCard label="和局率" value={fmtPct(rates.tie_rate)} sub={`${fmtNum(hs.ties)} 局`} />
                    <StatCard label="Super6 出現" value={fmtNum(hs.super6_count)}
                      sub={`出現率 ${fmtPct(rates.super6_rate)}`} accent />
                    <StatCard label="└ 自然S6（20倍）" value={fmtNum(hs.super6_natural_count)}
                      sub={`佔S6的 ${hs.super6_count ? fmtPct(hs.super6_natural_count / hs.super6_count) : "—"}`} />
                    <StatCard label="└ 補牌S6（12倍）" value={fmtNum(hs.super6_draw_count)}
                      sub={`佔S6的 ${hs.super6_count ? fmtPct(hs.super6_draw_count / hs.super6_count) : "—"}`} />
                    <StatCard label="自然牌率" value={fmtPct(rates.natural_rate)} sub={`${fmtNum(hs.natural_count)} 局`} />
                    <StatCard label="閒對子" value={fmtNum(hs.pair_p_count)} sub={`出現率 ${fmtPct(rates.pair_p_rate)}`} />
                    <StatCard label="莊對子" value={fmtNum(hs.pair_b_count)} sub={`出現率 ${fmtPct(rates.pair_b_rate)}`} />
                  </div>
                  <div className="bg-bg-card border border-white/5 rounded-xl p-5">
                    <p className="text-xs text-text-muted mb-3">平台分布</p>
                    <div className="space-y-2">
                      <BetBar label="MT" count={hs.by_platform.MT} total={hs.total_hands} color="bg-accent" />
                      <BetBar label="DG" count={hs.by_platform.DG} total={hs.total_hands} color="bg-blue-400" />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ── 區塊 2：+EV 命中率 ── */}
          <div>
            <SectionTitle>
              <span className="w-2 h-5 bg-purple-400 rounded inline-block" />
              +EV 訊號命中率
              <span className="text-xs font-normal text-text-muted ml-1">（{periodLabel}，訊號發出後該局實際結果）</span>
            </SectionTitle>

            {!data.ev_hit_rates ? (
              <MigrationBanner text="需執行 Migration 004+005，兩表資料都有後才開始統計命中率。" />
            ) : (() => {
              const h = data.ev_hit_rates!;
              const s6 = h.super6 as Super6HitStat;
              return (
                <div className="bg-bg-card border border-white/5 rounded-xl p-5">
                  <div className="flex text-xs text-text-muted mb-2 px-0">
                    <span className="w-20 shrink-0">注區</span>
                    <span className="w-24 shrink-0">訊號次數</span>
                    <span className="w-24 shrink-0">命中次數</span>
                    <span className="w-20 shrink-0">命中率</span>
                    <span>備註</span>
                  </div>
                  <HitRow label="莊" stat={h.banker} />
                  <HitRow label="閒" stat={h.player} />
                  <HitRow label="Super6" stat={s6}
                    extra={s6.hits > 0
                      ? `自然20倍 ${s6.hits_natural} 次 / 補牌12倍 ${s6.hits_draw} 次`
                      : undefined}
                  />
                  <HitRow label="閒對子" stat={h.pair_p} />
                  <HitRow label="莊對子" stat={h.pair_b} />
                  <HitRow label="和局" stat={h.tie} />
                  <p className="text-xs text-text-muted mt-3">
                    命中率 ≥ 50% 金色，40-50% 黃色，&lt;40% 灰色。理論莊勝率約 45.86%，閒 44.62%，Super6 約 2.27%。
                  </p>
                </div>
              );
            })()}
          </div>

          {/* ── 區塊 3：正EV訊號統計 ── */}
          <div>
            <SectionTitle>
              <span className="w-2 h-5 bg-blue-400 rounded inline-block" />
              正EV訊號統計
              <span className="text-xs font-normal text-text-muted ml-1">（{periodLabel}）</span>
            </SectionTitle>

            {(() => {
              const ev = data.ev_signals;
              const total = ev.total || 1;
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <StatCard label="正EV訊號總次數" value={fmtNum(ev.total)} sub={periodLabel} accent />
                    <StatCard label="Super6 提示" value={fmtNum(ev.super6_signals)}
                      sub={`佔 ${fmtPct(ev.super6_signals / total)}`} />
                    <StatCard label="莊注提示" value={fmtNum(ev.banker_signals)}
                      sub={`佔 ${fmtPct(ev.banker_signals / total)}`} />
                    <StatCard label="閒注提示" value={fmtNum(ev.player_signals)}
                      sub={`佔 ${fmtPct(ev.player_signals / total)}`} />
                    <StatCard label="閒對子提示" value={fmtNum(ev.pair_p_signals)}
                      sub={`佔 ${fmtPct(ev.pair_p_signals / total)}`} />
                    <StatCard label="莊對子提示" value={fmtNum(ev.pair_b_signals)}
                      sub={`佔 ${fmtPct(ev.pair_b_signals / total)}`} />
                    <StatCard label="最高 EV 值" value={ev.peak_ev != null ? ev.peak_ev.toFixed(4) : "—"}
                      sub="期間峰值" accent />
                    <StatCard label="平均 EV 值" value={ev.avg_ev != null ? ev.avg_ev.toFixed(4) : "—"}
                      sub="正EV局均值" />
                  </div>

                  <div className="bg-bg-card border border-white/5 rounded-xl p-5">
                    <p className="text-xs text-text-muted mb-3">最佳注區分布（以 best_bet 計）</p>
                    <div className="space-y-2">
                      {[
                        { label: "莊",  count: ev.by_bet.banker, color: "bg-accent" },
                        { label: "閒",  count: ev.by_bet.player, color: "bg-blue-400" },
                        { label: "S6",  count: ev.by_bet.super6, color: "bg-purple-400" },
                        { label: "閒對",count: ev.by_bet.pair_p, color: "bg-pink-400" },
                        { label: "莊對",count: ev.by_bet.pair_b, color: "bg-orange-400" },
                        { label: "和",  count: ev.by_bet.tie,    color: "bg-green-400" },
                      ].map((item) => (
                        <BetBar key={item.label} label={item.label}
                          count={item.count} total={ev.total} color={item.color} />
                      ))}
                    </div>
                  </div>

                  <div className="bg-bg-card border border-white/5 rounded-xl p-5">
                    <p className="text-xs text-text-muted mb-3">平台分布</p>
                    <div className="space-y-2">
                      <BetBar label="MT" count={ev.by_platform.MT} total={ev.total} color="bg-accent" />
                      <BetBar label="DG" count={ev.by_platform.DG} total={ev.total} color="bg-blue-400" />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <p className="text-xs text-text-muted text-right">
            更新時間：{new Date(data.generated_at).toLocaleString("zh-TW")}（每 5 分鐘刷新）
          </p>
        </>
      )}
    </div>
  );
}
