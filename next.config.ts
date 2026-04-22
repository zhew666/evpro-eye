import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  // 強制 Turbopack 以此資料夾為 workspace root，避免向上追到
  // 有中文字的父資料夾名（會觸發 byte slicing panic）
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
