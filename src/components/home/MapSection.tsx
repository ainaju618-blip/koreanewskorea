'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Map, Clock, MapPin } from 'lucide-react';

interface RealtimeNews {
  id: string;
  title: string;
  region: string;
  time: string;
  isNew?: boolean;
}

interface MapSectionProps {
  realtimeNews?: RealtimeNews[];
}

// 샘플 데이터
const defaultRealtimeNews: RealtimeNews[] = [
  { id: '1', title: '부산항 신항, 자동화 부두 개장식 개최', region: '부산', time: '14:25', isNew: true },
  { id: '2', title: 'AI 창업 캠프 입주 기업 모집 시작', region: '광주', time: '14:10', isNew: true },
  { id: '3', title: '서울광장 봄맞이 행사 일정 안내', region: '서울', time: '13:58' },
  { id: '4', title: '제주 국제공항 이용객 전년 대비 15% 증가', region: '제주', time: '13:45' },
  { id: '5', title: '대전 스타트업 지원센터 개소', region: '대전', time: '13:30' },
];

// 지역 데이터 (클릭 시 해당 시/도 페이지로 이동)
const REGIONS = [
  { id: 'seoul', name: '서울', code: 'seoul' },
  { id: 'gyeonggi', name: '경기', code: 'gyeonggi' },
  { id: 'gangwon', name: '강원', code: 'gangwon' },
  { id: 'chungbuk', name: '충북', code: 'chungbuk' },
  { id: 'chungnam', name: '충남', code: 'chungnam' },
  { id: 'jeonbuk', name: '전북', code: 'jeonbuk' },
  { id: 'jeonnam', name: '전남', code: 'jeonnam' },
  { id: 'gyeongbuk', name: '경북', code: 'gyeongbuk' },
  { id: 'gyeongnam', name: '경남', code: 'gyeongnam' },
  { id: 'busan', name: '부산', code: 'busan' },
  { id: 'daegu', name: '대구', code: 'daegu' },
  { id: 'gwangju', name: '광주', code: 'gwangju' },
  { id: 'daejeon', name: '대전', code: 'daejeon' },
  { id: 'ulsan', name: '울산', code: 'ulsan' },
  { id: 'incheon', name: '인천', code: 'incheon' },
  { id: 'sejong', name: '세종', code: 'sejong' },
  { id: 'jeju', name: '제주', code: 'jeju' },
];

export default function MapSection({ realtimeNews = defaultRealtimeNews }: MapSectionProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'realtime' | 'popular'>('realtime');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const handleRegionClick = (code: string) => {
    router.push(`/region/${code}`);
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 지도 시각화 */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white font-serif flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            전국 뉴스 지도
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">지역을 클릭하여 해당 지역 뉴스로 이동합니다.</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-cyan-100 dark:border-slate-700 min-h-[320px] relative overflow-hidden">
          {/* 17개 시/도 그리드 */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {REGIONS.map((region) => (
              <button
                key={region.id}
                onClick={() => handleRegionClick(region.code)}
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                className={`
                  bg-white dark:bg-slate-800 rounded-lg px-3 py-2.5 cursor-pointer transition-all flex items-center justify-center shadow-sm
                  ${hoveredRegion === region.id
                    ? 'border-2 border-primary bg-primary text-white scale-105 shadow-md'
                    : 'border border-gray-200 dark:border-gray-600 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 text-slate-700 dark:text-slate-300'
                  }
                `}
              >
                <span className={`text-xs font-medium whitespace-nowrap ${hoveredRegion === region.id ? 'font-bold' : ''}`}>
                  {region.name}
                </span>
              </button>
            ))}
          </div>

          {/* 안내 메시지 */}
          <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            {hoveredRegion
              ? `${REGIONS.find(r => r.id === hoveredRegion)?.name} 뉴스 보기 →`
              : '17개 시/도 지역 뉴스'
            }
          </div>

          {/* 전체 지도 보기 버튼 */}
          <div className="absolute bottom-4 right-4">
            <Link
              href="/region"
              className="bg-white dark:bg-slate-700 shadow-md text-slate-900 dark:text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-primary hover:text-white transition-colors"
            >
              <Map className="w-4 h-4" /> 전체 지역 보기
            </Link>
          </div>
        </div>
      </div>

      {/* 실시간 피드 & 랭킹 */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('realtime')}
              className={`text-lg pb-2 -mb-2.5 transition-colors ${
                activeTab === 'realtime'
                  ? 'text-primary font-bold border-b-2 border-primary'
                  : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              실시간 뉴스
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`text-lg pb-2 transition-colors ${
                activeTab === 'popular'
                  ? 'text-primary font-bold border-b-2 border-primary'
                  : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              인기 지역
            </button>
          </div>

          {/* 실시간 인디케이터 */}
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
        </div>

        {/* 뉴스 피드 */}
        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {realtimeNews.map((news) => (
            <Link
              key={news.id}
              href={`/news/${news.id}`}
              className="flex gap-3 items-start p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:border-primary/30 dark:hover:border-primary/50 transition-colors cursor-pointer"
            >
              <span className={`font-bold text-xs mt-1 shrink-0 w-12 ${news.isNew ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                {news.time}
              </span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] px-1.5 py-0.5 rounded font-medium">
                    {news.region}
                  </span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
                    {news.title}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 더보기 링크 */}
        <Link
          href="/news/realtime"
          className="text-center text-sm text-slate-500 dark:text-slate-400 hover:text-primary py-2 border-t border-gray-100 dark:border-gray-700"
        >
          더 많은 뉴스 보기 →
        </Link>
      </div>
    </section>
  );
}
