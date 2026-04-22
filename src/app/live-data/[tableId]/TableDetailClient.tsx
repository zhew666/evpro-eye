"use client";

import { useEffect, useState } from "react";
import { RoadsPanel, type ApiHand } from "@/components/BaccaratRoads";

interface ApiResponse {
  table_id: string;
  shoe: number | null;
  shoe_started_at: string | null;
  total_hands: number;
  hands: ApiHand[];
  error?: string;
}

export default function TableDetailClient({ tableId }: { tableId: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/live-data/${tableId}/shoe`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ApiResponse;
        if (!cancelled) {
          setData(json);
          setError(null);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
          setLoading(false);
        }
      }
    };

    fetchData();
    const id = setInterval(fetchData, 30000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [tableId]);

  if (loading) {
    return <div className="text-text-muted">載入中…</div>;
  }
  if (error) {
    return <div className="text-red-400">錯誤：{error}</div>;
  }
  if (!data || data.hands.length === 0) {
    return <div className="text-text-muted">此桌目前無當前靴資料</div>;
  }

  return (
    <div>
      {/* 靴資訊 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard label="靴號" value={String(data.shoe)} />
        <StatCard label="總手數" value={String(data.total_hands)} />
        <StatCard
          label="起始時間"
          value={
            data.shoe_started_at
              ? new Date(data.shoe_started_at).toLocaleTimeString("zh-TW", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"
          }
        />
      </div>

      {/* 五路面板 */}
      <RoadsPanel hands={data.hands} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-primary/40 border border-white/10 rounded p-3">
      <div className="text-[11px] text-text-muted">{label}</div>
      <div className="text-lg font-bold mt-1">{value}</div>
    </div>
  );
}
