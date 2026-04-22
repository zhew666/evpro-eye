/**
 * /api/hands — 歷史牌局靴列表
 * 查詢條件：platform、table_id、date_from、date_to、limit、offset
 * 資料來源：shoe_summaries（只讀）
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

export const revalidate = 60;

interface ShoeSummaryRow {
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

async function supabaseGet<T>(path: string, rangeFrom: number, rangeTo: number): Promise<{ items: T; total: number }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "count=exact",
      Range: `${rangeFrom}-${rangeTo}`,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  const contentRange = res.headers.get("Content-Range") || "";
  const totalMatch = contentRange.match(/\/(\d+)$/);
  const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;
  return { items: await res.json(), total };
}

export async function GET(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return Response.json({ error: "Server configuration missing" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const tableId = searchParams.get("table_id");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10) || 30, 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);
    const sort = searchParams.get("sort") || "newest";

    const filters: string[] = [];
    filters.push("total_hands=gt.0");
    if (platform === "MT" || platform === "DG") filters.push(`platform=eq.${platform}`);
    if (tableId) filters.push(`table_id=ilike.*${encodeURIComponent(tableId)}*`);
    if (dateFrom) filters.push(`shoe_started_at=gte.${encodeURIComponent(dateFrom)}`);
    if (dateTo) filters.push(`shoe_started_at=lte.${encodeURIComponent(dateTo)}`);

    const select =
      "id,table_id,platform,shoe,shoe_started_at,ended_at,is_complete," +
      "total_hands,banker_wins,player_wins,tie_wins,super6_count," +
      "pair_p_count,pair_b_count,longest_banker_streak,longest_player_streak," +
      "has_long_dragon,big_eye_longest_alt";

    const sortMap: Record<string, string> = {
      newest: "shoe_started_at.desc",
      oldest: "shoe_started_at.asc",
      most_hands: "total_hands.desc,shoe_started_at.desc",
      least_hands: "total_hands.asc,shoe_started_at.desc",
      banker_streak: "longest_banker_streak.desc,shoe_started_at.desc",
      player_streak: "longest_player_streak.desc,shoe_started_at.desc",
      big_eye_alt: "big_eye_longest_alt.desc,shoe_started_at.desc",
      super6: "super6_count.desc,shoe_started_at.desc",
      long_dragon: "has_long_dragon.desc,longest_banker_streak.desc,longest_player_streak.desc,shoe_started_at.desc",
    };
    const order = sortMap[sort] || sortMap.newest;

    const query = `shoe_summaries?select=${select}&${filters.join("&")}&order=${order}`;

    const { items, total } = await supabaseGet<ShoeSummaryRow[]>(query, offset, offset + limit - 1);

    return Response.json({
      total,
      limit,
      offset,
      items,
    });
  } catch (e) {
    return Response.json({ error: "Internal server error", detail: String(e) }, { status: 500 });
  }
}
