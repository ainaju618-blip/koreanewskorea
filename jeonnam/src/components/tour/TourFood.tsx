import Image from 'next/image';
import Link from 'next/link';
import { Utensils, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';

interface TourFoodProps {
    regionKeys: string[];  // English slugs like 'mokpo', 'yeongam'
}

interface TourSpotDB {
    id: number;
    content_id: string;
    title: string;
    content_type: string;
    content_type_name: string;
    region_key: string;
    region_name: string;
    address: string;
    image_url?: string;
    thumbnail_url?: string;
}

// Fallback data
const FALLBACK_RESTAURANTS: TourSpotDB[] = [
    { id: 1, content_id: 'f1', title: '독천식당', address: '목포시 항동', content_type: '39', content_type_name: '음식점', region_key: 'mokpo', region_name: '목포시' },
    { id: 2, content_id: 'f2', title: '나주곰탕', address: '나주시 금계동', content_type: '39', content_type_name: '음식점', region_key: 'naju', region_name: '나주시' },
    { id: 3, content_id: 'f3', title: '무등산보리밥', address: '광주 동구', content_type: '39', content_type_name: '음식점', region_key: 'gwangju', region_name: '광주' },
];

export default async function TourFood({ regionKeys }: TourFoodProps) {
    let restaurants: TourSpotDB[] = [];

    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from('tour_spots')
            .select('*')
            .in('region_key', regionKeys)
            .eq('content_type', '39')  // Restaurants
            .not('image_url', 'is', null)
            .limit(6);

        if (data && data.length > 0) {
            restaurants = data as TourSpotDB[];
        }
    } catch (error) {
        console.error('Error fetching restaurants:', error);
    }

    // Use fallback data if no database results
    if (restaurants.length === 0) {
        restaurants = FALLBACK_RESTAURANTS;
    }

    return (
        <section>
            {/* Section Header */}
            <div className="kn-section-header">
                <h2 className="kn-section-title">
                    <Utensils className="w-5 h-5 inline-block mr-1 text-primary" />
                    맛집 추천
                </h2>
                <Link href="/tour/food" className="kn-section-more">
                    더보기 &gt;
                </Link>
            </div>

            {/* Restaurant Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => (
                    <div
                        key={restaurant.content_id}
                        className="group bg-white border border-gray-200 hover:shadow-md transition-shadow"
                    >
                        {/* Image */}
                        <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                            {restaurant.image_url ? (
                                <Image
                                    src={restaurant.image_url}
                                    alt={restaurant.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    unoptimized
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-yellow-50">
                                    <Utensils className="w-12 h-12 text-orange-300" />
                                </div>
                            )}

                            {/* Region Tag */}
                            <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-white text-xs">
                                {restaurant.region_name}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <h3 className="font-bold text-gray-800 group-hover:text-primary transition-colors mb-2">
                                {restaurant.title}
                            </h3>

                            {/* Address */}
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="line-clamp-1">{restaurant.address}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* No Data Message */}
            {restaurants.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <Utensils className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>맛집 정보를 불러오는 중입니다</p>
                </div>
            )}
        </section>
    );
}
