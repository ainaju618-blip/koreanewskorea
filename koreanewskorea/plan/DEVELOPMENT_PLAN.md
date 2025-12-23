# Development Plan - Regional Homepage System (v2)

> **파일:** `koreanewskorea/plan/DEVELOPMENT_PLAN.md`
> **Created:** 2025-12-23
> **Updated:** 2025-12-23 (의견 반영)
> **Status:** In Progress

---

## 현재 상태 (Current Status)

### ✅ 완료된 작업

| Phase | 항목 | 상태 | 비고 |
|-------|------|------|------|
| 1.1 | package.json | ✅ | Next.js 15, React 19 |
| 1.1 | tsconfig.json | ✅ | @/common/* alias |
| 1.1 | next.config.ts | ✅ | Cloudinary 허용 |
| 1.2 | 폴더 구조 | ✅ | app/, common/ 생성 |
| 2.1 | middleware.ts | ✅ | 서브도메인 감지 |
| 2.2 | regions.ts | ✅ | 24개 지역 설정 |
| 2.3 | supabase.ts | ✅ | 클라이언트 생성 |
| 3.1 | RegionalHeader | ✅ | 브랜드 헤더 |
| 3.1 | RegionalHero | ✅ | Tier별 히어로 |
| 3.1 | NewsCard | ✅ | 기사 카드 |
| 3.1 | NewsList | ✅ | 그리드 리스트 |
| 3.1 | Footer | ✅ | 공통 푸터 |
| 3.2 | FullLayout | ✅ | Tier 1 |
| 3.2 | StandardLayout | ✅ | Tier 2 |
| 3.2 | CompactLayout | ✅ | Tier 3 |
| 4.1 | content.ts | ✅ | Smart Fill 알고리즘 |
| 5.1 | app/page.tsx | ✅ | 동적 홈페이지 |
| 5.2 | app/news/[id] | ✅ | 상세 페이지 |

**개발 서버:** `http://localhost:3001` (동작 중)

### 🔲 남은 작업

| Phase | 항목 | 우선순위 |
|-------|------|----------|
| 5.3 | API Routes | P1 |
| 6.1 | region_config 테이블 | P2 (optional) |
| 6.2 | posts 인덱스 추가 | P1 |
| 7 | Vercel 배포 | P0 (Claude) |
| 8 | 24개 지역 테스트 | P0 |

---

## Phase 5.3: API Routes (남은 작업)

### 필요 여부 재검토

현재 `app/page.tsx`에서 Server Component로 직접 Supabase 호출 중.
**별도 API는 외부 연동 시에만 필요.**

### 최소 API (선택적)

```
app/api/
├── regions/route.ts         # GET: 전체 지역 목록
└── region/[code]/
    └── route.ts             # GET: 지역 설정
```

**구현 여부:** 배포 후 필요시 추가

---

## Phase 6: Database (남은 작업)

### 6.1 region_config 테이블 (Optional)

현재 `common/lib/regions.ts`에 하드코딩됨.
**DB 마이그레이션은 추후 필요시 진행.**

### 6.2 posts 인덱스 (권장)

```sql
-- 성능 개선용 (안전한 작업)
CREATE INDEX IF NOT EXISTS idx_posts_region ON posts(region);
CREATE INDEX IF NOT EXISTS idx_posts_status_published_at 
  ON posts(status, published_at DESC);
```

> [!WARNING]
> 기존 koreanewsone.com과 DB 공유. 적용 전 백업 권장.

---

## Phase 7: Deployment (Claude 담당)

### 7.1 Vercel 설정

1. 새 프로젝트 생성: `koreanewskorea`
2. Git 연결
3. 환경변수: koreanewsone과 동일
4. 와일드카드 도메인: `*.koreanewskorea.com`

### 7.2 DNS 설정

```
*.koreanewskorea.com → Vercel CNAME
```

---

## Phase 8: Rollout & Testing

### 8.1 테스트 체크리스트

**Tier 1 (광주, 전남):**
- [ ] gwangju.koreanewskorea.com 로드
- [ ] FullLayout 렌더링
- [ ] Hero 6개 기사 표시
- [ ] Smart Fill 정상 동작

**Tier 2 (5개 시):**
- [ ] mokpo.koreanewskorea.com
- [ ] StandardLayout 렌더링

**Tier 3 (17개 군):**
- [ ] damyang.koreanewskorea.com
- [ ] CompactLayout 렌더링
- [ ] 콘텐츠 부족 시 Smart Fill

**공통:**
- [ ] 잘못된 서브도메인 → gwangju 리다이렉트
- [ ] 모바일 반응형
- [ ] 뉴스 상세 페이지

### 8.2 자동화 테스트 (권장)

```bash
# 24개 서브도메인 응답 확인 스크립트
for region in gwangju jeonnam mokpo yeosu suncheon naju gwangyang \
  damyang gokseong gurye goheung boseong hwasun jangheung \
  gangjin haenam yeongam muan hampyeong yeonggwang jangseong \
  wando jindo shinan; do
  curl -s -o /dev/null -w "%{http_code} $region\n" \
    "https://$region.koreanewskorea.com"
done
```

---

## Timeline (예상 일정)

| Phase | 작업 | 담당 | 예상 |
|-------|------|------|------|
| 5.3 | API Routes | Gemini | 필요시 |
| 6.2 | DB 인덱스 | Claude | 30분 |
| 7 | Vercel 배포 | Claude | 1시간 |
| 8 | 24개 테스트 | Gemini | 2시간 |

**총 예상:** 1일 내 완료 가능

---

## Tier별 콘텐츠 비율 (수정됨)

기존 70/20/10 비율은 Tier 1에만 적용.

| Tier | Local | Nearby | National | 이유 |
|------|-------|--------|----------|------|
| 1 | 70% | 20% | 10% | 콘텐츠 충분 |
| 2 | 50% | 30% | 20% | 중간 규모 |
| 3 | 30% | 40% | 30% | Smart Fill 적극 활용 |

**구현:** `content.ts`의 getSmartFilledNews() 수정 필요

---

## SEO 체크리스트 (추가됨)

- [ ] 각 지역 title/description 메타태그
- [ ] Open Graph 태그
- [ ] sitemap.xml 생성
- [ ] robots.txt
- [ ] Google Search Console 등록

---

## Monitoring (추가됨)

### 배포 후 모니터링

1. **Vercel Analytics** - 기본 제공
2. **에러 로깅** - Vercel 대시보드
3. **지역별 트래픽** - Analytics 필터

---

## Risk Assessment (업데이트)

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| DB 변경이 기존 사이트 영향 | HIGH | 인덱스만 추가 (안전) | 대기 |
| 서브도메인 라우팅 실패 | MEDIUM | middleware 테스트 완료 | ✅ |
| 콘텐츠 비율 부자연 | LOW | Tier별 다른 비율 적용 | ✅ 구현됨 |
| 성능 이슈 | MEDIUM | 인덱스 + 캐싱 | 대기 |

---

## Phase 9: Admin Dashboard (P2, 배포 후)

### 9.1 관리자 대시보드 요구사항

**URL:** `/admin` (미들웨어 예외 처리 필요)

**필수 기능:**

1. **지역별 현황 테이블**
   - 24개 지역 목록 (테이블 형식)
   - 컬럼: Code, 지역명, Tier, 오늘 기사수, 전체 기사수, 상태
   - 정렬/필터 기능

2. **콘텐츠 알림 시스템**
   - 로컬 기사 부족 지역 경고
   - Smart Fill 발동 현황

3. **지역 설정 관리**
   - 인접 지역 매핑 편집
   - 활성/비활성 토글

4. **트래픽 통계** (Vercel Analytics 연동)

### 9.2 Admin UI Rules (P0)

| 규칙 | 이유 |
|------|------|
| Desktop-first | 관리자는 PC 사용 |
| 테이블 사용 | 정보 밀도 최대화 |
| Compact padding | 화면 활용 극대화 |
| 25+ rows per page | 스크롤 최소화 |

### 9.3 구현 위치

```
koreanewskorea/app/admin/
├── page.tsx           # 대시보드 메인
├── layout.tsx         # Admin 레이아웃
└── regions/[code]/page.tsx
```

### 9.4 우선순위

**P2** - 배포 후 추가 가능, MVP는 지역 현황 테이블만

---

## 다음 단계

1. **Gemini:** SEO 메타태그/sitemap 구현
2. **Claude:** Git push → Vercel 배포
3. **Claude:** 와일드카드 도메인 설정
4. **Gemini:** 24개 지역 테스트
5. **Gemini:** Admin 대시보드 구현 (P2)

---

*이 계획서는 의견.md 및 FIX_ORDER_v3.md 피드백을 반영하여 수정됨.*
