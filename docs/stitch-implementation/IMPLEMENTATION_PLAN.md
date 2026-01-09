# Stitch 디자인 시안 구현 계획서

> 작성일: 2026-01-07
> 대상: koreanewskorea (개발서버 3001)

---

## 1. 디자인 시안 개요

| 파일 | 용도 | 적용 대상 |
|------|------|-----------|
| `stitch_/code.html` | 전국판 메인 | `src/app/(site)/page.tsx` |
| `stitch_ (1)/code.html` | 지도 & 정책 브리핑 | 신규 섹션 또는 `/map` |
| `stitch_ (2)/code.html` | 나주판 (지역 페이지) | `src/app/(site)/region/naju/page.tsx` |
| `stitch_ (3)/code.html` | 뉴스 상세 페이지 | `src/app/(site)/news/[id]/page.tsx` |

---

## 2. 공통 디자인 시스템

### 2.1 컬러 팔레트
```css
--primary: #3c83f6 (파란색)
--primary-dark: #1d4ed8
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-400: #9ca3af
--gray-500: #6b7280
--gray-700: #374151
--gray-900: #111827
```

### 2.2 타이포그래피
```css
font-family: 'Public Sans', 'Noto Sans KR', sans-serif;

/* 크기 */
text-xs: 12px
text-sm: 14px
text-base: 16px
text-lg: 18px
text-xl: 20px
text-2xl: 24px
text-3xl: 30px
```

### 2.3 아이콘
- **Material Symbols Rounded** 사용
- CDN: `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded`
- 사용 예: `<span class="material-symbols-rounded">home</span>`

### 2.4 레이아웃
- **모바일 퍼스트**: `max-w-md` (448px)
- **반응형**: 데스크톱에서는 중앙 정렬 + 최대폭 제한
- **Safe Area**: iOS 노치 대응 `pb-safe`

---

## 3. 추출할 공통 컴포넌트

### 3.1 레이아웃 컴포넌트
| 컴포넌트 | 파일 위치 | 설명 |
|----------|-----------|------|
| `MobileLayout` | `stitch-design/layout/MobileLayout.tsx` | 모바일 기본 레이아웃 (max-w-md 중앙정렬) |
| `BottomNav` | `stitch-design/layout/BottomNav.tsx` | 하단 네비게이션 (홈, 내지역, +, 스크랩, 전체) |
| `StickyHeader` | `stitch-design/layout/StickyHeader.tsx` | 고정 헤더 + 카테고리 탭 |

### 3.2 UI 컴포넌트
| 컴포넌트 | 파일 위치 | 설명 |
|----------|-----------|------|
| `CategoryChips` | `stitch-design/ui/CategoryChips.tsx` | 카테고리 필터 칩 (스크롤 가능) |
| `NewsCard` | `stitch-design/ui/NewsCard.tsx` | 뉴스 카드 (이미지 + 제목 + 메타) |
| `NewsListItem` | `stitch-design/ui/NewsListItem.tsx` | 뉴스 리스트 아이템 (썸네일 + 텍스트) |
| `HeroNews` | `stitch-design/ui/HeroNews.tsx` | 메인 히어로 뉴스 |
| `RegionGrid` | `stitch-design/ui/RegionGrid.tsx` | 지역 선택 그리드 |
| `QuickMenu` | `stitch-design/ui/QuickMenu.tsx` | 4열 빠른메뉴 아이콘 |
| `StatCard` | `stitch-design/ui/StatCard.tsx` | 통계 카드 (정책 브리핑용) |

### 3.3 섹션 컴포넌트
| 컴포넌트 | 파일 위치 | 설명 |
|----------|-----------|------|
| `LifestyleSection` | `stitch-design/sections/LifestyleSection.tsx` | 라이프스타일 위젯 영역 |
| `NewsletterCTA` | `stitch-design/sections/NewsletterCTA.tsx` | 뉴스레터 구독 CTA |
| `PolicyBriefing` | `stitch-design/sections/PolicyBriefing.tsx` | 정책 브리핑 피드 |
| `InteractiveMap` | `stitch-design/sections/InteractiveMap.tsx` | 인터랙티브 지역 지도 |

### 3.4 뉴스 상세 컴포넌트
| 컴포넌트 | 파일 위치 | 설명 |
|----------|-----------|------|
| `ArticleHeader` | `stitch-design/article/ArticleHeader.tsx` | 기사 헤더 (뒤로가기, 북마크, 공유) |
| `ArticleBody` | `stitch-design/article/ArticleBody.tsx` | 기사 본문 (이미지, 인용문 포함) |
| `ArticleQuote` | `stitch-design/article/ArticleQuote.tsx` | 인용문 블록 |
| `NativeAd` | `stitch-design/article/NativeAd.tsx` | 네이티브 광고 영역 |
| `RelatedNews` | `stitch-design/article/RelatedNews.tsx` | 관련 뉴스 섹션 |
| `CommentSection` | `stitch-design/article/CommentSection.tsx` | 댓글 영역 |
| `EngagementBar` | `stitch-design/article/EngagementBar.tsx` | 하단 고정 참여 바 |

