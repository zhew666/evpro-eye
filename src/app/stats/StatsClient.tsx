"use client";

import { useState, useEffect, useCallback } from "react";
import type { StatsResponse, Period, HitStat, Super6HitStat, EvHitRates } from "@/lib/stats";
import { deriveHandRates, fmtPct, fmtNum } from "@/lib/stats";
import {
  Card,
  Tabs,
  ScopeBanner,
  TheoryBar,
  DialChart,
  BreakevenGauge,
  FlowCard,
} from "@/components/ui";
import type { TabItem, FlowStep } from "@/components/ui";

// ── 盈虧試算 ─────────────────────────────────────────────────
// 每注 main（莊閒）/ side（S6+對子）
interface BetSize {
  main: number;
  side: number;
  label: string;
}
const BET_SIZES: BetSize[] = [
  { main: 1000, side: 300, label: "每注 1000／300" },
  { main: 500,  side: 100, label: "每注 500／100" },
  { main: 100,  side: 100, label: "每注 100／100" },
];

/**
 * 單區盈虧
 * @returns { pnl 盈虧、breakeven 0-100 損平率 }
 */
function pnlBanker(hr: HitStat, bet: number) {
  // 莊贏 1:1（免佣計算），輸全賠，和局不計（signals 已排除 tie）
  const pnl = hr.hits * bet - (hr.signals - hr.hits) * bet;
  return { pnl, breakeven: 50 };
}
function pnlPlayer(hr: HitStat, bet: number) {
  const pnl = hr.hits * bet - (hr.signals - hr.hits) * bet;
  return { pnl, breakeven: 50 };
}
function pnlSuper6(hr: Super6HitStat, bet: number) {
  // 自然12倍 + 補牌20倍 + 未中 -bet
  const misses = hr.signals - hr.hits;
  const pnl = hr.hits_natural * bet * 12 + hr.hits_draw * bet * 20 - misses * bet;
  const naturalBE = 1 / 13 * 100; // 7.69%（全自然）
  const drawBE = 1 / 21 * 100;     // 4.76%（全補牌）
  // 混合損平：依實際命中 natural/draw 比例推估，若無命中則保守用 natural
  const totalHits = hr.hits_natural + hr.hits_draw;
  let blendedBE = naturalBE;
  if (totalHits > 0) {
    const avgPayout = (hr.hits_natural * 12 + hr.hits_draw * 20) / totalHits;
    blendedBE = (1 / (avgPayout + 1)) * 100;
  }
  return { pnl, naturalBE, drawBE, blendedBE };
}
function pnlPair(pairHits: number, pairSignals: number, bet: number) {
  // 對子 11 倍
  const pnl = pairHits * bet * 11 - (pairSignals - pairHits) * bet;
  return { pnl, breakeven: 1 / 12 * 100 }; // 8.33%
}

