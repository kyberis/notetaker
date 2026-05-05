import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /** Local HTTPS hostnames (see repo root `dev/Caddyfile`) — allows dev HMR when the browser uses `*.trefolio-dev.com`. */
  allowedDevOrigins: ["will.trefolio-dev.com"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  serverExternalPackages: ["pdf-parse", "@simplewebauthn/server"],
};

export default config;
