import { ChevronRight } from 'lucide-react';
import type { EventData } from '@/types/region';

interface EventCardProps {
  event: EventData;
}

// Color mapping for event categories
const EVENT_COLORS: Record<string, string> = {
  'festival': 'bg-red-50 text-red-500',
  'culture': 'bg-purple-50 text-purple-500',
  'sports': 'bg-blue-50 text-blue-500',
  'education': 'bg-green-50 text-green-500',
  'default': 'bg-gray-50 text-gray-500',
};

/**
 * 행사 카드 컴포넌트
 * SSR 가능 - 서버 컴포넌트에서 사용 가능
 */
export default function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.eventDate);
  const month = eventDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'Asia/Seoul' }).toUpperCase();
  const day = eventDate.getDate();
  const color = EVENT_COLORS[event.category] || EVENT_COLORS.default;

  return (
    <div className="flex items-center bg-white lg:bg-gray-50 rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
      <div className={`${color} rounded-lg p-2 flex flex-col items-center justify-center w-14 shrink-0 mr-4`}>
        <span className="text-[10px] font-bold">{month}</span>
        <span className="text-xl font-black">{day}</span>
      </div>
      <div className="flex-1">
        <h4 className="text-gray-900 font-bold text-sm mb-1">{event.title}</h4>
        <p className="text-gray-500 text-xs">{event.location}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </div>
  );
}
