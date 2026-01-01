import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint warnings should not block build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript errors should not block build (warnings only)
  typescript: {
    ignoreBuildErrors: false,
  },

  // PPR(Partial Prerendering)은 Next.js canary 버전에서만 지원
  // 향후 안정 버전 출시 시 활성화 가능

  // 이미지 최적화 설정 (Context7 권장사항 적용)
  images: {
    // AVIF > WebP 순서로 최적 포맷 자동 선택 (AVIF는 WebP보다 20-30% 작음)
    formats: ['image/avif', 'image/webp'],
    
    // 반응형 이미지 크기 설정 (불필요한 크기 제거로 캐시 효율화)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    
    // 이미지 캐시 TTL (1년 = 31536000초)
    minimumCacheTTL: 31536000,
    
    remotePatterns: [
      { protocol: 'https', hostname: '**.go.kr' },      // All government sites
      { protocol: 'https', hostname: '**.or.kr' },      // Organizations
      { protocol: 'http', hostname: '**.go.kr' },       // HTTP fallback
      { protocol: 'http', hostname: '**.or.kr' },
      { protocol: 'https', hostname: 'www.gwangju.go.kr' },
      { protocol: 'https', hostname: 'www.jeonnam.go.kr' },
      { protocol: 'https', hostname: 'www.naju.go.kr' },
      { protocol: 'https', hostname: 'www.mokpo.go.kr' },
      { protocol: 'https', hostname: 'www.suncheon.go.kr' },
      { protocol: 'https', hostname: 'www.yeosu.go.kr' },
      { protocol: 'https', hostname: '*.supabase.co' },   // Supabase storage
      { protocol: 'https', hostname: 'placehold.co' },    // Mock images
      { protocol: 'https', hostname: 'res.cloudinary.com' },  // Cloudinary CDN
    ],
  },
  
  // 패키지 임포트 최적화 (번들 크기 감소)
  // Note: @supabase/supabase-js removed due to Next.js 15 compatibility issues
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    // Disable worker for more stable builds
    webpackBuildWorker: false,
  },

  // Development cache settings for better hot reload stability
  onDemandEntries: {
    // Keep pages in memory for shorter time (faster garbage collection)
    maxInactiveAge: 15 * 1000, // 15 seconds
    // Fewer buffered pages
    pagesBufferLength: 2,
  },

  // Webpack configuration for cache management
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Disable filesystem cache in development for stability
      config.cache = {
        type: 'memory',
      };
      // Use deterministic module IDs for better debugging
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
        chunkIds: 'named',
      };
    }
    return config;
  },
};

export default nextConfig;