---

## 4. 구현 우선순위

### Phase 1: 기반 작업 (Day 1)
```
1. 공통 레이아웃 컴포넌트
   - MobileLayout.tsx
   - BottomNav.tsx
   - StickyHeader.tsx

2. 공통 UI 컴포넌트
   - CategoryChips.tsx
   - NewsCard.tsx
   - NewsListItem.tsx
```

### Phase 2: 전국판 메인 (Day 2)
```
1. HeroNews.tsx
2. RegionGrid.tsx
3. LifestyleSection.tsx
4. NewsletterCTA.tsx

→ 적용: src/app/(site)/page.tsx 리뉴얼
```

### Phase 3: 지역 페이지 - 나주판 (Day 3)
```
1. QuickMenu.tsx
2. 지역 Hero 배너 수정

→ 적용: src/app/(site)/region/naju/page.tsx 리뉴얼
```

### Phase 4: 뉴스 상세 페이지 (Day 4)
```
1. ArticleHeader.tsx
2. ArticleBody.tsx + ArticleQuote.tsx
3. RelatedNews.tsx
4. CommentSection.tsx
5. EngagementBar.tsx

→ 적용: src/app/(site)/news/[id]/page.tsx 리뉴얼
```

### Phase 5: 지도 & 정책 브리핑 (Day 5)
```
1. InteractiveMap.tsx
2. StatCard.tsx
3. PolicyBriefing.tsx

→ 적용: 신규 섹션 또는 별도 페이지
```

---

## 5. 폴더 구조

```
src/components/stitch-design/
├── layout/
│   ├── MobileLayout.tsx
│   ├── BottomNav.tsx
│   └── StickyHeader.tsx
├── ui/
│   ├── CategoryChips.tsx
│   ├── NewsCard.tsx
│   ├── NewsListItem.tsx
│   ├── HeroNews.tsx
│   ├── RegionGrid.tsx
│   ├── QuickMenu.tsx
│   └── StatCard.tsx
├── sections/
│   ├── LifestyleSection.tsx
│   ├── NewsletterCTA.tsx
│   ├── PolicyBriefing.tsx
│   └── InteractiveMap.tsx
├── article/
│   ├── ArticleHeader.tsx
│   ├── ArticleBody.tsx
│   ├── ArticleQuote.tsx
│   ├── NativeAd.tsx
│   ├── RelatedNews.tsx
│   ├── CommentSection.tsx
│   └── EngagementBar.tsx
└── index.ts (배럴 export)
```

---

## 6. 기술 변환 가이드

### 6.1 HTML → TSX 변환 규칙
```tsx
// Before (HTML)
<div class="flex items-center gap-2">
  <span class="material-symbols-rounded">home</span>
</div>

// After (TSX)
<div className="flex items-center gap-2">
  <span className="material-symbols-rounded">home</span>
</div>
```

### 6.2 Material Symbols 설정
```tsx
// src/app/layout.tsx에 추가
<link
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0"
  rel="stylesheet"
/>
```

### 6.3 데이터 연동 패턴
```tsx
// 정적 데이터 → Supabase 연동
interface NewsItem {
  id: string;
  title: string;
  category: string;
  thumbnail?: string;
  created_at: string;
  source?: string;
}

// 서버 컴포넌트에서 fetch
async function getNews(): Promise<NewsItem[]> {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  return data || [];
}
```

---

## 7. 병렬 작업 전략

### 서브에이전트 활용
```
Agent 1: layout/ 폴더 컴포넌트 생성
Agent 2: ui/ 폴더 컴포넌트 생성
Agent 3: sections/ 폴더 컴포넌트 생성
Agent 4: article/ 폴더 컴포넌트 생성
```

### 작업 의존성
```
MobileLayout → 모든 페이지에서 사용
BottomNav → MobileLayout에 포함
CategoryChips → StickyHeader, 지역페이지에서 사용
NewsCard → 여러 섹션에서 재사용
```

---

## 8. 테스트 체크리스트

- [ ] 모바일 뷰포트 (375px, 390px, 414px)에서 정상 표시
- [ ] 태블릿 뷰포트 (768px)에서 정상 표시
- [ ] 데스크톱에서 max-w-md 중앙 정렬 확인
- [ ] iOS Safari에서 하단 네비게이션 safe-area 확인
- [ ] 다크모드 대응 (선택사항)
- [ ] Lighthouse 성능 점수 90+ 유지

---

## 9. 참고 원본 파일

| 디자인 | 경로 |
|--------|------|
| 전국판 메인 | `d:\cbt\koreanewskorea\a\stitch_\code.html` |
| 지도 & 정책 | `d:\cbt\koreanewskorea\a\stitch_ (1)\code.html` |
| 나주판 | `d:\cbt\koreanewskorea\a\stitch_ (2)\code.html` |
| 뉴스 상세 | `d:\cbt\koreanewskorea\a\stitch_ (3)\code.html` |
