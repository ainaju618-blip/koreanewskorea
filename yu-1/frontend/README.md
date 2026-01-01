# Frontend (Next.js)

> 주역 점술 서비스 프론트엔드 - Next.js 16 + React 19 + Three.js

## 📁 구조

```
frontend/
├── public/                  # 정적 자산 [상세](public/README.md)
│   ├── videos/             # 배경 비디오
│   └── *.svg               # 아이콘 파일
│
├── src/
│   ├── app/                # 페이지 (App Router) [상세](src/app/README.md)
│   │   ├── page.tsx        # / (홈 - 일간운세)
│   │   ├── layout.tsx      # 루트 레이아웃
│   │   ├── globals.css     # 전역 스타일
│   │   ├── divination/     # /divination (점술)
│   │   ├── history/        # /history (기록)
│   │   ├── dice/           # /dice (주사위 테스트)
│   │   ├── yijing/         # /yijing (주역 정보)
│   │   ├── mystical/       # /mystical (신비 콘텐츠)
│   │   ├── icon-preview/   # /icon-preview (아이콘 미리보기)
│   │   └── admin/          # /admin (관리자)
│   │
│   ├── components/         # 컴포넌트 (12개) [상세](src/components/README.md)
│   │   ├── Header.tsx             # 헤더 네비게이션
│   │   ├── HeroSection.tsx        # 히어로 (일간운세)
│   │   ├── CategorySelector.tsx   # 9대분류 선택
│   │   ├── QuickCategory.tsx      # 빠른 카테고리
│   │   ├── QuestionSearch.tsx     # 질문 검색
│   │   ├── QuestionSuggestion.tsx # AI 질문 추천
│   │   ├── PopularQuestions.tsx   # 인기 질문
│   │   ├── DivinationFlow.tsx     # 점술 전체 플로우
│   │   ├── Dice3D.tsx             # 3D 정팔면체 주사위
│   │   ├── OctahedronDice.tsx     # 8괘 팔면체 주사위
│   │   ├── YaoSlider.tsx          # 효 슬라이더
│   │   └── ResultCard.tsx         # 점술 결과 카드
│   │
│   ├── lib/                # 유틸리티 [상세](src/lib/README.md)
│   │   └── api.ts          # Backend API 클라이언트
│   │
│   └── types/              # 타입 정의 [상세](src/types/README.md)
│       └── layoutStyles.ts # 레이아웃 스타일 타입
│
├── package.json            # 의존성 정의
├── tailwind.config.ts      # Tailwind CSS 설정
├── tsconfig.json           # TypeScript 설정
└── next.config.ts          # Next.js 설정
```

## 🚀 실행

```bash
# 의존성 설치
cd frontend
npm install

# 개발 서버 (포트 3001)
npm run dev -- -p 3001

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start

# 린트 검사
npm run lint
```

> 개발 서버: http://localhost:3001

## 🎨 주요 컴포넌트

### 메인 화면

| 컴포넌트 | 파일 | 역할 |
|---------|------|------|
| Header | `Header.tsx` | 상단 네비게이션 (로고, 메뉴) |
| HeroSection | `HeroSection.tsx` | 일간운세 표시 + 괘 비주얼 |
| QuickCategory | `QuickCategory.tsx` | 인기 카테고리 퀵버튼 4개 |
| PopularQuestions | `PopularQuestions.tsx` | 카테고리별 인기 질문 목록 |

### 점술 플로우

| 컴포넌트 | 파일 | 역할 |
|---------|------|------|
| CategorySelector | `CategorySelector.tsx` | 9대분류 그리드 선택 |
| QuestionSearch | `QuestionSearch.tsx` | 질문 검색 + 자동완성 |
| QuestionSuggestion | `QuestionSuggestion.tsx` | AI 기반 질문 추천 |
| DivinationFlow | `DivinationFlow.tsx` | 점술 전체 워크플로우 |

### 3D/비주얼

