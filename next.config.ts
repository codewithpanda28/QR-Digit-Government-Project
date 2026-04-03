import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Enable Next.js Image Optimization — auto WebP/AVIF conversion
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year cache
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ✅ Enable gzip/brotli compression
  compress: true,

  // ✅ Fix HMR issues with large ESM libraries (lucide-react, framer-motion)
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.cashfree.com https://www.cashfree.com;",
          },
        ],
      },
      // ✅ Aggressive caching for static assets
      {
        source: '/products/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/image(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
};

export default nextConfig;
