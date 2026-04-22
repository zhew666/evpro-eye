"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

/* ─── 型別 ──────────────────────────────────── */

interface ShoeItem {
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
  pair_p_count: number;
  pair_b_count: number;
  longest_banker_streak: number;
  longest_player_streak: number;
  has_long_dragon: boolean;
  big_eye_longest_alt: number;
}

interface ListResponse {
  total: number;
  limit: number;
  offset: number;
  items: ShoeItem[];
}

const PAGE_SIZE = 30;

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest",        label: "最新優先" },
  { value: "oldest",        label: "最舊優先" },
  { value: "most_hands",    label: "手數最多" },
  { value: "least_hands",   label: "手數最少" },
  { value: "long_dragon",   label: "長龍優先" },
  { value: "banker_streak", label: "連莊最長" },
  { value: "player_streak", label: "連閒最長" },
  { value: "big_eye_alt",   label: "大眼仔雙跳最長" },
  { value: "super6",        label: "Super6 最多" },
];

/* ─── 工具 ──────────────────────────────────── */

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/* ─── 組件 ──────────────────────────────────── */

function PlatformBadge({ platform }: { platform: string }) {
  const color = platform === "MT" ? "bg-red-500/20 text-red-300" : "bg-blue-500/20 text-blue-300";
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color}`}>
      {platform}
    </span>
  );
}

function ShoeCard({ item }: { item: ShoeItem }) {
  const longestStreak = Math.max(item.longest_banker_streak, item.longest_player_streak);
  return (
    <Link
      href={`/hands/${item.id}`}
      className="block bg-bg-card border border-white/5 rounded-xl p-4 hover:border-accent/30 hover:bg-bg-card/80 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <PlatformBadge platform={item.platform} />
        <span className="font-mono text-sm font-bold text-text">{item.table_id}</span>
        <span className="text-xs text-text-muted ml-auto">靴 #{item.shoe}</span>
      </div>
      <div className="text-xs text-text-muted mb-3">
        {fmtDateTime(item.shoe_started_at)}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <div className="text-red-400 text-sm font-bold">{item.banker_wins}</div>
          <div className="text-[10px] text-text-muted">莊</div>
        </div>
        <div className="text-center">
          <div className="text-blue-400 text-sm font-bold">{item.player_wins}</div>
          <div className="text-[10px] text-text-muted">閒</div>
        </div>
        <div className="text-center">
          <div className="text-green-400 text-sm font-bold">{item.tie_wins}</div>
          <div className="text-[10px] text-text-muted">和</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap text-[10px]">
        <span className="text-text-muted">共 {item.total_hands} 手</span>
        {longestStreak >= 4 && (
          <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold">
            {item.longest_banker_streak >= item.longest_player_streak ? "連莊" : "連閒"} {longestStreak}
          </span>
        )}
        {item.has_long_dragon && (
          <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold">
            長龍
          </span>
        )}
        {item.super6_count > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
            S6×{item.super6_count}
          </span>
        )}
        {item.big_eye_longest_alt >= 4 && (
          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
            雙跳 {item.big_eye_longest_alt}
          </span>
        )}
        {!item.is_complete && (
          <span className="px-1.5 py-0.5 rounded bg-white/10 text-text-muted">
            進行中
          </span>
        )}
      </div>
    </Link>
  );
}

/* ─── 主 ───────────────────────────────────── */

export default function HandsClient() {
  const [platform, setPlatform] = useState<"" | "MT" | "DG">("");
  const [tableId, setTableId] = useState("");
  const [dateFrom, setDateFrom] = useState(todayISO(-30));
  const [dateTo, setDateTo] = useState(todayISO(0));
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const fetchHands = useCallback(async (nextOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(nextOffset),
        sort,
      });
      if (platform) qs.set("platform", platform);
      if (tableId.trim()) qs.set("table_id", tableId.trim());
      if (dateFrom) {
        // dateFrom + timeFrom (預設 00:00)
        const t = timeFrom || "00:00";
        qs.set("date_from", new Date(`${dateFrom}T${t}:00`).toISOString());
      }
      if (dateTo) {
        // dateTo + timeTo (預設 23:59:59.999)
        if (timeTo) {
          qs.set("date_to", new Date(`${dateTo}T${timeTo}:59.999`).toISOString());
        } else {
          // 無 timeTo → 包含當日結束
          const d = new Date(`${dateTo}T23:59:59.999`);
          qs.set("date_to", d.toISOString());
        }
      }

      const res = await fetch(`/api/hands?${qs.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [platform, tableId, dateFrom, dateTo, timeFrom, timeTo, sort]);

  useEffect(() => {
    fetchHands(0);
    setOffset(0);
  }, [fetchHands]);

  const handleApply = () => {
    setOffset(0);
    fetchHands(0);
  };

  const handlePage = (newOffset: number) => {
    setOffset(newOffset);
    fetchHands(newOffset);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  return (
    <div>
      {/* 篩選器 */}
      <div className="bg-bg-card border border-white/5 rounded-xl p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">平台</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as "" | "MT" | "DG")}
              className="w-full px-3 py-2 bg-primary/50 border border-white/10 rounded text-sm text-text focus:outline-none focus:border-accent/50"
            >
              <option value="">全部</option>
              <option value="MT">MT</option>
              <option value="DG">DG</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">桌號</label>
            <input
              type="text"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              placeholder="例：11 或 BAG11"
              className="w-full px-3 py-2 bg-primary/50 border border-white/10 rounded text-sm text-text font-mono focus:outline-none focus:border-accent/50"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">起始日期 / 時間</label>
            <div className="flex gap-1">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 min-w-0 px-2 py-2 bg-primary/50 border border-white/10 rounded text-sm text-text focus:outline-none focus:border-accent/50"
              />
              <input
                type="time"
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
                placeholder="00:00"
                className="w-[85px] shrink-0 px-2 py-2 bg-primary/50 border border-white/10 rounded text-sm text-text focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">結束日期 / 時間</label>
            <div className="flex gap-1">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 min-w-0 px-2 py-2 bg-primary/50 border border-white/10 rounded text-sm text-text focus:outline-none focus:border-accent/50"
              />
              <input
                type="time"
                value={timeTo}
                onChange={(e) => setTimeTo(e.target.value)}
                placeholder="23:59"
                className="w-[85px] shrink-0 px-2 py-2 bg-primary/50 border border-white/10 rounded text-sm text-text focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">排序</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-3 py-2 bg-primary/50 border border-white/10 rounded text-sm text-text focus:outline-none focus:border-accent/50"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleApply}
            disabled={loading}
            className="px-4 py-2 bg-accent text-primary text-sm font-bold rounded hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {loading ? "查詢中..." : "套用篩選"}
          </button>
          <span className="text-xs text-text-muted">
            {total > 0 ? `共 ${total.toLocaleString("zh-TW")} 靴` : "—"}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-bg-card border border-red-500/20 rounded-xl p-5 text-center text-text-muted mb-6">
          載入失敗：{error}
        </div>
      )}

      {/* 結果列表 */}
      {loading && !data ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-text-muted">此條件下無資料</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => <ShoeCard key={item.id} item={item} />)}
          </div>

          {/* 分頁 */}
          {(hasPrev || hasNext) && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => handlePage(Math.max(0, offset - PAGE_SIZE))}
                disabled={!hasPrev || loading}
                className="px-3 py-1.5 bg-bg-card border border-white/10 rounded text-sm text-text hover:border-accent/50 disabled:opacity-30 transition-colors"
              >
                ← 上一頁
              </button>
              <span className="text-xs text-text-muted">
                {offset + 1} – {Math.min(offset + PAGE_SIZE, total)} / {total}
              </span>
              <button
                onClick={() => handlePage(offset + PAGE_SIZE)}
                disabled={!hasNext || loading}
                className="px-3 py-1.5 bg-bg-card border border-white/10 rounded text-sm text-text hover:border-accent/50 disabled:opacity-30 transition-colors"
              >
                下一頁 →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
