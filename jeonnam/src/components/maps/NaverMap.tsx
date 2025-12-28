'use client';

import { useEffect, useRef, useState } from 'react';

// 네이버 지도 타입 확장
declare global {
    interface Window {
        naver: typeof naver;
        initNaverMap?: () => void;
    }
}

interface NaverMapProps {
    /** 지도 중심 위도 (기본값: 전라남도청 위치) */
    centerLat?: number;
    /** 지도 중심 경도 */
    centerLng?: number;
    /** 줌 레벨 (기본값: 10) */
    zoom?: number;
    /** 마커 클릭 콜백 */
    onMarkerClick?: (location: LocationMarker) => void;
    /** 표시할 마커 목록 */
    markers?: LocationMarker[];
}

/** 장소 마커 인터페이스 */
export interface LocationMarker {
    id: string;
    name: string;
    lat: number;
    lng: number;
    category: 'FESTIVAL' | 'FOOD' | 'SPOT' | 'STAY' | 'OUTING';
    curation?: string;
}

// 카테고리별 마커 색상 매핑
const CATEGORY_COLORS: Record<string, string> = {
    FESTIVAL: '#FF6B6B',  // 빨강 - 축제
    FOOD: '#FFA94D',      // 주황 - 맛집
    SPOT: '#51CF66',      // 초록 - 관광지
    STAY: '#748FFC',      // 파랑 - 숙박
    OUTING: '#9775FA',    // 보라 - 나들이
};

/** 네이버 지도 컴포넌트 */
export default function NaverMap({
    centerLat = 34.8161, // 전라남도청 위치
    centerLng = 126.4629,
    zoom = 10,
    onMarkerClick,
    markers = [],
}: NaverMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mapInstance = useRef<naver.maps.Map | null>(null);
    const markerInstances = useRef<naver.maps.Marker[]>([]);

    // 네이버 지도 SDK 로드
    useEffect(() => {
        const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

        if (!clientId) {
            setError('네이버 지도 Client ID가 설정되지 않았습니다. .env.local에 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID를 추가하세요.');
            return;
        }

        // 이미 로드된 경우 스킵
        if (window.naver && window.naver.maps) {
            setIsMapReady(true);
            return;
        }

        // SDK 스크립트 동적 로드
        const script = document.createElement('script');
        script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
        script.async = true;

        script.onload = () => {
            setIsMapReady(true);
        };

        script.onerror = () => {
            setError('네이버 지도 SDK 로드에 실패했습니다. Client ID를 확인하세요.');
        };

        document.head.appendChild(script);

        return () => {
            // Cleanup: 스크립트 제거 (선택적)
        };
    }, []);

    // 지도 초기화
    useEffect(() => {
        if (!isMapReady || !mapRef.current) return;

        try {
            const mapOptions = {
                center: new naver.maps.LatLng(centerLat, centerLng),
                zoom: zoom,
                minZoom: 7,
                maxZoom: 18,
                zoomControl: true,
                zoomControlOptions: {
                    position: naver.maps.Position.TOP_RIGHT,
                },
            };

            mapInstance.current = new naver.maps.Map(mapRef.current, mapOptions);
        } catch (err) {
            console.error('지도 초기화 오류:', err);
            setError('지도 초기화에 실패했습니다.');
        }
    }, [isMapReady, centerLat, centerLng, zoom]);

    // 마커 렌더링
    useEffect(() => {
        if (!mapInstance.current || !isMapReady) return;

        // 기존 마커 제거
        markerInstances.current.forEach((marker) => marker.setMap(null));
        markerInstances.current = [];

        // 새 마커 추가
        markers.forEach((loc) => {
            const markerColor = CATEGORY_COLORS[loc.category] || '#333';

            const marker = new naver.maps.Marker({
                position: new naver.maps.LatLng(loc.lat, loc.lng),
                map: mapInstance.current!,
                title: loc.name,
                icon: {
                    content: `
            <div style="
              width: 30px;
              height: 30px;
              background: ${markerColor};
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 2px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="transform: rotate(45deg); font-size: 14px; color: white;">📍</span>
            </div>
          `,
                    anchor: new naver.maps.Point(15, 30),
                },
            });

            // 클릭 이벤트
            naver.maps.Event.addListener(marker, 'click', () => {
                onMarkerClick?.(loc);
            });

            markerInstances.current.push(marker);
        });
    }, [markers, isMapReady, onMarkerClick]);

    // 에러 표시
    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-8">
                    <div className="text-6xl mb-4">🗺️</div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">지도를 불러올 수 없습니다</h3>
                    <p className="text-sm text-gray-500 max-w-md">{error}</p>
                </div>
            </div>
        );
    }

    // 로딩 표시
    if (!isMapReady) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin text-4xl mb-4">🌀</div>
                    <p className="text-gray-600">지도 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return <div ref={mapRef} className="w-full h-full" />;
}
