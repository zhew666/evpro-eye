/**
 * /api/hands/[id] — 單靴完整資料
 * 查 shoe_summaries 拿 table_id + shoe_started_at，再撈 hand_results 完整牌面 + EV
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

export const revalidate = 60;

interface ShoeSummary {
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
  super6_natural_count: number;
  super6_draw_count: number;
  pair_p_count: number;
  pair_b_count: number;
  natural_count: number;
  winner_sequence: string;
  longest_banker_streak: number;
  longest_player_streak: number;
  banker_dragon_count: number;
  player_dragon_count: number;
  has_long_dragon: boolean;
  big_eye_longest_run: number;
  big_eye_longest_alt: number;
  small_road_longest_run: number;
  small_road_longest_alt: number;
  cockroach_longest_run: number;
  cockroach_longest_alt: number;
}

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
  { params }: { params: Promise<{ id: string }> },
) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return Response.json({ error: "Server configuration missing" }, { status: 500 });
  }

  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (!Number.isFinite(numId) || numId <= 0) {
      return Response.json({ error: "Invalid shoe id" }, { status: 400 });
    }

    const summaries = await supabaseGet<ShoeSummary[]>(
      `shoe_summaries?select=*&id=eq.${numId}&limit=1`,
    );
    if (summaries.length === 0) {
      return Response.json({ error: "Shoe not found" }, { status: 404 });
    }
    const summary = summaries[0];

    const handsPath =
      `hand_results?select=hand_num,winner,player_score,banker_score,` +
      `is_super6,is_super6_natural,is_pair_p,is_pair_b,p1,p2,p3,b1,b2,b3,` +
      `ev_banker,ev_player,ev_tie,ev_super6,ev_pair_p,ev_pair_b` +
      `&table_id=eq.${encodeURIComponent(summary.table_id)}` +
      `&shoe_started_at=eq.${encodeURIComponent(summary.shoe_started_at)}` +
      `&order=hand_num.asc`;
    const hands = await supabaseGet<HandRow[]>(handsPath);

    return Response.json({ summary, hands });
  } catch (e) {
    return Response.json(
      { error: "Internal server error", detail: String(e) },
      { status: 500 },
    );
  }
}
