'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Star, Phone, Clock, ChevronLeft, Loader2,
  Navigation, ExternalLink, UtensilsCrossed, Share2
} from 'lucide-react';
import KakaoMap from '@/components/KakaoMap';

interface PlaceDetail {
  id: string;
  name: string;
  description: string;
  thumbnail: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
  category: string;
  phone: string | null;
  rating: number | null;
  isFeatured: boolean;
}

export default function FoodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlace() {
      try {
        const res = await fetch(`/api/places/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPlace(data.place);
        } else {
          setError('맛집 정보를 찾을 수 없습니다.');
        }
      } catch (err) {
        setError('정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlace();
  }, [id]);

  const handleNavigation = () => {
    if (place?.lat && place?.lng) {
      window.open(`https://map.kakao.com/link/to/${place.name},${place.lat},${place.lng}`, '_blank');
    } else if (place?.address) {
      window.open(`https://map.kakao.com/link/search/${encodeURIComponent(place.address)}`, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: place?.name,
          text: place?.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="ml-3 text-gray-500">정보를 불러오는 중...</span>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link href="/region/naju/food" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-5 h-5" />
              <span>나주의 맛</span>
            </Link>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <UtensilsCrossed className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">{error || '맛집 정보를 찾을 수 없습니다.'}</p>
          <Link href="/region/naju/food" className="mt-4 inline-block text-orange-500 font-medium">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/region/naju/food" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-5 h-5" />
            <span>나주의 맛</span>
          </Link>
          <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-full">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Hero Image */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="relative aspect-video max-h-[400px] bg-gray-200 rounded-xl overflow-hidden">
          {place.thumbnail ? (
            <Image
              src={place.thumbnail}
              alt={place.name}
              fill
              className="object-cover object-center"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
              <UtensilsCrossed className="w-20 h-20 text-orange-300" />
            </div>
          )}
          <div className="absolute top-4 left-4 bg-orange-500 text-white text-sm px-3 py-1 rounded-full">
            {place.category === 'restaurant' ? '맛집' : place.category === 'cafe' ? '카페' : place.category}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Title Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900">{place.name}</h1>
            {place.rating && (
              <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 fill-yellow-500" />
                <span className="font-bold">{place.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {place.description && (
            <p className="text-gray-600 leading-relaxed mb-4">{place.description}</p>
          )}

          {/* Info */}
          <div className="space-y-3 text-sm">
            {place.address && (
              <div className="flex items-start gap-3 text-gray-600">
                <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <span>{place.address}</span>
              </div>
            )}
            {place.phone && (
              <a href={`tel:${place.phone}`} className="flex items-center gap-3 text-gray-600 hover:text-orange-500">
                <Phone className="w-5 h-5 text-gray-400" />
                <span>{place.phone}</span>
              </a>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={handleNavigation}
            className="flex items-center justify-center gap-2 bg-orange-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            <Navigation className="w-5 h-5" />
            길찾기
          </button>
          {place.phone && (
            <a
              href={`tel:${place.phone}`}
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              <Phone className="w-5 h-5" />
              전화하기
            </a>
          )}
        </div>

        {/* 카카오맵 */}
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
      </main>
    </div>
  );
}
