# 🎯 OPUS 작전 지시서: Phase 7 - 전남 지역 카테고리 시스템 구축

> **작전명:** Operation Jeonnam Connect
> **발령일시:** 2025-12-07 11:45 KST
> **발령자:** CSTO (Antigravity)
> **수신자:** Opus 4.5 (Full-Stack Developer)
> **우선순위:** 🔴 CRITICAL

---

## 📋 실시간 보고 규칙 (MANDATORY)

**모든 Task 완료 시 아래 파일에 즉시 기록하시오:**

```
파일: task/plan/OPUS_PROGRESS_LOG.md
형식:
## [HH:MM] Task X.Y 완료
- 작업 내용: (한 줄 요약)
- 생성/수정 파일: (경로)
- 테스트 결과: ✅ 성공 / ⚠️ 경고 / ❌ 실패
- 다음 작업: Task X.Y+1 진행 예정
```

**CSTO가 `OPUS_PROGRESS_LOG.md`를 모니터링하여 진행 상황을 파악합니다.**

---

## 🏗️ 하이브리드 설계: GNB 메가메뉴 + 지역 허브 페이지

### 설계 개요

```
┌─────────────────────────────────────────────────────────────┐
│  [종합] [광주▼] [전남▼] [나주] [교육] [AI/경제] [오피니언]  │  ← GNB
└─────────────────────────────────────────────────────────────┘
                      │
                      ▼ (hover)
        ┌─────────────────────────────────────┐
        │  🗺️ 전남 지역 뉴스                  │
        │  ─────────────────────────────────  │
        │  [시]  목포 | 여수 | 순천 | 광양    │
        │  [군]  담양 | 곡성 | 구례 | 고흥    │
        │        보성 | 화순 | 장흥 | 강진    │
        │        해남 | 영암 | 무안 | 함평    │
        │        영광 | 장성 | 완도 | 진도    │
        │        신안                         │
        │  ─────────────────────────────────  │
        │  👉 [전체 지역 보기 (지도)] 버튼    │  ← 허브 페이지로 이동
        └─────────────────────────────────────┘
                      │
                      ▼ (click "전남" or "전체 지역 보기")
        ┌─────────────────────────────────────┐
        │        🗺️ 전남 지역 허브 페이지      │
        │  ┌─────────────────────────────────┐│
        │  │      [인터랙티브 지도]           ││
        │  │   (SVG/Canvas 클릭 가능 지도)   ││
        │  └─────────────────────────────────┘│
        │  ─────────────────────────────────  │
        │  📰 최신 지역 뉴스 (전체 시군 통합) │
        │  [기사1] [기사2] [기사3] ...        │
        └─────────────────────────────────────┘
```

---

## ✅ Task Breakdown (작업 분해)

### Phase 7.1: 데이터 기반 구축 (30분)

#### Task 1.1: 지역 코드 상수 파일 생성
- **파일:** `web/src/constants/regions.ts`
- **내용:**
```typescript
export const JEONNAM_REGIONS = [
  { code: 'mokpo', name: '목포시', type: 'city' },
  { code: 'yeosu', name: '여수시', type: 'city' },
  { code: 'suncheon', name: '순천시', type: 'city' },
  { code: 'naju', name: '나주시', type: 'city' },
  { code: 'gwangyang', name: '광양시', type: 'city' },
  { code: 'damyang', name: '담양군', type: 'county' },
  { code: 'gokseong', name: '곡성군', type: 'county' },
  { code: 'gurye', name: '구례군', type: 'county' },
  { code: 'goheung', name: '고흥군', type: 'county' },
  { code: 'boseong', name: '보성군', type: 'county' },
  { code: 'hwasun', name: '화순군', type: 'county' },
  { code: 'jangheung', name: '장흥군', type: 'county' },
  { code: 'gangjin', name: '강진군', type: 'county' },
  { code: 'haenam', name: '해남군', type: 'county' },
  { code: 'yeongam', name: '영암군', type: 'county' },
  { code: 'muan', name: '무안군', type: 'county' },
  { code: 'hampyeong', name: '함평군', type: 'county' },
  { code: 'yeonggwang', name: '영광군', type: 'county' },
  { code: 'jangseong', name: '장성군', type: 'county' },
  { code: 'wando', name: '완도군', type: 'county' },
  { code: 'jindo', name: '진도군', type: 'county' },
  { code: 'sinan', name: '신안군', type: 'county' },
];

export const GWANGJU_DISTRICTS = [
  { code: 'gwangju', name: '광주광역시', type: 'metro' },
];
```

