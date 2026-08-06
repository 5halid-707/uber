import type { NextConfig } from "next";

// Set DATABASE_URL BEFORE anything else
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:/tmp/uber.db";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
  env: {
    DATABASE_URL: "file:/tmp/uber.db",
  },
};

export default nextConfig;
