"use client";

import { useState, useEffect } from "react";

interface HeroStatsData {
  hands: number;
  signals: number;
}

export default function HeroStats() {
  const [data, setData] = useState<HeroStatsData | null>(null);

  useEffect(() => {
    fetch("/api/stats?period=1d")
      .then((r) => r.json())
      .then((json) => {
        setData({
          hands: json.hand_stats?.total_hands ?? 0,
          signals: json.ev_signals?.total ?? 0,
        });
      })
      .catch(() => {});
  }, []);

  if (!data || (data.hands === 0 && data.signals === 0)) return null;

  return (
    <div className="flex items-center justify-center gap-6 mt-6 text-sm text-text-muted">
      {data.hands > 0 && (
        <span>
          今日監測{" "}
          <span className="text-accent font-bold">
            {data.hands.toLocaleString("zh-TW")}
          </span>{" "}
          局
        </span>
      )}
      {data.hands > 0 && data.signals > 0 && (
        <span className="text-white/20">·</span>
      )}
      {data.signals > 0 && (
        <span>
          推播{" "}
          <span className="text-accent font-bold">
            {data.signals.toLocaleString("zh-TW")}
          </span>{" "}
          次
        </span>
      )}
    </div>
  );
}
