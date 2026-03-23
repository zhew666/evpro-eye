import type { Metadata } from "next";
import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | 百家之眼 EVpro Eye",
    default: "百家之眼 EVpro Eye — 百家樂 EV 期望值即時分析",
  },
  description:
    "以窮舉法即時計算百家樂期望值，用數學取代玄學。免費試用 LINE Bot。",
  metadataBase: new URL("https://evpro-eye.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant-TW" className={`${notoSansTC.variable} antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "百家之眼 EVpro Eye",
              url: "https://evpro-eye.com",
              description:
                "台灣首個以窮舉法即時計算百家樂期望值的工具。監控13桌即時牌局，透過LINE Bot推播+EV訊號。",
              sameAs: ["https://lin.ee/PGaRsrg"],
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
