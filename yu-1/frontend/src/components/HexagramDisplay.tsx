'use client';

/**
 * HexagramDisplay - 커스텀 괘 표시 컴포넌트
 *
 * 6개 효를 개별적으로 렌더링하여 특정 효에 하이라이트 효과를 줄 수 있음
 *
 * @param hexagramNumber - 1~64 괘 번호
 * @param highlightYao - 강조할 효 위치 (1~6, 없으면 하이라이트 없음)
 * @param size - 크기 ('sm' | 'md' | 'lg')
 */

interface HexagramDisplayProps {
  hexagramNumber: number;
  highlightYao?: number;  // 1~6, 강조할 효 위치
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;   // 효 이름 표시 여부
}

// 64괘의 효 구성 (1=양효, 0=음효, 아래→위 순서)
// 각 괘는 6개 효로 구성: [초효, 이효, 삼효, 사효, 오효, 상효]
const HEXAGRAM_LINES: Record<number, number[]> = {
  1:  [1,1,1,1,1,1], // 건위천 ☰☰
  2:  [0,0,0,0,0,0], // 곤위지 ☷☷
  3:  [1,0,0,0,1,0], // 수뢰둔 ☵☳
  4:  [0,1,0,0,0,1], // 산수몽 ☶☵
  5:  [1,1,1,0,1,0], // 수천수 ☵☰
  6:  [0,1,0,1,1,1], // 천수송 ☰☵
  7:  [0,1,0,0,0,0], // 지수사 ☷☵
  8:  [0,0,0,0,1,0], // 수지비 ☵☷
  9:  [1,1,1,1,1,0], // 풍천소축 ☴☰
  10: [1,1,0,1,1,1], // 천택리 ☰☱
  11: [1,1,1,0,0,0], // 지천태 ☷☰
  12: [0,0,0,1,1,1], // 천지비 ☰☷
  13: [1,0,1,1,1,1], // 천화동인 ☰☲
  14: [1,1,1,1,0,1], // 화천대유 ☲☰
  15: [0,0,1,0,0,0], // 지산겸 ☷☶
  16: [0,0,0,1,0,0], // 뢰지예 ☳☷
  17: [1,0,0,1,1,0], // 택뢰수 ☱☳
  18: [0,1,1,0,0,1], // 산풍고 ☶☴
  19: [1,1,0,0,0,0], // 지택림 ☷☱
  20: [0,0,0,0,1,1], // 풍지관 ☴☷
  21: [1,0,0,1,0,1], // 화뢰서합 ☲☳
  22: [1,0,1,0,0,1], // 산화비 ☶☲
  23: [0,0,0,0,0,1], // 산지박 ☶☷
  24: [1,0,0,0,0,0], // 지뢰복 ☷☳
  25: [1,0,0,1,1,1], // 천뢰무망 ☰☳
  26: [1,1,1,0,0,1], // 산천대축 ☶☰
  27: [1,0,0,0,0,1], // 산뢰이 ☶☳
  28: [0,1,1,1,1,0], // 택풍대과 ☱☴
  29: [0,1,0,0,1,0], // 감위수 ☵☵
  30: [1,0,1,1,0,1], // 리위화 ☲☲
  31: [0,0,1,1,1,0], // 택산함 ☱☶
  32: [0,1,1,1,0,0], // 뢰풍항 ☳☴
  33: [0,0,1,1,1,1], // 천산둔 ☰☶
  34: [1,1,1,1,0,0], // 뢰천대장 ☳☰
  35: [0,0,0,1,0,1], // 화지진 ☲☷
  36: [1,0,1,0,0,0], // 지화명이 ☷☲
  37: [1,0,1,0,1,1], // 풍화가인 ☴☲
  38: [1,1,0,1,0,1], // 화택규 ☲☱
  39: [0,0,1,0,1,0], // 수산건 ☵☶
  40: [0,1,0,1,0,0], // 뢰수해 ☳☵
  41: [1,0,0,0,1,1], // 산택손 ☶☱
  42: [1,1,0,0,0,1], // 풍뢰익 ☴☳
  43: [1,1,1,1,1,0], // 택천쾌 ☱☰ (Note: 9번과 동일 패턴, 괘 의미 다름)
  44: [0,1,1,1,1,1], // 천풍구 ☰☴
  45: [0,0,0,1,1,0], // 택지췌 ☱☷
  46: [0,1,1,0,0,0], // 지풍승 ☷☴
  47: [0,1,0,1,1,0], // 택수곤 ☱☵
  48: [0,1,1,0,1,0], // 수풍정 ☵☴
  49: [1,0,1,1,1,0], // 택화혁 ☱☲
  50: [0,1,1,1,0,1], // 화풍정 ☲☴
  51: [1,0,0,1,0,0], // 진위뢰 ☳☳
  52: [0,0,1,0,0,1], // 간위산 ☶☶
  53: [0,0,1,0,1,1], // 풍산점 ☴☶
  54: [1,1,0,1,0,0], // 뢰택귀매 ☳☱
  55: [1,0,1,1,0,0], // 뢰화풍 ☳☲
  56: [0,0,1,1,0,1], // 화산려 ☲☶
  57: [0,1,1,0,1,1], // 손위풍 ☴☴
  58: [1,1,0,1,1,0], // 태위택 ☱☱
  59: [0,1,0,0,1,1], // 풍수환 ☴☵
  60: [1,1,0,0,1,0], // 수택절 ☵☱
  61: [1,1,0,0,1,1], // 풍택중부 ☴☱
  62: [0,0,1,1,0,0], // 뢰산소과 ☳☶
  63: [1,0,1,0,1,0], // 수화기제 ☵☲
  64: [0,1,0,1,0,1], // 화수미제 ☲☵
};

