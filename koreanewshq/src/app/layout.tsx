import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "KOREANEWS - All of Korea, All the News",
  description: "KOREANEWS HQ: Government press releases, KTV broadcasts, policy briefings, and nationwide tourism information",
  keywords: ["Korea NEWS", "Government News", "KTV", "Policy Briefing", "Korea Tourism", "Korea.kr"],
  openGraph: {
    title: "KOREANEWS - All of Korea, All the News",
    description: "Government press releases, KTV broadcasts, policy briefings, and nationwide tourism information",
    type: "website",
    locale: "ko_KR",
    siteName: "KOREANEWS",
    url: "https://koreanewskorea.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "KOREANEWS - All of Korea, All the News",
    description: "Government press releases, KTV broadcasts, and policy briefings",
  },
  alternates: {
    canonical: "https://koreanewskorea.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
