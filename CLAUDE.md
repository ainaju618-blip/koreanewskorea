# koreanewskorea 프로젝트 AI 규칙

---

## 🔴 개발 우선순위 (MUST READ)

```
┌─────────────────────────────────────────────────────────────┐
│  📌 개발 순서 (절대 준수!)                                   │
│                                                              │
│  1단계: 메인 페이지 (/) ━━━━━━━━━━━━━━━━━━━━━━━ 최우선     │
│         → main-hero.png 적용                                 │
│         → HeroSection API 연동                               │
│         → MapSection 지역 클릭 네비게이션                    │
│                                                              │
│  2단계: 시/도 서브 페이지 (/region/[sido]) ━━━━━━━━ 다음    │
│         → 전국 17개 시/도 페이지                             │
│         → 히어로 이미지 + 뉴스 연동                          │
│                                                              │
│  3단계: 시/군 서브서브 페이지 (/region/[sido]/[sigungu])    │
│         → 중점 지역: 나주, 진도 ⭐                           │
│         → 나주 특화 페이지 완성                              │
│         → 진도 특화 페이지 생성                              │
│                                                              │
│  📋 상세 계획: docs/DEVELOPMENT_PLAN.md                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 핵심 원칙 (P0 - 절대 규칙)

### 🔴 DB 분리 원칙 (2026-01-05 확정)
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ 중요: 이 프로젝트는 완전히 별도의 Supabase DB를 사용!   │
│                                                              │
│  📌 DB 분리 구조:                                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  koreanewskorea (이 프로젝트)                         │  │
│  │  └── Supabase: ainaju618@gmail.com 계정 (신규 DB)     │  │
│  │      └── 전국 17개 시·도 보도자료                     │  │
│  │      └── 정부 보도자료 (korea.kr, 각 부처)            │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  koreanewsone-clone (운영)                            │  │
│  │  └── Supabase: kyh6412057153 계정 (기존 DB)           │  │
│  │      └── 광주/전남 27개 지역 보도자료                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ❌ 더 이상 DB 공유 안함!                                    │
│  ✅ 완전히 독립된 데이터 운영                                │
└─────────────────────────────────────────────────────────────┘
```

### 스크래퍼 운영 원칙
```
┌─────────────────────────────────────────────────────────────┐
│  📌 이 프로젝트는 "전국 17개 시·도 + 정부" 보도자료 담당    │
│                                                              │
│  ✅ 허용 (이 프로젝트 담당):                                 │
│     - 전국 17개 시·도청 보도자료 스크래핑                    │
│     - 정부 보도자료 (korea.kr, 각 부처)                      │
│     - scrapers/templates/ 템플릿 활용                        │
│     - ainaju618@gmail.com Supabase에 저장                    │
│                                                              │
│  ❌ 금지:                                                    │
│     - 광주/전남 27개 지역 스크래퍼 (koreanewsone-clone 담당) │
│     - kyh6412057153 Supabase 접근                            │
│                                                              │
│  📌 스크래퍼 참조:                                           │
│     - koreanewsone-clone/scrapers/ 폴더 형식 참고            │
│     - Playwright 기반, utils/ 유틸리티 활용                  │
└─────────────────────────────────────────────────────────────┘
```

