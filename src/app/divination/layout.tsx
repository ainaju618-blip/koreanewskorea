import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '주역점 - 코리아NEWS',
  description: '3천년 역사의 주역으로 오늘의 운세를 알아보세요. 64괘와 384효로 하늘의 뜻을 구합니다.',
  keywords: ['주역', '점괘', '운세', '오늘의운세', '64괘', 'I Ching', '주역점'],
  openGraph: {
    title: '주역점 - 하늘의 뜻을 구하다',
    description: '3천년 역사의 주역으로 오늘의 운세를 알아보세요. 64괘와 384효로 당신의 길을 안내합니다.',
    url: 'https://www.koreanewskorea.com/divination',
    siteName: '코리아NEWS',
    images: [
      {
        url: 'https://www.koreanewskorea.com/images/divination/hexagram-mandala.png',
        width: 800,
        height: 800,
        alt: '주역 64괘 만다라',
      },
      {
        url: 'https://www.koreanewskorea.com/images/divination/sage-yinyang.png',
        width: 600,
        height: 600,
        alt: '주역 음양 현자',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '주역점 - 하늘의 뜻을 구하다',
    description: '3천년 역사의 주역으로 오늘의 운세를 알아보세요.',
    images: ['https://www.koreanewskorea.com/images/divination/hexagram-mandala.png'],
  },
};

export default function DivinationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
