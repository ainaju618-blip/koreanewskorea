# Frontend Types - TypeScript 타입 정의

`src/types/` 디렉토리는 프론트엔드에서 사용하는 TypeScript 타입, 인터페이스, 상수들을 정의합니다.

## 📋 타입 파일

### layoutStyles.ts
레이아웃 & UI 스타일 설정 타입 정의

#### HeroLayoutStyle 인터페이스
히어로 섹션의 레이아웃 스타일 정의
```typescript
interface HeroLayoutStyle {
  id: string;                 // 스타일 ID (unique)
  name: string;               // 스타일 이름 (UI에 표시)
  description: string;        // 스타일 설명
  preview?: string;           // 미리보기 이미지 URL (선택)

  // 로고 오버레이 설정
  logo: {
    position: string;         // Tailwind 위치 (top-[6px])
    titleSize: string;        // 제목 크기 (text-3xl)
    iconSize: string;         // 아이콘 크기 (text-5xl)
    subtitle: string;         // 부제 문구
    subtitleSize: string;     // 부제 크기 (text-sm)
  };

  // 괘 표시 설정
  hexagram: {
    symbolSize: string;       // 괘 크기 (text-[50px])
    gap: string;              // 상괘/하괘 간격 (gap-6)
    trigramSpacing: string;   // 상괘/하괘 간격 미세조정 (-mt-[5px])
  };

  // 효 표시 점 설정
  yaoDot: {
    size: string;             // 점 크기 (text-[10px])
    color: string;            // 점 색상 (text-white)
    offset: string;           // 점 위치 오프셋 (-right-4)
  };

  // 운세 카드 설정
  fortuneCard: {
    padding: string;          // 패딩 (p-5)
    borderRadius: string;     // 모서리 반경 (rounded-2xl)
  };

  // 버튼 영역 설정
  buttons: {
    gap: string;              // 버튼 간격 (gap-3)
    borderRadius: string;     // 버튼 모서리 (rounded-xl)
  };
}
```

#### LAYOUT_STYLES 상수
사전 정의된 3가지 레이아웃 스타일:

1. **classic-mystical** (클래식 신비)
   - ID: `'classic-mystical'`
   - 설명: 우주적 신비감을 강조한 기본 스타일
   - 로고 크기: 제목 `text-3xl`, 아이콘 `text-5xl`
   - 괘 크기: `text-[50px]`
   - 스타일: 중간 규모, 밸런스 잡힌 레이아웃

2. **modern-minimal** (모던 미니멀)
   - ID: `'modern-minimal'`
   - 설명: 깔끔하고 현대적인 스타일
   - 로고 크기: 제목 `text-2xl`, 아이콘 `text-4xl`
   - 괘 크기: `text-[40px]`
   - 스타일: 작고 정리된 레이아웃
   - 색상: 주황색 점 (`text-amber-400`)

3. **grand-traditional** (웅장 전통)
   - ID: `'grand-traditional'`
   - 설명: 전통적이고 웅장한 느낌의 스타일
   - 로고 크기: 제목 `text-4xl`, 아이콘 `text-6xl`
   - 괘 크기: `text-[60px]`
   - 스타일: 크고 인상적인 레이아웃
   - 색상: 금색 점 (`text-amber-300`)

#### getLayoutStyleById() 함수
ID로 스타일 찾기
```typescript
function getLayoutStyleById(id: string): HeroLayoutStyle
```
- 매칭되는 스타일이 없으면 첫 번째 스타일(classic-mystical) 반환
- localStorage에 저장된 ID로 사용자 선택 스타일 복원

**사용 예시**:
```typescript
const style = getLayoutStyleById('modern-minimal');
console.log(style.hexagram.symbolSize); // 'text-[40px]'
```

#### LAYOUT_STYLE_STORAGE_KEY 상수
localStorage 키
```typescript
const LAYOUT_STYLE_STORAGE_KEY = 'heroLayoutStyle'
```
- 사용자가 선택한 레이아웃 스타일 ID를 localStorage에 저장
- HeroSection 컴포넌트에서 페이지 로드 시 복원

**사용 예시**:
```typescript
// 스타일 저장
localStorage.setItem(LAYOUT_STYLE_STORAGE_KEY, 'modern-minimal');

// 스타일 복원
const savedId = localStorage.getItem(LAYOUT_STYLE_STORAGE_KEY);
const style = getLayoutStyleById(savedId || 'classic-mystical');
```

## 📐 Tailwind 클래스 매핑

레이아웃 스타일에서 사용되는 Tailwind 클래스들:

### 크기 클래스
| 값 | 의미 |
|---|---|
| `text-xs` | 12px (매우 작음) |
| `text-sm` | 14px (작음) |
| `text-base` | 16px (기본) |
| `text-lg` | 18px (큼) |
| `text-xl` | 20px (더 큼) |
| `text-2xl` | 24px |
| `text-3xl` | 30px |
| `text-4xl` | 36px |
| `text-5xl` | 48px |
| `text-6xl` | 60px |
| `text-[40px]` | 정확한 크기 |
| `text-[50px]` | 정확한 크기 |
| `text-[60px]` | 정확한 크기 |

