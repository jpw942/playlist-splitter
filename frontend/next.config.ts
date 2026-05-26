import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // allows 127.0.0.1 to connect to the Next.js dev server for hot reload
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
