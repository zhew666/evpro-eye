import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

interface HandRow {
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
  ev_player: number;
  ev_banker: number;
  ev_tie: number;
  ev_pair_p: number;
  ev_pair_b: number;
  ev_super6: number;
}

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

const MASK = "****";
const HANDS_PER_TABLE = 6;
const MASKED_COUNT = 3; // latest 3 hands are masked

function maskHand(hand: HandRow): MaskedHand {
  return {
    table_id: hand.table_id,
    shoe: hand.shoe,
    hand_num: hand.hand_num,
    dealer: hand.dealer,
    p1: MASK,
    p2: MASK,
    p3: MASK,
    b1: MASK,
    b2: MASK,
    b3: MASK,
    ev_player: MASK,
    ev_banker: MASK,
    ev_tie: MASK,
    ev_pair_p: MASK,
    ev_pair_b: MASK,
    ev_super6: MASK,
    masked: true,
  };
}

function revealHand(hand: HandRow): MaskedHand {
  return {
    ...hand,
    ev_player: hand.ev_player?.toFixed(4) ?? "0",
    ev_banker: hand.ev_banker?.toFixed(4) ?? "0",
    ev_tie: hand.ev_tie?.toFixed(4) ?? "0",
    ev_pair_p: hand.ev_pair_p?.toFixed(4) ?? "0",
    ev_pair_b: hand.ev_pair_b?.toFixed(4) ?? "0",
    ev_super6: hand.ev_super6?.toFixed(4) ?? "0",
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
    // Fetch recent hands: last 80 rows ordered by shoe desc, hand_num desc
    const url = `${SUPABASE_URL}/rest/v1/baccarat_hands?select=table_id,shoe,hand_num,dealer,p1,p2,p3,b1,b2,b3,ev_player,ev_banker,ev_tie,ev_pair_p,ev_pair_b,ev_super6&order=shoe.desc,hand_num.desc&limit=80`;

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

    const rows: HandRow[] = await res.json();

    // Group by table_id, keep latest HANDS_PER_TABLE per table
    const tableMap = new Map<string, HandRow[]>();
    for (const row of rows) {
      const arr = tableMap.get(row.table_id) || [];
      if (arr.length < HANDS_PER_TABLE) {
        arr.push(row);
        tableMap.set(row.table_id, arr);
      }
    }

    // Build response: mask latest MASKED_COUNT, reveal the rest
    const tables: { table_id: string; hands: MaskedHand[] }[] = [];

    for (const [tableId, hands] of tableMap) {
      const processed = hands.map((hand, idx) =>
        idx < MASKED_COUNT ? maskHand(hand) : revealHand(hand)
      );
      tables.push({ table_id: tableId, hands: processed });
    }

    // Sort tables by table_id
    tables.sort((a, b) => a.table_id.localeCompare(b.table_id));

    return NextResponse.json({
      tables,
      updated_at: new Date().toISOString(),
      total_tables: tables.length,
      note: "最新 3 手數據已遮蔽，加入 LINE Bot 查看完整即時資訊",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