### 색상 클래스
| 값 | 색상 |
|---|---|
| `text-white` | 흰색 (#fff) |
| `text-amber-300` | 밝은 주황색 |
| `text-amber-400` | 중간 주황색 |

### 간격 클래스
| 값 | 크기 | px |
|---|---|---|
| `gap-2` | 0.5rem | 8px |
| `gap-3` | 0.75rem | 12px |
| `gap-4` | 1rem | 16px |
| `gap-6` | 1.5rem | 24px |
| `gap-8` | 2rem | 32px |
| `p-4` | 1rem (모든 방향) | 16px |
| `p-5` | 1.25rem | 20px |
| `p-6` | 1.5rem | 24px |

### 반경 클래스
| 값 | 크기 |
|---|---|
| `rounded-lg` | 8px |
| `rounded-xl` | 12px |
| `rounded-2xl` | 16px |
| `rounded-3xl` | 24px |

### 위치 클래스
| 값 | px |
|---|---|
| `top-[4px]` | 4px |
| `top-[6px]` | 6px |
| `top-[12px]` | 12px |
| `-right-3` | -12px |
| `-right-4` | -16px |
| `-right-5` | -20px |
| `-mt-[3px]` | margin-top: -3px |
| `-mt-[5px]` | margin-top: -5px |
| `-mt-[8px]` | margin-top: -8px |

## 🎨 스타일 시스템 아키텍처

```
LAYOUT_STYLES (상수 배열)
  ├── classic-mystical
  │   ├── logo (4개 속성)
  │   ├── hexagram (3개 속성)
  │   ├── yaoDot (3개 속성)
  │   ├── fortuneCard (2개 속성)
  │   └── buttons (2개 속성)
  ├── modern-minimal
  │   └── (동일 구조)
  └── grand-traditional
      └── (동일 구조)

HeroSection 컴포넌트
  ├── localStorage에서 스타일 ID 읽기
  ├── getLayoutStyleById() 호출
  └── 선택된 스타일의 className들을 JSX에 적용
```

## 💾 로컬스토리지 사용

### 저장 시점
- 사용자가 스타일 변경 시 (관리자 페이지에서)

### 복원 시점
- HeroSection 컴포넌트 마운트 시

### 데이터 형식
```javascript
// localStorage에 저장되는 값
localStorage.getItem('heroLayoutStyle') // 'modern-minimal'
```

## 🔄 컴포넌트에서의 사용

### HeroSection.tsx 예시
```typescript
import {
  getLayoutStyleById,
  LAYOUT_STYLE_STORAGE_KEY,
  type HeroLayoutStyle
} from '@/types/layoutStyles';

export default function HeroSection() {
  const [layoutStyle, setLayoutStyle] = useState<HeroLayoutStyle | null>(null);

  useEffect(() => {
    // 저장된 스타일 불러오기
    const savedStyleId = localStorage.getItem(LAYOUT_STYLE_STORAGE_KEY);
    const style = getLayoutStyleById(savedStyleId || 'classic-mystical');
    setLayoutStyle(style);
  }, []);

  const style = layoutStyle || getLayoutStyleById('classic-mystical');

  return (
    <div className={style.fortuneCard.borderRadius}>
      {/* style.logo.titleSize, style.hexagram.symbolSize 등 사용 */}
    </div>
  );
}
```

### 관리자 페이지에서의 사용
```typescript
import { LAYOUT_STYLES, LAYOUT_STYLE_STORAGE_KEY } from '@/types/layoutStyles';

function AdminPanel() {
  return (
    <div>
      {LAYOUT_STYLES.map(style => (
        <button
          key={style.id}
          onClick={() => {
            localStorage.setItem(LAYOUT_STYLE_STORAGE_KEY, style.id);
            window.location.reload(); // 또는 상태 업데이트
          }}
        >
          {style.name}
        </button>
      ))}
    </div>
  );
}
```

## 📦 타입 확장 가능성

향후 추가될 타입들:
```typescript
interface CategoryData { ... }
interface DivinationSession { ... }
interface UserPreferences { ... }
interface AnalyticsEvent { ... }
```

## 🚀 성능 고려사항

- **getLayoutStyleById()**: O(n) 시간복잡도 (배열 검색)
  - 3개 스타일이므로 무시할 수 있음
- **localStorage**: 동기 작업
  - 마운트 시에만 호출하므로 성능 영향 최소

## ✅ 타입 안전성

```typescript
// ✅ 올바른 사용
const style: HeroLayoutStyle = LAYOUT_STYLES[0];
const buttonGap: string = style.buttons.gap;

// ❌ 타입 오류
const size: number = style.hexagram.symbolSize; // string이어야 함
const invalid = getLayoutStyleById(); // ID 필수
```
