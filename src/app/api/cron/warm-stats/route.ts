/**
 * Vercel Cron：定時打 /api/stats 的 7d 與 30d，把 CDN cache 暖起來。
 * 避免「第一個訪客等 50 秒」的窘境。
 * 設定見 vercel.json 的 crons 區塊。
 */

export const maxDuration = 60; // 給 Supabase MICRO 的慢 RPC 足夠時間

export async function GET(request: Request) {
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("host");
  if (!host) {
    return Response.json({ error: "no host" }, { status: 400 });
  }
  const base = `${proto}://${host}`;

  const results: Record<string, { ok: boolean; ms: number; ev?: number }> = {};

  for (const period of ["7d", "30d"] as const) {
    const t0 = Date.now();
    try {
      const res = await fetch(
        `${base}/api/stats?period=${period}&warm=${Date.now()}`,
        { cache: "no-store", headers: { "user-agent": "vercel-cron-warmup" } },
      );
      const j = await res.json();
      results[period] = {
        ok: res.ok && j?.has_hand_data === true,
        ms: Date.now() - t0,
        ev: j?.ev_signals?.total,
      };
    } catch (e) {
      results[period] = { ok: false, ms: Date.now() - t0 };
    }
  }

  return Response.json({ warmed_at: new Date().toISOString(), results });
}
