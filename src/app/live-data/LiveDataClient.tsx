"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { RoadsPanel, type ApiHand as RoadApiHand } from "@/components/BaccaratRoads";
import { Card, Button, Badge, Tabs } from "@/components/ui";
import type { TabItem } from "@/components/ui";
import { cn } from "@/lib/cn";

/* ─── Types ────────────────────────────────────────── */

interface TableEntry {
  table_id: string;
  platform: string;
  hand: {
    table_id: string;
    platform: string;
    shoe: number;
    hand_num: number;
    dealer: string;
    p1: string; p2: string; p3: string;
    b1: string; b2: string; b3: string;
    ev_player: string; ev_banker: string; ev_tie: string;
    ev_pair_p: string; ev_pair_b: string; ev_super6: string;
    masked: boolean;
  };
}

interface ListResponse {
  tables: TableEntry[];
  tables_by_platform: Record<string, string[]>;
  updated_at: string;
  total_tables: number;
  mt_tables: number;
  dg_tables: number;
}

interface HistoryHand {
  hand_num: number;
  p1: string; p2: string; p3: string;
  b1: string; b2: string; b3: string;
  masked: boolean;
  created_at: string;
}

interface DetailResponse {
  table: {
    table_id: string;
    platform: string;
    shoe: number;
    hand_num: number;
    dealer: string;
    p1: string; p2: string; p3: string;
    b1: string; b2: string; b3: string;
    ev_banker: string; ev_player: string; ev_tie: string;
    ev_super6: string; ev_pair_p: string; ev_pair_b: string;
    updated_at: string;
  };
  history: HistoryHand[];
  screenshot_url: string | null;
}

interface ShoeResponse {
  table_id: string;
  shoe: number | null;
  shoe_started_at: string | null;
  total_hands: number;
  hands: RoadApiHand[];
}

/* ─── Utils ────────────────────────────────────────── */

const PLATFORMS = ["MT", "DG"] as const;

const platformTabs: TabItem<string>[] = PLATFORMS.map((p) => ({ key: p, label: p }));

function cardPoint(card: string | null | undefined): number {
  if (!card || card === "****" || card === "" || card === "-") return 0;
  const rank = card.replace(/[^\dTJQKA]/g, "");
  if (["T", "J", "Q", "K", "10"].includes(rank)) return 0;
  if (rank === "A") return 1;
  return parseInt(rank) || 0;
}

function getResult(p1: string, p2: string, p3: string, b1: string, b2: string, b3: string): string {
  const pScore = (cardPoint(p1) + cardPoint(p2) + cardPoint(p3)) % 10;
  const bScore = (cardPoint(b1) + cardPoint(b2) + cardPoint(b3)) % 10;
  if (pScore > bScore) return "閒贏";
  if (bScore > pScore) return "莊贏";
  return "和局";
}

function isRedSuit(card: string): boolean {
  return card.includes("\u2665") || card.includes("\u2666");
}

/* ─── Sub-Components ───────────────────────────────── */

function CardSpan({ card }: { card: string }) {
  if (!card || card === "" || card === "-") return null;
  return (
    <span className={`mr-1 font-mono ${isRedSuit(card) ? "text-red-400" : "text-text"}`}>
      {card}
    </span>
  );
}

function ResultBadge({ result }: { result: string }) {
  const toneMap: Record<string, "game-banker" | "game-player" | "game-tie" | "neutral"> = {
    "莊贏": "game-banker",
    "閒贏": "game-player",
    "和局": "game-tie",
  };
  const tone = toneMap[result] ?? "neutral";
  return (
    <Badge tone={tone} variant="dot" size="sm">
      {result}
    </Badge>
  );
}

/* ─── Main Component ───────────────────────────────── */

