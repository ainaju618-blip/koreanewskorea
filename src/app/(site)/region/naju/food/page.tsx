'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, UtensilsCrossed, Loader2 } from 'lucide-react';

interface Place {
  id: string;
  name: string;
  description: string;
  thumbnail: string | null;
  address: string;
  category: string;
  phone: string | null;
  rating: number | null;
}

export default function NajuFoodPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: '전체', emoji: '🍽️' },
    { id: 'restaurant', label: '맛집', emoji: '🍜' },
    { id: 'cafe', label: '카페', emoji: '☕' },
  ];

  useEffect(() => {
    async function fetchPlaces() {
      try {
        const categoryParam = activeCategory !== 'all' ? `&category=${activeCategory}` : '';
        const res = await fetch(`/api/region/naju/places?limit=30${categoryParam}`);
        if (res.ok) {
          const data = await res.json();
          // Filter to only show restaurant and cafe categories
          const foodPlaces = data.places.filter((p: Place) =>
            p.category === 'restaurant' || p.category === 'cafe'
          );
          setPlaces(activeCategory === 'all' ? foodPlaces : data.places);
        }
      } catch (error) {
        console.error('Failed to fetch places:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlaces();
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Title */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <UtensilsCrossed className="w-7 h-7" />
            나주의 맛
          </h1>
          <p className="text-orange-100 mt-2">나주 곰탕부터 배까지, 맛있는 나주를 만나보세요</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-[92px] md:top-[103px] z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setIsLoading(true);
                  setActiveCategory(cat.id);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <span className="ml-3 text-gray-500">맛집 정보를 불러오는 중...</span>
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-20">
            <UtensilsCrossed className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">등록된 맛집이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">곧 나주의 맛집 정보가 업데이트됩니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {places.map((place) => (
              <Link
                key={place.id}
                href={`/region/naju/food/${place.id}`}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow group"
              >
                <div className="aspect-video relative overflow-hidden">
                  {place.thumbnail ? (
                    <Image
                      src={place.thumbnail}
                      alt={place.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                      <UtensilsCrossed className="w-12 h-12 text-orange-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    {place.category === 'restaurant' ? '맛집' : place.category === 'cafe' ? '카페' : place.category}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">{place.name}</h3>
                    {place.rating && (
                      <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                        <Star className="w-4 h-4 fill-yellow-500" />
                        {place.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  {place.description && (
                    <p className="text-gray-500 text-sm line-clamp-2 mb-3">{place.description}</p>
                  )}
                  {place.address && (
                    <p className="text-gray-400 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {place.address}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Fallback Sample Data */}
        {!isLoading && places.length === 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">추천 맛집 (샘플)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: '하얀집 나주곰탕', category: '곰탕/수육', rating: 4.8, address: '나주시 중앙동' },
                { name: '사랑채 숯불구이', category: '한식', rating: 4.5, address: '나주시 빛가람동' },
                { name: '나주배 직판장', category: '특산물', rating: 4.7, address: '나주시 금천면' },
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                    <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                      <Star className="w-4 h-4 fill-yellow-500" />
                      {item.rating}
                    </div>
                  </div>
                  <p className="text-orange-500 text-sm font-medium mb-2">{item.category}</p>
                  <p className="text-gray-400 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {item.address}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">* 샘플 데이터입니다</p>
          </div>
        )}
      </main>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
