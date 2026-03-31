import { ImageResponse } from "next/og";

export const alt = "百家之眼 EVpro Eye — 百家樂 EV 期望值即時分析";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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

export default async function OGImage() {
  const fontData = await loadFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)",
          position: "relative",
          overflow: "hidden",
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
            opacity: 0.08,
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

        {/* Glow circle */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "200px",
            background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Brand icon - eye symbol */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            borderRadius: "40px",
            border: "2px solid #d4af37",
            marginBottom: "24px",
            fontSize: "40px",
          }}
        >
          👁
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 700,
            color: "#d4af37",
            letterSpacing: "8px",
            display: "flex",
            marginBottom: "8px",
          }}
        >
          百家之眼
        </div>

        {/* English name */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: 400,
            color: "#9999b3",
            letterSpacing: "12px",
            display: "flex",
            marginBottom: "32px",
            textTransform: "uppercase" as const,
          }}
        >
          EVpro Eye
        </div>

        {/* Divider */}
        <div
          style={{
            width: "120px",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #d4af37, transparent)",
            display: "flex",
            marginBottom: "32px",
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: "26px",
            color: "#e8e8f0",
            display: "flex",
            letterSpacing: "4px",
          }}
        >
          百家樂 EV 期望值即時分析
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "48px",
            marginTop: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "32px", fontWeight: 700, color: "#d4af37", display: "flex" }}>
              27
            </div>
            <div style={{ fontSize: "14px", color: "#9999b3", display: "flex", marginTop: "4px" }}>
              桌即時監控
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "32px", fontWeight: 700, color: "#d4af37", display: "flex" }}>
              窮舉法
            </div>
            <div style={{ fontSize: "14px", color: "#9999b3", display: "flex", marginTop: "4px" }}>
              精確計算
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "32px", fontWeight: 700, color: "#d4af37", display: "flex" }}>
              LINE
            </div>
            <div style={{ fontSize: "14px", color: "#9999b3", display: "flex", marginTop: "4px" }}>
              即時推播
            </div>
          </div>
        </div>

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
