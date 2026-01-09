import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '나주시 | 중앙뉴스',
  description: '나주시 소식, 관광명소, 맛집, 축제 정보를 한눈에. 나주곰탕, 영산강 황포돛배, 금성관 등 나주의 모든 것.',
  keywords: ['나주시', '나주뉴스', '나주곰탕', '영산강', '황포돛배', '금성관', '나주관광', '전남나주'],
  openGraph: {
    title: '나주시 - 천년의 역사, 영산강의 고장 | 중앙뉴스',
    description: '나주시 소식, 관광명소, 맛집, 축제 정보를 한눈에. 나주곰탕, 영산강 황포돛배, 금성관 등 나주의 모든 것.',
    url: 'https://koreanewskorea.com/region/naju',
    siteName: '중앙뉴스',
    images: [
      {
        url: '/images/hero/naju-hero.png',
        width: 1200,
        height: 630,
        alt: '나주시 전경 - 영산강과 나주평야',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '나주시 - 천년의 역사, 영산강의 고장 | 중앙뉴스',
    description: '나주시 소식, 관광명소, 맛집, 축제 정보를 한눈에.',
    images: ['/images/hero/naju-hero.png'],
  },
};

// StitchHeader가 이미 NajuHeader를 포함하므로 여기서는 children만 반환
export default function NajuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
