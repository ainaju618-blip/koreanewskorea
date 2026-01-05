/**
 * KoreaMap Organism Component
 * Interactive SVG map of South Korea with 17 provinces/cities
 */

'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { getAllRegions, buildRegionPath, Region } from '@/lib/national-regions';

export interface KoreaMapProps {
  onRegionClick?: (region: Region) => void;
  onRegionHover?: (region: Region | null) => void;
  selectedRegion?: string;
  activeRegions?: string[];
  disabledRegions?: string[];
  showLabels?: boolean;
  showTooltip?: boolean;
  colorScheme?: 'default' | 'blue' | 'green' | 'warm';
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

// SVG path data for each region (simplified polygons)
const REGION_PATHS: Record<string, { path: string; labelX: number; labelY: number }> = {
  seoul: {
    path: 'M165,95 L175,90 L185,95 L185,105 L175,110 L165,105 Z',
    labelX: 175,
    labelY: 102,
  },
  incheon: {
    path: 'M145,95 L155,85 L165,90 L165,105 L155,115 L145,110 Z',
    labelX: 155,
    labelY: 100,
  },
  gyeonggi: {
    path: 'M135,70 L190,60 L210,85 L205,130 L175,145 L140,135 L125,110 Z',
    labelX: 165,
    labelY: 115,
  },
  gangwon: {
    path: 'M190,40 L260,35 L280,80 L265,130 L220,145 L195,125 L200,85 Z',
    labelX: 235,
    labelY: 90,
  },
  sejong: {
    path: 'M150,165 L165,160 L175,170 L170,180 L155,180 Z',
    labelX: 162,
    labelY: 172,
  },
  chungnam: {
    path: 'M100,145 L155,140 L175,165 L170,200 L130,215 L95,190 Z',
    labelX: 135,
    labelY: 175,
  },
  daejeon: {
    path: 'M155,180 L175,175 L185,190 L175,200 L155,195 Z',
    labelX: 168,
    labelY: 188,
  },
  chungbuk: {
    path: 'M175,130 L215,125 L230,155 L210,190 L175,195 L160,165 Z',
    labelX: 195,
    labelY: 160,
  },
  jeonbuk: {
    path: 'M95,200 L155,195 L175,230 L155,270 L100,260 L85,230 Z',
    labelX: 130,
    labelY: 235,
  },
  daegu: {
    path: 'M230,205 L250,200 L260,215 L250,230 L230,225 Z',
    labelX: 245,
    labelY: 215,
  },
  gyeongbuk: {
    path: 'M220,140 L280,130 L305,180 L290,240 L250,255 L215,230 L205,190 Z',
    labelX: 255,
    labelY: 185,
  },
  ulsan: {
    path: 'M285,245 L305,240 L315,260 L300,275 L280,265 Z',
    labelX: 295,
    labelY: 258,
  },
  busan: {
    path: 'M265,280 L290,275 L300,295 L280,310 L260,300 Z',
    labelX: 278,
    labelY: 292,
  },
  gyeongnam: {
    path: 'M175,255 L250,245 L280,280 L260,320 L200,330 L160,300 Z',
    labelX: 215,
    labelY: 285,
  },
  gwangju: {
    path: 'M105,285 L130,280 L140,300 L125,315 L100,305 Z',
    labelX: 120,
    labelY: 298,
  },
  jeonnam: {
    path: 'M70,270 L130,260 L160,295 L150,350 L85,370 L50,330 Z',
    labelX: 105,
    labelY: 315,
  },
  jeju: {
    path: 'M70,400 L130,395 L140,420 L120,440 L80,435 L60,415 Z',
    labelX: 100,
    labelY: 418,
  },
};

// Color schemes
const COLOR_SCHEMES = {
  default: {
    fill: '#e5e7eb',
    hover: '#3b82f6',
    active: '#1d4ed8',
    selected: '#1e40af',
    disabled: '#f3f4f6',
    stroke: '#9ca3af',
  },
  blue: {
    fill: '#dbeafe',
    hover: '#60a5fa',
    active: '#3b82f6',
    selected: '#2563eb',
    disabled: '#f1f5f9',
    stroke: '#93c5fd',
  },
  green: {
    fill: '#dcfce7',
    hover: '#4ade80',
    active: '#22c55e',
    selected: '#16a34a',
    disabled: '#f0fdf4',
    stroke: '#86efac',
  },
  warm: {
    fill: '#fef3c7',
    hover: '#fbbf24',
    active: '#f59e0b',
    selected: '#d97706',
    disabled: '#fffbeb',
    stroke: '#fcd34d',
  },
};

const SIZE_CLASSES = {
  sm: 'w-[250px] h-[300px]',
  md: 'w-[350px] h-[420px]',
  lg: 'w-[450px] h-[540px]',
  full: 'w-full h-auto aspect-[350/450]',
};

export default function KoreaMap({
  onRegionClick,
  onRegionHover,
  selectedRegion,
  activeRegions = [],
  disabledRegions = [],
  showLabels = true,
  showTooltip = true,
  colorScheme = 'default',
  size = 'md',
  className,
}: KoreaMapProps) {
  const router = useRouter();
  const regions = getAllRegions();
  const colors = COLOR_SCHEMES[colorScheme];

  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleRegionClick = useCallback(
    (regionCode: string) => {
      const region = regions.find((r) => r.code === regionCode);
      if (!region || disabledRegions.includes(regionCode)) return;

      if (onRegionClick) {
        onRegionClick(region);
      } else {
        // Default behavior: navigate to region page
        router.push(buildRegionPath(regionCode));
      }
    },
    [regions, disabledRegions, onRegionClick, router]
  );

  const handleMouseEnter = useCallback(
    (regionCode: string, e: React.MouseEvent) => {
      if (disabledRegions.includes(regionCode)) return;

      setHoveredRegion(regionCode);
      setTooltipPos({ x: e.clientX, y: e.clientY });

      const region = regions.find((r) => r.code === regionCode);
      if (region && onRegionHover) {
        onRegionHover(region);
      }
    },
    [regions, disabledRegions, onRegionHover]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredRegion(null);
    if (onRegionHover) {
      onRegionHover(null);
    }
  }, [onRegionHover]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  const getRegionColor = (code: string) => {
    if (disabledRegions.includes(code)) return colors.disabled;
    if (code === selectedRegion) return colors.selected;
    if (code === hoveredRegion) return colors.hover;
    if (activeRegions.includes(code)) return colors.active;
    return colors.fill;
  };

  const hoveredRegionData = hoveredRegion
    ? regions.find((r) => r.code === hoveredRegion)
    : null;

  return (
    <div className={cn('relative inline-block', SIZE_CLASSES[size], className)}>
      <svg
        viewBox="0 0 350 460"
        className="w-full h-full"
        style={{ maxWidth: '100%' }}
      >
        {/* Background */}
        <rect x="0" y="0" width="350" height="460" fill="#f0f9ff" rx="8" />

        {/* Sea decoration */}
        <text x="30" y="150" className="text-xs fill-blue-300 font-light">
          서해
        </text>
        <text x="310" y="200" className="text-xs fill-blue-300 font-light">
          동해
        </text>

        {/* Region paths */}
        {Object.entries(REGION_PATHS).map(([code, data]) => {
          const region = regions.find((r) => r.code === code);
          const isDisabled = disabledRegions.includes(code);

          return (
            <g key={code}>
              <path
                d={data.path}
                fill={getRegionColor(code)}
                stroke={colors.stroke}
                strokeWidth={code === hoveredRegion || code === selectedRegion ? 2 : 1}
                className={cn(
                  'transition-all duration-200',
                  !isDisabled && 'cursor-pointer'
                )}
                onClick={() => handleRegionClick(code)}
                onMouseEnter={(e) => handleMouseEnter(code, e)}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
              />
              {showLabels && region && (
                <text
                  x={data.labelX}
                  y={data.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={cn(
                    'text-[8px] font-medium pointer-events-none select-none',
                    code === hoveredRegion || code === selectedRegion
                      ? 'fill-white'
                      : isDisabled
                      ? 'fill-gray-400'
                      : 'fill-gray-700'
                  )}
                >
                  {region.shortName || region.name.replace(/특별시|광역시|도|특별자치/g, '')}
                </text>
              )}
            </g>
          );
        })}

        {/* Title */}
        <text x="175" y="25" textAnchor="middle" className="text-sm font-bold fill-gray-800">
          대한민국 지역 뉴스
        </text>
      </svg>

      {/* Tooltip */}
      {showTooltip && hoveredRegionData && (
        <div
          className="fixed z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltipPos.x + 10,
            top: tooltipPos.y + 10,
          }}
        >
          <div className="font-medium">{hoveredRegionData.name}</div>
          <div className="text-gray-300 text-xs">
            {hoveredRegionData.districts.length}개 시/군/구
          </div>
        </div>
      )}

      {/* Legend for active/disabled regions */}
      {(activeRegions.length > 0 || disabledRegions.length > 0) && (
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs space-y-1">
          {activeRegions.length > 0 && (
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: colors.active }}
              />
              <span>서비스 중</span>
            </div>
          )}
          {disabledRegions.length > 0 && (
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: colors.disabled }}
              />
              <span>준비 중</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
