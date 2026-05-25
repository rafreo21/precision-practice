import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fixes "multiple lockfiles detected" workspace root warning
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
