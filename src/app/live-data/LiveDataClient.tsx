"use client";

import { useState, useEffect, useCallback } from "react";

interface MaskedHand {
  table_id: string;
  shoe: number;
  hand_num: number;
  dealer: string;
  p1: string;
  p2: string;
  p3: string;
  b1: string;
  b2: string;
  b3: string;
  ev_player: string;
  ev_banker: string;
  ev_tie: string;
  ev_pair_p: string;
  ev_pair_b: string;
  ev_super6: string;
  masked: boolean;
}

interface TableData {
  table_id: string;
  hands: MaskedHand[];
}

interface LiveResponse {
  tables: TableData[];
  updated_at: string;
  total_tables: number;
  note: string;
}

function EvBadge({ value, masked }: { value: string; masked: boolean }) {
  if (masked) {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs bg-white/5 text-text-muted blur-sm select-none">
        +0.0000
      </span>
    );
  }
  const num = parseFloat(value);
  const isPositive = num > 0;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-mono ${
        isPositive
          ? "bg-green-500/20 text-green-400"
          : "bg-white/5 text-text-muted"
      }`}
    >
      {isPositive ? "+" : ""}
      {value}
    </span>
  );
}

function CardDisplay({ cards, masked }: { cards: string[]; masked: boolean }) {
  if (masked) {
    return (
      <span className="font-mono text-sm text-text-muted blur-sm select-none">
        🂠 🂠 🂠
      </span>
    );
  }
  return (
    <span className="font-mono text-sm">
      {cards
        .filter((c) => c && c !== "-")
        .map((card, i) => (
          <span
            key={i}
            className={`mr-1 ${
              card.includes("♥") || card.includes("♦")
                ? "text-red-400"
                : "text-text"
            }`}
          >
            {card}
          </span>
        ))}
      {cards.filter((c) => c && c !== "-").length === 0 && (
        <span className="text-text-muted">-</span>
      )}
    </span>
  );
}

function TableCard({ table }: { table: TableData }) {
  const latestHand = table.hands[0];
  if (!latestHand) return null;

  return (
    <div className="bg-bg-card border border-white/5 rounded-xl overflow-hidden hover:border-accent/20 transition-colors">
      {/* Table header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-primary/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="font-bold text-accent">{table.table_id}</span>
        </div>
        <span className="text-text-muted text-xs">
          靴 {latestHand.shoe} · 第 {latestHand.hand_num} 手
        </span>
      </div>

      {/* Hands list */}
      <div className="divide-y divide-white/5">
        {table.hands.map((hand, idx) => (
          <div key={`${hand.shoe}-${hand.hand_num}`} className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-muted">
                #{hand.hand_num}
              </span>
              {hand.masked && idx === 0 && (
                <span className="text-xs text-accent flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  加入 LINE 解鎖
                </span>
              )}
            </div>

            {/* Cards */}
            <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
              <div>
                <span className="text-text-muted mr-1">閒:</span>
                <CardDisplay
                  cards={[hand.p1, hand.p2, hand.p3]}
                  masked={hand.masked}
                />
              </div>
              <div>
                <span className="text-text-muted mr-1">莊:</span>
                <CardDisplay
                  cards={[hand.b1, hand.b2, hand.b3]}
                  masked={hand.masked}
                />
              </div>
            </div>

            {/* EV values */}
            <div className="flex flex-wrap gap-1">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-text-muted">莊</span>
                <EvBadge value={hand.ev_banker} masked={hand.masked} />
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-text-muted">閒</span>
                <EvBadge value={hand.ev_player} masked={hand.masked} />
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-text-muted">和</span>
                <EvBadge value={hand.ev_tie} masked={hand.masked} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LiveDataClient() {
  const [data, setData] = useState<LiveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/live-data");
      if (!res.ok) throw new Error("Failed to fetch");
      const json: LiveResponse = await res.json();
      setData(json);
      setError(null);
      setCountdown(30);
    } catch {
      setError("數據載入失敗，稍後重試...");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-text-muted">正在載入即時數據...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-accent text-primary rounded font-bold hover:bg-accent-hover transition-colors"
        >
          重試
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Status bar */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            監控中
          </span>
          <span className="text-text-muted text-sm">
            {data?.total_tables ?? 0} 桌
          </span>
        </div>
        <span className="text-text-muted text-xs">
          {countdown}s 後更新
        </span>
      </div>

      {/* Tables grid */}
      {data && data.tables.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.tables.map((table) => (
            <TableCard key={table.table_id} table={table} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-text-muted">目前無牌局數據</p>
        </div>
      )}

      {/* Bottom note */}
      <div className="mt-8 text-center">
        <p className="text-text-muted text-sm mb-3">
          數據每 30 秒更新 · 最新 3 手已遮蔽
        </p>
        <a
          href="https://lin.ee/PGaRsrg"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-primary font-bold rounded-lg hover:bg-accent-hover transition-colors"
        >
          加入 LINE Bot 查看完整數據
        </a>
      </div>
    </div>
  );
}
