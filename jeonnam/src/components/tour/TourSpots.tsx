import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';

interface TourSpotsProps {
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
    map_x?: number;
    map_y?: number;
}

// Fallback data when DB is not available
const FALLBACK_SPOTS: TourSpotDB[] = [
    { id: 1, content_id: 'f1', title: '유달산', address: '전남 목포시 유달로', content_type: '12', content_type_name: '관광지', region_key: 'mokpo', region_name: '목포시' },
    { id: 2, content_id: 'f2', title: '목포해상케이블카', address: '전남 목포시 해양대학로', content_type: '28', content_type_name: '레포츠', region_key: 'mokpo', region_name: '목포시' },
    { id: 3, content_id: 'f3', title: '월출산국립공원', address: '전남 영암군 영암읍', content_type: '12', content_type_name: '관광지', region_key: 'yeongam', region_name: '영암군' },
];

export default async function TourSpots({ regionKeys }: TourSpotsProps) {
    let spots: TourSpotDB[] = [];

    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from('tour_spots')
            .select('*')
            .in('region_key', regionKeys)
            .eq('content_type', '12')  // Only tourist attractions
            .not('image_url', 'is', null)  // Only with images
            .limit(9);

        if (data && data.length > 0) {
            spots = data as TourSpotDB[];
        }
    } catch (error) {
        console.error('Error fetching tour spots:', error);
    }

    // Use fallback data if no database results
    if (spots.length === 0) {
        spots = FALLBACK_SPOTS;
    }

    return (
        <section>
            {/* Section Header */}
            <div className="kn-section-header">
                <h2 className="kn-section-title">
                    <MapPin className="w-5 h-5 inline-block mr-1 text-primary" />
                    관광명소 BEST
                </h2>
                <Link href="/tour/spots" className="kn-section-more">
                    더보기 &gt;
                </Link>
            </div>

            {/* Spots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {spots.map((spot, idx) => (
                    <div
                        key={spot.content_id}
                        className="group border border-gray-200 hover:border-primary transition-colors"
                    >
                        {/* Image */}
                        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                            {spot.image_url ? (
                                <Image
                                    src={spot.image_url}
                                    alt={spot.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    unoptimized
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-blue-100">
                                    <MapPin className="w-12 h-12 text-primary/40" />
                                </div>
                            )}

                            {/* Ranking Badge */}
                            <div className={`absolute top-3 left-3 w-8 h-8 flex items-center justify-center text-white font-bold ${
                                idx < 3 ? 'bg-primary' : 'bg-gray-600'
                            }`}>
                                {idx + 1}
                            </div>

                            {/* Region Tag */}
                            <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 text-white text-xs">
                                {spot.region_name}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <h3 className="font-bold text-gray-800 group-hover:text-primary transition-colors mb-2">
                                {spot.title}
                            </h3>

                            <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                                {spot.address}
                            </p>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                <span className="text-xs text-primary bg-primary/10 px-2 py-1">
                                    {spot.content_type_name}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* No Data Message */}
            {spots.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>관광지 정보를 불러오는 중입니다</p>
                </div>
            )}
        </section>
    );
}
