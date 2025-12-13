import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import CookieConsentBanner from "@/components/CookieConsentBanner";

// 웹폰트는 globals.css에서 @font-face로 로드
// - 본문: Pretendard (현대적 고딕, 최고 가독성)
// - 제목: 조선일보명조 (신문사 권위감)

// 사이트 기본 URL
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://koreanews.com';

export const metadata: Metadata = {
  // 기본 메타데이터
  title: {
    default: '코리아NEWS - 로컬과 세계를 잇는 AI 저널리즘',
    template: '%s | 코리아NEWS',
  },
  description: '광주, 전남, 나주 혁신도시 뉴스와 AI/교육 정보를 가장 빠르게 전달합니다.',
  keywords: ['광주뉴스', '전남뉴스', '나주뉴스', '지역뉴스', '혁신도시', 'AI뉴스', '코리아NEWS'],
  authors: [{ name: '코리아NEWS', url: siteUrl }],
  creator: '코리아NEWS',
  publisher: '코리아NEWS',

  // Open Graph (Facebook, KakaoTalk 등)
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    siteName: '코리아NEWS',
    title: '코리아NEWS - 로컬과 세계를 잇는 AI 저널리즘',
    description: '광주, 전남, 나주 혁신도시 뉴스와 AI/교육 정보를 가장 빠르게 전달합니다.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: '코리아NEWS - 광주·전남 지역 뉴스',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: '코리아NEWS - 로컬과 세계를 잇는 AI 저널리즘',
    description: '광주, 전남, 나주 혁신도시 뉴스와 AI/교육 정보를 가장 빠르게 전달합니다.',
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

  // 기타 메타
  verification: {
    // google: 'Google Search Console 인증 코드',
    // naver: '네이버 서치어드바이저 인증 코드',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans min-h-screen bg-[#f8f9fa] text-slate-800 antialiased selection:bg-[#0a192f] selection:text-white" suppressHydrationWarning>
        <Providers>
          {children}
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
