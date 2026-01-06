# 카카오맵 API 연동 자문요청서

## 1. 현재 상황

### 프로젝트 정보
- **프로젝트**: koreanewskorea (지역뉴스 사이트)
- **프레임워크**: Next.js 15 (App Router)
- **개발 서버**: http://localhost:3001
- **대상 페이지**: 맛집/여행 상세 페이지 (`/region/naju/food/[id]`, `/region/naju/travel/[id]`)

### 구현 목표
상세 페이지 하단에 해당 장소의 위치를 카카오맵으로 표시

### 현재 증상
- 지도가 표시되지 않음
- fallback UI 표시됨 (회색 배경 + "카카오맵에서 보기" 링크)
- 콘솔 에러 확인 필요

---

## 2. 현재 설정 상태

### 2.1 환경변수 (.env.local)
```
NEXT_PUBLIC_KAKAO_MAP_KEY=61d9083b6fb69272c0f5728677d72e0f
```

### 2.2 카카오 개발자 콘솔 설정
- **앱 이름**: 코리아뉴스 (ID: 1364267)
- **JavaScript 키**: 61d9083b6fb69272c0f5728677d72e0f (키 이름: koreanews)
- **JS SDK 도메인**: 확인 필요 (localhost:3001 등록 여부)

### 2.3 KakaoMap 컴포넌트 코드
```tsx
// src/components/KakaoMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

    if (!apiKey) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Check if script already loaded
    if (window.kakao && window.kakao.maps) {
      initMap();
      return;
    }

    // Load Kakao Maps SDK
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        initMap();
      });
    };

    script.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, [lat, lng]);

  const initMap = () => {
    if (!mapRef.current || !window.kakao) return;

    try {
      const position = new window.kakao.maps.LatLng(lat, lng);

      const options = {
        center: position,
        level: 3,
      };

      const map = new window.kakao.maps.Map(mapRef.current, options);

      // Add marker
      const marker = new window.kakao.maps.Marker({
        position: position,
        map: map,
      });

      // Add info window
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:5px;font-size:12px;white-space:nowrap;">${name}</div>`,
      });
      infowindow.open(map, marker);

      // Add zoom control
      const zoomControl = new window.kakao.maps.ZoomControl();
      map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

      setIsLoading(false);
    } catch (error) {
      console.error('Kakao Map init error:', error);
      setHasError(true);
      setIsLoading(false);
    }
  };

  // Fallback link
  const kakaoMapLink = `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`;

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
  );
}
```

### 2.4 상세 페이지에서 사용
```tsx
// 맛집 상세 페이지 예시
{place.lat && place.lng && (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
    <div className="p-4 border-b border-gray-100">
      <h2 className="font-bold text-gray-900">위치</h2>
    </div>
    <KakaoMap
      lat={place.lat}
      lng={place.lng}
      name={place.name}
      className="aspect-video"
    />
  </div>
)}
```

### 2.5 API 응답 데이터 예시
```json
{
  "place": {
    "id": 1233,
    "name": "나주곰탕하얀집",
    "lat": 34.9876,
    "lng": 126.7124,
    "address": "전남 나주시 금성관길 8"
  }
}
```

---

## 3. 확인 필요 사항

### 3.1 카카오 개발자 콘솔
1. **JS SDK 도메인 등록 확인**
   - `http://localhost:3001` 등록되어 있는지?
   - 형식이 올바른지? (http:// 포함 여부)

2. **앱 상태**
   - 앱이 활성화 상태인지?
   - JavaScript 키가 정상 발급 상태인지?

### 3.2 브라우저 개발자 도구
1. **Console 탭**에서 에러 메시지 확인
   - "domain mismatched" 에러가 있는지?
   - API 키 관련 에러가 있는지?

2. **Network 탭**에서 SDK 로딩 확인
   - `dapi.kakao.com` 요청이 성공하는지?
   - 응답 상태 코드가 200인지?

---

## 4. 의심되는 원인

1. **도메인 미등록**: JS SDK 도메인에 localhost:3001이 등록되지 않음
2. **도메인 형식 오류**: `http://localhost:3001` vs `localhost:3001` 형식 차이
3. **API 키 타입 오류**: JavaScript 키 대신 REST API 키 사용
4. **앱 비활성화**: 카카오 앱이 비활성 상태

---

## 5. 요청 사항

1. 카카오 개발자 콘솔에서 JS SDK 도메인 설정 상태 스크린샷
2. 브라우저 개발자 도구 Console 탭 에러 메시지
3. Network 탭에서 kakao 관련 요청 상태

---

## 6. 참고 문서

- [카카오맵 JavaScript API 가이드](https://apis.map.kakao.com/web/guide/)
- [카카오 개발자 앱 등록](https://developers.kakao.com/docs/latest/ko/getting-started/app)
