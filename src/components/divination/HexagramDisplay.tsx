'use client';

/**
 * HexagramDisplay - Custom hexagram visualization component
 *
 * Renders 6 lines (yaos) with optional highlight effect on specific line
 *
 * @param hexagramNumber - 1~64 hexagram number
 * @param highlightYao - Line position to highlight (1~6)
 * @param size - Size variant ('sm' | 'md' | 'lg')
 * @param showLabels - Whether to show yao names
 */

interface HexagramDisplayProps {
  hexagramNumber: number;
  highlightYao?: number;  // 1~6
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  animate?: boolean;
}

// 64 hexagrams line patterns (1=yang, 0=yin, bottom to top)
// Each hexagram has 6 lines: [line1, line2, line3, line4, line5, line6]
export const HEXAGRAM_LINES: Record<number, number[]> = {
  1:  [1,1,1,1,1,1], // Qian (Heaven)
  2:  [0,0,0,0,0,0], // Kun (Earth)
  3:  [1,0,0,0,1,0], // Zhun
  4:  [0,1,0,0,0,1], // Meng
  5:  [1,1,1,0,1,0], // Xu
  6:  [0,1,0,1,1,1], // Song
  7:  [0,1,0,0,0,0], // Shi
  8:  [0,0,0,0,1,0], // Bi
  9:  [1,1,1,1,1,0], // Xiao Xu
  10: [1,1,0,1,1,1], // Lu
  11: [1,1,1,0,0,0], // Tai
  12: [0,0,0,1,1,1], // Pi
  13: [1,0,1,1,1,1], // Tong Ren
  14: [1,1,1,1,0,1], // Da You
  15: [0,0,1,0,0,0], // Qian (Modesty)
  16: [0,0,0,1,0,0], // Yu
  17: [1,0,0,1,1,0], // Sui
  18: [0,1,1,0,0,1], // Gu
  19: [1,1,0,0,0,0], // Lin
  20: [0,0,0,0,1,1], // Guan
  21: [1,0,0,1,0,1], // Shi He
  22: [1,0,1,0,0,1], // Bi (Grace)
  23: [0,0,0,0,0,1], // Bo
  24: [1,0,0,0,0,0], // Fu
  25: [1,0,0,1,1,1], // Wu Wang
  26: [1,1,1,0,0,1], // Da Xu
  27: [1,0,0,0,0,1], // Yi
  28: [0,1,1,1,1,0], // Da Guo
  29: [0,1,0,0,1,0], // Kan
  30: [1,0,1,1,0,1], // Li
  31: [0,0,1,1,1,0], // Xian
  32: [0,1,1,1,0,0], // Heng
  33: [0,0,1,1,1,1], // Dun
  34: [1,1,1,1,0,0], // Da Zhuang
  35: [0,0,0,1,0,1], // Jin
  36: [1,0,1,0,0,0], // Ming Yi
  37: [1,0,1,0,1,1], // Jia Ren
  38: [1,1,0,1,0,1], // Kui
  39: [0,0,1,0,1,0], // Jian
  40: [0,1,0,1,0,0], // Xie
  41: [1,0,0,0,1,1], // Sun
  42: [1,1,0,0,0,1], // Yi (Increase)
  43: [1,1,1,1,1,0], // Guai
  44: [0,1,1,1,1,1], // Gou
  45: [0,0,0,1,1,0], // Cui
  46: [0,1,1,0,0,0], // Sheng
  47: [0,1,0,1,1,0], // Kun (Oppression)
  48: [0,1,1,0,1,0], // Jing
  49: [1,0,1,1,1,0], // Ge
  50: [0,1,1,1,0,1], // Ding
  51: [1,0,0,1,0,0], // Zhen
  52: [0,0,1,0,0,1], // Gen
  53: [0,0,1,0,1,1], // Jian (Gradual)
  54: [1,1,0,1,0,0], // Gui Mei
  55: [1,0,1,1,0,0], // Feng
  56: [0,0,1,1,0,1], // Lu (Traveler)
  57: [0,1,1,0,1,1], // Xun
  58: [1,1,0,1,1,0], // Dui
  59: [0,1,0,0,1,1], // Huan
  60: [1,1,0,0,1,0], // Jie
  61: [1,1,0,0,1,1], // Zhong Fu
  62: [0,0,1,1,0,0], // Xiao Guo
  63: [1,0,1,0,1,0], // Ji Ji
  64: [0,1,0,1,0,1], // Wei Ji
};

