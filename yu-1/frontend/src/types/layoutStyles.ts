// 레이아웃 스타일 타입 정의

export interface HeroLayoutStyle {
  id: string;
  name: string;
  description: string;
  preview?: string; // 미리보기 이미지 URL (선택)

  // 로고 오버레이 설정
  logo: {
    position: string;      // top-[6px] 등
    titleSize: string;     // text-3xl 등
    iconSize: string;      // text-5xl 등
    subtitle: string;      // 부제 문구
    subtitleSize: string;  // text-sm 등
  };

  // 괘 표시 설정
  hexagram: {
    symbolSize: string;    // text-[50px] 등
    gap: string;           // gap-6 등
    trigramSpacing: string; // -mt-[5px] 등
  };

  // 효 표시 점 설정
  yaoDot: {
    size: string;          // text-[10px] 등
    color: string;         // text-white 등
    offset: string;        // -right-2.5 등
  };

  // 운세 카드 설정
  fortuneCard: {
    padding: string;       // p-5 등
    borderRadius: string;  // rounded-2xl 등
  };

  // 버튼 영역 설정
  buttons: {
    gap: string;           // gap-3 등
    borderRadius: string;  // rounded-xl 등
  };
}

// 기본 스타일 (현재 적용된 스타일)
export const LAYOUT_STYLES: HeroLayoutStyle[] = [
  {
    id: 'classic-mystical',
    name: '클래식 신비',
    description: '우주적 신비감을 강조한 기본 스타일',
    logo: {
      position: 'top-[6px]',
      titleSize: 'text-3xl',
      iconSize: 'text-5xl',
      subtitle: '3천년 역사 · 우주의 신비로 천명을 구하다',
      subtitleSize: 'text-sm',
    },
    hexagram: {
      symbolSize: 'text-[50px]',
      gap: 'gap-6',
      trigramSpacing: '-mt-[5px]',
    },
    yaoDot: {
      size: 'text-[10px]',
      color: 'text-white',
      offset: '-right-4',  // scaleX(1.5) 고려하여 조정
    },
    fortuneCard: {
      padding: 'p-5',
      borderRadius: 'rounded-2xl',
    },
    buttons: {
      gap: 'gap-3',
      borderRadius: 'rounded-xl',
    },
  },
  {
    id: 'modern-minimal',
    name: '모던 미니멀',
    description: '깔끔하고 현대적인 스타일',
    logo: {
      position: 'top-[12px]',
      titleSize: 'text-2xl',
      iconSize: 'text-4xl',
      subtitle: '동양 철학의 지혜',
      subtitleSize: 'text-xs',
    },
    hexagram: {
      symbolSize: 'text-[40px]',
      gap: 'gap-4',
      trigramSpacing: '-mt-[3px]',
    },
    yaoDot: {
      size: 'text-[8px]',
      color: 'text-amber-400',
      offset: '-right-3',  // scaleX(1.5) 고려하여 조정
    },
    fortuneCard: {
      padding: 'p-4',
      borderRadius: 'rounded-xl',
    },
    buttons: {
      gap: 'gap-2',
      borderRadius: 'rounded-lg',
    },
  },
  {
    id: 'grand-traditional',
    name: '웅장 전통',
    description: '전통적이고 웅장한 느낌의 스타일',
    logo: {
      position: 'top-[4px]',
      titleSize: 'text-4xl',
      iconSize: 'text-6xl',
      subtitle: '천지인 합일 · 음양의 조화로 운명을 읽다',
      subtitleSize: 'text-base',
    },
    hexagram: {
      symbolSize: 'text-[60px]',
      gap: 'gap-8',
      trigramSpacing: '-mt-[8px]',
    },
    yaoDot: {
      size: 'text-[12px]',
      color: 'text-amber-300',
      offset: '-right-5',  // scaleX(1.5) 고려하여 조정 (60px 심볼용)
    },
    fortuneCard: {
      padding: 'p-6',
      borderRadius: 'rounded-3xl',
    },
    buttons: {
      gap: 'gap-4',
      borderRadius: 'rounded-2xl',
    },
  },
];

// 스타일 ID로 스타일 찾기
export const getLayoutStyleById = (id: string): HeroLayoutStyle => {
  return LAYOUT_STYLES.find(style => style.id === id) || LAYOUT_STYLES[0];
};

// localStorage 키
export const LAYOUT_STYLE_STORAGE_KEY = 'heroLayoutStyle';
