'use client';

import Image from 'next/image';

// 운영서버 이미지 URL
const PRODUCTION_URL = 'https://www.koreanewskorea.com';

// 메뉴 없는 새 창으로 열기
const openPopup = (url: string, title: string) => {
  const popup = window.open(
    url,
    title,
    'width=1000,height=800,screenX=200,screenY=200,left=200,top=200,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes'
  );
  // 브라우저 호환성을 위해 moveTo도 시도
  if (popup) {
    popup.moveTo(200, 200);
  }
};

// 배너 데이터 (운영서버 참조)
const BANNERS = [
  {
    id: 1,
    title: '2026 한국폴리텍대학 전력기술교육원 신입생 모집',
    image: `${PRODUCTION_URL}/images/ads/naju01.png`,
    link: 'https://ipsi.kopo.ac.kr/poly/wonseo/wonseoSearch.do?daehag_cd=3320000&gwajeong_gb=34',
    alt: '2026 한국폴리텍대학 전력기술교육원 신입생 모집',
  },
  {
    id: 2,
    title: '오늘의 운세',
    image: `${PRODUCTION_URL}/images/divination/divination-bg.png?v=2`,
    link: 'https://www.koreanewskorea.com/divination',
    alt: '오늘의 운세',
  },
];

interface SidebarBannersProps {
  className?: string;
}

export default function SidebarBanners({ className = '' }: SidebarBannersProps) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {BANNERS.map((banner) => (
        <button
          key={banner.id}
          onClick={() => openPopup(banner.link, banner.title)}
          className="group relative flex-1 block w-full overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-500 hover:scale-[1.02] cursor-pointer"
        >
          <div className="relative w-full h-full min-h-[120px]">
            <Image
              src={banner.image}
              alt={banner.alt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 400px"
              unoptimized
            />
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10" />
          </div>
        </button>
      ))}
    </div>
  );
}
