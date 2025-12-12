'use client';

import { useState, useCallback } from 'react';
import NaverMap, { LocationMarker } from '@/components/maps/NaverMap';
import { MapPin, Utensils, PartyPopper, TreePine, Home, Search, Filter, X } from 'lucide-react';

// 카테고리 필터 옵션
const CATEGORIES = [
    { key: 'ALL', label: '전체', icon: MapPin, color: 'bg-gray-600' },
    { key: 'FESTIVAL', label: '축제', icon: PartyPopper, color: 'bg-red-500' },
    { key: 'FOOD', label: '맛집', icon: Utensils, color: 'bg-orange-500' },
    { key: 'SPOT', label: '관광지', icon: TreePine, color: 'bg-green-500' },
    { key: 'STAY', label: '숙박', icon: Home, color: 'bg-blue-500' },
    { key: 'OUTING', label: '나들이', icon: MapPin, color: 'bg-purple-500' },
];

// 샘플 마커 데이터 (추후 API 연동)
const SAMPLE_MARKERS: LocationMarker[] = [
    {
        id: '1',
        name: '나주 배꽃 축제',
        lat: 35.0159,
        lng: 126.7109,
        category: 'FESTIVAL',
        curation: '봄철 최고의 배꽃 축제. 가족 나들이 추천!',
    },
    {
        id: '2',
        name: '나주곰탕 하얀집',
        lat: 35.0328,
        lng: 126.7206,
        category: 'FOOD',
        curation: '50년 전통의 나주곰탕 원조집',
    },
    {
        id: '3',
        name: '목포 해상케이블카',
        lat: 34.7824,
        lng: 126.3796,
        category: 'SPOT',
        curation: '목포 야경의 필수 코스',
    },
    {
        id: '4',
        name: '순천만습지',
        lat: 34.8867,
        lng: 127.5094,
        category: 'OUTING',
        curation: '갈대밭과 일몰이 아름다운 생태 관광지',
    },
];

/** /map 페이지 - 남도 다이소 메인 지도 인터페이스 */
export default function MapPage() {
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedLocation, setSelectedLocation] = useState<LocationMarker | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // 필터링된 마커
    const filteredMarkers = SAMPLE_MARKERS.filter((marker) => {
        const categoryMatch = selectedCategory === 'ALL' || marker.category === selectedCategory;
        const searchMatch = !searchQuery || marker.name.toLowerCase().includes(searchQuery.toLowerCase());
        return categoryMatch && searchMatch;
    });

    // 마커 클릭 핸들러
    const handleMarkerClick = useCallback((location: LocationMarker) => {
        setSelectedLocation(location);
        setIsSidebarOpen(true);
    }, []);

    // 사이드바 닫기
    const closeSidebar = useCallback(() => {
        setSelectedLocation(null);
    }, []);

    return (
        <div className="h-screen w-full flex flex-col md:flex-row relative">
            {/* 상단 헤더 / 검색바 */}
            <div className="absolute top-4 left-4 right-4 md:left-80 z-10 flex gap-2">
                {/* 검색창 */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="장소, 축제, 맛집 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* 필터 버튼 (모바일) */}
                <button className="md:hidden p-3 bg-white rounded-xl border border-gray-200 shadow-lg">
                    <Filter className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* 카테고리 필터 (데스크탑) */}
            <div className="hidden md:flex absolute top-20 left-80 z-10 gap-2 flex-wrap">
                {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.key;
                    return (
                        <button
                            key={cat.key}
                            onClick={() => setSelectedCategory(cat.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${isActive
                                    ? `${cat.color} text-white border-transparent shadow-lg`
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{cat.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* 사이드바 */}
            <aside
                className={`
          absolute md:relative left-0 top-0 h-full w-full md:w-80 bg-white z-20
          transform transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          border-r border-gray-200 shadow-lg overflow-hidden
        `}
            >
                {/* 사이드바 헤더 */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-800">
                            🗺️ 남도 다이소
                        </h1>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        전라남도의 모든 것이 다 있어요!
                    </p>
                </div>

                {/* 카테고리 필터 (모바일) */}
                <div className="md:hidden p-4 border-b border-gray-200 overflow-x-auto">
                    <div className="flex gap-2">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = selectedCategory === cat.key;
                            return (
                                <button
                                    key={cat.key}
                                    onClick={() => setSelectedCategory(cat.key)}
                                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl min-w-[60px] transition-all ${isActive
                                            ? `${cat.color} text-white`
                                            : 'bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-xs font-medium">{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 선택된 장소 상세보기 */}
                {selectedLocation ? (
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-2xl">
                                {selectedLocation.category === 'FESTIVAL' && '🎭'}
                                {selectedLocation.category === 'FOOD' && '🍜'}
                                {selectedLocation.category === 'SPOT' && '🏞️'}
                                {selectedLocation.category === 'STAY' && '🏠'}
                                {selectedLocation.category === 'OUTING' && '🌳'}
                            </span>
                            <button
                                onClick={closeSidebar}
                                className="p-1 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        <h2 className="text-lg font-bold text-gray-800 mb-2">
                            {selectedLocation.name}
                        </h2>

                        {selectedLocation.curation && (
                            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                                ✍️ 기자 한마디: {selectedLocation.curation}
                            </p>
                        )}

                        <div className="mt-4 space-y-2">
                            <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                관련 기사 보기
                            </button>
                            <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                길찾기
                            </button>
                        </div>
                    </div>
                ) : (
                    /* 장소 목록 */
                    <div className="p-4 overflow-y-auto h-[calc(100%-180px)]">
                        <h3 className="text-sm font-semibold text-gray-500 mb-3">
                            📍 {filteredMarkers.length}개 장소
                        </h3>
                        <div className="space-y-3">
                            {filteredMarkers.map((marker) => (
                                <button
                                    key={marker.id}
                                    onClick={() => setSelectedLocation(marker)}
                                    className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">
                                            {marker.category === 'FESTIVAL' && '🎭'}
                                            {marker.category === 'FOOD' && '🍜'}
                                            {marker.category === 'SPOT' && '🏞️'}
                                            {marker.category === 'STAY' && '🏠'}
                                            {marker.category === 'OUTING' && '🌳'}
                                        </span>
                                        <div>
                                            <h4 className="font-semibold text-gray-800">{marker.name}</h4>
                                            {marker.curation && (
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                    {marker.curation}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </aside>

            {/* 지도 영역 */}
            <main className="flex-1 relative">
                <NaverMap
                    markers={filteredMarkers}
                    onMarkerClick={handleMarkerClick}
                />

                {/* 모바일: 사이드바 열기 버튼 */}
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden absolute bottom-4 left-4 p-4 bg-white rounded-full shadow-lg z-10"
                    >
                        <MapPin className="w-6 h-6 text-blue-600" />
                    </button>
                )}
            </main>
        </div>
    );
}
