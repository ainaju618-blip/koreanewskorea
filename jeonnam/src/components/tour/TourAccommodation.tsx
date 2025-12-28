import Image from 'next/image';
import { Building2, MapPin, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';

interface TourAccommodationProps {
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
const FALLBACK_ACCOMMODATIONS: TourSpotDB[] = [
    { id: 1, content_id: 'a1', title: '목포신안비치호텔', address: '목포시 해안로', content_type: '32', content_type_name: '숙박', region_key: 'mokpo', region_name: '목포시' },
    { id: 2, content_id: 'a2', title: '여수베네치아호텔', address: '여수시 오동도로', content_type: '32', content_type_name: '숙박', region_key: 'yeosu', region_name: '여수시' },
    { id: 3, content_id: 'a3', title: '순천드라마호텔', address: '순천시 순천만길', content_type: '32', content_type_name: '숙박', region_key: 'suncheon', region_name: '순천시' },
];

export default async function TourAccommodation({ regionKeys }: TourAccommodationProps) {
    let accommodations: TourSpotDB[] = [];

    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from('tour_spots')
            .select('*')
            .in('region_key', regionKeys)
            .eq('content_type', '32')  // Accommodations
            .not('image_url', 'is', null)
            .limit(4);

        if (data && data.length > 0) {
            accommodations = data as TourSpotDB[];
        }
    } catch (error) {
        console.error('Error fetching accommodations:', error);
    }

    // Use fallback data if no database results
    if (accommodations.length === 0) {
        accommodations = FALLBACK_ACCOMMODATIONS;
    }

    return (
        <div className="kn-sidebar-section">
            <div className="kn-sidebar-header">
                <Building2 className="w-4 h-4 inline-block mr-1" />
                숙박 추천
            </div>
            <div className="kn-sidebar-content p-0">
                <ul className="divide-y divide-gray-100">
                    {accommodations.map((acc) => (
                        <li key={acc.content_id} className="p-3 hover:bg-gray-50 transition-colors">
                            <div className="flex gap-3">
                                {/* Thumbnail */}
                                <div className="relative w-[70px] h-[50px] flex-shrink-0 bg-gray-100 overflow-hidden">
                                    {acc.image_url ? (
                                        <Image
                                            src={acc.image_url}
                                            alt={acc.title}
                                            fill
                                            className="object-cover"
                                            sizes="70px"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                                            <Building2 className="w-5 h-5 text-blue-300" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-800 line-clamp-1">
                                        {acc.title}
                                    </h4>

                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5">
                                            {acc.region_name}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                        <MapPin className="w-3 h-3" />
                                        <span className="line-clamp-1">{acc.address}</span>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}

                    {accommodations.length === 0 && (
                        <li className="px-4 py-6 text-center text-sm text-gray-400">
                            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            숙박 정보 준비 중
                        </li>
                    )}
                </ul>

                {/* View All Link */}
                {accommodations.length > 0 && (
                    <div className="p-3 border-t border-gray-100">
                        <a
                            href="/tour/stay"
                            className="flex items-center justify-center gap-1 text-sm text-primary hover:underline"
                        >
                            숙박시설 더보기
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
