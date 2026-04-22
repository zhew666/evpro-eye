import type { Metadata } from "next";
import ShoeDetailClient from "./ShoeDetailClient";

export const metadata: Metadata = {
  title: "歷史牌局詳情 — 每靴完整牌面與五路",
  description: "百家之眼歷史牌局單靴完整資料，含牌面、點數、勝負、EV 訊號、五路圖（大路、珠盤、大眼仔、小路、蟑螂）。",
  alternates: { canonical: "https://evpro-eye.com/hands" },
  robots: { index: false, follow: true },
};

export default async function ShoeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <section className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <ShoeDetailClient id={id} />
      </div>
    </section>
  );
}