### 🗺️ 전국 17개 시·도 보도자료 URL (2026-01-05)
```
┌─────────────────────────────────────────────────────────────┐
│  📌 광역시 (6개)                                            │
│  ├── 서울특별시: https://www.seoul.go.kr/news/news_report.do│
│  ├── 부산광역시: https://www.busan.go.kr/nbtnewsBU           │
│  ├── 대구광역시: https://www.daegu.go.kr (시정뉴스→보도자료)│
│  ├── 인천광역시: https://www.incheon.go.kr (소통참여→새소식)│
│  ├── 광주광역시: https://www.gwangju.go.kr (시정소식→보도자료)│
│  └── 대전광역시: https://www.daejeon.go.kr (소식참여→보도자료)│
│                                                              │
│  📌 특별시·특별자치시 (2개)                                 │
│  ├── 서울특별시: (위 참조)                                   │
│  └── 세종특별자치시: https://www.sejong.go.kr               │
│                                                              │
│  📌 도 (9개)                                                │
│  ├── 경기도: https://gnews.gg.go.kr/briefing/brief_gongbo.do│
│  ├── 강원특별자치도: https://www.province.gangwon.kr        │
│  ├── 충청북도: https://www.chungbuk.go.kr                   │
│  ├── 충청남도: https://www.chungnam.go.kr                   │
│  ├── 전라북도: https://www.jeonbuk.go.kr                    │
│  ├── 전라남도: https://www.jeonnam.go.kr                    │
│  ├── 경상북도: https://www.gb.go.kr                         │
│  ├── 경상남도: https://www.gyeongnam.go.kr                  │
│  └── 제주특별자치도: https://www.jeju.go.kr                 │
│                                                              │
│  ⚠️ 각 사이트 메뉴 구조가 다르므로 실제 URL 확인 필요!      │
└─────────────────────────────────────────────────────────────┘
```

---

## 프로젝트 아키텍처

### 역할 분리 (DB 완전 분리)
```
┌─────────────────────────────────────────────────────────────┐
│                    🔴 DB 완전 분리 구조                     │
├─────────────────────────────┬───────────────────────────────┤
│  Supabase #1 (kyh6412057153)│  Supabase #2 (ainaju618)     │
│  xdcxfaoucvzfrryhczmy       │  ebagdrupjfwkawbwqjjg        │
├─────────────────────────────┼───────────────────────────────┤
│           ↑                 │           ↑                   │
│  koreanewsone-clone/        │  koreanewskorea/              │
│  (운영 - 포트 3000)         │  (개발 - 포트 3001)           │
│                             │                               │
│  ✅ 광주/전남 27개 지역     │  ✅ 전국 17개 시·도 보도자료  │
│  ✅ 지역 스크래퍼 운영      │  ✅ 정부 보도자료 (korea.kr)  │
│  ✅ koreanewsone.com        │  ✅ koreanewskorea.com (예정) │
└─────────────────────────────┴───────────────────────────────┘
```

### 폴더 구조
```
d:\cbt\koreanewskorea\
│
├── web/                      ← 🟢 메인: Next.js 프론트엔드
│   └── (전국판 웹사이트 개발)
│
├── scrapers/                 ← 🟢 전국 스크래퍼만 운영
│   └── templates/            ← 전국 스크래퍼 템플릿
│       └── base_scraper.py
│
├── backupscrapers/           ← 🔒 백업 (사용 안함)
│   └── (기존 27개 지역 스크래퍼 보관)
│
├── processors/               ← AI 가공 (필요시)
│
└── .env                      ← koreanews-live와 동일 DB 연결
```

---

## 📝 문서 작성 규칙

| 항목 | 언어 | 예시 |
|------|------|------|
| **문서 파일** (.md) | 한글 | README.md, 가이드 문서 |
| **코드 주석** | 영어 | `// This function...` |
| **변수/함수명** | 영어 | `getUserById`, `articleList` |
| **UI 텍스트** | 한글 | "저장", "취소", "로그인" |
| **커밋 메시지** | 영어 | `fix: resolve login issue` |

---

## 로컬 개발 환경

| 항목 | 값 |
|------|-----|
| 포트 | 3001 |
| DB | 🔴 Supabase (ainaju618@gmail.com - 별도 DB) |
| 도메인 (목표) | koreanewskorea.com |

```bash
# 웹 실행
npm run dev -- -p 3001

# 또는 PM2로 실행
pm2 start ecosystem.config.js --only koreanewskorea
```

