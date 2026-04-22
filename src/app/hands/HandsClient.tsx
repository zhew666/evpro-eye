"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/cn";

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
  // MT → warning（黃），DG → info（紫）用以區分平台
  const tone = platform === "MT" ? "warning" : "info";
  return (
    <Badge tone={tone} size="sm">
      {platform}
    </Badge>
  );
}

function ShoeCard({ item }: { item: ShoeItem }) {
  const longestStreak = Math.max(item.longest_banker_streak, item.longest_player_streak);
  return (
    <Link
      href={`/hands/${item.id}`}
      className="block group"
    >
      <Card
        variant="compact"
        className="hover:border-accent/30 hover:bg-bg-card/80 transition-colors"
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
            <div className="text-[color:var(--color-banker)] text-sm font-bold">{item.banker_wins}</div>
            <div className="text-[10px] text-text-muted">莊</div>
          </div>
          <div className="text-center">
            <div className="text-[color:var(--color-player)] text-sm font-bold">{item.player_wins}</div>
            <div className="text-[10px] text-text-muted">閒</div>
          </div>
          <div className="text-center">
            <div className="text-[color:var(--color-tie)] text-sm font-bold">{item.tie_wins}</div>
            <div className="text-[10px] text-text-muted">和</div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-text-muted">共 {item.total_hands} 手</span>
          {longestStreak >= 4 && (
            <Badge tone="warning" size="sm">
              {item.longest_banker_streak >= item.longest_player_streak ? "連莊" : "連閒"} {longestStreak}
            </Badge>
          )}
          {item.has_long_dragon && (
            <Badge tone="warning" size="sm">
              長龍
            </Badge>
          )}
          {item.super6_count > 0 && (
            <Badge tone="game-super6" size="sm">
              S6×{item.super6_count}
            </Badge>
          )}
          {item.big_eye_longest_alt >= 4 && (
            <Badge tone="info" size="sm">
              雙跳 {item.big_eye_longest_alt}
            </Badge>
          )}
          {!item.is_complete && (
            <Badge tone="neutral" size="sm">
              進行中
            </Badge>
          )}
        </div>
      </Card>
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

  const inputClass = cn(
    "w-full px-3 py-2 bg-primary/50 rounded-md text-sm text-text",
    "border border-[color:var(--color-border-strong)]",
    "focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30",
    "transition-colors duration-[var(--duration-fast)]"
  );
  const compactInputClass = cn(
    "px-2 py-2 bg-primary/50 rounded-md text-sm text-text",
    "border border-[color:var(--color-border-strong)]",
    "focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30",
    "transition-colors duration-[var(--duration-fast)]"
  );

  return (
    <div>
      {/* 篩選器 */}
      <Card className="mb-6 p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">平台</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as "" | "MT" | "DG")}
              className={inputClass}
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
              className={cn(inputClass, "font-mono")}
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">起始日期 / 時間</label>
            <div className="flex flex-col sm:flex-row gap-1">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={cn(compactInputClass, "flex-1 min-w-0")}
              />
              <input
                type="time"
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
                placeholder="00:00"
                className={cn(compactInputClass, "w-full sm:w-[85px] sm:shrink-0")}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">結束日期 / 時間</label>
            <div className="flex flex-col sm:flex-row gap-1">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={cn(compactInputClass, "flex-1 min-w-0")}
              />
              <input
                type="time"
                value={timeTo}
                onChange={(e) => setTimeTo(e.target.value)}
                placeholder="23:59"
                className={cn(compactInputClass, "w-full sm:w-[85px] sm:shrink-0")}
              />
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs text-text-muted mb-1">排序</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className={inputClass}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleApply}
            disabled={loading}
          >
            {loading ? "查詢中..." : "套用篩選"}
          </Button>
          <span className="text-xs text-text-muted">
            {total > 0 ? `共 ${total.toLocaleString("zh-TW")} 靴` : "—"}
          </span>
        </div>
      </Card>

      {error && (
        <Card className="mb-6 text-center text-text-muted border-[color:var(--color-error)]/20">
          載入失敗：{error}
        </Card>
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
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePage(Math.max(0, offset - PAGE_SIZE))}
                disabled={!hasPrev || loading}
              >
                ← 上一頁
              </Button>
              <span className="text-xs text-text-muted">
                {offset + 1} – {Math.min(offset + PAGE_SIZE, total)} / {total}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePage(offset + PAGE_SIZE)}
                disabled={!hasNext || loading}
              >
                下一頁 →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
