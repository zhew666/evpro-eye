"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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

interface EvSnapshot {
  ev_banker: string; ev_player: string; ev_tie: string;
  ev_super6: string; ev_pair_p: string; ev_pair_b: string;
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

/* ─── Utils ────────────────────────────────────────── */

const PLATFORMS = ["MT", "DG"] as const;

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
  const colorMap: Record<string, string> = {
    "莊贏": "text-red-400",
    "閒贏": "text-blue-400",
    "和局": "text-green-400",
  };
  return <span className={`text-xs font-bold ${colorMap[result] || "text-text-muted"}`}>{result}</span>;
}

/* ─── Main Component ───────────────────────────────── */

export default function LiveDataClient() {
  const [listData, setListData] = useState<ListResponse | null>(null);
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [platform, setPlatform] = useState<string>("MT");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);
  const tabScrollRef = useRef<HTMLDivElement>(null);

  // Accumulate EV snapshots per hand (keyed by "tableId:shoe:hand_num")
  const evCacheRef = useRef<Record<string, EvSnapshot>>({});
  const lastSeenRef = useRef<{ tableId: string; shoe: number; handNum: number }>({ tableId: "", shoe: 0, handNum: 0 });

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

  // Fetch single table detail + accumulate EV
  const fetchDetail = useCallback(async (tableId: string) => {
    if (!tableId) return;
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/live-data/${encodeURIComponent(tableId)}`);
      if (!res.ok) throw new Error("Failed to fetch detail");
      const json: DetailResponse = await res.json();
      setDetail(json);

      // Accumulate EV snapshot for current hand
      const t = json.table;
      if (t && t.hand_num > 0) {
        const prev = lastSeenRef.current;
        // Reset cache on table or shoe change
        if (prev.tableId !== t.table_id || prev.shoe !== t.shoe) {
          evCacheRef.current = {};
        }
        lastSeenRef.current = { tableId: t.table_id, shoe: t.shoe, handNum: t.hand_num };

        const key = `${t.table_id}:${t.shoe}:${t.hand_num}`;
        if (!evCacheRef.current[key]) {
          evCacheRef.current[key] = {
            ev_banker: t.ev_banker,
            ev_player: t.ev_player,
            ev_tie: t.ev_tie,
            ev_super6: t.ev_super6,
            ev_pair_p: t.ev_pair_p,
            ev_pair_b: t.ev_pair_b,
          };
        }
      }
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
          await fetchDetail(platformTables[0]);
        }
      }
    })();
  }, [fetchList, fetchDetail]);

  // Auto refresh every 10s
  useEffect(() => {
    const interval = setInterval(async () => {
      await fetchList();
      if (selectedTable) {
        await fetchDetail(selectedTable);
      }
      setCountdown(10);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchList, fetchDetail, selectedTable]);

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
      await fetchDetail(firstTable);
    } else {
      setSelectedTable("");
      setDetail(null);
    }
  }, [listData, fetchDetail]);

  // Switch table
  const handleTableChange = useCallback(async (tableId: string) => {
    setSelectedTable(tableId);
    evCacheRef.current = {};
    lastSeenRef.current = { tableId: "", shoe: 0, handNum: 0 };
    await fetchDetail(tableId);
  }, [fetchDetail]);

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
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchList}
          className="px-4 py-2 bg-accent text-primary rounded font-bold hover:bg-accent-hover transition-colors"
        >
          重試
        </button>
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
      <div className="flex gap-2 mb-3">
        {PLATFORMS.map((p) => (
          <button
            key={p}
            onClick={() => handlePlatformChange(p)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
              platform === p
                ? "bg-accent text-primary"
                : "bg-white/5 text-text-muted hover:bg-white/10"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Table tabs - horizontal scroll */}
      <div
        ref={tabScrollRef}
        className="flex gap-1.5 mb-5 overflow-x-auto pb-2 scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {currentTables.map((tid) => (
          <button
            key={tid}
            onClick={() => handleTableChange(tid)}
            className={`shrink-0 px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors ${
              selectedTable === tid
                ? "bg-accent text-primary"
                : "bg-white/5 text-text-muted hover:bg-white/10"
            }`}
          >
            {tid}
          </button>
        ))}
        {currentTables.length === 0 && (
          <span className="text-text-muted text-sm py-1">此平台暫無桌局</span>
        )}
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
          {/* Screenshot placeholder */}
          <div className="relative w-full aspect-video bg-bg-card border border-white/5 rounded-xl flex items-center justify-center">
            <div className="text-center text-text-muted">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">即時畫面開發中</p>
            </div>
          </div>

          {/* Table info bar */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-sm">
            <span className="text-text-muted">
              荷官：<span className="text-text font-medium">{t.dealer || "-"}</span>
            </span>
            <span className="text-text-muted">
              靴號：<span className="text-text font-medium">{t.shoe}</span>
            </span>
            <span className="text-text-muted">
              手數：<span className="text-text font-medium">{t.hand_num}</span>
            </span>
          </div>

          {/* Hand history */}
          <div className="bg-bg-card border border-white/5 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/5 bg-primary/50">
              <h3 className="text-sm font-bold text-text">開牌記錄（當前靴）</h3>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {sortedHistory.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm">暫無記錄</div>
              ) : (
                <div className="divide-y divide-white/5">
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
                              <span className="text-red-400 mr-1">♥K</span>
                              <span className="mr-1">♣3</span>
                            </span>
                            <span className="ml-auto text-xs font-bold text-blue-400">閒贏</span>
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

                    // Look up accumulated EV for this hand
                    const evKey = `${detail.table.table_id}:${detail.table.shoe}:${hand.hand_num}`;
                    const ev = evCacheRef.current[evKey];

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
                        {ev && (
                          <div className="flex gap-2 mt-1 ml-8 text-[10px] font-mono text-text-muted">
                            <span>莊<span className={parseFloat(ev.ev_banker) > 0 ? "text-green-400" : ""}>{parseFloat(ev.ev_banker) > 0 ? "+" : ""}{(parseFloat(ev.ev_banker) * 100).toFixed(2)}%</span></span>
                            <span>閒<span className={parseFloat(ev.ev_player) > 0 ? "text-green-400" : ""}>{parseFloat(ev.ev_player) > 0 ? "+" : ""}{(parseFloat(ev.ev_player) * 100).toFixed(2)}%</span></span>
                            <span>和<span className={parseFloat(ev.ev_tie) > 0 ? "text-green-400" : ""}>{parseFloat(ev.ev_tie) > 0 ? "+" : ""}{(parseFloat(ev.ev_tie) * 100).toFixed(2)}%</span></span>
                            <span>S6<span className={parseFloat(ev.ev_super6) > 0 ? "text-green-400" : ""}>{parseFloat(ev.ev_super6) > 0 ? "+" : ""}{(parseFloat(ev.ev_super6) * 100).toFixed(2)}%</span></span>
                            <span>閒對<span className={parseFloat(ev.ev_pair_p) > 0 ? "text-green-400" : ""}>{parseFloat(ev.ev_pair_p) > 0 ? "+" : ""}{(parseFloat(ev.ev_pair_p) * 100).toFixed(2)}%</span></span>
                            <span>莊對<span className={parseFloat(ev.ev_pair_b) > 0 ? "text-green-400" : ""}>{parseFloat(ev.ev_pair_b) > 0 ? "+" : ""}{(parseFloat(ev.ev_pair_b) * 100).toFixed(2)}%</span></span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* EV Panel */}
          <div className="bg-bg-card border border-white/5 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/5 bg-primary/50">
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
                    <div className="text-xs text-text-muted mb-1">{label}</div>
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-primary font-bold text-sm rounded-lg hover:bg-accent-hover transition-colors"
                >
                  加入 LINE 查看即時 EV
                </a>
                <p className="text-text-muted text-xs mt-2">
                  推薦碼：<code className="text-accent font-bold">LUCKY777</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-8 text-center">
        <p className="text-text-muted text-sm mb-3">
          數據每 10 秒更新 / EV 數據加入 LINE 即可查看（推薦碼：<code className="text-accent font-bold">LUCKY777</code>）
        </p>
      </div>
    </div>
  );
}