### 환경 변수 설정 (.env.local)
```
# 🔴 주의: ainaju618@gmail.com 계정의 Supabase 사용!
NEXT_PUBLIC_SUPABASE_URL=https://ebagdrupjfwkawbwqjjg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYWdkcnVwamZ3a2F3YndxampnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTk4NjUsImV4cCI6MjA4MTU3NTg2NX0.wngOV0yCHDWI1ONQhcRNgEIQflp_fGSQkkA9v8Fq9JA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYWdkcnVwamZ3a2F3YndxampnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk5OTg2NSwiZXhwIjoyMDgxNTc1ODY1fQ.-VkZPHzBtsvLKKu3rv4-ORi5UIW_oPHJgqUguaqi94s
```

---

## 저장소 및 배포 정보

> **⚠️ 완전 분리된 인프라 (GitHub, Vercel, Supabase 모두 별도)**

| 항목 | koreanewskorea | koreanewsone-clone |
|------|----------------|---------------------|
| **GitHub** | ainaju618-blip/koreanewskorea | korea-news/koreanewsone |
| **Vercel** | ainaju618-blip 계정 | koreanews-projects |
| **Supabase** | 🔴 ainaju618@gmail.com (신규) | kyh6412057153 계정 |
| **포트** | 3001 | 3000 |
| **도메인** | koreanewskorea.com (예정) | koreanewsone.com |

```
┌─────────────────────────────────────────────────────────────┐
│  [완전 분리 구조 - DB 포함]                                  │
│                                                              │
│  koreanewskorea/                 koreanewsone-clone/        │
│  ├── GitHub: ainaju618-blip     ├── GitHub: korea-news      │
│  │   └── koreanewskorea         │   └── koreanewsone        │
│  ├── Vercel: ainaju618-blip     ├── Vercel: koreanews-proj  │
│  └── Supabase: ainaju618        └── Supabase: kyh6412057153 │
│           ↓ (신규 DB)                    ↓ (기존 DB)         │
│     [전국 17개 시·도]             [광주/전남 27개 지역]      │
│     [정부 보도자료]                                          │
│                                                              │
│  ❌ 더 이상 DB 공유 안함!                                    │
└─────────────────────────────────────────────────────────────┘
```

### Git 설정
```bash
# koreanewskorea Git 설정
git remote: https://github.com/ainaju618-blip/koreanewskorea.git
git user.email: ainaju618@gmail.com
git user.name: ainaju618-blip
```

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| **[docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md)** | **🔴 개발 우선순위 계획서 (작업 전 필독!)** |
| **[docs/MASTER_PLAN.md](docs/MASTER_PLAN.md)** | **📌 통합 마스터 기획서** |
| **[docs/NATIONAL_EDITION_IA.md](docs/NATIONAL_EDITION_IA.md)** | **📌 전국판 IA/라우팅 구현 문서** |
| [docs/기획.md](docs/기획.md) | 원본 기획서 |
| [docs/PLAN_koreanewskorea_rebuild.md](docs/PLAN_koreanewskorea_rebuild.md) | 전국판 확장 계획 |
| [README.md](README.md) | 프로젝트 개요 |

---

## 📋 계획서 관리 규칙 (MUST)

```
┌─────────────────────────────────────────────────────────────┐
│  📌 개발 작업 전/후 계획서 확인 및 업데이트 필수!           │
│                                                              │
│  🔍 작업 시작 전 (BEFORE):                                   │
│     1. docs/MASTER_PLAN.md 읽기                              │
│     2. 현재 진행 상황 및 우선순위 확인                       │
│     3. 관련 구현 문서 (NATIONAL_EDITION_IA.md 등) 확인       │
│                                                              │
│  ✅ 작업 완료 후 (AFTER):                                    │
│     1. MASTER_PLAN.md Phase 작업 상태 업데이트               │
│        - 🔜 → ✅ 완료 상태 변경                              │
│        - 완료 날짜 기록                                      │
│     2. "최신 업데이트" 섹션에 완료 내역 추가                 │
│     3. 관련 구현 문서에 세부 내용 기록                       │
│                                                              │
│  📝 업데이트 양식:                                           │
│     | 작업 | 상태 | 날짜 |                                   │
│     |------|------|------|                                   │
│     | OOO 구현 | ✅ 완료 | 2026-01-04 |                      │
│                                                              │
│  ⚠️ 주의사항:                                                │
│     - 계획서 업데이트 없이 작업 완료 보고 금지               │
│     - 새로운 작업 항목 발생 시 계획서에 추가                 │
│     - 문서 버전 번호 업데이트 (v2.0 → v2.1)                  │
└─────────────────────────────────────────────────────────────┘
```

