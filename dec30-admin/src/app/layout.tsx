import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '12월30일버젼 - Bot Control',
  description: 'Manual Scraping & AI Processing Control Panel',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
