# Frontend Components - 컴포넌트 카탈로그

`src/components/` 디렉토리의 재사용 가능한 React 컴포넌트들입니다. 모든 컴포넌트는 클라이언트 사이드 렌더링(`'use client'`)을 사용합니다.

## 📦 컴포넌트 목록

### 레이아웃 & 네비게이션

#### Header.tsx
- **용도**: 상단 헤더 네비게이션 바
- **Props**:
  - `showHistory?: boolean` (default: true) - 히스토리 버튼 표시 여부
- **주요 기능**:
  - 로고 (☯️ 주역점)
  - 히스토리 버튼 (📜)
  - 드롭다운 메뉴 버튼 (햄버거 아이콘)
  - 메뉴: 홈, 점괘 보기, 히스토리, 버전 표시
- **상태**: `menuOpen` (메뉴 오픈/클로즈)
- **스타일**:
  - 검은색 반투명 배경 (`bg-black/80`)
  - 블러 효과 (`backdrop-blur-md`)
  - Sticky 위치 (최상단 고정)

#### HeroSection.tsx
- **용도**: 홈 페이지 히어로 섹션 (영상 배경 + 오늘의 운세)
- **Props**:
  - `onQuickFortune?: () => void` - 빠른 응답 클릭 핸들러
- **주요 기능**:
  - 비디오 배경 (`<video>` 요소)
  - 영상 자막 (떠다니는 텍스트 애니메이션)
  - 오늘의 운세 카드
  - 질문 입력 필드
  - 응답받기 버튼
- **상태**:
  - `fortune`: 오늘의 운세 데이터
  - `isLoadingFortune`: 로딩 상태
  - `layoutStyle`: UI 스타일 설정
  - `question`: 입력된 질문
  - `heroVideoUrl`: 영상 URL
- **API 호출**:
  - `GET /api/divination/today` - 오늘의 운세
  - `GET /api/settings/hero-video` - 히어로 영상 설정
- **특징**: localStorage를 통한 캐싱, 반응형 영상 URL

### 카테고리 & 선택

#### CategorySelector.tsx
- **용도**: 9개 대분류 + 소분류 카테고리 선택
- **Props**:
  - `selectedMajor: number` - 선택된 대분류 ID
  - `selectedSub: number | null` - 선택된 소분류 ID
  - `onMajorChange: (id: number) => void` - 대분류 변경 콜백
  - `onSubChange: (id: number | null) => void` - 소분류 변경 콜백
- **주요 기능**:
  - 9개 대분류 버튼 (이모지 포함)
  - 소분류 드롭다운 (대분류 선택 시 표시)
  - 버튼 활성화/비활성화 상태
- **대분류**: 재물, 직업, 학업, 연애, 대인, 건강, 취미, 운명, 기타

#### QuickCategory.tsx
- **용도**: 카테고리 빠른 선택 버튼들
- **설명**: 카테고리별 정렬된 빠른 선택 인터페이스

### 질문 & 검색

#### QuestionSearch.tsx
- **용도**: 9,500개 질문 데이터베이스 검색
- **Props**:
  - `onSelect: (question: SearchResult) => void` - 질문 선택 콜백
  - `placeholder?: string` - 입력 필드 플레이스홀더
  - `categoryFilter?: number` - 카테고리 필터 ID
- **주요 기능**:
  - 실시간 검색 (디바운스 300ms)
  - 검색 결과 드롭다운 (최대 10개)
  - 결과별 카테고리 정보 표시
  - 매칭 점수 표시
  - 외부 클릭 감지로 자동 닫기
- **API 호출**:
  - `GET /api/questions/search?q=...&limit=10&category_id=...`
- **특징**: 키보드 네비게이션 (ESC), 스코어 기반 정렬

#### PopularQuestions.tsx
- **용도**: 카테고리별 인기 질문 표시
- **Props**:
  - `categoryId: number` - 카테고리 ID
  - `categoryName: string` - 카테고리 이름
  - `onSelect: (question) => void` - 선택 콜백
- **주요 기능**:
  - 인기 질문 상위 5개 표시
  - 클릭하면 질문 자동 입력
- **API 호출**:
  - `GET /api/questions/popular?category_id=...`

#### QuestionSuggestion.tsx
- **용도**: 입력 중 자동 질문 제안
- **Props**:
  - `userInput: string` - 사용자 입력 텍스트
  - `categoryId: number` - 카테고리 ID
  - `onSelect: (question) => void` - 선택 콜백
- **주요 기능**:
  - 입력 텍스트 기반 AI 추천 질문
  - 입력 중 자동으로 제안 표시
- **API 호출**:
  - `GET /api/questions/suggest?q=...&category_id=...`

### 효 선택

