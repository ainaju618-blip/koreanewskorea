# 🎨 Stitch 디자인 시스템 가이드

> **koreanewskorea 프로젝트 디자인 일관성 유지를 위한 공식 가이드**
>
> 모든 개발자는 새 페이지/컴포넌트 작성 시 반드시 이 가이드라인을 준수해야 합니다.

---

## 1. 색상 시스템 (Color System)

```
┌─────────────────────────────────────────────────────────────┐
│  📌 Primary Color (브랜드 메인):                            │
│     - cyan-500: #06B6D4 (메인 컬러)                         │
│     - cyan-600: #0891B2 (hover 상태)                        │
│     - cyan-100: #CFFAFE (뱃지 배경)                         │
│     - cyan-50:  #ECFEFF (버튼 배경, 약한 강조)              │
│                                                              │
│  📌 Background Colors:                                       │
│     - bg-gray-50: 페이지 전체 배경 (필수!)                  │
│     - bg-white: 카드 배경                                    │
│                                                              │
│  📌 Text Colors:                                             │
│     - text-gray-900: 제목, 강조 텍스트                       │
│     - text-gray-600: 본문 텍스트                             │
│     - text-gray-500: 부가 정보, 날짜                         │
│     - text-gray-400: 비활성 상태                             │
│                                                              │
│  📌 Border Colors:                                           │
│     - border-gray-100: 카드 테두리 (기본)                    │
│     - border-gray-200: 구분선                                │
│                                                              │
│  ❌ 금지 색상 (혼용 금지):                                   │
│     - purple-*, green-*, blue-* 단독 카테고리 색상 사용 금지 │
│     - slate-50/50 배경 사용 금지 (gray-50 사용)              │
│     - bg-white 페이지 배경 사용 금지 (gray-50 사용)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 카드 컴포넌트 (Card Components)

```css
/* 기본 카드 스타일 */
.stitch-card {
  @apply bg-white rounded-xl shadow-sm border border-gray-100;
}

/* 호버 카드 */
.stitch-card-hover {
  @apply bg-white rounded-xl shadow-sm border border-gray-100
         hover:shadow-md transition-shadow;
}
```

**Tailwind 클래스:**
- 기본: `bg-white rounded-xl shadow-sm border border-gray-100`
- 호버: `hover:shadow-md transition-shadow` 추가
- 패딩: `p-4` 또는 `p-5` (컨텐츠에 따라)

---

## 3. 카테고리 뱃지 (Category Badge)

```tsx
// ✅ 올바른 사용 (모든 카테고리에 cyan 사용)
<span className="bg-cyan-100 text-cyan-600 px-2 py-0.5 text-xs font-bold rounded">
  카테고리명
</span>

// ❌ 잘못된 사용 (혼합 색상)
<span className="bg-purple-100 text-purple-600">나주의회</span>
<span className="bg-green-100 text-green-600">나주교육</span>
```

---

## 4. 버튼 스타일 (Button Styles)

```tsx
// Primary 버튼 (메인 액션)
<button className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3
                   rounded-lg font-medium transition-colors">
  버튼 텍스트
</button>

// Secondary 버튼 (보조 액션)
<button className="bg-cyan-50 hover:bg-cyan-100 text-cyan-600
                   px-4 py-2.5 rounded-lg font-bold transition-colors">
  보조 버튼
</button>

// Ghost 버튼 (텍스트만)
<button className="text-cyan-500 hover:text-cyan-600 font-medium">
  더보기 →
</button>
```

---

## 5. 페이지 레이아웃 (Page Layout)

```tsx
// ✅ 올바른 페이지 배경
<div className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 py-6">
    {/* 컨텐츠 */}
  </div>
</div>

// ❌ 잘못된 페이지 배경
<div className="min-h-screen bg-slate-50/50">  // 금지
<div className="min-h-screen bg-white">        // 금지
```

---

## 6. 히어로 섹션 (Hero Section)

```tsx
// 카테고리 페이지 히어로 예시
<div className="relative py-16 bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
  <div className="max-w-4xl mx-auto text-center">
    <h1 className="text-4xl md:text-5xl font-bold mb-4">페이지 제목</h1>
    <p className="text-lg md:text-xl text-white/90">설명 텍스트</p>
  </div>
</div>
```

**카테고리별 그라데이션:**
| 카테고리 | 그라데이션 |
|----------|-----------|
| 여행 | `from-cyan-500 to-blue-600` |
| 맛집 | `from-orange-500 to-red-500` |
| 비즈니스 | `from-slate-700 to-slate-900` |
| 기본 | `from-cyan-500 to-blue-600` |

---

## 7. 아이콘 사용 (Icons)

```tsx
// lucide-react 사용 (필수)
import { MapPin, Clock, ChevronRight } from 'lucide-react';