| 컴포넌트 | 파일 | 역할 |
|---------|------|------|
| Dice3D | `Dice3D.tsx` | Three.js 3D 정팔면체 (8괘) |
| OctahedronDice | `OctahedronDice.tsx` | 8괘 팔면체 2D 애니메이션 |
| YaoSlider | `YaoSlider.tsx` | 효 위치 슬라이더 (1-6효) |

### 결과 표시

| 컴포넌트 | 파일 | 역할 |
|---------|------|------|
| ResultCard | `ResultCard.tsx` | 점술 결과 카드 (괘/효사/해석) |

## 🗺️ 페이지 라우팅

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | 홈 | 일간운세 + 퀵메뉴 |
| `/divination` | 점술 | 카테고리 → 질문 → 결과 |
| `/divination/result/[id]` | 결과 상세 | 점술 결과 상세 페이지 |
| `/history` | 히스토리 | 과거 점술 기록 |
| `/dice` | 주사위 | 3D 주사위 테스트 |
| `/yijing` | 주역 | 주역 64괘 정보 |
| `/mystical` | 신비 | 신비 콘텐츠 |
| `/admin` | 관리자 | 데이터 관리 |

## 🔌 API 클라이언트 (`lib/api.ts`)

| 함수 | 엔드포인트 | 설명 |
|------|-----------|------|
| `castDivination()` | POST `/api/divination/cast` | 점술 수행 |
| `getDivination()` | GET `/api/divination` | 간단 효 조회 |
| `getCategories()` | GET `/api/divination/categories` | 대분류 목록 |
| `getSubCategories()` | GET `/api/divination/categories/{id}/sub` | 소분류 목록 |
| `healthCheck()` | GET `/api/divination/health` | 서버 상태 |
| `getAIRecommendation()` | - | AI 카테고리 추천 (클라이언트) |

## 📦 의존성

### Dependencies (런타임)

| 패키지 | 버전 | 용도 |
|--------|------|------|
| next | 16.1.1 | React 프레임워크 |
| react | 19.2.3 | UI 라이브러리 |
| react-dom | 19.2.3 | React DOM 렌더링 |
| three | 0.182.0 | 3D 그래픽 라이브러리 |
| @react-three/fiber | 9.5.0 | React Three.js 통합 |
| @react-three/drei | 10.7.7 | Three.js 헬퍼 컴포넌트 |

### DevDependencies (개발)

| 패키지 | 버전 | 용도 |
|--------|------|------|
| typescript | ^5 | 타입 시스템 |
| @types/node | ^20 | Node.js 타입 |
| @types/react | ^19 | React 타입 |
| @types/react-dom | ^19 | React DOM 타입 |
| tailwindcss | ^4 | CSS 프레임워크 |
| @tailwindcss/postcss | ^4 | Tailwind PostCSS 플러그인 |
| eslint | ^9 | 코드 린터 |
| eslint-config-next | 16.1.1 | Next.js ESLint 규칙 |

## 🔗 Backend 연동

```typescript
// 환경변수로 API URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 점술 요청 예시
const result = await castDivination({
  divination_type: 'iching',
  period: 'daily',
  main_category: 1,
  question: '오늘 비트코인 사도 될까요?'
});
```

## 📊 기술 스택 요약

| 영역 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| 3D | Three.js + React Three Fiber |
| Language | TypeScript 5 |
| Lint | ESLint 9 |

## 🔄 사용자 플로우

```
[홈 /] ──────────────────────────────────────────────────────
    │
    ├── HeroSection (일간운세)
    │       └── API: /api/divination/today
    │
    ├── QuickCategory (빠른 카테고리)
    │       └── 재물 | 연애 | 직업 | 오늘운세
    │
    └── ──→ [점술 /divination]
                │
                ├── CategorySelector (9대분류)
                ├── QuestionSearch (질문 입력)
                └── DivinationFlow (점술 수행)
                        │
                        ├── Dice3D / OctahedronDice (괘 결정)
                        └── ResultCard (결과 표시)
                                └── API: /api/divination/cast
                                        │
                                        └── ──→ [히스토리 /history]
```
