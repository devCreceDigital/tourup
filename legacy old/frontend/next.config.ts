import type { NextConfig } from "next";

const nextConfig: NextConfig & { eslint?: { ignoreDuringBuilds?: boolean } } = {
  // Configuración de Turbopack
  turbopack: { 
    root: process.cwd() 
  },
  
  // Fuerza a Next.js a ignorar los errores de TypeScript al compilar
  typescript: {
    ignoreBuildErrors: true,
  },

  // Fuerza a Next.js a ignorar los errores de ESLint al compilar
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Dominios e imágenes permitidas
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "images-ext-1.discordapp.net" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "thkyziqyimpeszgmbdga.supabase.co" },
    ],
  },
};

export default nextConfig;
