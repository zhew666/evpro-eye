import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

interface LiveRow {
  table_id: string;
  platform: string;
  shoe: number;
  hand_num: number;
  dealer: string | null;
  p1: string;
  p2: string;
  p3: string | null;
  b1: string;
  b2: string;
  b3: string | null;
  ev_player: number;
  ev_banker: number;
  ev_tie: number;
  ev_pair_p: number;
  ev_pair_b: number;
  ev_super6: number;
  updated_at: string;
}

interface DisplayHand {
  table_id: string;
  platform: string;
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

const MASK = "****";

function maskHand(row: LiveRow): DisplayHand {
  return {
    table_id: row.table_id,
    platform: row.platform,
    shoe: row.shoe,
    hand_num: row.hand_num,
    dealer: row.dealer || "",
    p1: MASK, p2: MASK, p3: MASK,
    b1: MASK, b2: MASK, b3: MASK,
    ev_player: MASK, ev_banker: MASK, ev_tie: MASK,
    ev_pair_p: MASK, ev_pair_b: MASK, ev_super6: MASK,
    masked: true,
  };
}

function revealHand(row: LiveRow): DisplayHand {
  return {
    table_id: row.table_id,
    platform: row.platform,
    shoe: row.shoe,
    hand_num: row.hand_num,
    dealer: row.dealer || "",
    p1: row.p1, p2: row.p2, p3: row.p3 || "",
    b1: row.b1, b2: row.b2, b3: row.b3 || "",
    ev_player: row.ev_player?.toFixed(4) ?? "0",
    ev_banker: row.ev_banker?.toFixed(4) ?? "0",
    ev_tie: row.ev_tie?.toFixed(4) ?? "0",
    ev_pair_p: row.ev_pair_p?.toFixed(4) ?? "0",
    ev_pair_b: row.ev_pair_b?.toFixed(4) ?? "0",
    ev_super6: row.ev_super6?.toFixed(4) ?? "0",
    masked: false,
  };
}

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: "Server configuration missing" },
      { status: 500 }
    );
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/live_tables?select=table_id,platform,shoe,hand_num,dealer,p1,p2,p3,b1,b2,b3,ev_player,ev_banker,ev_tie,ev_pair_p,ev_pair_b,ev_super6,updated_at&order=platform.asc,table_id.asc`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 502 }
      );
    }

    const rows: LiveRow[] = await res.json();

    // Split by platform, mask EV for display (reveal cards but mask EV to drive LINE signup)
    const tables = rows.map((row) => {
      // Show cards but mask EV values to create curiosity
      const hand = maskHand(row);
      // Reveal cards only (not EV)
      hand.p1 = row.p1;
      hand.p2 = row.p2;
      hand.p3 = row.p3 || "";
      hand.b1 = row.b1;
      hand.b2 = row.b2;
      hand.b3 = row.b3 || "";
      hand.dealer = row.dealer || "";
      return {
        table_id: row.table_id,
        platform: row.platform,
        hand,
      };
    });

    const mtCount = rows.filter(r => r.platform === "MT").length;
    const dgCount = rows.filter(r => r.platform === "DG").length;

    return NextResponse.json({
      tables,
      updated_at: new Date().toISOString(),
      total_tables: tables.length,
      mt_tables: mtCount,
      dg_tables: dgCount,
      note: "EV 數據已遮蔽，加入 LINE Bot 查看完整即時資訊",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
