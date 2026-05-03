import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  serverExternalPackages: ["pdf-parse", "@simplewebauthn/server"],
};

export default config;
