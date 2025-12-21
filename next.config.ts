import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/christmas_tree',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
