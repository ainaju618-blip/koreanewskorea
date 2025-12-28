import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import { CURRENT_SITE } from "@/config/site-regions";

// Site URL from config
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${CURRENT_SITE.domain}`;

// Site-specific metadata
const siteName = `코리아NEWS ${CURRENT_SITE.name}`;
const siteDescription = CURRENT_SITE.subtitle;
const primaryRegions = CURRENT_SITE.regions.primary.names.join(', ');

export const metadata: Metadata = {
  title: {
    default: `${siteName} - ${siteDescription}`,
    template: `%s | ${siteName}`,
  },
  description: `${siteDescription}. ${primaryRegions} 지역 뉴스를 제공합니다.`,
  keywords: [
    ...CURRENT_SITE.regions.primary.names.map(n => `${n} 뉴스`),
    ...CURRENT_SITE.regions.adjacent1.names.map(n => `${n} 뉴스`),
    '전라남도 뉴스',
    '지역 뉴스',
    '코리아NEWS',
  ],
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: '코리아NEWS',

  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    siteName: siteName,
    title: `${siteName} - ${siteDescription}`,
    description: `${siteDescription}. ${primaryRegions} 지역 뉴스를 제공합니다.`,
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - ${siteDescription}`,
    description: `${siteDescription}. ${primaryRegions} 지역 뉴스를 제공합니다.`,
    images: [`${siteUrl}/og-image.png`],
  },

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

  alternates: {
    canonical: siteUrl,
  },

  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteName,
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
  themeColor: '#0066CC', // Primary blue
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* Pretendard Font */}
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
      </head>
      <body className="font-sans min-h-screen bg-white text-gray-800 antialiased" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
