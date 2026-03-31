"use client";

import { useState, useEffect, useCallback } from "react";

interface DisplayHand {
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
}

interface TableEntry {
  table_id: string;
  platform: string;
  hand: DisplayHand;
}

interface LiveResponse {
  tables: TableEntry[];
  updated_at: string;
  total_tables: number;
  mt_tables: number;
  dg_tables: number;
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

function CardDisplay({ cards }: { cards: string[] }) {
  const filtered = cards.filter((c) => c && c !== "-" && c !== "" && c !== "****");
  if (filtered.length === 0) return <span className="text-text-muted text-sm">-</span>;
  return (
    <span className="font-mono text-sm">
      {filtered.map((card, i) => (
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
    </span>
  );
}

function TableCard({ entry }: { entry: TableEntry }) {
  const hand = entry.hand;
  const platformColor = entry.platform === "DG" ? "text-purple-400" : "text-accent";

  return (
    <div className="bg-bg-card border border-white/5 rounded-xl overflow-hidden hover:border-accent/20 transition-colors">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-primary/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className={`font-bold ${platformColor}`}>{entry.table_id}</span>
          <span className="text-xs text-text-muted bg-white/5 px-1.5 py-0.5 rounded">{entry.platform}</span>
        </div>
        <span className="text-text-muted text-xs">
          靴 {hand.shoe} · 第 {hand.hand_num} 手
        </span>
      </div>

      <div className="px-4 py-3">
        {/* Cards */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div>
            <span className="text-text-muted mr-1">閒:</span>
            <CardDisplay cards={[hand.p1, hand.p2, hand.p3]} />
          </div>
          <div>
            <span className="text-text-muted mr-1">莊:</span>
            <CardDisplay cards={[hand.b1, hand.b2, hand.b3]} />
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

        {hand.masked && (
          <div className="mt-2 text-center">
            <span className="text-xs text-accent flex items-center justify-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              加入 LINE 查看 EV 數據
            </span>
          </div>
        )}
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

  const mtTables = data?.tables.filter(t => t.platform === "MT") || [];
  const dgTables = data?.tables.filter(t => t.platform === "DG") || [];

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
            MT {data?.mt_tables ?? 0} 桌 · DG {data?.dg_tables ?? 0} 桌
          </span>
        </div>
        <span className="text-text-muted text-xs">
          {countdown}s 後更新
        </span>
      </div>

      {data && data.tables.length > 0 ? (
        <>
          {/* MT Section */}
          {mtTables.length > 0 && (
            <>
              <h3 className="text-lg font-bold mb-3 text-accent">MT 真人百家樂</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                {mtTables.map((entry) => (
                  <TableCard key={entry.table_id} entry={entry} />
                ))}
              </div>
            </>
          )}

          {/* DG Section */}
          {dgTables.length > 0 && (
            <>
              <h3 className="text-lg font-bold mb-3 text-purple-400">DG 真人百家樂</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {dgTables.map((entry) => (
                  <TableCard key={entry.table_id} entry={entry} />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-text-muted">目前無牌局數據</p>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-8 text-center">
        <p className="text-text-muted text-sm mb-3">
          數據每 30 秒更新 · EV 數據加入 LINE Bot 即可查看
        </p>
        <a
          href="https://lin.ee/PGaRsrg"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-primary font-bold rounded-lg hover:bg-accent-hover transition-colors"
        >
          加入 LINE Bot 查看完整數據
        </a>
        <p className="text-text-muted text-xs mt-2">
          推薦碼：<code className="text-accent font-bold">LUCKY777</code>
        </p>
      </div>
    </div>
  );
}
