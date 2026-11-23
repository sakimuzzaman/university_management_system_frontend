import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Pin the workspace root to this project (avoids picking up a parent lockfile).
  outputFileTracingRoot: path.join(__dirname),
  images: {
    // User avatars are arbitrary HTTPS URLs (Google profile pictures, etc.).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
