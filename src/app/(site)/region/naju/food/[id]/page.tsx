'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MapPin, Phone, Star, Clock, ExternalLink, UtensilsCrossed } from 'lucide-react';

interface PlaceDetail {
  id: string;
  name: string;
  description: string;
  thumbnail: string | null;
  address: string;
  category: string;
  phone: string | null;
  rating: number | null;
  kakaoMapUrl: string | null;
  naverMapUrl: string | null;
  lat: number | null;
  lng: number | null;
  tags: string[];
  specialties: string[];
}

export default function FoodDetailPage() {
  const params = useParams();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlace() {
      try {
        const res = await fetch(`/api/region/naju/places/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setPlace(data.place);
        }
      } catch (error) {
        console.error('Failed to fetch place:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlace();
  }, [params.id]);

  // 카카오맵 URL 생성
  const getKakaoMapUrl = () => {
    if (!place) return '#';
    if (place.kakaoMapUrl) return place.kakaoMapUrl;
    if (place.lat && place.lng) {
      return `https://map.kakao.com/link/map/${encodeURIComponent(place.name)},${place.lat},${place.lng}`;
    }
    return `https://map.kakao.com/link/search/${encodeURIComponent(place.name + ' ' + (place.address || '나주'))}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <UtensilsCrossed className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">맛집을 찾을 수 없습니다</h1>
          <p className="text-gray-500 mb-6">요청하신 맛집 정보가 존재하지 않습니다.</p>
          <Link
            href="/region/naju/food"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-6">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            href="/region/naju/food"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            목록으로
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20">
              {place.category === 'restaurant' ? '맛집' : place.category === 'cafe' ? '카페' : place.category}
            </span>
            {place.rating && (
              <span className="flex items-center gap-1 text-yellow-300">
                <Star className="w-4 h-4 fill-yellow-300" />
                {place.rating.toFixed(1)}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{place.name}</h1>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Image */}
        {place.thumbnail && (
          <div className="aspect-video relative rounded-xl overflow-hidden mb-6">
            <Image
              src={place.thumbnail}
              alt={place.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          {place.description && (
            <p className="text-gray-700 mb-6">{place.description}</p>
          )}

          <div className="space-y-4">
            {place.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">주소</p>
                  <p className="text-gray-900">{place.address}</p>
                </div>
              </div>
            )}

            {place.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">전화번호</p>
                  <a href={`tel:${place.phone}`} className="text-orange-600 hover:underline">
                    {place.phone}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Specialties */}
          {place.specialties && place.specialties.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-3">대표 메뉴</h3>
              <div className="flex flex-wrap gap-2">
                {place.specialties.map((item, idx) => (
                  <span key={idx} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {place.tags && place.tags.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {place.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Map Button */}
        <a
          href={getKakaoMapUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 bg-yellow-400 text-yellow-900 rounded-xl font-bold hover:bg-yellow-500 transition-colors"
        >
          <MapPin className="w-5 h-5" />
          카카오맵에서 보기
          <ExternalLink className="w-4 h-4" />
        </a>

        {/* Naver Map Button */}
        {place.naverMapUrl && (
          <a
            href={place.naverMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 mt-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors"
          >
            <MapPin className="w-5 h-5" />
            네이버지도에서 보기
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </main>
    </div>
  );
}
