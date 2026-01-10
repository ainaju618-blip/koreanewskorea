import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '나주뉴스 | 코리아NEWS',
  description: '나주시 소식, 관광명소, 맛집, 축제 정보를 한눈에. 나주곰탕, 영산강 황포돛배, 금성관 등 나주의 모든 것.',
  keywords: ['나주시', '나주뉴스', '나주곰탕', '영산강', '황포돛배', '금성관', '나주관광', '전남나주'],
  openGraph: {
    title: '나주뉴스 - 천년의 역사, 영산강의 고장 | 코리아NEWS',
    description: '나주시 소식, 관광명소, 맛집, 축제 정보를 한눈에. 나주곰탕, 영산강 황포돛배, 금성관 등 나주의 모든 것.',
    url: 'https://koreanewskorea.com/region/naju',
    siteName: '코리아NEWS',
    images: [
      {
        url: '/api/og?title=나주뉴스&type=naju',
        width: 1200,
        height: 630,
        alt: '나주 배밭과 영산강 풍경 - 코리아NEWS',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '나주뉴스 - 천년의 역사, 영산강의 고장 | 코리아NEWS',
    description: '나주시 소식, 관광명소, 맛집, 축제 정보를 한눈에.',
    images: ['/api/og?title=나주뉴스&type=naju'],
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