### 계획서 우선순위

1. **MASTER_PLAN.md** - 전체 프로젝트 로드맵 (Phase별 진행상황)
2. **NATIONAL_EDITION_IA.md** - 전국판 IA/라우팅 상세
3. 기타 문서 - 필요시 참조

---

## 역할 분담

- **Perplexity AI** = 두뇌 (기획/분석/해결)
- **Claude Code** = 손 (실행/구현)

## 에러 규칙

- 에러 1회 → 자체 해결
- 같은 에러 2회 → STOP → 에러 보고서 출력

---

## 🎨 디자인 시스템 가이드라인 (Stitch Design System)

> **⚠️ 중요: 2026년 1월 개편 후 모든 페이지는 아래 디자인 시스템을 반드시 준수해야 합니다.**

### 1. 색상 시스템 (Color System)

```
┌─────────────────────────────────────────────────────────────┐
│  🎨 Stitch 디자인 시스템 색상 팔레트                        │
│                                                              │
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

### 2. 카드 컴포넌트 (Card Components)

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

### 3. 카테고리 뱃지 (Category Badge)

```tsx
// ✅ 올바른 사용 (모든 카테고리에 cyan 사용)
<span className="bg-cyan-100 text-cyan-600 px-2 py-0.5 text-xs font-bold rounded">
  카테고리명
</span>

