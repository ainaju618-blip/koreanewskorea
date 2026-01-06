'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import { MapPin, ExternalLink, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    kakao: any;
  }
}

interface KakaoMapProps {
  lat: number;
  lng: number;
  name: string;
  className?: string;
}

export default function KakaoMap({ lat, lng, name, className = '' }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  // initMap을 useCallback으로 메모이제이션
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.kakao?.maps) {
      console.log('[KakaoMap] initMap: mapRef or kakao.maps not ready');
      return;
    }

    try {
      console.log('[KakaoMap] Initializing map with:', { lat, lng, name });
      const position = new window.kakao.maps.LatLng(lat, lng);
      const options = { center: position, level: 3 };
      const map = new window.kakao.maps.Map(mapRef.current, options);

      const marker = new window.kakao.maps.Marker({ position, map });
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:5px;font-size:12px;white-space:nowrap;">${name}</div>`,
      });
      infowindow.open(map, marker);

      const zoomControl = new window.kakao.maps.ZoomControl();
      map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

      setIsLoading(false);
      setHasError(false);
      console.log('[KakaoMap] Map initialized successfully!');
    } catch (error) {
      console.error('[KakaoMap] Map init error:', error);
      setHasError(true);
      setIsLoading(false);
    }
  }, [lat, lng, name]);

  // 스크립트 로드 완료 후 초기화
  const handleScriptLoad = useCallback(() => {
    console.log('[KakaoMap] Script loaded! window.kakao:', window.kakao);
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => {
        console.log('[KakaoMap] kakao.maps.load callback fired');
        setScriptLoaded(true);
        initMap();
      });
    }
  }, [initMap]);

  // 스크립트 에러 핸들러
  const handleScriptError = useCallback((e: any) => {
    console.error('[KakaoMap] Script load error:', e);
    setHasError(true);
    setIsLoading(false);
  }, []);

  // 이미 로드된 경우 처리
  useEffect(() => {
    if (window.kakao?.maps) {
      console.log('[KakaoMap] Kakao SDK already loaded');
      setScriptLoaded(true);
      initMap();
    }
  }, [initMap]);

  // 좌표 변경 시 지도만 재초기화
  useEffect(() => {
    if (scriptLoaded && window.kakao?.maps && mapRef.current) {
      initMap();
    }
  }, [initMap, scriptLoaded]);

  // Fallback link to Kakao Map
  const kakaoMapLink = `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`;

  // API 키가 없으면 fallback 표시
  if (!apiKey) {
    console.error('[KakaoMap] API key is missing');
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <a
          href={kakaoMapLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-blue-500 flex flex-col items-center gap-2 p-4"
        >
          <MapPin className="w-8 h-8" />
          <span className="text-sm">카카오맵에서 보기</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <a
          href={kakaoMapLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-blue-500 flex flex-col items-center gap-2 p-4"
        >
          <MapPin className="w-8 h-8" />
          <span className="text-sm">카카오맵에서 보기</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <>
      {/* Next.js Script 컴포넌트 사용 */}
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`}
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
      />
      <div className={`relative ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
        <a
          href={kakaoMapLink}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-gray-700 text-xs px-2 py-1 rounded shadow flex items-center gap-1"
        >
          <span>크게 보기</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </>
  );
}
