"use client";

import { useState, useEffect, useCallback } from "react";
import type { StatsResponse, Period, HitStat, Super6HitStat } from "@/lib/stats";
import { deriveHandRates, fmtPct, fmtNum } from "@/lib/stats";

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
        {fmtNum(count)} 次 ({pct.toFixed(1)}%)
      </span>
    </div>
  );
}

/** 命中率列：白話版「推了X次，中了Y次」 */
function HitRow({ label, stat, extra }: {
  label: string;
  stat: HitStat;
  extra?: React.ReactNode;
}) {
  const pct = stat.rate ?? 0;
  const barColor =
    pct >= 50 ? "bg-accent" :
    pct >= 40 ? "bg-yellow-400" :
    "bg-white/20";

  return (
    <div className="py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-text">{label}</span>
        <span className="text-sm text-text-muted">
          推了 <span className="text-text font-bold">{fmtNum(stat.signals)}</span> 次，
          中了 <span className="text-accent font-bold">{fmtNum(stat.hits)}</span> 次
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
          <div className={`h-1.5 rounded-full ${barColor}`}
            style={{ width: `${Math.min(pct, 100).toFixed(1)}%` }} />
        </div>
        <span className={`text-xs font-bold w-14 text-right shrink-0 ${
          pct >= 50 ? "text-accent" : pct >= 40 ? "text-yellow-400" : "text-text-muted"
        }`}>
          {stat.rate != null ? stat.rate.toFixed(1) + "%" : "—"}
        </span>
      </div>
      {extra && <p className="text-xs text-text-muted mt-1">{extra}</p>}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <div className="h-5 w-40 bg-white/10 rounded mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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

  const periodDays = period === "7d" ? 7 : 30;
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
          {/* ── 區塊 1：系統推播活躍度 ── */}
          <div>
            <SectionTitle>
              <span className="w-2 h-5 bg-accent rounded inline-block" />
              系統推播活躍度
              <span className="text-xs font-normal text-text-muted ml-1">（{periodLabel}）</span>
            </SectionTitle>

            {(() => {
              const ev = data.ev_signals;
              const perDay = ev.total / periodDays;
              return (
                <div className="space-y-4">
                  {/* 主要數字 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <StatCard
                      label={`${periodLabel}推播總次數`}
                      value={fmtNum(ev.total)}
                      sub="正EV訊號出現次數"
                      accent
                    />
                    <StatCard
                      label="平均每天推播"
                      value={`${perDay.toFixed(1)} 次`}
                      sub="訊號出現頻率"
                    />
                    <StatCard
                      label="Super6 提示次數"
                      value={fmtNum(ev.super6_signals)}
                      sub={`平均每天 ${(ev.super6_signals / periodDays).toFixed(1)} 次`}
                      accent
                    />
                    <StatCard
                      label="莊注提示次數"
                      value={fmtNum(ev.banker_signals)}
                      sub={`平均每天 ${(ev.banker_signals / periodDays).toFixed(1)} 次`}
                    />
                    <StatCard
                      label="閒注提示次數"
                      value={fmtNum(ev.player_signals)}
                      sub={`平均每天 ${(ev.player_signals / periodDays).toFixed(1)} 次`}
                    />
                    <StatCard
                      label="對子提示次數"
                      value={fmtNum((ev.pair_p_signals ?? 0) + (ev.pair_b_signals ?? 0))}
                      sub={`平均每天 ${((ev.pair_p_signals + ev.pair_b_signals) / periodDays).toFixed(1)} 次`}
                    />
                  </div>

                  {/* 注區分布長條 */}
                  <div className="bg-bg-card border border-white/5 rounded-xl p-5">
                    <p className="text-xs text-text-muted mb-3">推播注區分布</p>
                    <div className="space-y-2">
                      {[
                        { label: "莊",  count: ev.by_bet.banker, color: "bg-accent" },
                        { label: "閒",  count: ev.by_bet.player, color: "bg-blue-400" },
                        { label: "S6",  count: ev.by_bet.super6, color: "bg-purple-400" },
                        { label: "對子",count: ev.by_bet.pair_p + ev.by_bet.pair_b, color: "bg-pink-400" },
                        { label: "和",  count: ev.by_bet.tie,    color: "bg-green-400" },
                      ].map((item) => (
                        <BetBar key={item.label} label={item.label}
                          count={item.count} total={ev.total} color={item.color} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ── 區塊 2：提示命中率 ── */}
          <div>
            <SectionTitle>
              <span className="w-2 h-5 bg-purple-400 rounded inline-block" />
              提示命中率
              <span className="text-xs font-normal text-text-muted ml-1">（{periodLabel}，系統提示後該局實際結果）</span>
            </SectionTitle>

            {!data.ev_hit_rates ? (
              <MigrationBanner text="手牌數據累積中，有足夠數據後自動顯示。" />
            ) : (() => {
              const h = data.ev_hit_rates!;
              const s6 = h.super6 as Super6HitStat;
              return (
                <div className="bg-bg-card border border-white/5 rounded-xl p-5">
                  <HitRow label="莊注" stat={h.banker} />
                  <HitRow label="閒注" stat={h.player} />
                  <HitRow label="Super6" stat={s6}
                    extra={s6.hits > 0
                      ? `命中細節：20倍（兩張牌）${s6.hits_natural} 次 ／ 12倍（補牌）${s6.hits_draw} 次`
                      : undefined}
                  />
                  <HitRow label="對子" stat={{
                    signals: h.pair_p.signals + h.pair_b.signals,
                    hits: h.pair_p.hits + h.pair_b.hits,
                    rate: (h.pair_p.signals + h.pair_b.signals) > 0
                      ? Math.round((h.pair_p.hits + h.pair_b.hits) / (h.pair_p.signals + h.pair_b.signals) * 10000) / 100
                      : null,
                  }} />
                  <HitRow label="和局" stat={h.tie} />
                  <p className="text-xs text-text-muted mt-4 pt-3 border-t border-white/5">
                    理論長期勝率：莊 45.86%、閒 44.62%、Super6 約 2.27%。
                    我們只在 EV 高於理論值時推播，命中率應優於長期均值。
                  </p>
                </div>
              );
            })()}
          </div>

          {/* ── 區塊 3：牌局結果統計 ── */}
          <div>
            <SectionTitle>
              <span className="w-2 h-5 bg-blue-400 rounded inline-block" />
              牌局結果統計
              <span className="text-xs font-normal text-text-muted ml-1">（{periodLabel}，27 桌合計）</span>
            </SectionTitle>

            {!data.has_hand_data ? (
              <MigrationBanner text="手牌數據累積中，累積足夠後自動顯示莊閒勝率。" />
            ) : (() => {
              const hs = data.hand_stats!;
              const rates = deriveHandRates(hs);
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <StatCard label="統計局數" value={fmtNum(hs.total_hands)} sub={periodLabel} />
                    <StatCard
                      label="莊贏"
                      value={`${fmtNum(hs.banker_wins)} 場`}
                      sub={fmtPct(rates.banker_rate)}
                      accent
                    />
                    <StatCard
                      label="閒贏"
                      value={`${fmtNum(hs.player_wins)} 場`}
                      sub={fmtPct(rates.player_rate)}
                    />
                    <StatCard
                      label="和局"
                      value={`${fmtNum(hs.ties)} 場`}
                      sub={fmtPct(rates.tie_rate)}
                    />
                    <StatCard
                      label="Super6 出現"
                      value={`${fmtNum(hs.super6_count)} 次`}
                      sub={`自然20倍 ${fmtNum(hs.super6_natural_count)} 次 ／ 補牌12倍 ${fmtNum(hs.super6_draw_count)} 次`}
                      accent
                    />
                    <StatCard
                      label="自然牌"
                      value={`${fmtNum(hs.natural_count)} 次`}
                      sub={`出現率 ${fmtPct(rates.natural_rate)}`}
                    />
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
