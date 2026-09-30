import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  typedRoutes: true,
  devIndicators: false,
  agentRules: false,
  // The article route reads its editing prompt from disk.
  outputFileTracingIncludes: {
    '/api/articles/**': ['./prompts/**/*'],
  },
};

export default nextConfig;
