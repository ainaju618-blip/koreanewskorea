'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface TravelSpot {
  id: string;
  title: string;
  region: string;
  thumbnail: string;
}

interface TravelSectionProps {
  spots?: TravelSpot[];
}

// 샘플 데이터
const defaultSpots: TravelSpot[] = [
  {
    id: '1',
    title: '대관령 양떼목장의 봄',
    region: '강원',
    thumbnail: '/images/travel/gangwon.jpg',
  },
  {
    id: '2',
    title: '불국사의 고즈넉한 아침',
    region: '경주',
    thumbnail: '/images/travel/gyeongju.jpg',
  },
  {
    id: '3',
    title: '해운대 야경 명소 BEST 5',
    region: '부산',
    thumbnail: '/images/travel/busan.jpg',
  },
  {
    id: '4',
    title: '협재 해수욕장 숨은 스팟',
    region: '제주',
    thumbnail: '/images/travel/jeju.jpg',
  },
];

export default function TravelSection({ spots = defaultSpots }: TravelSectionProps) {
  return (
    <section className="mt-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
          <span>🗺️</span> 추천 여행지
        </h3>
        <Link
          href="/category/travel"
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary flex items-center gap-1"
        >
          전체보기 <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 여행지 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {spots.map((spot) => (
          <Link
            key={spot.id}
            href={`/travel/${spot.id}`}
            className="group relative rounded-xl overflow-hidden aspect-square shadow-sm"
          >
            {/* 배경 이미지 */}
            {spot.thumbnail ? (
              <Image
                src={spot.thumbnail}
                alt={spot.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400" />
            )}

            {/* 그라디언트 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* 텍스트 */}
            <div className="absolute bottom-0 left-0 p-3 w-full">
              <span className="text-[10px] font-bold text-primary bg-white/90 backdrop-blur px-1.5 py-0.5 rounded mb-1 inline-block">
                {spot.region}
              </span>
              <p className="text-white font-bold text-sm leading-tight">
                {spot.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
