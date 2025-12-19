import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '한국폴리텍대학 나주캠퍼스 하이테크 과정',
    description: '2026학년도 신입생 모집 - 전력설비학과, 신재생에너지학과, 전기소방학과 | 코리아뉴스',
    openGraph: {
        title: '한국폴리텍대학 나주캠퍼스 하이테크 과정',
        description: '2026학년도 신입생 모집 - 전력설비학과, 신재생에너지학과, 전기소방학과 | 코리아뉴스',
        url: 'https://www.koreanewsone.com/popup/polytechnic',
        siteName: '코리아NEWS',
        images: [
            {
                url: 'https://www.koreanewsone.com/images/ads/naju01.png',
                width: 1200,
                height: 630,
                alt: '2026 신입생 모집 - 한국폴리텍대학 전력기술교육원',
            },
        ],
        locale: 'ko_KR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: '한국폴리텍대학 나주캠퍼스 하이테크 과정',
        description: '2026학년도 신입생 모집 - 전력설비학과, 신재생에너지학과, 전기소방학과 | 코리아뉴스',
        images: ['https://www.koreanewsone.com/images/ads/naju01.png'],
    },
};

export default function PolytechnicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