function fmtMoney(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return sign + n.toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

// ── 小工具元件 ──────────────────────────────────────────────

/** 三段式數據卡片（label / value / sub）— 透過新 Card primitive 實作 */
function StatCard({
  label, value, sub, accent,
}: {
  label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <Card variant="numeric">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-accent" : "text-text"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-text-muted">{sub}</p>}
    </Card>
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

/** 盈虧區段 */
function PnlSection({ hr, bet, periodLabel, rebatePct }: {
  hr: EvHitRates;
  bet: BetSize;
  periodLabel: string;
  rebatePct: number; // 反水比例 0.4 - 1.2 (%)
}) {
  const b = pnlBanker(hr.banker, bet.main);
  const p = pnlPlayer(hr.player, bet.main);
  const s6 = pnlSuper6(hr.super6 as Super6HitStat, bet.side);

  // 對子合併（兩個訊號同時觸發）
  const pairHits = Math.max(hr.pair_p.hits, hr.pair_b.hits);
  const pairSigs = Math.max(hr.pair_p.signals, hr.pair_b.signals);
  const pair = pnlPair(pairHits, pairSigs, bet.side);

  const totalSignals =
    hr.banker.signals + hr.player.signals + (hr.super6 as Super6HitStat).signals + pairSigs;
  const mainTurnover =
    (hr.banker.signals + hr.player.signals) * bet.main;
  const sideTurnover =
    ((hr.super6 as Super6HitStat).signals + pairSigs) * bet.side;
  const totalTurnover = mainTurnover + sideTurnover;
  const basePnl = b.pnl + p.pnl + s6.pnl + pair.pnl;
  const rebateAmount = totalTurnover * (rebatePct / 100);
  const totalPnl = basePnl + rebateAmount;
  const roi = totalTurnover > 0 ? (totalPnl / totalTurnover) * 100 : 0;

  const rows = [
    {
      label: "莊注",
      signals: hr.banker.signals,
      hits: hr.banker.hits,
      rate: hr.banker.rate,
      be: b.breakeven,
      pnl: b.pnl,
      bet: bet.main,
    },
    {
      label: "閒注",
      signals: hr.player.signals,
      hits: hr.player.hits,
      rate: hr.player.rate,
      be: p.breakeven,
      pnl: p.pnl,
      bet: bet.main,
    },
    {
      label: "Super6",
      signals: hr.super6.signals,
      hits: hr.super6.hits,
      rate: hr.super6.rate,
      be: s6.blendedBE, // 依實際 natural/draw 混合比例算
      beNote: `自然 ${s6.naturalBE.toFixed(2)}% / 補牌 ${s6.drawBE.toFixed(2)}%`,
      pnl: s6.pnl,
      bet: bet.side,
    },
    {
      label: "對子",
      signals: pairSigs,
      hits: pairHits,
      rate: pairSigs > 0 ? (pairHits / pairSigs) * 100 : null,
      be: pair.breakeven,
      pnl: pair.pnl,
      bet: bet.side,
    },
  ];

  // FlowCard steps：各注區 pnl 貢獻 + 反水
  const flowSteps: FlowStep[] = [
    { label: "莊注盈虧", value: b.pnl, tone: "banker" },
    { label: "閒注盈虧", value: p.pnl, tone: "player" },
    { label: "Super6 盈虧", value: s6.pnl, tone: "super6" },
    { label: "對子盈虧", value: pair.pnl, tone: "pair" },
    { label: "基礎合計", value: basePnl, tone: "neutral" },
    {
      label: `反水 ${rebatePct.toFixed(1)}%`,
      value: rebateAmount,
      tone: "accent",
    },
  ];

  return (
    <div className="space-y-4">
      {/* 總結卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label={`${periodLabel}淨盈虧`}
          value={`${fmtMoney(totalPnl)} 元`}
          sub={`含反水 ${rebatePct.toFixed(1)}%`}
          accent
        />
        <StatCard
          label="輸贏結果"
          value={`${fmtMoney(basePnl)} 元`}
          sub="不含反水"
        />
        <StatCard
          label="反水獎勵"
          value={`${fmtMoney(rebateAmount)} 元`}
          sub={`總流水 ${fmtNum(totalTurnover)} × ${rebatePct.toFixed(1)}%`}
        />
        <StatCard
          label="投報率 (ROI)"
          value={`${roi >= 0 ? "+" : ""}${roi.toFixed(2)}%`}
          sub={`${fmtNum(totalSignals)} 次 / 流水 ${fmtNum(totalTurnover)}`}
        />
      </div>

      {/* 盈虧組成（FlowCard）— 各注區貢獻 + 反水 → 淨盈虧 */}
      <FlowCard
        title="盈虧組成（各注區貢獻 ＋ 反水 ＝ 淨盈虧）"
        steps={flowSteps}
        total={{
          label: "淨盈虧",
          value: totalPnl,
          accent: true,
        }}
        fmtValue={(n) => `${fmtMoney(n)} 元`}
      />

      {/* 詳細表格 */}
      <div className="bg-bg-card border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/5 bg-primary/50">
          <h3 className="text-sm font-bold text-text">各注區盈虧 / 損平點</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-text-muted border-b border-white/5">
                <th className="text-left px-4 py-2 font-medium">注區</th>
                <th className="text-right px-3 py-2 font-medium">推播</th>
                <th className="text-right px-3 py-2 font-medium">命中</th>
                <th className="text-right px-3 py-2 font-medium">實際命中率</th>
                <th className="text-right px-3 py-2 font-medium">損平點</th>
                <th className="text-right px-4 py-2 font-medium">盈虧（元）</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const beat = r.rate != null && r.rate >= r.be;
                return (
                  <tr key={r.label} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-text">{r.label}</td>
                    <td className="px-3 py-2.5 text-right text-text-muted">{fmtNum(r.signals)}</td>
                    <td className="px-3 py-2.5 text-right text-text-muted">{fmtNum(r.hits)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={beat ? "text-accent font-bold" : "text-text-muted"}>
                        {r.rate != null ? r.rate.toFixed(2) + "%" : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-text-muted">
                      {r.rate != null ? (
                        <div className="inline-flex flex-col items-end gap-1">
                          <BreakevenGauge
                            actual={r.rate}
                            breakeven={r.be}
                            width={110}
                          />
                          {"beNote" in r && r.beNote && (
                            <div className="text-[10px] opacity-60 text-right">
                              {r.beNote}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div>{r.be.toFixed(2)}%</div>
                          {"beNote" in r && r.beNote && (
                            <div className="text-[10px] opacity-60">{r.beNote}</div>
                          )}
                        </>
                      )}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono font-bold ${
                      r.pnl > 0 ? "text-accent" : r.pnl < 0 ? "text-red-400" : "text-text-muted"
                    }`}>
                      {fmtMoney(r.pnl)}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-primary/30 font-bold">
                <td className="px-4 py-3 text-text">合計</td>
                <td className="px-3 py-3 text-right text-text">{fmtNum(totalSignals)}</td>
                <td className="px-3 py-3 text-right text-text">—</td>
                <td className="px-3 py-3 text-right text-text">—</td>
                <td className="px-3 py-3 text-right text-text">—</td>
                <td className={`px-4 py-3 text-right font-mono text-base ${
                  totalPnl > 0 ? "text-accent" : totalPnl < 0 ? "text-red-400" : "text-text-muted"
                }`}>
                  {fmtMoney(totalPnl)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 說明 */}
      <Card className="text-xs text-text-muted leading-relaxed" variant="compact">
        <p className="mb-1">
          <span className="text-accent font-bold">損平點</span>：命中率要達多少才不賠錢。
          莊／閒注皆 50%、Super6 補牌（20倍）4.76%、自然（12倍）7.69%、對子（11倍）8.33%。
        </p>
        <p className="mb-1">
          <span className="text-accent font-bold">盈虧計算</span>：
          莊／閒皆 1:1、Super6 補牌 20 倍 / 自然 12 倍、對子 11 倍。和局退注不計。
        </p>
        <p>
          <span className="text-accent font-bold">反水</span>：
          不論輸贏，會員可依總流水領回 {rebatePct.toFixed(1)}% 的現金反饋，
          常見範圍 0.4% ~ 1.2%（依會員等級、平台與代理制度而定）。
        </p>
      </Card>
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
    <Card>
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
    </Card>
  );
}

// ── 主元件 ──────────────────────────────────────────────────

const PERIODS: { key: Period; label: string }[] = [
  { key: "1d",  label: "今日" },
  { key: "7d",  label: "近 7 天" },
  { key: "30d", label: "近 30 天" },
];

const PERIOD_TABS: TabItem<Period>[] = PERIODS.map((p) => ({
  key: p.key,
  label: p.label,
}));

export default function StatsClient() {
  const [period, setPeriod] = useState<Period>("1d");
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [betIdx, setBetIdx] = useState(0); // 預設第一個: 1000/300
  const [rebatePct, setRebatePct] = useState(0.6); // 反水 0.4% - 1.2%

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

  // 注額組合的 tab items（以字串 index 為 key）
  const betSizeTabs: TabItem<string>[] = BET_SIZES.map((bs, i) => ({
    key: String(i),
    label: bs.label,
  }));

  return (
    <div className="space-y-12">
      {/* Period toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-text-muted text-sm mr-2">統計區間</span>
        <Tabs
          items={PERIOD_TABS}
          value={period}
          onChange={setPeriod}
          variant="pill"
          size="md"
          ariaLabel="統計區間"
        />
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
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 sm:p-5">
            <SectionTitle>
              <span className="w-2 h-5 bg-accent rounded inline-block" />
              牌局結果統計
              <span className="text-xs font-normal text-text-muted ml-1">
                （{periodLabel}，27 桌合計）
              </span>
            </SectionTitle>

            <ScopeBanner
              variant="all"
              title="所有監控桌台的開牌結果"
              description="27 桌全部牌局，包含玩家未下注的手。用來驗證莊/閒/和局的實際機率是否吻合理論值。"
            />

            {!data.has_hand_data ? (
              <TheoryBanner />
            ) : (() => {
              const hs = data.hand_stats!;
              const rates = deriveHandRates(hs);
              const pairTotal = hs.pair_p_count + hs.pair_b_count;
              return (
                <div className="space-y-4">
                  {/* 數字卡片 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard label="監測局數" value={fmtNum(hs.total_hands)} sub={periodLabel} />
                    <StatCard label="莊贏" value={`${fmtNum(hs.banker_wins)} 場`} sub={fmtPct(rates.banker_rate)} accent />
                    <StatCard label="閒贏" value={`${fmtNum(hs.player_wins)} 場`} sub={fmtPct(rates.player_rate)} />
                    <StatCard label="和局" value={`${fmtNum(hs.ties)} 場`} sub={fmtPct(rates.tie_rate)} />
                  </div>

                  {/* 勝率長條圖（Theory vs Actual）*/}
                  <Card>
                    <div className="flex items-baseline justify-between mb-3">
                      <p className="text-xs text-text-muted">勝負分布（實際 vs 理論）</p>
                      <p className="text-2xs text-text-dim">
                        <span className="inline-block w-2 h-[2px] align-middle bg-accent mr-1" />
                        金色豎線＝理論機率
                      </p>
                    </div>
                    <div className="space-y-3">
                      <TheoryBar
                        label="莊贏"
                        actual={rates.banker_rate * 100}
                        theory={45.86}
                        count={hs.banker_wins}
                        total={hs.total_hands}
                        tone="game-banker"
                      />
                      <TheoryBar
                        label="閒贏"
                        actual={rates.player_rate * 100}
                        theory={44.62}
                        count={hs.player_wins}
                        total={hs.total_hands}
                        tone="game-player"
                      />
                      <TheoryBar
                        label="和局"
                        actual={rates.tie_rate * 100}
                        theory={9.52}
                        count={hs.ties}
                        total={hs.total_hands}
                        tone="game-tie"
                      />
                    </div>
                    <p className="text-xs text-text-muted mt-3 leading-relaxed">
                      <span className="text-accent">莊的長期勝率高於閒 1.24%</span>，
                      這就是系統偏好推莊的數學原因。
                    </p>
                  </Card>

                  {/* 其他統計 */}
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      label="對子出現"
                      value={`${fmtNum(pairTotal)} 次`}
                      sub={`莊對 ${fmtNum(hs.pair_b_count)} ／ 閒對 ${fmtNum(hs.pair_p_count)}`}
                    />
                    <StatCard
                      label="Super6 出現"
                      value={`${fmtNum(hs.super6_count)} 次`}
                      sub={`自然12倍 ${fmtNum(hs.super6_natural_count)} ／ 補牌20倍 ${fmtNum(hs.super6_draw_count)}`}
                      accent
                    />
                  </div>

                </div>
              );
            })()}
          </div>

          {/* ── 區塊二：推播與命中（整合推播次數 + 命中率） ── */}
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 sm:p-5">
            <SectionTitle>
              <span className="w-2 h-5 bg-purple-400 rounded inline-block" />
              推播與命中
              <span className="text-xs font-normal text-text-muted ml-1">
                （{periodLabel}，正EV推播次數及命中結果）
              </span>
            </SectionTitle>

            <ScopeBanner
              variant="push"
              title="LINE Bot 推送過的正 EV 訊號"
              description="只計入系統偵測到「正期望值」而推播給會員的那些手。推播次數、命中率代表實戰訊號的表現。"
            />

            {(() => {
              const ev = data.ev_signals;
              const hr = data.ev_hit_rates;
              const perDay = periodDays > 0 ? (ev.total / periodDays).toFixed(1) : "—";

              // 對子：pair_p 和 pair_b 同一手同時計算，取 max 避免雙重計算
              // 完整去重需靠 SQL pair_signals 欄位（待 006 migration）
              const pairSignals = Math.max(ev.pair_p_signals ?? 0, ev.pair_b_signals ?? 0);
              const pairHits = hr ? Math.max(hr.pair_p.hits, hr.pair_b.hits) : 0;
              const pairHrSignals = hr ? Math.max(hr.pair_p.signals, hr.pair_b.signals) : 0;
              const pairRate = (pairHrSignals > 0)
                ? Math.round(pairHits / pairHrSignals * 10000) / 100
                : null;

              // 命中率區段：signals 用 hr.*.signals（有對應 hand_results 的推播數）
              // 確保推播次數與命中次數來自同一時間區間
              const rows: { label: string; stat: HitStat; extra?: React.ReactNode }[] = [
                {
                  label: "莊注",
                  stat: hr
                    ? { signals: hr.banker.signals, hits: hr.banker.hits, rate: hr.banker.rate }
                    : { signals: ev.banker_signals, hits: 0, rate: null },
                },
                {
                  label: "閒注",
                  stat: hr
                    ? { signals: hr.player.signals, hits: hr.player.hits, rate: hr.player.rate }
                    : { signals: ev.player_signals, hits: 0, rate: null },
                },
                {
                  label: "Super6",
                  stat: hr
                    ? { signals: hr.super6.signals, hits: (hr.super6 as Super6HitStat).hits, rate: hr.super6.rate }
                    : { signals: ev.super6_signals, hits: 0, rate: null },
                  extra: hr && (hr.super6 as Super6HitStat).hits > 0
                    ? `命中細節：12倍（兩張牌）${(hr.super6 as Super6HitStat).hits_natural} 次 ／ 20倍（補牌）${(hr.super6 as Super6HitStat).hits_draw} 次`
                    : undefined,
                },
                {
                  label: "對子",
                  stat: hr
                    ? { signals: pairHrSignals, hits: pairHits, rate: pairRate }
                    : { signals: pairSignals, hits: 0, rate: null },
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
                  <Card>
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
                  </Card>

                  {/* 各注區命中率（Dial 2x2 + 損平點 tick）*/}
                  <Card>
                    <div className="flex items-baseline justify-between mb-1 flex-wrap gap-x-3">
                      <p className="text-xs text-text-muted">各注區命中率 vs 損平點</p>
                      <p className="text-2xs text-text-dim">
                        <span className="inline-block w-2 h-[2px] align-middle bg-accent mr-1" />
                        金色 tick＝該注區損平點（要高於才賺）
                      </p>
                    </div>
                    <p className="text-xs text-text-muted mb-5 opacity-60">
                      莊／閒命中率不計和局（和局視為退注）。
                    </p>
                    {(() => {
                      // Dial 2×2 grid：莊、閒、S6、對子
                      const s6Stat = hr?.super6 as Super6HitStat | undefined;
                      const s6BE = (() => {
                        if (!s6Stat) return (1 / 13) * 100;
                        const totalHits = s6Stat.hits_natural + s6Stat.hits_draw;
                        if (totalHits === 0) return (1 / 13) * 100;
                        const avgPayout =
                          (s6Stat.hits_natural * 12 + s6Stat.hits_draw * 20) /
                          totalHits;
                        return (1 / (avgPayout + 1)) * 100;
                      })();

                      // 以 breakeven 為中心對稱 → tick 永遠在儀表正中央
                      const centered = (be: number, half: number) => ({
                        min: Math.max(0, be - half),
                        max: be + half,
                      });

                      const dials: {
                        label: string;
                        value: number | null;
                        breakeven: number;
                        tone: "game-banker" | "game-player" | "game-super6" | "game-pair";
                        sublabel: string;
                        min: number;
                        max: number;
                        extra?: React.ReactNode;
                      }[] = [
                        {
                          label: "莊注",
                          value: rows[0].stat.rate,
                          breakeven: 50,
                          tone: "game-banker",
                          sublabel: `推 ${fmtNum(rows[0].stat.signals)} 中 ${fmtNum(rows[0].stat.hits)}`,
                          ...centered(50, 10), // 40-60
                        },
                        {
                          label: "閒注",
                          value: rows[1].stat.rate,
                          breakeven: 50,
                          tone: "game-player",
                          sublabel: `推 ${fmtNum(rows[1].stat.signals)} 中 ${fmtNum(rows[1].stat.hits)}`,
                          ...centered(50, 10),
                        },
                        {
                          label: "Super6",
                          value: rows[2].stat.rate,
                          breakeven: s6BE,
                          tone: "game-super6",
                          sublabel: `推 ${fmtNum(rows[2].stat.signals)} 中 ${fmtNum(rows[2].stat.hits)}`,
                          ...centered(s6BE, 6),
                          extra: s6Stat && s6Stat.hits > 0
                            ? `12倍 ${s6Stat.hits_natural} 次 / 20倍 ${s6Stat.hits_draw} 次`
                            : undefined,
                        },
                        {
                          label: "對子",
                          value: rows[3].stat.rate,
                          breakeven: (1 / 12) * 100,
                          tone: "game-pair",
                          sublabel: `推 ${fmtNum(rows[3].stat.signals)} 中 ${fmtNum(rows[3].stat.hits)}`,
                          ...centered((1 / 12) * 100, 8), // be=8.33 → 0.33-16.33
                        },
                      ];

                      return (
                        <div className="grid grid-cols-2 gap-6 py-2">
                          {dials.map((d) => (
                            <div
                              key={d.label}
                              className="flex flex-col items-center gap-1"
                            >
                              {d.value != null ? (
                                <DialChart
                                  label={d.label}
                                  value={d.value}
                                  breakeven={d.breakeven}
                                  tone={d.tone}
                                  sublabel={d.sublabel}
                                  min={d.min}
                                  max={d.max}
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-1 py-2">
                                  <div className="w-[120px] h-[70px] flex items-end justify-center">
                                    <span className="text-text-dim text-xs">
                                      命中率累積中
                                    </span>
                                  </div>
                                  <span className="text-sm font-medium text-text">
                                    {d.label}
                                  </span>
                                  <span className="text-2xs text-text-dim">
                                    {d.sublabel}
                                  </span>
                                </div>
                              )}
                              {d.extra && (
                                <p className="text-2xs text-text-dim">
                                  {d.extra}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </Card>
                </div>
              );
            })()}
          </div>

          {/* ── 區塊三：模擬盈虧與損平點 ── */}
          {data.ev_hit_rates && (
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 sm:p-5">
              <SectionTitle>
                <span className="w-2 h-5 bg-green-400 rounded inline-block" />
                模擬盈虧與損平點
                <span className="text-xs font-normal text-text-muted ml-1">
                  （{periodLabel}，依實際推播結果試算）
                </span>
              </SectionTitle>

              <ScopeBanner
                variant="push"
                title="基於推播訊號的盈虧模擬"
                description="假設每次系統推播會員都有照推下注，依實際命中率與賠率試算總盈虧。僅計入 LINE 推播過的那些手。"
              />

              {/* 注額切換 */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-text-muted text-sm mr-1">注額組合</span>
                <Tabs
                  items={betSizeTabs}
                  value={String(betIdx)}
                  onChange={(k) => setBetIdx(Number(k))}
                  variant="pill"
                  size="sm"
                  ariaLabel="注額組合"
                />
              </div>

              {/* 反水調整 */}
              <div className="flex flex-wrap items-center gap-3 mb-4 bg-bg-card/50 border border-white/5 rounded-lg px-4 py-2.5">
                <span className="text-text-muted text-sm shrink-0">反水比例</span>
                <input
                  type="range"
                  min={0.4}
                  max={1.2}
                  step={0.1}
                  value={rebatePct}
                  onChange={(e) => setRebatePct(parseFloat(e.target.value))}
                  className="flex-1 min-w-[120px] accent-accent"
                />
                <span className="text-accent font-bold text-sm w-12 text-right shrink-0">
                  {rebatePct.toFixed(1)}%
                </span>
                <span className="text-[10px] text-text-muted shrink-0">
                  範圍 0.4% ~ 1.2%
                </span>
              </div>

              <PnlSection
                hr={data.ev_hit_rates}
                bet={BET_SIZES[betIdx]}
                periodLabel={periodLabel}
                rebatePct={rebatePct}
              />
            </div>
          )}

          {data.hand_data_start && (
            <p className="text-xs text-text-muted">
              * 牌局與命中率統計自{" "}
              <span className="text-accent">
                {new Date(data.hand_data_start).toLocaleDateString("zh-TW")}
              </span>{" "}
              起累積。完整 7 天 / 30 天數據將於資料累積足夠後呈現，
              推播次數為 positive_ev_log 完整歷史。
            </p>
          )}

          <p className="text-xs text-text-muted text-right">
            更新時間：{new Date(data.generated_at).toLocaleString("zh-TW")}（每分鐘刷新）
          </p>
        </>
      )}
    </div>
  );
}
