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

function BetBar({ label, count, total, color, unit = "場" }: {
  label: string; count: number; total: number; color: string; unit?: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-muted w-14 shrink-0">{label}</span>
      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct.toFixed(1)}%` }} />
      </div>
      <span className="text-xs text-text-muted w-28 text-right shrink-0">
        {fmtNum(count)} {unit} ({pct.toFixed(2)}%)
      </span>
    </div>
  );
}

/** 推播 + 命中率合併行 */
function SignalRow({ label, stat, extra }: {
  label: string;
  stat: HitStat;
  extra?: React.ReactNode;
}) {
  const hasHit = stat.rate != null;
  const pct = stat.rate ?? 0;
  const barColor =
    pct >= 50 ? "bg-accent" :
    pct >= 40 ? "bg-yellow-400" :
    "bg-white/20";

  return (
    <div className="py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-text">{label}</span>
        <span className="text-sm text-text-muted">
          推了 <span className="text-text font-bold">{fmtNum(stat.signals)}</span> 次
          {hasHit && (
            <>，中了 <span className="text-accent font-bold">{fmtNum(stat.hits)}</span> 次</>
          )}
        </span>
      </div>
      {hasHit && (
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div className={`h-1.5 rounded-full ${barColor}`}
              style={{ width: `${Math.min(pct, 100).toFixed(1)}%` }} />
          </div>
          <span className={`text-xs font-bold w-14 text-right shrink-0 ${
            pct >= 50 ? "text-accent" : pct >= 40 ? "text-yellow-400" : "text-text-muted"
          }`}>
            {pct.toFixed(1)}%
          </span>
        </div>
      )}
      {!hasHit && (
        <p className="text-xs text-text-muted">命中率統計累積中</p>
      )}
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

/** 尚無真實數據時，顯示理論值作為參考 */
function TheoryBanner() {
  return (
    <div className="bg-bg-card border border-white/5 rounded-xl p-5">
      <p className="text-xs text-text-muted mb-3">
        手牌數據累積中，以下為百家樂長期理論機率供參考
      </p>
      <div className="space-y-2">
        {[
          { label: "莊贏", pct: 45.86, color: "bg-accent" },
          { label: "閒贏", pct: 44.62, color: "bg-blue-400" },
          { label: "和局", pct: 9.52,  color: "bg-white/30" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-xs text-text-muted w-14 shrink-0">{item.label}</span>
            <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
              <div className={`h-2 rounded-full ${item.color}`}
                style={{ width: `${item.pct}%` }} />
            </div>
            <span className="text-xs text-text-muted w-16 text-right shrink-0">
              {item.pct}%
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-accent mt-3">
        * 莊的長期勝率比閒高 1.24%，這是系統推莊較多的數學原因。
        實際統計數據累積後將自動替換此說明。
      </p>
    </div>
  );
}

// ── 主元件 ──────────────────────────────────────────────────

const PERIODS: { key: Period; label: string }[] = [
  { key: "1d",  label: "今日" },
  { key: "7d",  label: "近 7 天" },
  { key: "30d", label: "近 30 天" },
];

export default function StatsClient() {
  const [period, setPeriod] = useState<Period>("1d");
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

  // 每 60 秒自動刷新
  useEffect(() => {
    const timer = setInterval(() => fetchStats(period), 60_000);
    return () => clearInterval(timer);
  }, [period, fetchStats]);

  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? "";
  const periodDays = period === "30d" ? 30 : period === "7d" ? 7 : 1;

  return (
    <div className="space-y-12">
      {/* Period toggle */}
      <div className="flex items-center gap-2">
        <span className="text-text-muted text-sm mr-2">統計區間</span>
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              period === p.key
                ? "bg-accent text-primary"
                : "bg-bg-card text-text-muted hover:text-text border border-white/10"
            }`}>
            {p.label}
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
          {/* ── 區塊一：牌局結果統計 ── */}
          <div>
            <SectionTitle>
              <span className="w-2 h-5 bg-accent rounded inline-block" />
              牌局結果統計
              <span className="text-xs font-normal text-text-muted ml-1">
                （{periodLabel}，27 桌合計）
              </span>
            </SectionTitle>

            {!data.has_hand_data ? (
              <TheoryBanner />
            ) : (() => {
              const hs = data.hand_stats!;
              const rates = deriveHandRates(hs);
              const pairTotal = hs.pair_p_count + hs.pair_b_count;
              const pairRate = hs.total_hands > 0 ? pairTotal / hs.total_hands : 0;
              return (
                <div className="space-y-4">
                  {/* 數字卡片 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard label="監測局數" value={fmtNum(hs.total_hands)} sub={periodLabel} />
                    <StatCard label="莊贏" value={`${fmtNum(hs.banker_wins)} 場`} sub={fmtPct(rates.banker_rate)} accent />
                    <StatCard label="閒贏" value={`${fmtNum(hs.player_wins)} 場`} sub={fmtPct(rates.player_rate)} />
                    <StatCard label="和局" value={`${fmtNum(hs.ties)} 場`} sub={fmtPct(rates.tie_rate)} />
                  </div>

                  {/* 勝率長條圖 */}
                  <div className="bg-bg-card border border-white/5 rounded-xl p-5">
                    <p className="text-xs text-text-muted mb-3">勝負分布</p>
                    <div className="space-y-2">
                      <BetBar label="莊贏" count={hs.banker_wins} total={hs.total_hands} color="bg-accent" />
                      <BetBar label="閒贏" count={hs.player_wins} total={hs.total_hands} color="bg-blue-400" />
                      <BetBar label="和局" count={hs.ties}        total={hs.total_hands} color="bg-white/30" />
                    </div>
                    <p className="text-xs text-accent mt-3">
                      莊的勝率高於閒，這是系統推莊較多的數學原因。
                    </p>
                  </div>

                  {/* 其他統計 */}
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      label="對子出現"
                      value={`${fmtNum(pairTotal)} 次`}
                      sub={`出現率 ${fmtPct(pairRate)}`}
                    />
                    <StatCard
                      label="Super6 出現"
                      value={`${fmtNum(hs.super6_count)} 次`}
                      sub={`自然20倍 ${fmtNum(hs.super6_natural_count)} ／ 補牌12倍 ${fmtNum(hs.super6_draw_count)}`}
                      accent
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ── 區塊二：推播與命中（整合推播次數 + 命中率） ── */}
          <div>
            <SectionTitle>
              <span className="w-2 h-5 bg-purple-400 rounded inline-block" />
              推播與命中
              <span className="text-xs font-normal text-text-muted ml-1">
                （{periodLabel}，正EV推播次數及命中結果）
              </span>
            </SectionTitle>

            {(() => {
              const ev = data.ev_signals;
              const hr = data.ev_hit_rates;
              const perDay = periodDays > 0 ? (ev.total / periodDays).toFixed(1) : "—";

              // 把推播次數和命中率合併成一個物件給每個注區
              const pairSignals = (ev.pair_p_signals ?? 0) + (ev.pair_b_signals ?? 0);
              const pairHits = hr ? hr.pair_p.hits + hr.pair_b.hits : 0;
              const pairRate = (hr && pairSignals > 0)
                ? Math.round(pairHits / pairSignals * 10000) / 100
                : null;

              const rows: { label: string; stat: HitStat; extra?: React.ReactNode }[] = [
                {
                  label: "莊注",
                  stat: hr
                    ? { signals: ev.banker_signals, hits: hr.banker.hits, rate: hr.banker.rate }
                    : { signals: ev.banker_signals, hits: 0, rate: null },
                },
                {
                  label: "閒注",
                  stat: hr
                    ? { signals: ev.player_signals, hits: hr.player.hits, rate: hr.player.rate }
                    : { signals: ev.player_signals, hits: 0, rate: null },
                },
                {
                  label: "Super6",
                  stat: hr
                    ? { signals: ev.super6_signals, hits: (hr.super6 as Super6HitStat).hits, rate: hr.super6.rate }
                    : { signals: ev.super6_signals, hits: 0, rate: null },
                  extra: hr && (hr.super6 as Super6HitStat).hits > 0
                    ? `命中細節：20倍（兩張牌）${(hr.super6 as Super6HitStat).hits_natural} 次 ／ 12倍（補牌）${(hr.super6 as Super6HitStat).hits_draw} 次`
                    : undefined,
                },
                {
                  label: "對子",
                  stat: { signals: pairSignals, hits: pairHits, rate: pairRate },
                },
              ];

              return (
                <div className="space-y-4">
                  {/* 總覽卡片 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <StatCard
                      label={`${periodLabel}推播總次數`}
                      value={fmtNum(ev.total)}
                      sub="正EV訊號"
                      accent
                    />
                    <StatCard
                      label="平均每天"
                      value={`${perDay} 次`}
                      sub="推播頻率"
                    />
                    <StatCard
                      label="推播分布"
                      value={`莊 ${fmtNum(ev.banker_signals)} ／ 閒 ${fmtNum(ev.player_signals)}`}
                      sub={`Super6 ${fmtNum(ev.super6_signals)} ／ 對子 ${fmtNum(pairSignals)}`}
                    />
                  </div>

                  {/* 推播分布長條圖 */}
                  <div className="bg-bg-card border border-white/5 rounded-xl p-5">
                    <p className="text-xs text-text-muted mb-3">推播注區分布</p>
                    <div className="space-y-2">
                      {[
                        { label: "莊",   count: ev.by_bet.banker, color: "bg-accent" },
                        { label: "閒",   count: ev.by_bet.player, color: "bg-blue-400" },
                        { label: "S6",   count: ev.by_bet.super6, color: "bg-purple-400" },
                        { label: "對子", count: ev.by_bet.pair_p + ev.by_bet.pair_b, color: "bg-pink-400" },
                        { label: "和",   count: ev.by_bet.tie,    color: "bg-green-400" },
                      ].map((item) => (
                        <BetBar key={item.label} label={item.label}
                          count={item.count} total={ev.total} color={item.color} unit="次" />
                      ))}
                    </div>
                  </div>

                  {/* 各注區命中率 */}
                  <div className="bg-bg-card border border-white/5 rounded-xl p-5">
                    <p className="text-xs text-text-muted mb-1">各注區命中率</p>
                    <p className="text-xs text-text-muted mb-3 opacity-60">
                      理論長期勝率：莊 45.86%、閒 44.62%、Super6 約 2.27%
                    </p>
                    {rows.map((r) => (
                      <SignalRow key={r.label} label={r.label} stat={r.stat} extra={r.extra} />
                    ))}
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
