import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import { WebSiteSchema } from "@/components/seo";
// PWA 하단 배너 제거 - 햄버거 메뉴에서만 설치 가능

// 웹폰트는 globals.css에서 @font-face로 로드
// - 본문: Pretendard (현대적 고딕, 최고 가독성)
// - 제목: 조선일보명조 (신문사 권위감)

// 사이트 기본 URL
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koreanewskorea.com';

export const metadata: Metadata = {
  // 기본 메타데이터
  title: {
    default: '코리아NEWS 본사 - 대한민국 뉴스 포털',
    template: '%s | 코리아NEWS',
  },
  description: '대한민국 17개 시도 뉴스와 정책 브리핑을 가장 빠르게 전달합니다. AI 기반 뉴스 큐레이션.',
  keywords: ['대한민국뉴스', '전국뉴스', '정책브리핑', '시도뉴스', '중앙뉴스', 'AI뉴스', '코리아NEWS'],
  authors: [{ name: '코리아NEWS', url: siteUrl }],
  creator: '코리아NEWS',
  publisher: '코리아NEWS',

  // Open Graph (Facebook, KakaoTalk 등)
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    siteName: '코리아NEWS',
    title: '코리아NEWS 본사 - 대한민국 뉴스 포털',
    description: '대한민국 17개 시도 뉴스와 정책 브리핑을 가장 빠르게 전달합니다. AI 기반 뉴스 큐레이션.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: '코리아NEWS 본사 - 대한민국 뉴스 포털',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: '코리아NEWS 본사 - 대한민국 뉴스 포털',
    description: '대한민국 17개 시도 뉴스와 정책 브리핑을 가장 빠르게 전달합니다. AI 기반 뉴스 큐레이션.',
    images: [`${siteUrl}/og-image.png`],
  },

  // 검색엔진 설정
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Canonical URL
  alternates: {
    canonical: siteUrl,
  },

  // Search Engine Verification
  verification: {
    google: 'vEKVAG-M2htffG-I2SPMBIZfDYAuemCTZPseGjrUJo4',
    other: {
      'naver-site-verification': 'f865d2460b6a6defdba3bb6dbaee7c3b53442649',
    },
  },

  // PWA 관련 메타
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '코리아NEWS',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#0a192f',
  width: 'device-width',
  initialScale: 1,
  // maximumScale removed for accessibility - allows users to zoom
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains - DNS prefetch */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* Font Preload - Critical fonts for LCP */}
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/gh/fonts-archive/Pretendard/Pretendard-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/gh/fonts-archive/Pretendard/Pretendard-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Serif font - NOT preloaded (433KB is too heavy, use font-display:swap instead) */}
      </head>
      <body className="font-sans min-h-screen bg-[#f8f9fa] text-slate-800 antialiased selection:bg-[#0a192f] selection:text-white" suppressHydrationWarning>
        {/* SEO: WebSite Schema for Google Sitelinks Search Box */}
        <WebSiteSchema />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
