import type { Metadata } from "next";
import { Inter, Playfair_Display, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["100", "300", "400", "500", "700", "900"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});



const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "코리아NEWS - 로컬과 세계를 잇는 AI 저널리즘",
  description: "광주, 전남, 나주 혁신도시 뉴스와 AI/교육 정보를 가장 빠르게 전달합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${notoSansKr.variable} ${playfair.variable} min-h-screen bg-[#f8f9fa] text-slate-800 antialiased selection:bg-[#0a192f] selection:text-white`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
