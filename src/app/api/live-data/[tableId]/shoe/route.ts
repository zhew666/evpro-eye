/**
 * 取指定桌的「當前靴」完整資料（從 hand_results 永久表查）
 * 用於 /live-data/[tableId] 詳情頁的五路渲染
 *
 * 與既有 /api/live-data/[tableId] 的差異：
 *   既有：讀 live_tables 即時狀態 + shoe_history（會被清）
 *   本 API：讀 hand_results 永久表，含牌面+winner+flags 完整資料
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

export const revalidate = 30;

interface HandRow {
  hand_num: number;
  winner: "banker" | "player" | "tie";
  player_score: number;
  banker_score: number;
  is_super6: boolean;
  is_super6_natural: boolean | null;
  is_pair_p: boolean;
  is_pair_b: boolean;
  p1: string | null;
  p2: string | null;
  p3: string | null;
  b1: string | null;
  b2: string | null;
  b3: string | null;
  ev_banker: number | null;
  ev_player: number | null;
  ev_tie: number | null;
  ev_super6: number | null;
  ev_pair_p: number | null;
  ev_pair_b: number | null;
  shoe: number;
  shoe_started_at: string;
  created_at: string;
}

async function supabaseGet<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tableId: string }> },
) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return Response.json(
      { error: "Server configuration missing" },
      { status: 500 },
    );
  }

  try {
    const { tableId } = await params;
    const encoded = encodeURIComponent(tableId);

    // 1. 找出該桌當前靴（shoe_started_at 最新的那個）
    const latest: Array<{ shoe_started_at: string; shoe: number }> =
      await supabaseGet(
        `hand_results?select=shoe_started_at,shoe&table_id=eq.${encoded}&order=shoe_started_at.desc&limit=1`,
      );

    if (latest.length === 0) {
      return Response.json({
        table_id: tableId,
        shoe: null,
        shoe_started_at: null,
        hands: [],
      });
    }

    const { shoe_started_at, shoe } = latest[0];

    // 2. 抓該靴所有手牌（含 EV 欄位）
    const hands: HandRow[] = await supabaseGet(
      `hand_results?select=hand_num,winner,player_score,banker_score,is_super6,is_super6_natural,is_pair_p,is_pair_b,p1,p2,p3,b1,b2,b3,ev_banker,ev_player,ev_tie,ev_super6,ev_pair_p,ev_pair_b,shoe,shoe_started_at,created_at&table_id=eq.${encoded}&shoe_started_at=eq.${encodeURIComponent(shoe_started_at)}&order=hand_num.asc`,
    );

    return Response.json({
      table_id: tableId,
      shoe,
      shoe_started_at,
      total_hands: hands.length,
      hands: hands.map((h) => ({
        hand_num: h.hand_num,
        winner: h.winner,
        player_score: h.player_score,
        banker_score: h.banker_score,
        is_super6: h.is_super6,
        is_super6_natural: h.is_super6_natural,
        is_pair_p: h.is_pair_p,
        is_pair_b: h.is_pair_b,
        p1: h.p1,
        p2: h.p2,
        p3: h.p3,
        b1: h.b1,
        b2: h.b2,
        b3: h.b3,
        ev_banker: h.ev_banker,
        ev_player: h.ev_player,
        ev_tie: h.ev_tie,
        ev_super6: h.ev_super6,
        ev_pair_p: h.ev_pair_p,
        ev_pair_b: h.ev_pair_b,
      })),
    });
  } catch (e) {
    return Response.json(
      { error: "Internal server error", detail: String(e) },
      { status: 500 },
    );
  }
}
