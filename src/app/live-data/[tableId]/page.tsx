import type { Metadata } from "next";
import TableDetailClient from "./TableDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tableId: string }>;
}): Promise<Metadata> {
  const { tableId } = await params;
  return {
    robots: { index: false, follow: false },
    title: `${tableId} 牌路詳情 — 百家之眼`,
    description: `${tableId} 當前靴五路視覺化：珠盤路、大路、大眼仔路、小路、蟑螂路。`,
  };
}

export default async function TableDetailPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;

  return (
    <main className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <a
            href="/live-data"
            className="text-text-muted hover:text-accent text-sm"
          >
            ← 回即時數據
          </a>
          <h1 className="text-2xl font-bold mt-2">
            <span className="text-accent">{tableId}</span> 牌路
          </h1>
          <p className="text-text-muted text-sm mt-1">
            當前靴五路視覺化（每 30 秒更新）
          </p>
        </div>

        <TableDetailClient tableId={tableId} />
      </div>
    </main>
  );
}
