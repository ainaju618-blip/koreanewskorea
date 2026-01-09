'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BookOpen, Landmark, Star, X, Calendar, MapPin, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import type { EventData, PlaceData } from '@/types/region';

interface SidebarTabsProps {
  events: EventData[];           // 전국 축제
  regionalEvents: EventData[];   // 지역 축제 (전남+광주)
  places: PlaceData[];
  isLoading?: boolean;
}

type TabType = 'events' | 'regional' | 'heritage';

// 페이지당 아이템 수
const ITEMS_PER_PAGE = 10;

/**
 * 사이드바 탭 컴포넌트 (전국축제/지역축제/문화유적)
 * 클라이언트 컴포넌트 - 탭 전환 인터랙션 + 페이지네이션
 */
export default function SidebarTabs({ events, regionalEvents, places, isLoading }: SidebarTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  // 각 탭별 페이지 상태
  const [eventsPage, setEventsPage] = useState(1);
  const [regionalPage, setRegionalPage] = useState(1);
  const [heritagePage, setHeritagePage] = useState(1);

  const heritagePlaces = places.filter((p) => p.category === 'heritage');

  // 페이지네이션 헬퍼 함수
  const getPaginatedItems = <T,>(items: T[], page: number): T[] => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const getTotalPages = (totalItems: number): number => {
    return Math.ceil(totalItems / ITEMS_PER_PAGE);
  };

  // 탭 변경 시 페이지 리셋
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // 탭 변경 시 해당 탭의 페이지를 1로 리셋하지 않음 (사용자 편의)
  };

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Seoul',
    });
  };

  // 축제 기간 표시
  const getEventPeriod = (event: EventData) => {
    const start = event.startDate || event.eventDate;
    const end = event.endDate;
    if (!end || start === end) {
      return formatDate(start);
    }
    return `${formatDate(start)} ~ ${formatDate(end)}`;
  };

  if (isLoading) {
    return (
      <section className="px-4 mb-8 lg:bg-white lg:dark:bg-gray-800 lg:rounded-xl lg:p-4 lg:shadow-sm lg:border lg:border-gray-100 lg:dark:border-gray-700">
        <div className="flex gap-6 mb-4 border-b border-gray-200 dark:border-gray-700">
          {['🎪 전국축제', '🎉 지역축제', '🏛️ 문화유적'].map((label, i) => (
            <div key={i} className="pb-2 px-1 h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="px-4 mb-8 lg:bg-white lg:dark:bg-gray-800 lg:rounded-xl lg:p-4 lg:shadow-sm lg:border lg:border-gray-100 lg:dark:border-gray-700">
        {/* Tab Headers */}
        <div className="flex items-center gap-6 mb-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => handleTabChange('events')}
            className={`pb-2 border-b-2 font-medium text-base px-1 whitespace-nowrap transition-colors ${
              activeTab === 'events'
                ? 'border-red-500 text-red-500 font-bold'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            🎪 전국축제 {events.length > 0 && <span className="text-xs ml-1">({events.length})</span>}
          </button>
          <button
            onClick={() => handleTabChange('regional')}
            className={`pb-2 border-b-2 font-medium text-base px-1 whitespace-nowrap transition-colors ${
              activeTab === 'regional'
                ? 'border-orange-500 text-orange-500 font-bold'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            🎉 지역축제 {regionalEvents.length > 0 && <span className="text-xs ml-1">({regionalEvents.length})</span>}
          </button>
          <button
            onClick={() => handleTabChange('heritage')}
            className={`pb-2 border-b-2 font-medium text-base px-1 whitespace-nowrap transition-colors ${
              activeTab === 'heritage'
                ? 'border-cyan-500 text-cyan-500 font-bold'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            🏛️ 문화유적 {heritagePlaces.length > 0 && <span className="text-xs ml-1">({heritagePlaces.length})</span>}
          </button>
        </div>

        {/* Events Tab - 전국축제 (10개 페이지네이션) */}
        {activeTab === 'events' && (
          <div className="flex flex-col gap-3">
            {events.length > 0 ? (
              <>
                {getPaginatedItems(events, eventsPage).map((event) => (
                  <EventCardWithClick
                    key={event.id}
                    event={event}
                    onClick={() => setSelectedEvent(event)}
                  />
                ))}
                {/* 페이지네이션 UI */}
                {getTotalPages(events.length) > 1 && (
                  <PaginationControls
                    currentPage={eventsPage}
                    totalPages={getTotalPages(events.length)}
                    onPageChange={setEventsPage}
                    accentColor="red"
                  />
                )}
              </>
            ) : (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>예정된 축제가 없습니다.</p>
              </div>
            )}
          </div>
        )}

        {/* Regional Festivals Tab - 전남+광주 지역축제 (10개 페이지네이션) */}
        {activeTab === 'regional' && (
          <div className="flex flex-col gap-3">
            {regionalEvents.length > 0 ? (
              <>
                {getPaginatedItems(regionalEvents, regionalPage).map((event) => (
                  <EventCardWithClick
                    key={event.id}
                    event={event}
                    onClick={() => setSelectedEvent(event)}
                  />
                ))}
                {/* 페이지네이션 UI */}
                {getTotalPages(regionalEvents.length) > 1 && (
                  <PaginationControls
                    currentPage={regionalPage}
                    totalPages={getTotalPages(regionalEvents.length)}
                    onPageChange={setRegionalPage}
                    accentColor="orange"
                  />
                )}
              </>
            ) : (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>예정된 지역 축제가 없습니다.</p>
              </div>
            )}
          </div>
        )}

        {/* Heritage Tab - 문화유적 (10개 페이지네이션) */}
        {activeTab === 'heritage' && (
          <div className="flex flex-col gap-3">
            {heritagePlaces.length > 0 ? (
              <>
                {getPaginatedItems(heritagePlaces, heritagePage).map((place) => (
                  <div
                    key={place.id}
                    className="flex items-center bg-white dark:bg-gray-800 lg:bg-gray-50 lg:dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    {place.thumbnail ? (
                      <div className="w-14 h-14 shrink-0 mr-4 rounded-lg overflow-hidden relative">
                        <Image src={place.thumbnail} alt={place.name} fill sizes="56px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 shrink-0 mr-4 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Landmark className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="text-gray-900 dark:text-white font-bold text-sm mb-1">{place.name}</h4>
                      <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-1">{place.description}</p>
                    </div>
                    {place.rating > 0 && (
                      <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                        <Star className="w-3 h-3 fill-yellow-500" />
                        {place.rating}
                      </div>
                    )}
                  </div>
                ))}
                {/* 페이지네이션 UI */}
                {getTotalPages(heritagePlaces.length) > 1 && (
                  <PaginationControls
                    currentPage={heritagePage}
                    totalPages={getTotalPages(heritagePlaces.length)}
                    onPageChange={setHeritagePage}
                    accentColor="cyan"
                  />
                )}
              </>
            ) : (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <Landmark className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>문화유적 정보를 준비 중입니다.</p>
              </div>
            )}
          </div>
        )}

        <button className="w-full mt-4 py-3 text-gray-500 dark:text-gray-400 text-sm font-medium bg-gray-50 dark:bg-gray-700 lg:bg-gray-100 lg:dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 lg:hover:bg-gray-200 lg:dark:hover:bg-gray-600 transition-colors">
          {activeTab === 'events' ? '전국 축제 더보기' : activeTab === 'regional' ? '지역 축제 더보기' : '전체 보기'}
        </button>
      </section>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Image */}
            <div className="relative">
              {selectedEvent.imageUrl ? (
                <div className="relative h-48 w-full">
                  <Image
                    src={selectedEvent.imageUrl}
                    alt={selectedEvent.title}
                    fill
                    sizes="(max-width: 512px) 100vw, 512px"
                    className="object-cover rounded-t-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-2xl" />
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-br from-red-400 to-orange-500 rounded-t-2xl" />
              )}
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="inline-block px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full mb-2">
                  🎪 축제
                </span>
                <h2 className="text-white text-xl font-bold drop-shadow-lg">
                  {selectedEvent.title}
                </h2>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5">
              {/* Event Period */}
              <div className="flex items-start gap-3 mb-4">
                <Calendar className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">축제 기간</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{getEventPeriod(selectedEvent)}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">장소</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedEvent.location}</p>
                </div>
              </div>

              {/* Phone */}
              {selectedEvent.phone && (
                <div className="flex items-start gap-3 mb-4">
                  <Phone className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">문의전화</p>
                    <a
                      href={`tel:${selectedEvent.phone}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {selectedEvent.phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full mt-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Event Card with Click Handler
interface EventCardWithClickProps {
  event: EventData;
  onClick: () => void;
}

// Color mapping for event categories
const EVENT_COLORS: Record<string, string> = {
  festival: 'bg-red-50 text-red-500',
  culture: 'bg-purple-50 text-purple-500',
  sports: 'bg-blue-50 text-blue-500',
  education: 'bg-green-50 text-green-500',
  default: 'bg-gray-50 text-gray-500',
};

function EventCardWithClick({ event, onClick }: EventCardWithClickProps) {
  // startDate 사용 (eventDate는 deprecated)
  const dateStr = event.startDate || event.eventDate;
  const eventDate = dateStr ? new Date(dateStr) : new Date();
  const month = `${eventDate.getMonth() + 1}월`; // 한글 월 표시
  const day = eventDate.getDate();
  const color = EVENT_COLORS[event.category] || EVENT_COLORS.default;

  return (
    <div
      onClick={onClick}
      className="flex items-center bg-white dark:bg-gray-800 lg:bg-gray-50 lg:dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-red-200 dark:hover:border-red-800 transition-all cursor-pointer"
    >
      <div className={`${color} rounded-lg p-2 flex flex-col items-center justify-center w-14 shrink-0 mr-4`}>
        <span className="text-[10px] font-bold">{month}</span>
        <span className="text-xl font-black">{day}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-gray-900 dark:text-white font-bold text-sm mb-1 truncate">{event.title}</h4>
        <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{event.location}</p>
      </div>
      {event.imageUrl && (
        <div className="w-12 h-12 shrink-0 ml-2 rounded-lg overflow-hidden relative">
          <Image src={event.imageUrl} alt={event.title} fill sizes="48px" className="object-cover" />
        </div>
      )}
    </div>
  );
}

// 페이지네이션 컨트롤 컴포넌트
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  accentColor: 'red' | 'orange' | 'cyan';
}

const ACCENT_COLORS = {
  red: {
    active: 'bg-red-500 text-white',
    hover: 'hover:bg-red-100 dark:hover:bg-red-900/30',
    text: 'text-red-500',
  },
  orange: {
    active: 'bg-orange-500 text-white',
    hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
    text: 'text-orange-500',
  },
  cyan: {
    active: 'bg-cyan-500 text-white',
    hover: 'hover:bg-cyan-100 dark:hover:bg-cyan-900/30',
    text: 'text-cyan-500',
  },
};

function PaginationControls({ currentPage, totalPages, onPageChange, accentColor }: PaginationControlsProps) {
  const colors = ACCENT_COLORS[accentColor];

  return (
    <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
      {/* 이전 버튼 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-lg transition-colors ${
          currentPage === 1
            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            : `text-gray-500 dark:text-gray-400 ${colors.hover}`
        }`}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* 페이지 번호 */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              page === currentPage
                ? colors.active
                : `text-gray-500 dark:text-gray-400 ${colors.hover}`
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      {/* 다음 버튼 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-lg transition-colors ${
          currentPage === totalPages
            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            : `text-gray-500 dark:text-gray-400 ${colors.hover}`
        }`}
        aria-label="다음 페이지"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* 페이지 정보 */}
      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
        {currentPage}/{totalPages}
      </span>
    </div>
  );
}
