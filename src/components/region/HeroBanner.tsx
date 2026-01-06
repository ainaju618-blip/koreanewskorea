import Image from 'next/image';
import { MapPin, Quote } from 'lucide-react';
import type { RegionInfo } from '@/types/region';

interface HeroBannerProps {
  region: RegionInfo;
}

/**
 * 지역 페이지 히어로 배너
 * SSR 가능 - 서버 컴포넌트에서 사용 가능
 */
export default function HeroBanner({ region }: HeroBannerProps) {
  // Theme color mapping
  const themeColors: Record<string, { gradient: string; badge: string; accent: string }> = {
    emerald: {
      gradient: 'from-emerald-600/85 to-teal-500/70',
      badge: 'bg-emerald-500/30',
      accent: 'text-emerald-100',
    },
    cyan: {
      gradient: 'from-cyan-600/85 to-blue-500/70',
      badge: 'bg-cyan-500/30',
      accent: 'text-cyan-100',
    },
    purple: {
      gradient: 'from-purple-600/85 to-indigo-500/70',
      badge: 'bg-purple-500/30',
      accent: 'text-purple-100',
    },
    blue: {
      gradient: 'from-blue-600/85 to-indigo-500/70',
      badge: 'bg-blue-500/30',
      accent: 'text-blue-100',
    },
    orange: {
      gradient: 'from-orange-600/85 to-red-500/70',
      badge: 'bg-orange-500/30',
      accent: 'text-orange-100',
    },
  };

  const theme = themeColors[region.themeColor] || themeColors.cyan;

  return (
    <section className="relative text-white py-16 overflow-hidden">
      {/* Background Image */}
      <Image
        src={region.heroImage}
        alt={`${region.name} 대표 풍경`}
        fill
        className="object-cover"
        priority
      />
      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient}`} />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-6 h-6" />
          <span className={`${theme.accent} text-sm font-medium`}>{region.nameEn.toUpperCase()}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{region.name}</h1>
        <p className={`${theme.accent} max-w-2xl mb-4`}>
          {region.description}
        </p>
        {/* 슬로건 배지 */}
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
            <Quote className="w-3.5 h-3.5" />
            <span className="font-medium">{region.slogan}</span>
          </div>
          <div className={`inline-flex items-center gap-1.5 ${theme.badge} backdrop-blur-sm px-3 py-1.5 rounded-full text-xs ${theme.accent}`}>
            <span>{region.sido} | {region.sidoSlogan}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
