import { NextRequest, NextResponse } from "next/server";
import type { StatsResponse, EvSignalStats, HandStats } from "@/lib/stats";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

// Cache 5 分鐘（統計數字不需要即時）
export const revalidate = 300;

async function supabaseRpc(
  fn: string,
  body: Record<string, unknown>
): Promise<unknown> {
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

/**
 * 直接查詢 positive_ev_log 並在 JS 層聚合
 * 作為 RPC 不可用時的 fallback
 */
async function queryEvSignalsDirect(since: string): Promise<EvSignalStats> {
  type EvLogRow = {
    best_bet: string;
    best_ev: number;
    platform: string;
    ev_super6?: number;
    ev_banker?: number;
    ev_player?: number;
  };

  const rows = (await supabaseGet(
    `positive_ev_log?select=best_bet,best_ev,platform,ev_super6,ev_banker,ev_player&created_at=gte.${since}&limit=50000`
  )) as EvLogRow[];

  const by_bet = { banker: 0, player: 0, tie: 0, super6: 0, pair_p: 0, pair_b: 0 };
  const by_platform = { MT: 0, DG: 0 };
  let peak_ev = 0;
  let sum_ev = 0;
  let super6_signals = 0;
  let banker_signals = 0;
  let player_signals = 0;

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
  const periodDays = searchParams.get("period") === "30d" ? 30 : 7;
  const since = new Date(
    Date.now() - periodDays * 24 * 60 * 60 * 1000
  ).toISOString();

  try {
    // 嘗試用 RPC（get_stats）一次拿到所有聚合數據
    let ev_signals: EvSignalStats;
    let hand_stats: HandStats | null = null;
    let has_hand_data = false;

    try {
      const rpcResult = (await supabaseRpc("get_stats", {
        since_ts: since,
      })) as {
        ev_signals: EvSignalStats;
        hand_stats: HandStats | null;
        has_hand_data: boolean;
      };

      ev_signals = rpcResult.ev_signals;
      hand_stats = rpcResult.hand_stats;
      has_hand_data = rpcResult.has_hand_data ?? false;
    } catch {
      // RPC 不存在（Migration 還沒跑）→ fallback 直接查 positive_ev_log
      ev_signals = await queryEvSignalsDirect(since);
      has_hand_data = false;
    }

    const response: StatsResponse = {
      period: `${periodDays}d`,
      generated_at: new Date().toISOString(),
      ev_signals,
      hand_stats,
      has_hand_data,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("[stats API]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
