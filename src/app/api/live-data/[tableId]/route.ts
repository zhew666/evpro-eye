const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

const MASK = "****";
const MASKED_HAND_COUNT = 3;

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

interface ShoeHistoryRow {
  hand_num: number;
  p1: string;
  p2: string;
  p3: string | null;
  b1: string;
  b2: string;
  b3: string | null;
  created_at: string;
}

async function supabaseGet(path: string) {
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
  { params }: { params: Promise<{ tableId: string }> }
) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return Response.json(
      { error: "Server configuration missing" },
      { status: 500 }
    );
  }

  try {
    const { tableId } = await params;

    // Fetch table data from live_tables
    const tableRows: LiveRow[] = await supabaseGet(
      `live_tables?select=table_id,platform,shoe,hand_num,dealer,p1,p2,p3,b1,b2,b3,ev_player,ev_banker,ev_tie,ev_pair_p,ev_pair_b,ev_super6,updated_at&table_id=eq.${encodeURIComponent(tableId)}&limit=1`
    );

    if (tableRows.length === 0) {
      return Response.json({ error: "Table not found" }, { status: 404 });
    }

    const table = tableRows[0];

    // Fetch shoe history
    const historyRows: ShoeHistoryRow[] = await supabaseGet(
      `shoe_history?select=hand_num,p1,p2,p3,b1,b2,b3,created_at&table_id=eq.${encodeURIComponent(tableId)}&shoe=eq.${table.shoe}&order=hand_num.asc`
    );

    // Determine which hands to mask (latest N hands)
    const maxHand = Math.max(table.hand_num, ...historyRows.map((h) => h.hand_num));
    const maskThreshold = maxHand - MASKED_HAND_COUNT + 1;

    const history = historyRows.map((row) => {
      const isMasked = row.hand_num >= maskThreshold;
      return {
        hand_num: row.hand_num,
        p1: isMasked ? MASK : row.p1,
        p2: isMasked ? MASK : row.p2,
        p3: isMasked ? MASK : (row.p3 || ""),
        b1: isMasked ? MASK : row.b1,
        b2: isMasked ? MASK : row.b2,
        b3: isMasked ? MASK : (row.b3 || ""),
        masked: isMasked,
        created_at: row.created_at,
      };
    });

    // Table info: return real EV values (masking handled by frontend)
    const tableData = {
      table_id: table.table_id,
      platform: table.platform,
      shoe: table.shoe,
      hand_num: table.hand_num,
      dealer: table.dealer || "",
      p1: table.p1,
      p2: table.p2,
      p3: table.p3 || "",
      b1: table.b1,
      b2: table.b2,
      b3: table.b3 || "",
      ev_banker: String(table.ev_banker ?? 0),
      ev_player: String(table.ev_player ?? 0),
      ev_tie: String(table.ev_tie ?? 0),
      ev_super6: String(table.ev_super6 ?? 0),
      ev_pair_p: String(table.ev_pair_p ?? 0),
      ev_pair_b: String(table.ev_pair_b ?? 0),
      updated_at: table.updated_at,
    };

    return Response.json({
      table: tableData,
      history,
      screenshot_url: null,
    });
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