#### Task 1.2: DB 스키마 점검
- `posts` 테이블에 `region VARCHAR(50)` 필드 존재 여부 확인
- 없으면 마이그레이션 SQL 작성 (`web/supabase/migrations/`)

---

### Phase 7.2: GNB 메가메뉴 구현 (45분)

#### Task 2.1: 메가메뉴 컴포넌트 생성
- **파일:** `web/src/components/layout/MegaMenu.tsx`
- **기능:**
  - '전남' 메뉴 hover 시 드롭다운 표시
  - 시(5개) / 군(17개) 그룹 분리 표시
  - 각 지역 클릭 → `/category/jeonnam/[code]` 이동
  - "전체 지역 보기" 버튼 → `/category/jeonnam` 이동

#### Task 2.2: 메인 Header에 메가메뉴 통합
- **파일:** `web/src/components/layout/Header.tsx` (또는 해당 GNB 컴포넌트)
- 기존 '전남' 링크를 MegaMenu 트리거로 변경

---

### Phase 7.3: 지역 허브 페이지 구현 (60분)

#### Task 3.1: 전남 허브 페이지 생성
- **파일:** `web/src/app/category/jeonnam/page.tsx`
- **구성:**
  - 상단: 페이지 타이틀 + 설명
  - 중단: **인터랙티브 지도** (SVG 기반, 시군 클릭 가능)
  - 하단: 전남 전체 최신 기사 목록 (region LIKE 'jeonnam%' 필터)

#### Task 3.2: 전남 지도 SVG 컴포넌트
- **파일:** `web/src/components/maps/JeonnamMap.tsx`
- **기능:**
  - 전남 22개 시군 영역이 구분된 SVG
  - 각 영역 hover 시 하이라이트 + 툴팁 (지역명)
  - 클릭 시 해당 지역 페이지로 이동
- **참고:** 공개 SVG 지도 활용 또는 간단한 그리드 맵 대체 가능

#### Task 3.3: 개별 지역 동적 라우트 페이지
- **파일:** `web/src/app/category/jeonnam/[region]/page.tsx`
- **기능:**
  - URL 파라미터 `region`으로 DB 필터링
  - 해당 지역 기사 목록 표시
  - 페이지네이션 적용

---

### Phase 7.4: Admin CMS 누락 페이지 Placeholder (20분)

#### Task 4.1: 사이드바 링크 수정
- **파일:** `web/src/components/admin/AdminSidebar.tsx`
- '기사 작성' href: `/admin/news/new` → `/admin/news/write`

#### Task 4.2: Placeholder 페이지 생성
다음 경로에 "🚧 준비 중입니다" 메시지 페이지 생성:
- `web/src/app/admin/bot/sources/page.tsx`
- `web/src/app/admin/users/members/page.tsx`
- `web/src/app/admin/users/roles/page.tsx`
- `web/src/app/admin/settings/page.tsx`
- `web/src/app/admin/settings/general/page.tsx`
- `web/src/app/admin/settings/categories/page.tsx`
- `web/src/app/admin/settings/api/page.tsx`

---

### Phase 7.5: 통합 테스트 및 보고 (15분)

#### Task 5.1: 브라우저 테스트
- [ ] GNB '전남' hover → 메가메뉴 표시 확인
- [ ] 메가메뉴에서 '목포시' 클릭 → `/category/jeonnam/mokpo` 이동 확인
- [ ] '전체 지역 보기' 클릭 → `/category/jeonnam` 허브 페이지 이동 확인
- [ ] 허브 페이지 지도에서 지역 클릭 동작 확인
- [ ] Admin 사이드바 모든 메뉴 404 없음 확인