// ❌ 잘못된 사용 (혼합 색상)
<span className="bg-purple-100 text-purple-600">나주의회</span>
<span className="bg-green-100 text-green-600">나주교육</span>
```

### 4. 버튼 스타일 (Button Styles)

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

### 5. 페이지 레이아웃 (Page Layout)

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

### 6. 히어로 섹션 (Hero Section)

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
- 여행: `from-cyan-500 to-blue-600`
- 맛집: `from-orange-500 to-red-500`
- 비즈니스: `from-slate-700 to-slate-900`
- 기본: `from-cyan-500 to-blue-600`

### 7. 아이콘 사용 (Icons)

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

### 8. 반응형 브레이크포인트

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

### 9. 컴포넌트 파일 구조

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

### 10. 체크리스트 (새 페이지 생성 시)

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

## 🔧 컴포넌트 사용 예시

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

## 🍌 나노바나나 (Nano Banana) AI 이미지 생성 가이드

> **Google Gemini 2.5 Flash + Imagen 4 기반 AI 이미지 생성 도구**
> 히어로 섹션 배경 이미지 등 프로젝트 이미지 에셋 제작에 활용

### 1. 나노바나나란?

```
┌─────────────────────────────────────────────────────────────┐
│  🍌 Nano Banana (나노바나나)                                │
│                                                              │
│  - Google의 AI 이미지 생성 모델                              │
│  - Gemini 2.5 Flash + Imagen 4 이중 구조                    │
│  - 2025년 8월 정식 출시                                      │
│                                                              │
│  📌 주요 특징:                                               │
│     - 캐릭터/사물 일관성 유지 우수                           │
│     - 한국어 프롬프트 지원                                   │
│     - 복잡한 장면 묘사 이해력 뛰어남                         │
│     - 대화형 편집 가능 (생성 후 수정 요청)                   │
└─────────────────────────────────────────────────────────────┘
```

### 2. 접근 방법

| 방법 | URL | 비용 |
|------|-----|------|
| **Gemini 앱** | gemini.google.com | 무료 (제한) / Plus 구독 |
| **Google AI Studio** | aistudio.google.com | 무료 (Nano Banana) |
| **캐럿 AI** | carat.im | 무료 (제한) |

**Gemini 앱에서 사용:**
1. 도구 메뉴 → '🍌이미지 만들기' 선택
2. 모델 메뉴 → '빠른 모드' (일반) 또는 '사고 모드' (Pro)
3. 프롬프트 입력 또는 이미지 업로드 후 편집 요청

### 3. 프롬프트 작성법

```
┌─────────────────────────────────────────────────────────────┐
│  📝 나노바나나 프롬프트 작성 공식                           │
│                                                              │
│  기본 구조:                                                  │
│  <피사체> + <동작/상태> + <장면/배경> + <스타일>            │
│                                                              │
│  예시:                                                       │
│  "한국 전통 한옥 마을, 새벽 안개가 피어오르는 풍경,         │
│   영화 같은 시네마틱 분위기, 울트라 와이드, 16:9 비율"      │
│                                                              │
│  📌 팁:                                                      │
│     ✅ 완전한 문장으로 서술 (키워드 나열 X)                  │
│     ✅ 구체적으로 묘사 (오른쪽 다리를 꼬고 앉아있는...)     │
│     ✅ 기본 이미지 생성 후 대화로 점진적 개선               │
│     ✅ 조명, 그림자, 분위기 함께 요청                        │
│     ❌ 한 번에 너무 많은 요소 요구 금지                      │
│     ❌ 채팅이 길어지면 성능 저하 (새 대화 권장)             │
└─────────────────────────────────────────────────────────────┘
```

### 4. 히어로 배경 이미지 프롬프트 (카테고리별)

#### 🗺️ 여행 카테고리
```
한국 전통 한옥 마을과 자연 풍경이 어우러진 아름다운 장면.
새벽 안개가 살짝 피어오르고, 멀리 산이 보이는 평화로운 분위기.
영화 같은 시네마틱 색감, 따뜻한 골든아워 조명.
웹사이트 히어로 배너용 이미지, 가로로 긴 파노라마 비율 (16:9).
텍스트가 올라갈 공간을 위해 중앙~오른쪽에 여백 확보.
```

#### 🍜 맛집 카테고리
```
한국 전통 음식이 가득 차려진 상, 따뜻한 김이 피어오르는 장면.
비빔밥, 불고기, 전 등 다양한 한식이 정갈하게 놓여 있음.
따뜻하고 식욕을 돋우는 조명, 프로페셔널 푸드 포토그래피 스타일.
웹사이트 히어로 배너용 이미지, 가로로 긴 파노라마 비율 (16:9).
왼쪽에 텍스트 공간을 위한 약간 어두운 영역 확보.
```

#### 💼 비즈니스 카테고리
```
대한민국 현대적인 도시 스카이라인, 해질녘 황금빛 하늘.
유리 빌딩들이 늘어선 세련된 도심 풍경, 전문적이고 신뢰감 있는 분위기.
모던하고 깔끔한 색감, 기업적이고 프로페셔널한 느낌.
웹사이트 히어로 배너용 이미지, 가로로 긴 파노라마 비율 (16:9).
상단에 텍스트가 들어갈 수 있도록 하늘 영역 충분히 확보.
```

#### 🏛️ 지역 페이지 (예: 나주)
```
나주 영산강변의 아름다운 풍경, 나주배 과수원과 전통 한옥이 조화를 이룸.
부드러운 아침 햇살, 평화롭고 풍요로운 농촌 분위기.
따뜻한 파스텔 톤 색감, 자연스럽고 편안한 느낌.
웹사이트 히어로 배너용 이미지, 가로로 긴 파노라마 비율 (16:9).
중앙에 텍스트가 들어갈 수 있도록 여백 확보.
```

#### 🏠 메인 홈페이지
```
대한민국 전국 지도를 배경으로 한 추상적이고 현대적인 그래픽.
서울, 부산, 광주 등 주요 도시들이 빛나는 점으로 연결된 네트워크 느낌.
사이언(cyan) 계열 (#06B6D4)을 주요 색상으로 사용.
뉴스와 정보가 흐르는 역동적인 느낌, 깔끔하고 모던한 디자인.
웹사이트 히어로 배너용 이미지, 가로로 긴 파노라마 비율 (16:9).
```

### 5. 이미지 편집 프롬프트

```
# 배경 변경
이 이미지의 배경을 석양이 지는 바닷가로 변경해줘.

# 요소 제거
이 사진에서 왼쪽에 있는 사람을 제거해줘.

# 색감 조정
이 이미지를 좀 더 따뜻한 골든아워 색감으로 바꿔줘.

# 텍스트 공간 확보
이 이미지 왼쪽에 텍스트가 들어갈 수 있도록 약간 어두운 그라데이션 영역을 추가해줘.
```

### 6. 이미지 사양 (웹사이트용)

```
┌─────────────────────────────────────────────────────────────┐
│  📐 히어로 배경 이미지 권장 사양                            │
│                                                              │
│  📌 해상도:                                                  │
│     - 데스크톱: 1920 x 600 px (또는 1920 x 800 px)          │
│     - 모바일: 750 x 500 px                                  │
│                                                              │
│  📌 비율: 16:9 또는 3:1 (배너형)                            │
│                                                              │
│  📌 파일 형식:                                               │
│     - WebP 권장 (Next.js Image 자동 최적화)                 │
│     - PNG (투명 배경 필요시)                                 │
│     - JPG (사진형 이미지)                                    │
│                                                              │
│  📌 파일 크기: 500KB 이하 권장                              │
│                                                              │
│  📌 저장 위치: public/images/hero/                          │
│     - travel-hero.webp                                       │
│     - food-hero.webp                                         │
│     - business-hero.webp                                     │
│     - naju-hero.webp                                         │
└─────────────────────────────────────────────────────────────┘
```

### 7. Next.js 코드 적용 예시

```tsx
// 히어로 섹션에 배경 이미지 적용
<section className="relative py-16 text-white overflow-hidden">
  {/* 배경 이미지 */}
  <Image
    src="/images/hero/travel-hero.webp"
    alt="여행 배경"
    fill
    className="object-cover"
    priority  // LCP 최적화
  />
  {/* 그라데이션 오버레이 */}
  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/80 to-blue-600/60" />

  {/* 콘텐츠 */}
  <div className="relative z-10 max-w-4xl mx-auto text-center">
    <h1 className="text-4xl md:text-5xl font-bold mb-4">여행 가이드</h1>
    <p className="text-lg md:text-xl text-white/90">대한민국 방방곡곡 여행지</p>
  </div>
</section>
```

### 8. 참고 링크

| 리소스 | URL |
|--------|-----|
| Gemini 앱 | https://gemini.google.com |
| Google AI Studio | https://aistudio.google.com |
| 나노바나나 가이드 (캐럿) | https://carat.im/blog/nano-banana-ai-guide |
| 나노바나나 공식 블로그 | https://blog.google/intl/ko-kr/company-news/technology/nano-banana-pro/ |

### 9. 🚨 지역/카테고리 페이지 생성 시 필수 작업 (MUST)

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ 새 지역 또는 카테고리 페이지 생성 시                    │
│     반드시 나노바나나로 히어로 배경 이미지를 생성해야 함!   │
│                                                              │
│  📋 작업 순서:                                               │
│     1. 나노바나나로 해당 지역/카테고리 대표 이미지 생성     │
│     2. public/images/hero/[지역명]-hero.png 로 저장         │
│     3. 페이지에 히어로 배경 이미지 패턴 적용                │
│     4. 그라데이션 오버레이 색상 설정                        │
│                                                              │
│  ❌ 금지: 히어로 이미지 없이 단순 그라데이션만 사용         │
│  ✅ 필수: 나노바나나 생성 이미지 + 그라데이션 오버레이     │
└─────────────────────────────────────────────────────────────┘
```

#### 지역별 대표 이미지 프롬프트 템플릿

| 지역 | 대표 요소 | 프롬프트 키워드 |
|------|-----------|-----------------|
| 나주 | 영산강, 나주배, 금성관 | 영산강변 풍경, 배 과수원, 전통 한옥 |
| 목포 | 유달산, 목포대교, 항구 | 유달산 일출, 목포대교 야경, 어항 풍경 |
| 순천 | 순천만, 낙안읍성, 정원 | 순천만 갈대밭, 낙안읍성 한옥, 국가정원 |
| 여수 | 여수밤바다, 오동도, 해상케이블카 | 여수 밤바다 야경, 오동도 동백꽃, 해상 풍경 |
| 광주 | 무등산, 충장로, 국립아시아문화전당 | 무등산 주상절리, 도심 야경, 현대적 문화공간 |
| 담양 | 죽녹원, 메타세쿼이아길, 소쇄원 | 대나무 숲, 메타세쿼이아 가로수, 정원 풍경 |
| 보성 | 녹차밭, 보성다원 | 초록빛 차밭 언덕, 안개 낀 다원 새벽 풍경 |
| 해남 | 땅끝마을, 두륜산, 대흥사 | 땅끝 바다 풍경, 두륜산 운해, 사찰 풍경 |
| 완도 | 완도타워, 청산도, 해조류 | 청산도 느린섬 풍경, 에메랄드빛 바다 |
| 진도 | 신비의 바닷길, 운림산방 | 바닷길 기적, 진도개, 전통 민화 분위기 |

#### 프롬프트 생성 공식 (지역용)

```
[지역명]의 대표적인 [랜드마크/자연경관] 풍경.
[시간대/계절] 분위기, [특징적인 요소] 가 보임.
[색감/조명] 톤, [분위기 형용사] 느낌.
웹사이트 히어로 배너용 이미지, 가로로 긴 파노라마 비율 (16:9).
[텍스트 배치 위치]에 텍스트가 들어갈 공간 확보.
```

#### 예시: 목포 지역 페이지

```
목포 유달산에서 바라본 목포대교와 항구의 아름다운 야경.
해질녘 황금빛 하늘이 바다에 반사되는 모습, 불 밝힌 목포대교가 보임.
따뜻한 오렌지와 보라색이 어우러진 색감, 낭만적이고 감성적인 느낌.
웹사이트 히어로 배너용 이미지, 가로로 긴 파노라마 비율 (16:9).
왼쪽에 텍스트가 들어갈 수 있도록 약간 어두운 영역 확보.
```

#### 그라데이션 오버레이 색상 가이드

| 지역/카테고리 | 오버레이 색상 | Tailwind 클래스 |
|--------------|---------------|-----------------|
| 기본 (cyan) | cyan → blue | `from-cyan-600/85 to-blue-600/70` |
| 맛집/음식 | orange → red | `from-orange-600/85 to-red-500/70` |
| 비즈니스 | slate → gray | `from-slate-700/85 to-gray-600/70` |
| 자연/여행 | emerald → teal | `from-emerald-600/85 to-teal-500/70` |
| 문화/역사 | amber → orange | `from-amber-600/85 to-orange-500/70` |
| 해양/바다 | blue → indigo | `from-blue-600/85 to-indigo-500/70` |

---

**⚠️ 이 가이드라인은 koreanewskorea 프로젝트의 디자인 일관성을 위해 작성되었습니다.**
**모든 개발자는 새 페이지/컴포넌트 작성 시 반드시 이 가이드라인을 준수해야 합니다.**