export default function LiveDataClient() {
  const [listData, setListData] = useState<ListResponse | null>(null);
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [shoeHands, setShoeHands] = useState<RoadApiHand[]>([]);
  const [platform, setPlatform] = useState<string>("MT");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);
  const tabScrollRef = useRef<HTMLDivElement>(null);

  // DB EV lookup by hand_num (from /shoe API)
  const evByHand = useMemo(() => {
    const map: Record<number, RoadApiHand> = {};
    for (const h of shoeHands) map[h.hand_num] = h;
    return map;
  }, [shoeHands]);

  // Fetch table list
  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/live-data");
      if (!res.ok) throw new Error("Failed to fetch");
      const json: ListResponse = await res.json();
      setListData(json);
      setError(null);
      return json;
    } catch {
      setError("數據載入失敗，稍後重試...");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch shoe hands for road rendering (fire-and-forget, parallel with detail)
  const fetchShoe = useCallback(async (tableId: string) => {
    if (!tableId) return;
    try {
      const res = await fetch(`/api/live-data/${encodeURIComponent(tableId)}/shoe`);
      if (!res.ok) throw new Error("Failed to fetch shoe");
      const json: ShoeResponse = await res.json();
      setShoeHands(json.hands || []);
    } catch {
      setShoeHands([]);
    }
  }, []);

  // Fetch single table detail + accumulate EV
  const fetchDetail = useCallback(async (tableId: string) => {
    if (!tableId) return;
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/live-data/${encodeURIComponent(tableId)}`);
      if (!res.ok) throw new Error("Failed to fetch detail");
      const json: DetailResponse = await res.json();
      setDetail(json);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      const data = await fetchList();
      if (data) {
        const platformTables = data.tables_by_platform["MT"] || data.tables_by_platform["DG"] || [];
        const firstPlatform = data.tables_by_platform["MT"] ? "MT" : "DG";
        if (platformTables.length > 0) {
          setPlatform(firstPlatform);
          setSelectedTable(platformTables[0]);
          await Promise.all([fetchDetail(platformTables[0]), fetchShoe(platformTables[0])]);
        }
      }
    })();
  }, [fetchList, fetchDetail, fetchShoe]);

  // Auto refresh every 10s
  useEffect(() => {
    const interval = setInterval(async () => {
      await fetchList();
      if (selectedTable) {
        await Promise.all([fetchDetail(selectedTable), fetchShoe(selectedTable)]);
      }
      setCountdown(10);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchList, fetchDetail, fetchShoe, selectedTable]);

  // Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 10));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Switch platform
  const handlePlatformChange = useCallback(async (p: string) => {
    setPlatform(p);
    if (listData?.tables_by_platform[p]?.length) {
      const firstTable = listData.tables_by_platform[p][0];
      setSelectedTable(firstTable);
      setShoeHands([]);
      await Promise.all([fetchDetail(firstTable), fetchShoe(firstTable)]);
    } else {
      setSelectedTable("");
      setDetail(null);
      setShoeHands([]);
    }
  }, [listData, fetchDetail, fetchShoe]);

  // Switch table
  const handleTableChange = useCallback(async (tableId: string) => {
    setSelectedTable(tableId);
    setShoeHands([]);
    await Promise.all([fetchDetail(tableId), fetchShoe(tableId)]);
  }, [fetchDetail, fetchShoe]);

  // Touch scrolling for tab bar - handled by CSS overflow-x-auto

  const currentTables = listData?.tables_by_platform[platform] || [];

  /* ─── Loading / Error states ─── */

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-text-muted">正在載入即時數據...</p>
      </div>
    );
  }

  if (error && !listData) {
    return (
      <div className="text-center py-20">
        <p className="text-[color:var(--color-error)] mb-4">{error}</p>
        <Button variant="primary" onClick={fetchList}>
          重試
        </Button>
      </div>
    );
  }

  const t = detail?.table;
  const history = detail?.history || [];
  // Reverse: newest first
  const sortedHistory = [...history].reverse();

  return (
    <div>
      {/* Status bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            監控中
          </span>
          <span className="text-text-muted text-sm">
            MT {listData?.mt_tables ?? 0} 桌 / DG {listData?.dg_tables ?? 0} 桌
          </span>
        </div>
        <span className="text-text-muted text-xs">{countdown}s 後更新</span>
      </div>

      {/* Platform tabs */}
      <div className="mb-3">
        <Tabs
          items={platformTabs}
          value={platform}
          onChange={handlePlatformChange}
          variant="pill"
          size="md"
          ariaLabel="平台切換"
        />
      </div>

      {/* Table tabs - horizontal scroll (preserve custom scroll behavior) */}
      <div className="relative mb-5 after:pointer-events-none after:absolute after:right-0 after:top-0 after:bottom-2 after:w-8 after:bg-gradient-to-l after:from-[color:var(--color-bg)] after:to-transparent">
        <div
          ref={tabScrollRef}
          className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide"
          style={{ WebkitOverflowScrolling: "touch" }}
          role="tablist"
          aria-label="桌台切換"
        >
          {currentTables.map((tid) => {
            const selected = selectedTable === tid;
            return (
              <button
                key={tid}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => handleTableChange(tid)}
                className={cn(
                  "shrink-0 inline-flex items-center justify-center font-bold font-mono",
                  "transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)]",
                  "px-3.5 py-2 min-h-[40px] text-xs rounded-md",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]",
                  selected
                    ? "bg-accent text-primary"
                    : "bg-[color:var(--color-surface-1)] text-text-muted hover:bg-[color:var(--color-surface-2)] hover:text-text"
                )}
              >
                {tid}
              </button>
            );
          })}
          {currentTables.length === 0 && (
            <span className="text-text-muted text-sm py-1">此平台暫無桌局</span>
          )}
        </div>
      </div>

      {/* Detail area */}
      {detailLoading && !detail ? (
        <div className="text-center py-16">
          <div className="inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !t ? (
        <div className="text-center py-16 text-text-muted">請選擇一張桌台</div>
      ) : (
        <div className="space-y-4">
          {/* Screenshot area */}
          <Card className="relative w-full p-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mt-live-banner.png"
              alt="MT 真人百家樂"
              className="w-full h-auto object-cover"
            />
          </Card>

          {/* Table info bar */}
          <Card variant="compact" className="grid grid-cols-3 gap-2 text-xs sm:flex sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1 sm:text-sm">
            <span className="text-text-muted">
              荷官：<span className="text-text font-medium">{t.dealer || "-"}</span>
            </span>
            <span className="text-text-muted">
              靴號：<span className="text-text font-medium">{t.shoe}</span>
            </span>
            <span className="text-text-muted">
              手數：<span className="text-text font-medium">{t.hand_num}</span>
            </span>
          </Card>

          {/* 五路面板（大路常駐、其餘展開） */}
          <Card className="p-3">
            <RoadsPanel hands={shoeHands} />
          </Card>

          {/* Hand history */}
          <Card className="overflow-hidden p-0">
            <div className="px-4 py-2.5 border-b border-[color:var(--color-border)] bg-primary/50">
              <h3 className="text-sm font-bold text-text">開牌記錄（當前靴）</h3>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {sortedHistory.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm">暫無記錄</div>
              ) : (
                <div className="divide-y divide-[color:var(--color-border)]">
                  {sortedHistory.map((hand) => {
                    if (hand.masked) {
                      return (
                        <div key={hand.hand_num} className="relative px-4 py-2.5">
                          {/* Blurred content */}
                          <div className="flex items-center gap-3 blur-sm select-none pointer-events-none" aria-hidden="true">
                            <span className="text-xs text-text-muted w-8 shrink-0 font-mono">#{hand.hand_num}</span>
                            <span className="text-sm font-mono text-text">
                              <span className="mr-1">♠A</span>
                              <span className="mr-1">♣7</span>
                            </span>
                            <span className="text-text-muted text-xs mx-1">|</span>
                            <span className="text-sm font-mono text-text">
                              <span className="text-[color:var(--color-banker)] mr-1">♥K</span>
                              <span className="mr-1">♣3</span>
                            </span>
                            <span className="ml-auto text-xs font-bold text-[color:var(--color-player)]">閒贏</span>
                          </div>
                          {/* Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-bg-card/60 rounded">
                            <span className="text-xs text-accent flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                              遮蔽中
                            </span>
                          </div>
                        </div>
                      );
                    }

                    const result = getResult(hand.p1, hand.p2, hand.p3, hand.b1, hand.b2, hand.b3);
                    const pCards = [hand.p1, hand.p2, hand.p3].filter((c) => c && c !== "" && c !== "-");
                    const bCards = [hand.b1, hand.b2, hand.b3].filter((c) => c && c !== "" && c !== "-");

                    // Look up DB EV for this hand (from /shoe API)
                    const ev = evByHand[hand.hand_num];
                    const hasEv =
                      ev &&
                      (ev.ev_banker != null ||
                        ev.ev_player != null ||
                        ev.ev_tie != null);

                    return (
                      <div key={hand.hand_num} className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-text-muted w-8 shrink-0 font-mono">#{hand.hand_num}</span>
                          <span className="text-sm">
                            {pCards.map((c, i) => (
                              <CardSpan key={`p${i}`} card={c} />
                            ))}
                          </span>
                          <span className="text-text-muted text-xs mx-0.5">|</span>
                          <span className="text-sm">
                            {bCards.map((c, i) => (
                              <CardSpan key={`b${i}`} card={c} />
                            ))}
                          </span>
                          <span className="ml-auto">
                            <ResultBadge result={result} />
                          </span>
                        </div>
                        {hasEv && (
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 ml-8 text-[10px] font-mono text-text-muted">
                            {[
                              { label: "莊", val: ev.ev_banker },
                              { label: "閒", val: ev.ev_player },
                              { label: "和", val: ev.ev_tie },
                              { label: "S6", val: ev.ev_super6 },
                              { label: "閒對", val: ev.ev_pair_p },
                              { label: "莊對", val: ev.ev_pair_b },
                            ].map(({ label, val }) => {
                              if (val == null) return null;
                              return (
                                <span key={label}>
                                  {label}
                                  <span className={val > 0 ? "text-[color:var(--color-success)]" : ""}>
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
              )}
            </div>
          </Card>

          {/* EV Panel */}
          <Card className="overflow-hidden p-0">
            <div className="px-4 py-2.5 border-b border-[color:var(--color-border)] bg-primary/50">
              <h3 className="text-sm font-bold text-text">EV 面板</h3>
            </div>
            <div className="px-4 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "莊 EV", value: t.ev_banker },
                  { label: "閒 EV", value: t.ev_player },
                  { label: "和 EV", value: t.ev_tie },
                  { label: "S6", value: t.ev_super6 },
                  { label: "閒對", value: t.ev_pair_p },
                  { label: "莊對", value: t.ev_pair_b },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div className="text-[11px] sm:text-xs text-text-muted mb-1">{label}</div>
                    <div className="text-sm font-mono text-text-muted blur-sm select-none">
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="bg-primary/80 border border-accent/20 rounded-lg p-4 text-center">
                <p className="text-sm text-text mb-2">加入 LINE 查看即時 EV</p>
                <a
                  href="https://lin.ee/PGaRsrg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 font-bold",
                    "transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)]",
                    "px-5 py-2.5 text-sm rounded-lg",
                    "bg-accent text-primary hover:bg-accent-hover shadow-[var(--shadow-1)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    "focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]",
                    "active:translate-y-px"
                  )}
                >
                  加入 LINE 查看即時 EV
                </a>
                <p className="text-text-muted text-xs mt-2">
                  推薦碼：<code className="text-accent font-bold">LUCKY777</code>
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-8 text-center">
        <p className="text-text-muted text-sm mb-3">
          即時更新 / 完整 EV 數據加入 LINE 即可查看（推薦碼：<code className="text-accent font-bold">LUCKY777</code>）
        </p>
      </div>
    </div>
  );
}