// 아이콘 크기
- 작은: w-4 h-4
- 중간: w-5 h-5
- 큰:   w-6 h-6

// 아이콘 색상 (cyan 기반)
<MapPin className="w-5 h-5 text-cyan-500" />
```

---

## 8. 반응형 브레이크포인트

```
┌─────────────────────────────────────────────────────────────┐
│  📱 Mobile First 접근                                       │
│                                                              │
│  - 기본: 모바일 (< 640px)                                   │
│  - sm:  태블릿 세로 (≥ 640px)                               │
│  - md:  태블릿 가로 (≥ 768px)                               │
│  - lg:  데스크톱 (≥ 1024px) - 주요 브레이크포인트           │
│  - xl:  대형 화면 (≥ 1280px)                                │
│                                                              │
│  📌 주요 규칙:                                               │
│     - 모바일 하단 탭바: lg:hidden                            │
│     - 데스크톱 사이드바: hidden lg:block                     │
│     - 그리드: grid-cols-1 lg:grid-cols-2                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. 컴포넌트 파일 구조

```
src/components/
├── StitchHeader.tsx      ← 통합 헤더 (필수)
├── StitchFooter.tsx      ← 통합 푸터 (필수)
├── MobileTabBar.tsx      ← 모바일 하단 탭바 (필수)
├── home/
│   ├── HeroSection.tsx
│   ├── MapSection.tsx
│   └── TravelSection.tsx
└── ui/                   ← 재사용 UI 컴포넌트
```

---

## 10. 새 페이지 생성 시 체크리스트

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ 새 페이지 생성 시 필수 체크리스트                       │
│                                                              │
│  □ 배경색: bg-gray-50 적용                                  │
│  □ 최대 너비: max-w-7xl mx-auto 적용                        │
│  □ 카드: bg-white rounded-xl shadow-sm border-gray-100      │
│  □ 카테고리 뱃지: bg-cyan-100 text-cyan-600                 │
│  □ 버튼 색상: cyan 계열 사용                                 │
│  □ 아이콘 색상: text-cyan-500                               │
│  □ 텍스트: gray 계열 (900/600/500)                          │
│  □ 모바일 패딩: pb-16 (하단 탭바 공간)                      │
│  □ lucide-react 아이콘 사용                                 │
│  □ 호버 효과: hover:shadow-md transition-shadow             │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. 컴포넌트 사용 예시

### 뉴스 카드 (News Card)

```tsx
<article className="bg-white rounded-xl p-4 shadow-sm border border-gray-100
                    hover:shadow-md transition-shadow cursor-pointer">
  <div className="flex gap-4">
    <div className="flex-1">
      <span className="inline-block px-2 py-0.5 text-xs font-bold rounded
                       bg-cyan-100 text-cyan-600 mb-2">
        카테고리
      </span>
      <h4 className="text-base font-bold text-gray-900 leading-tight
                     line-clamp-2 mb-1">
        뉴스 제목
      </h4>
      <p className="text-gray-500 text-xs">시간 · 출처</p>
    </div>
    <div className="w-20 h-20 shrink-0 rounded-lg bg-gray-200 overflow-hidden">
      <Image src={...} alt={...} fill className="object-cover" />
    </div>
  </div>
</article>
```

### 섹션 헤더 (Section Header)

```tsx
<div className="flex items-center justify-between mb-4">
  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
    <MapIcon className="w-5 h-5 text-cyan-500" />
    섹션 제목
  </h3>
  <Link href="#" className="text-gray-500 text-xs font-medium hover:text-cyan-500">
    더보기 &gt;
  </Link>
</div>
```

---

## 12. 그라데이션 오버레이 색상 가이드

| 지역/카테고리 | 오버레이 색상 | Tailwind 클래스 |
|--------------|---------------|-----------------|
| 기본 (cyan) | cyan → blue | `from-cyan-600/85 to-blue-600/70` |
| 맛집/음식 | orange → red | `from-orange-600/85 to-red-500/70` |
| 비즈니스 | slate → gray | `from-slate-700/85 to-gray-600/70` |
| 자연/여행 | emerald → teal | `from-emerald-600/85 to-teal-500/70` |
| 문화/역사 | amber → orange | `from-amber-600/85 to-orange-500/70` |
| 해양/바다 | blue → indigo | `from-blue-600/85 to-indigo-500/70` |
