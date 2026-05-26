import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Monorepo: variables en /workspace/.env (raíz del repo)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
loadEnvConfig(repoRoot);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "images-ext-1.discordapp.net" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
};

export default nextConfig;