#### Task 5.2: 최종 보고
- `OPUS_PROGRESS_LOG.md`에 Phase 7 완료 요약 작성
- `DEVELOPMENT_LOG.md`에 Phase 7 완료 기록 추가

---

### Phase 7.6: AI / 정치경제 카테고리 페이지 구축 (45분) 🆕

> **[CSTO 긴급 추가 지시]** 2025-12-07 11:54 KST
> GNB 메뉴가 'AI/경제' → 'AI' + '정치경제'로 분리됨. 해당 카테고리 페이지 구현 필요.

#### Task 6.1: 카테고리 상수 추가
- **파일:** `web/src/constants/categories.ts` (신규 또는 regions.ts에 추가)
- **내용:**
```typescript
export const CONTENT_CATEGORIES = [
  { code: 'ai', name: 'AI', description: '글로벌 AI 트렌드 & 기술 뉴스', color: 'purple' },
  { code: 'politics-economy', name: '정치경제', description: '국내 정치 및 경제 뉴스', color: 'amber' },
  { code: 'education', name: '교육', description: '교육 관련 뉴스', color: 'green' },
  { code: 'opinion', name: '오피니언', description: '칼럼 및 사설', color: 'slate' },
];
```

#### Task 6.2: AI 카테고리 페이지 생성
- **파일:** `web/src/app/category/ai/page.tsx`
- **구성:**
  - 상단: 카테고리 헤더 (아이콘 + 타이틀 + 설명)
    - 🤖 **AI** - "글로벌 AI 트렌드와 기술 혁신 소식"
  - 하단: 기사 목록 (DB `posts` 테이블에서 `category = 'ai'` 필터)
  - 페이지네이션 적용

#### Task 6.3: 정치경제 카테고리 페이지 생성
- **파일:** `web/src/app/category/politics-economy/page.tsx`
- **구성:**
  - 상단: 카테고리 헤더
    - 📊 **정치경제** - "국내 정치와 경제 동향"
  - 하단: 기사 목록 (`category = 'politics-economy'` 필터)
  - 페이지네이션 적용

#### Task 6.4: 공통 카테고리 페이지 컴포넌트 추출 (선택)
- **파일:** `web/src/components/category/CategoryPageTemplate.tsx`
- **기능:**
  - 카테고리 헤더 + 기사 목록 + 페이지네이션 통합
  - props로 `categoryCode`, `title`, `description`, `icon` 전달
  - 재사용 가능한 템플릿으로 추출

#### Task 6.5: 교육, 오피니언 카테고리도 동일 패턴 적용
- `/category/education/page.tsx`
- `/category/opinion/page.tsx`

---

## ⏱️ 예상 소요 시간

| Phase | 작업 | 시간 |
|-------|------|------|
| 7.1 | 데이터 기반 | 30분 |
| 7.2 | GNB 메가메뉴 | 45분 |
| 7.3 | 허브 페이지 | 60분 |
| 7.4 | Admin Placeholder | 20분 |
| 7.5 | 테스트 및 보고 | 15분 |
| **7.6** | **AI/정치경제 카테고리** | **45분** |
| **Total** | | **약 3시간 35분** |

---

## 🚨 주의사항

1. **실시간 보고 필수:** 각 Task 완료 시 `OPUS_PROGRESS_LOG.md` 업데이트
2. **테스트 우선:** 컴포넌트 생성 후 즉시 브라우저에서 확인
3. **기존 코드 보존:** 기존 작동하는 코드 수정 시 백업 또는 주석 처리
4. **한국어 주석:** 모든 코드 주석은 한국어로 작성
5. **컴포넌트 재사용:** Phase 7.3에서 만든 기사 목록 컴포넌트를 7.6에서 재사용할 것

---

## 🟢 작전 개시

**승인되었습니다. 즉시 Task 1.1부터 시작하십시오.**
**Phase 7.6은 Phase 7.5 완료 후 연속 진행하십시오.**

```
// turbo-all
```