// Yao names (yang/yin)
export const YAO_NAMES = {
  yang: ['Chu Jiu', 'Jiu Er', 'Jiu San', 'Jiu Si', 'Jiu Wu', 'Shang Jiu'],
  yin: ['Chu Liu', 'Liu Er', 'Liu San', 'Liu Si', 'Liu Wu', 'Shang Liu'],
  ko_yang: ['Cho-gu', 'Gu-i', 'Gu-sam', 'Gu-sa', 'Gu-o', 'Sang-gu'],
  ko_yin: ['Cho-yuk', 'Yuk-i', 'Yuk-sam', 'Yuk-sa', 'Yuk-o', 'Sang-yuk'],
};

// Size styles
const SIZE_STYLES = {
  sm: {
    lineWidth: 'w-12',
    lineHeight: 'h-1.5',
    gap: 'gap-1',
    halfWidth: 'w-4',
    gapWidth: 'w-2',
  },
  md: {
    lineWidth: 'w-16',
    lineHeight: 'h-2',
    gap: 'gap-1.5',
    halfWidth: 'w-6',
    gapWidth: 'w-3',
  },
  lg: {
    lineWidth: 'w-24',
    lineHeight: 'h-3',
    gap: 'gap-2',
    halfWidth: 'w-10',
    gapWidth: 'w-4',
  },
};

export default function HexagramDisplay({
  hexagramNumber,
  highlightYao,
  size = 'md',
  showLabels = false,
  animate = false,
}: HexagramDisplayProps) {
  const lines = HEXAGRAM_LINES[hexagramNumber] || [1,1,1,1,1,1];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <div className={`flex flex-col-reverse ${sizeStyle.gap}`}>
      {lines.map((isYang, index) => {
        const position = index + 1; // 1~6
        const isHighlighted = highlightYao === position;
        const yaoName = isYang ? YAO_NAMES.ko_yang[index] : YAO_NAMES.ko_yin[index];

        return (
          <div
            key={position}
            className="flex items-center gap-2"
            style={animate ? { animationDelay: `${(6 - index) * 100}ms` } : undefined}
          >
            {/* Yao Line */}
            <div className="relative flex items-center justify-center">
              {isYang ? (
                // Yang line (solid)
                <div
                  className={`
                    ${sizeStyle.lineWidth} ${sizeStyle.lineHeight} rounded-sm
                    transition-all duration-300
                    ${isHighlighted
                      ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8),0_0_30px_rgba(251,191,36,0.4)]'
                      : 'bg-white/80'
                    }
                    ${animate ? 'animate-fadeIn' : ''}
                  `}
                />
              ) : (
                // Yin line (broken)
                <>
                  <div
                    className={`
                      ${sizeStyle.halfWidth} ${sizeStyle.lineHeight} rounded-sm
                      transition-all duration-300
                      ${isHighlighted
                        ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8),0_0_30px_rgba(251,191,36,0.4)]'
                        : 'bg-white/80'
                      }
                      ${animate ? 'animate-fadeIn' : ''}
                    `}
                  />
                  <div className={sizeStyle.gapWidth} />
                  <div
                    className={`
                      ${sizeStyle.halfWidth} ${sizeStyle.lineHeight} rounded-sm
                      transition-all duration-300
                      ${isHighlighted
                        ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8),0_0_30px_rgba(251,191,36,0.4)]'
                        : 'bg-white/80'
                      }
                      ${animate ? 'animate-fadeIn' : ''}
                    `}
                  />
                </>
              )}

              {/* Highlight glow effect */}
              {isHighlighted && (
                <div className="absolute inset-0 animate-pulse rounded-lg border border-amber-400/50" />
              )}
            </div>

            {/* Yao name label */}
            {showLabels && (
              <span className={`
                text-xs transition-all duration-300
                ${isHighlighted ? 'text-amber-400 font-bold' : 'text-gray-500'}
              `}>
                {yaoName}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
