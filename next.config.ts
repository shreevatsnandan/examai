import type { NextConfig } from "next";

const nextConfig = {
  experimental: {
    serverActions: true 
  },
  eslint: {
    ignoreDuringBuilds: true, 
  },
  typescript: {
    ignoreBuildErrors: true, 
  }
};

export default nextConfig;
