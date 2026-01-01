'use client';

/**
 * HexagramOverlay - Unicode 괘 심볼 위에 효 하이라이트 오버레이
 *
 * 기존 ☰☷ 심볼을 사용하면서 특정 효 위치에 빛나는 하이라이트를 겹침
 *
 * @param upperTrigram - 상괘 심볼 (☰, ☷ 등)
 * @param lowerTrigram - 하괘 심볼 (☰, ☷ 등)
 * @param highlightYao - 강조할 효 위치 (1~6)
 * @param size - 크기 ('sm' | 'md' | 'lg')
 */

interface HexagramOverlayProps {
  upperTrigram: string;    // 상괘 (☰, ☷, ☵ 등)
  lowerTrigram: string;    // 하괘
  highlightYao?: number;   // 1~6, 강조할 효 위치
  size?: 'sm' | 'md' | 'lg';
}

// 크기별 스타일
const SIZE_CONFIG = {
  sm: {
    fontSize: 'text-[32px]',
    trigramGap: '-mt-[3px]',
    overlayHeight: 'h-[10px]',
    overlayOffset: {
      // 상괘 내 효 위치 (4, 5, 6효)
      6: 'top-[2%]',
      5: 'top-[35%]',
      4: 'top-[68%]',
      // 하괘 내 효 위치 (1, 2, 3효)
      3: 'top-[2%]',
      2: 'top-[35%]',
      1: 'top-[68%]',
    },
  },
  md: {
    fontSize: 'text-[50px]',
    trigramGap: '-mt-[5px]',
    overlayHeight: 'h-[14px]',
    overlayOffset: {
      6: 'top-[2%]',
      5: 'top-[36%]',
      4: 'top-[70%]',
      3: 'top-[2%]',
      2: 'top-[36%]',
      1: 'top-[70%]',
    },
  },
  lg: {
    fontSize: 'text-[70px]',
    trigramGap: '-mt-[8px]',
    overlayHeight: 'h-[18px]',
    overlayOffset: {
      6: 'top-[2%]',
      5: 'top-[36%]',
      4: 'top-[70%]',
      3: 'top-[2%]',
      2: 'top-[36%]',
      1: 'top-[70%]',
    },
  },
};

export default function HexagramOverlay({
  upperTrigram,
  lowerTrigram,
  highlightYao,
  size = 'md',
}: HexagramOverlayProps) {
  const config = SIZE_CONFIG[size];
  const isUpperHighlight = highlightYao && highlightYao >= 4; // 4, 5, 6효는 상괘
  const isLowerHighlight = highlightYao && highlightYao <= 3; // 1, 2, 3효는 하괘

  return (
    <div className="flex flex-col items-center">
      {/* 상괘 (上卦) - 4, 5, 6효 */}
      <div className="relative inline-block">
        <span
          className={`${config.fontSize} gua-font text-white drop-shadow-lg leading-none block`}
          style={{ transform: 'scaleX(1.5)', transformOrigin: 'center' }}
        >
          {upperTrigram}
        </span>

        {/* 상괘 하이라이트 오버레이 */}
        {isUpperHighlight && highlightYao && (
          <div
            className={`
              absolute left-0 right-0 ${config.overlayHeight}
              ${config.overlayOffset[highlightYao as keyof typeof config.overlayOffset]}
              bg-amber-400/60 rounded-full
              shadow-[0_0_20px_rgba(251,191,36,0.9),0_0_40px_rgba(251,191,36,0.5)]
              animate-pulse
            `}
            style={{ transform: 'scaleX(1.5)', transformOrigin: 'center' }}
          />
        )}
      </div>

      {/* 하괘 (下卦) - 1, 2, 3효 */}
      <div className={`relative inline-block ${config.trigramGap}`}>
        <span
          className={`${config.fontSize} gua-font text-white drop-shadow-lg leading-none block`}
          style={{ transform: 'scaleX(1.5)', transformOrigin: 'center' }}
        >
          {lowerTrigram}
        </span>

        {/* 하괘 하이라이트 오버레이 */}
        {isLowerHighlight && highlightYao && (
          <div
            className={`
              absolute left-0 right-0 ${config.overlayHeight}
              ${config.overlayOffset[highlightYao as keyof typeof config.overlayOffset]}
              bg-amber-400/60 rounded-full
              shadow-[0_0_20px_rgba(251,191,36,0.9),0_0_40px_rgba(251,191,36,0.5)]
              animate-pulse
            `}
            style={{ transform: 'scaleX(1.5)', transformOrigin: 'center' }}
          />
        )}
      </div>
    </div>
  );
}

// 2글자 심볼에서 상괘/하괘 분리 헬퍼
export function splitHexagramSymbol(symbol: string): { upper: string; lower: string } {
  if (symbol.length >= 2) {
    return { upper: symbol[0], lower: symbol[1] };
  }
  return { upper: '☰', lower: '☰' };
}
