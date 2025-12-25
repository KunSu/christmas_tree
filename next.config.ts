import type { NextConfig } from "next";

/**
 * Deployment target configuration:
 * - DEPLOY_TARGET=github → basePath: '/christmas_tree' (for GitHub Pages)
 * - DEPLOY_TARGET=s3 → basePath: '' (for S3/CloudFront/Cloudflare)
 * - Default: GitHub Pages
 */
const deployTarget = process.env.DEPLOY_TARGET || 'github';
const isGitHubPages = deployTarget === 'github';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isGitHubPages ? '/christmas_tree' : '',
  assetPrefix: isGitHubPages ? '/christmas_tree/' : '',
  images: {
    unoptimized: true,
  },
  // Make basePath available at runtime
  env: {
    NEXT_PUBLIC_BASE_PATH: isGitHubPages ? '/christmas_tree' : '',
  },
  transpilePackages: ['three'],
};

export default nextConfig;
