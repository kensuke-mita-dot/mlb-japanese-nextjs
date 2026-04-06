import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow MLB Stats API images if needed in future
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'statsapi.mlb.com' },
    ],
  },
};

export default nextConfig;
