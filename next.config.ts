import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // ⚠️ NO security headers for now (debug mode)
  headers: async () => {
    return [];
  },

  images: {
    unoptimized: false,
  },
};

export default nextConfig;
