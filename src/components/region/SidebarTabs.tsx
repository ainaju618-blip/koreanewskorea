'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BookOpen, Landmark, Star } from 'lucide-react';
import type { EventData, PlaceData } from '@/types/region';
import EventCard from './EventCard';

interface SidebarTabsProps {
  events: EventData[];
  places: PlaceData[];
  isLoading?: boolean;
}

type TabType = 'events' | 'news' | 'heritage';

/**
 * 사이드바 탭 컴포넌트 (행사/동네소식/문화유적)
 * 클라이언트 컴포넌트 - 탭 전환 인터랙션
 */
export default function SidebarTabs({ events, places, isLoading }: SidebarTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('events');

  const heritagePlaces = places.filter((p) => p.category === 'heritage');

  if (isLoading) {
    return (
      <section className="px-4 mb-8 lg:bg-white lg:rounded-xl lg:p-4 lg:shadow-sm lg:border lg:border-gray-100">
        <div className="flex gap-6 mb-4 border-b border-gray-200">
          {['📅 행사일정', '📰 동네소식', '🏛️ 문화유적'].map((label, i) => (
            <div key={i} className="pb-2 px-1 h-6 w-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mb-8 lg:bg-white lg:rounded-xl lg:p-4 lg:shadow-sm lg:border lg:border-gray-100">
      {/* Tab Headers */}
      <div className="flex items-center gap-6 mb-4 border-b border-gray-200 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-2 border-b-2 font-medium text-base px-1 whitespace-nowrap transition-colors ${
            activeTab === 'events'
              ? 'border-cyan-500 text-cyan-500 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          📅 행사일정
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`pb-2 border-b-2 font-medium text-base px-1 whitespace-nowrap transition-colors ${
            activeTab === 'news'
              ? 'border-cyan-500 text-cyan-500 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          📰 동네소식
        </button>
        <button
          onClick={() => setActiveTab('heritage')}
          className={`pb-2 border-b-2 font-medium text-base px-1 whitespace-nowrap transition-colors ${
            activeTab === 'heritage'
              ? 'border-cyan-500 text-cyan-500 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          🏛️ 문화유적
        </button>
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="flex flex-col gap-3">
          {events.length > 0 ? (
            events.map((event) => <EventCard key={event.id} event={event} />)
          ) : (
            <div className="py-8 text-center text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>예정된 행사가 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* News Tab */}
      {activeTab === 'news' && (
        <div className="py-8 text-center text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>동네소식을 준비 중입니다.</p>
        </div>
      )}

      {/* Heritage Tab */}
      {activeTab === 'heritage' && (
        <div className="flex flex-col gap-3">
          {heritagePlaces.length > 0 ? (
            heritagePlaces.map((place) => (
              <div
                key={place.id}
                className="flex items-center bg-white lg:bg-gray-50 rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
              >
                {place.thumbnail ? (
                  <div className="w-14 h-14 shrink-0 mr-4 rounded-lg overflow-hidden relative">
                    <Image src={place.thumbnail} alt={place.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 shrink-0 mr-4 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Landmark className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-gray-900 font-bold text-sm mb-1">{place.name}</h4>
                  <p className="text-gray-500 text-xs line-clamp-1">{place.description}</p>
                </div>
                {place.rating > 0 && (
                  <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                    <Star className="w-3 h-3 fill-yellow-500" />
                    {place.rating}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-500">
              <Landmark className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>문화유적 정보를 준비 중입니다.</p>
            </div>
          )}
        </div>
      )}

      <button className="w-full mt-4 py-3 text-gray-500 text-sm font-medium bg-gray-50 lg:bg-gray-100 rounded-lg hover:bg-gray-100 lg:hover:bg-gray-200 transition-colors">
        전체 일정 보기
      </button>
    </section>
  );
}
