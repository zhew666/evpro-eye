import { NextRequest, NextResponse } from "next/server";
import type { StatsResponse, EvSignalStats } from "@/lib/stats";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

// 資料起算下限：2026-04-22 00:00 台灣時間 (= 04-21 16:00 UTC)
// 原因：之前 hand_results 的 is_super6_natural 分類有 bug（natural 佔 70% 異常，
//      理論應 17%），S6 盈虧試算因此嚴重偏低。等爬蟲修好後可移除此下限。
const DATA_FLOOR_ISO = "2026-04-21T16:00:00.000Z";

export const revalidate = 60;

async function supabaseRpc(fn: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RPC ${fn} failed: ${res.status}`);
  return res.json();
}

async function supabaseGet(path: string): Promise<unknown[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

/** Fallback：RPC 不可用時直接查 positive_ev_log */
async function queryEvSignalsDirect(since: string): Promise<EvSignalStats> {
  type Row = {
    best_bet: string;
    best_ev: number;
    platform: string;
    ev_super6?: number;
    ev_banker?: number;
    ev_player?: number;
    ev_pair_p?: number;
    ev_pair_b?: number;
  };

  const rows = (await supabaseGet(
    `positive_ev_log?select=best_bet,best_ev,platform,ev_super6,ev_banker,ev_player,ev_pair_p,ev_pair_b&created_at=gte.${since}&limit=50000`
  )) as Row[];

  const by_bet = { banker: 0, player: 0, tie: 0, super6: 0, pair_p: 0, pair_b: 0 };
  const by_platform = { MT: 0, DG: 0 };
  let peak_ev = 0, sum_ev = 0;
  let super6_signals = 0, banker_signals = 0, player_signals = 0;
  let pair_p_signals = 0, pair_b_signals = 0;

  for (const r of rows) {
    const bet = r.best_bet as keyof typeof by_bet;
    if (bet in by_bet) by_bet[bet]++;
    const plat = r.platform as keyof typeof by_platform;
    if (plat in by_platform) by_platform[plat]++;
    if (r.best_ev > peak_ev) peak_ev = r.best_ev;
    sum_ev += r.best_ev || 0;
    if ((r.ev_super6 ?? 0) > 0) super6_signals++;
    if ((r.ev_banker ?? 0) > 0) banker_signals++;
    if ((r.ev_player ?? 0) > 0) player_signals++;
    if ((r.ev_pair_p ?? 0) > 0) pair_p_signals++;
    if ((r.ev_pair_b ?? 0) > 0) pair_b_signals++;
  }

  return {
    total: rows.length,
    by_bet,
    by_platform,
    peak_ev: rows.length ? peak_ev : null,
    avg_ev: rows.length ? Math.round((sum_ev / rows.length) * 10000) / 10000 : null,
    super6_signals,
    banker_signals,
    player_signals,
    pair_p_signals,
    pair_b_signals,
  };
}

export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: "Server configuration missing" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "7d";

  let since: string;
  let periodDays: number;

  if (period === "1d") {
    // 今日：台灣時間 00:00（UTC+8 → 前一天 16:00 UTC）
    const now = new Date();
    const twMidnight = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + (now.getUTCHours() >= 16 ? 0 : -1),
        16, 0, 0, 0
      )
    );
    since = twMidnight.toISOString();
    periodDays = 1;
  } else {
    periodDays = period === "30d" ? 30 : 7;
    since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
  }

  // 套用下限：避免納入 S6 分類錯誤的舊資料
  if (since < DATA_FLOOR_ISO) {
    since = DATA_FLOOR_ISO;
    // 重算 periodDays = since 到現在的天數（用於 ROI、平均值等計算）
    const daysFromFloor = Math.max(
      1,
      Math.ceil((Date.now() - new Date(DATA_FLOOR_ISO).getTime()) / (24 * 60 * 60 * 1000)),
    );
    periodDays = Math.min(periodDays, daysFromFloor);
  }

  try {
    let response: StatsResponse;

    try {
      // RPC 一次拿所有聚合數據（需 Migration 004+005）
      const rpc = await supabaseRpc("get_stats", { since_ts: since });
      response = {
        period,
        generated_at: new Date().toISOString(),
        ev_signals: rpc.ev_signals,
        hand_stats: rpc.hand_stats ?? null,
        ev_hit_rates: rpc.ev_hit_rates ?? null,
        has_hand_data: rpc.has_hand_data ?? false,
        hand_data_start: rpc.hand_data_start ?? null,
      };
    } catch {
      // RPC 不存在 → fallback
      const ev_signals = await queryEvSignalsDirect(since);
      response = {
        period,
        generated_at: new Date().toISOString(),
        ev_signals,
        hand_stats: null,
        ev_hit_rates: null,
        has_hand_data: false,
      };
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (err) {
    console.error("[stats API]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
