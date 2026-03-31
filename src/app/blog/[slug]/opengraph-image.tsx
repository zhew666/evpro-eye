import { ImageResponse } from "next/og";
import { getArticleBySlug, getAllArticles } from "@/lib/articles";

export const alt = "百家之眼 EVpro Eye";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

async function loadFont() {
  const res = await fetch(
    "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@900&display=swap"
  );
  const css = await res.text();
  const match = css.match(/src: url\((.+?)\)/);
  if (!match) return null;
  const fontRes = await fetch(match[1]);
  return fontRes.arrayBuffer();
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  const title = article?.title ?? "百家之眼";
  const keywords = article?.keywords?.slice(0, 3) ?? [];
  const fontData = await loadFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)",
          position: "relative",
          overflow: "hidden",
          padding: "60px 80px",
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            opacity: 0.06,
            backgroundImage:
              "linear-gradient(#d4af37 1px, transparent 1px), linear-gradient(90deg, #d4af37 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%)",
            display: "flex",
          }}
        />

        {/* Glow */}
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-150px",
            width: "400px",
            height: "400px",
            borderRadius: "200px",
            background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Brand header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "24px",
              border: "2px solid #d4af37",
              fontSize: "24px",
            }}
          >
            👁
          </div>
          <div style={{ fontSize: "24px", color: "#d4af37", fontWeight: 700, display: "flex" }}>
            百家之眼
          </div>
          <div style={{ fontSize: "18px", color: "#9999b3", display: "flex", marginLeft: "4px" }}>
            EVpro Eye
          </div>
        </div>

        {/* Article title */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: title.length > 20 ? "48px" : "56px",
              fontWeight: 700,
              color: "#e8e8f0",
              lineHeight: 1.4,
              display: "flex",
              flexDirection: "column",
              maxWidth: "1000px",
            }}
          >
            {title
              .split(/(?<=[：？！，、；。])/)
              .filter(Boolean)
              .map((line, i) => (
                <div key={i} style={{ display: "flex" }}>
                  {line}
                </div>
              ))}
          </div>
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            {keywords.map((kw) => (
              <div
                key={kw}
                style={{
                  display: "flex",
                  padding: "8px 20px",
                  borderRadius: "20px",
                  border: "1px solid rgba(212,175,55,0.3)",
                  color: "#d4af37",
                  fontSize: "16px",
                }}
              >
                {kw}
              </div>
            ))}
          </div>
        )}

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%)",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "Noto Sans TC", data: fontData, weight: 900 as const }]
        : undefined,
    }
  );
}
