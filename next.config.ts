import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "file:/tmp/uber.db",
  },
};

export default nextConfig;