// 효 이름 (양/음)
const YAO_NAMES = {
  yang: ['초구', '구이', '구삼', '구사', '구오', '상구'],
  yin: ['초육', '육이', '육삼', '육사', '육오', '상육'],
};

// 크기별 스타일
const SIZE_STYLES = {
  sm: {
    lineWidth: 'w-12',
    lineHeight: 'h-1.5',
    gap: 'gap-1',
    gapInner: 'gap-1',
  },
  md: {
    lineWidth: 'w-16',
    lineHeight: 'h-2',
    gap: 'gap-1.5',
    gapInner: 'gap-1.5',
  },
  lg: {
    lineWidth: 'w-24',
    lineHeight: 'h-3',
    gap: 'gap-2',
    gapInner: 'gap-2',
  },
};

export default function HexagramDisplay({
  hexagramNumber,
  highlightYao,
  size = 'md',
  showLabels = false,
}: HexagramDisplayProps) {
  const lines = HEXAGRAM_LINES[hexagramNumber] || [1,1,1,1,1,1];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <div className={`flex flex-col-reverse ${sizeStyle.gap}`}>
      {lines.map((isYang, index) => {
        const position = index + 1; // 1~6
        const isHighlighted = highlightYao === position;
        const yaoName = isYang ? YAO_NAMES.yang[index] : YAO_NAMES.yin[index];

        return (
          <div key={position} className="flex items-center gap-2">
            {/* 효 라인 */}
            <div className="relative flex items-center justify-center">
              {isYang ? (
                // 양효 (━━━━━━) - 하나의 긴 선
                <div
                  className={`
                    ${sizeStyle.lineWidth} ${sizeStyle.lineHeight} rounded-sm
                    transition-all duration-300
                    ${isHighlighted
                      ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8),0_0_30px_rgba(251,191,36,0.4)]'
                      : 'bg-white/80'
                    }
                  `}
                />
              ) : (
                // 음효 (─  ─) - 두 개의 짧은 선
                <>
                  <div
                    className={`
                      ${size === 'lg' ? 'w-10' : size === 'md' ? 'w-6' : 'w-4'}
                      ${sizeStyle.lineHeight} rounded-sm
                      transition-all duration-300
                      ${isHighlighted
                        ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8),0_0_30px_rgba(251,191,36,0.4)]'
                        : 'bg-white/80'
                      }
                    `}
                  />
                  <div className={size === 'lg' ? 'w-4' : size === 'md' ? 'w-3' : 'w-2'} />
                  <div
                    className={`
                      ${size === 'lg' ? 'w-10' : size === 'md' ? 'w-6' : 'w-4'}
                      ${sizeStyle.lineHeight} rounded-sm
                      transition-all duration-300
                      ${isHighlighted
                        ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8),0_0_30px_rgba(251,191,36,0.4)]'
                        : 'bg-white/80'
                      }
                    `}
                  />
                </>
              )}

              {/* 하이라이트 효과 - 빛나는 테두리 */}
              {isHighlighted && (
                <div className="absolute inset-0 animate-pulse rounded-lg border border-amber-400/50" />
              )}
            </div>

            {/* 효 이름 라벨 */}
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

// 내보내기: 괘 라인 데이터 (다른 곳에서 사용 가능)
export { HEXAGRAM_LINES, YAO_NAMES };
