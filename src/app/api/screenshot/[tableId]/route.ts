const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response("Server configuration missing", { status: 500 });
  }

  const { tableId } = await params;

  // 從 Supabase Storage 私有 bucket 讀取截圖
  const url = `${SUPABASE_URL}/storage/v1/object/screenshots/live/${encodeURIComponent(tableId)}.png`;

  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return new Response("Screenshot not available", { status: 404 });
    }

    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch {
    return new Response("Failed to fetch screenshot", { status: 500 });
  }
}
