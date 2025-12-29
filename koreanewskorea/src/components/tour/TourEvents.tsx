import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';

interface TourEventsProps {
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
const FALLBACK_EVENTS: TourSpotDB[] = [
    { id: 1, content_id: 'e1', title: '목포항구축제', address: '목포 평화광장', content_type: '15', content_type_name: '축제공연행사', region_key: 'mokpo', region_name: '목포시' },
    { id: 2, content_id: 'e2', title: '나주배꽃축제', address: '나주 배배마을', content_type: '15', content_type_name: '축제공연행사', region_key: 'naju', region_name: '나주시' },
    { id: 3, content_id: 'e3', title: '광주비엔날레', address: '광주 비엔날레전시관', content_type: '15', content_type_name: '축제공연행사', region_key: 'gwangju', region_name: '광주' },
];

export default async function TourEvents({ regionKeys }: TourEventsProps) {
    let events: TourSpotDB[] = [];

    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from('tour_spots')
            .select('*')
            .in('region_key', regionKeys)
            .eq('content_type', '15')  // Festivals and events
            .limit(6);

        if (data && data.length > 0) {
            events = data as TourSpotDB[];
        }
    } catch (error) {
        console.error('Error fetching events:', error);
    }

    // Use fallback data if no database results
    if (events.length === 0) {
        events = FALLBACK_EVENTS;
    }

    return (
        <section>
            {/* Section Header */}
            <div className="kn-section-header">
                <h2 className="kn-section-title">
                    <Calendar className="w-5 h-5 inline-block mr-1 text-primary" />
                    축제/행사
                </h2>
                <Link href="/tour/events" className="kn-section-more">
                    더보기 &gt;
                </Link>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((event) => (
                    <div
                        key={event.content_id}
                        className="group flex gap-4 p-4 border border-gray-200 hover:border-primary transition-colors"
                    >
                        {/* Image */}
                        <div className="relative w-[120px] h-[90px] flex-shrink-0 bg-gray-100 overflow-hidden">
                            {event.image_url ? (
                                <Image
                                    src={event.image_url}
                                    alt={event.title}
                                    fill
                                    className="object-cover"
                                    sizes="120px"
                                    unoptimized
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-50">
                                    <Calendar className="w-8 h-8 text-purple-300" />
                                </div>
                            )}

                            {/* Region Badge */}
                            <div className="absolute top-2 left-2 px-2 py-0.5 text-xs text-white bg-primary">
                                {event.region_name}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 group-hover:text-primary transition-colors line-clamp-1 mb-2">
                                {event.title}
                            </h3>

                            {/* Location */}
                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="line-clamp-1">{event.address}</span>
                            </div>

                            {/* Category Tag */}
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5">
                                {event.content_type_name}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* No Data Message */}
            {events.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>예정된 행사가 없습니다</p>
                </div>
            )}
        </section>
    );
}
