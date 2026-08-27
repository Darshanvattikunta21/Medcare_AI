import os from "os";
import path from "path";
import type { NextConfig } from "next";

const tempOutput = path.relative(
  __dirname,
  path.join(os.tmpdir(), "medicare-ai-web-next")
).replace(/\\/g, "/");

const nextConfig: NextConfig = {
  // distDir: tempOutput,
  reactStrictMode: true,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  redirects: async () => {
    return [];
  },
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