#### YaoSlider.tsx
- **용도**: 효 위치 선택 (1-6번 슬라이더)
- **Props**:
  - `value: number` - 현재 선택된 효 위치 (1-6)
  - `onChange: (position: number) => void` - 변경 콜백
  - `isYang: boolean` - 양효 여부
  - `onYinYangChange: (isYang: boolean) => void` - 양효/음효 토글 콜백
- **주요 기능**:
  - 효 위치 슬라이더 (1-6)
  - 양효/음효 토글 버튼
  - 효 이름 표시 (초효, 이효, 삼효, 사효, 오효, 상효)
  - 선택 현황 시각화
- **스타일**: 슬라이더 + 토글 버튼 조합

### 점 관련

#### DivinationFlow.tsx
- **용도**: 점치기 전체 플로우 오케스트레이션
- **설명**: 질문 입력 → 카테고리 선택 → 효 선택 → 결과 표시 전체 프로세스 관리

#### ResultCard.tsx
- **용도**: 점괘 결과 카드 표시
- **Props**:
  - 괘 정보 (번호, 이름, 한자)
  - 효 정보 (위치, 이름)
  - 해석 텍스트
  - 운세 점수 (0-100)
  - 운세 카테고리 (대길, 길, 평, 소흉, 흉)
  - 액션 가이드 & 주의사항
  - 키워드들
- **스타일**: 검은색 카드 + 주황색 악센트 + 점수 표시

### 3D & 애니메이션

#### Dice3D.tsx
- **용도**: 3D 점주사위 렌더링
- **설명**: Three.js 기반 3D 주사위 시뮬레이션

#### OctahedronDice.tsx
- **용도**: 정팔면체 (8면) 점주사위
- **설명**: 3D 정팔면체 주사위 (전통 점법용)

### 기타

#### HeroSection.tsx (이미 위에 설명)
- 더 자세한 설명: 위의 "레이아웃 & 네비게이션" 섹션 참조

## 🗂️ 컴포넌트 트리

```
src/components/
├── Header.tsx                    # 상단 네비게이션
├── HeroSection.tsx               # 홈 히어로 섹션
├── CategorySelector.tsx           # 카테고리 선택
├── QuickCategory.tsx              # 빠른 카테고리
├── QuestionSearch.tsx             # 질문 검색
├── PopularQuestions.tsx           # 인기 질문
├── QuestionSuggestion.tsx         # 질문 제안
├── YaoSlider.tsx                  # 효 선택 슬라이더
├── DivinationFlow.tsx             # 점 전체 플로우
├── ResultCard.tsx                 # 결과 카드
├── Dice3D.tsx                     # 3D 주사위
└── OctahedronDice.tsx            # 정팔면체 주사위
```

## 🔗 컴포넌트 의존성

```
페이지 (App Router)
├── layout.tsx
│   └── Header.tsx
└── page.tsx
    └── HeroSection.tsx

/divination
└── DivinationFlow.tsx
    ├── QuestionSearch.tsx
    ├── QuestionSuggestion.tsx
    ├── PopularQuestions.tsx
    ├── CategorySelector.tsx
    └── YaoSlider.tsx

/divination/result/[id]
└── ResultCard.tsx

/history
└── (이력 목록, ResultCard 사용)

/dice
└── Dice3D.tsx 또는 OctahedronDice.tsx
```

## 🎨 공통 스타일 패턴

### 카드 스타일
```tsx
className="bg-black/40 border border-white/10 rounded-2xl p-5"
```

### 버튼 스타일
```tsx
className="px-6 py-2 bg-black/30 text-amber-300 font-bold rounded-xl
           border border-white/10 hover:bg-black/50 transition-all"
```

### 입력 필드 스타일
```tsx
className="bg-white/5 border border-white/10 rounded-xl p-3
           focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
```

### 텍스트 색상
- 주요: `text-white`
- 보조: `text-gray-300`
- 약간 흐린: `text-gray-400`
- 악센트: `text-amber-300`, `text-amber-400`, `text-amber-500`

## 📱 Props 타입 정의

각 컴포넌트의 주요 Props:

```typescript
// SearchResult (검색/제안에서 사용)
interface SearchResult {
  id: string;
  text: string;
  major_category_name: string;
  sub_category: string;
  score?: number;
}

// QuestionData (질문 객체)
interface Question {
  text: string;
  major_category_name: string;
  sub_category?: string;
}
```

## 🚀 사용 예시

```tsx
// 헤더
<Header showHistory={true} />

// 질문 검색
<QuestionSearch
  onSelect={(q) => setQuestion(q.text)}
  categoryFilter={majorCategory}
/>

// 효 선택
<YaoSlider
  value={yaoPosition}
  onChange={setYaoPosition}
  isYang={isYang}
  onYinYangChange={setIsYang}
/>

// 결과 카드
<ResultCard
  hexagram={hexagramData}
  yao={yaoData}
  interpretation="..."
  fortuneScore={75}
/>
```
