import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
};

export default nextConfig;

