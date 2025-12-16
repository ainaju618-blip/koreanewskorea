# 세션 작업 로그

> **용도:** 세션별 작업 내용 누적 기록
> **형식:** 최신 세션이 상단

---

## [2025-12-16 16:00] 세션 #10 - CosmicPulse Blog System by Claude

### 주인님 의도
- 유창일님 요청: AI가 해외 SF/우주 커뮤니티에서 트렌딩 주제를 수집하고 자동으로 글 작성
- KoreaNews 내에 독립적인 블로그 관리 시스템 구축
- 구글 애드센스 수익화 목표

### 전문가 추천 전략
- Q1: A (하루 10~30분 검토) - AI 90% + 사람 10% 편집
- Q2: A (SF 엔터테인먼트 중심) - 영화/드라마 분석, 제휴마케팅 쉬움
- Q3: A (한국어 먼저) - 경쟁 적음, 빠른 승인

### 수행 작업
1. **DB 스키마 설계** - 6개 테이블 (blog_posts, blog_categories, blog_sources, blog_ai_logs, blog_settings, blog_trending_topics)
2. **TypeScript 타입 정의** - src/types/blog.ts
3. **/blogadmin 관리자 페이지**
   - 대시보드 (통계, 최근 글)
   - 글 목록/CRUD
   - 글 작성 페이지
   - AI 글 생성 페이지
4. **Blog API 엔드포인트**
   - /api/blog/stats - 통계
   - /api/blog/posts - 글 CRUD
   - /api/blog/generate - AI 생성 (OpenAI GPT-4o-mini)
   - /api/blog/trending - 트렌딩 주제
5. **/blog 프론트 페이지**
   - 우주 테마 디자인 (별 배경, 네뷸라, 플로팅 파티클)
   - 메인 페이지 + 상세 페이지
6. **Supabase 마이그레이션 실행 완료**

### 사용 도구
- 직접 구현: 모든 코드 작성
- OpenAI GPT-4o-mini: AI 글 생성 엔진

### 결과
- 커밋: f9fe971 "feat: Add CosmicPulse AI Blog System (Phase 1)"
- 16 files changed, 3683 insertions

### 브랜드
- 블로그명: CosmicPulse
- 슬로건: "SF & Space for Korean Readers"
- 컨셉: SF 영화/드라마 과학 분석 + 우주 뉴스 해설

### 접속 URL
- 블로그 관리자: /blogadmin
- 블로그 프론트: /blog

### 다음 단계 (Phase 2)
- 해외 소스 크롤러 구현 (Reddit, Space.com, NASA)
- WordPress REST API 연동
- 스케줄러 자동 발행
- 트렌딩 주제 분석

### 주요 생성 파일
```
supabase/migrations/20251216_blog_schema.sql
src/types/blog.ts
src/app/blogadmin/layout.tsx
src/app/blogadmin/page.tsx
src/app/blogadmin/posts/page.tsx
src/app/blogadmin/posts/new/page.tsx
src/app/blogadmin/ai-generator/page.tsx
src/components/blogadmin/BlogAdminSidebar.tsx
src/app/api/blog/stats/route.ts
src/app/api/blog/posts/route.ts
src/app/api/blog/posts/[id]/route.ts
src/app/api/blog/generate/route.ts
src/app/api/blog/trending/route.ts
src/app/blog/page.tsx
src/app/blog/[slug]/page.tsx
src/app/globals.css (블로그 애니메이션 추가)
```

---

## [2025-12-15 11:54] 세션 #9 by Gemini

### 주인님 의도
1. 이미지 로딩 속도 느림 문제 해결
2. PageSpeed Insights로 성능 측정 및 최적화

### 수행 작업 (Gemini)
1. **next-cloudinary 적용**
   - `npm install next-cloudinary`
   - `src/lib/cloudinary-utils.ts` - URL → public_id 추출 유틸
   - `src/components/ui/OptimizedImage.tsx` - CldImage 래퍼 컴포넌트
   - `category/[slug]/page.tsx` - OptimizedImage 적용
   - Vercel 환경변수 `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` 추가

2. **서버 응답 시간 최적화**
   - `force-dynamic` → `revalidate=60` (ISR 적용)
   - `select('*')` → 필요한 6개 필드만 선택

3. **Vercel 배포 캐시 갱신 문제 해결**
   - `vercel --prod` 수동 재배포로 CDN 캐시 갱신

### 결과
- **Performance**: 61점 → 100점
- **LCP**: 37.7초 → 0.8초 (36.9초 단축)

### 에러 사례 기록
- `info/errors/frontend/image-loading-slow.md` 생성 (by Gemini)

### Git Commits
- `3274225`: feat: next-cloudinary 적용 - 이미지 로딩 속도 최적화
- `4c6dbc8`: perf: 카테고리 페이지 서버 응답 시간 최적화

### 주요 생성/수정 파일
```
src/lib/cloudinary-utils.ts (신규)
src/components/ui/OptimizedImage.tsx (신규)
src/app/(site)/category/[slug]/page.tsx (수정)
info/errors/frontend/image-loading-slow.md (신규)
info/errors/_catalog.md (수정)
```

---

## [2025-12-15] 세션 #8

### 주인님 의도
1. Git/Vercel 배포 상태 확인 및 문제 해결
2. 프로젝트 정보/에러/가이드를 체계적으로 관리할 `info/` 폴더 생성
3. 새 세션에서도 AI가 상태를 알 수 있도록 구조화

### 수행 작업

1. **Vercel 자동 배포 문제 해결**
   - 원인: GitHub 웹훅 없음 (`gh api repos/.../hooks` → 빈 배열)
   - 해결: `vercel git connect` 실행 → 자동 배포 복구

2. **info/ 폴더 생성 (정보 통합 허브)**
   - `info/README.md` - 인덱스 및 빠른 참조
   - `info/git.md` - Git/Vercel/배포 (기존 gitinfo/ 통합)
   - `info/scraper.md` - 스크래퍼 개발/에러
   - `info/frontend.md` - Next.js/React/UI
   - `info/backend.md` - API/Supabase/인증
   - `info/database.md` - DB 스키마/마이그레이션
   - `info/collaboration.md` - AI 협업 (Claude ↔ Gemini)
   - `info/troubleshooting.md` - 공통 문제 해결

3. **CLAUDE.md 업데이트**
   - 0.5 세션 시작 프로세스에 info/ 참조 추가
   - 0.8 분산형 문서 관리에 info/ 폴더 구조 추가

4. **기존 gitinfo/ 폴더 삭제**
   - info/git.md로 통합 완료

### 주요 생성/수정 파일
```
info/ (신규 폴더)
├── README.md
├── git.md
├── scraper.md
├── frontend.md
├── backend.md
├── database.md
├── collaboration.md
└── troubleshooting.md

CLAUDE.md (수정) - info/ 폴더 참조 추가
gitinfo/ (삭제) - info/git.md로 통합
```

### 다음 작업
- current_task.md, session_log.md 최신화 필요 (이번 세션에서 완료)

---

## [2025-12-15] 세션 #7

### 주인님 의도
1. **강원일보(kwnews.co.kr) 구조 분석** - 코리아뉴스 서브페이지 개편 참조용
2. **카테고리 페이지 레이아웃 통일** - 현재 일관성 없음 (사이드바 유무, 카드/리스트 혼재)
3. 강원일보 스타일(9:3 그리드 + 사이드바)로 통일하고 싶음
4. Gemini Antigravity에게 작업 위임

### 수행 작업

1. **강원일보 웹사이트 구조 분석**
   - Playwright로 kwnews.co.kr 탐색
   - 전체 페이지 구조 추출 (GNB, 카테고리, 지역 18개, URL 패턴)
   - `kwnews_structure.html` 문서 생성

2. **코리아뉴스 카테고리 페이지 현황 분석**
   - **Type A** (`category/[slug]/page.tsx`): 9:3 그리드 + 사이드바 ✅ 정상
   - **Type B** (`CategoryPageTemplate.tsx`): 3칸 카드 그리드, 사이드바 없음 ❌
   - **Type C** (`jeonnam-region/page.tsx`): 1칸 리스트, 사이드바 없음 ❌

3. **작업 지시서 작성**
   - `.ai-collab/TASK.md`에 상세 지시 추가
   - 강원일보 목표 레이아웃 다이어그램 제공
   - 참조 코드 (`category/[slug]/page.tsx`) 전체 포함
   - 수정 대상 파일 6개 명시
   - 테스트 체크리스트 7개 페이지

### 분석 결과 요약

| 타입 | 파일 | 현재 상태 | 수정 필요 |
|------|------|----------|----------|
| A | `category/[slug]/page.tsx` | 9:3 + 사이드바 | ✅ 참조용 |
| B | `CategoryPageTemplate.tsx` | 카드 그리드 | ❌ 완전 재작성 |
| C | `jeonnam-region/page.tsx` | 리스트 | ❌ 사이드바 추가 |

### 주요 생성/수정 파일
```
kwnews_structure.html (신규) - 강원일보 구조 문서
.ai-collab/TASK.md (수정) - 레이아웃 통일 작업 지시서 추가
```

### 다음 작업
- 주인님이 Gemini Antigravity에게 "읽어봐" 전달
- Antigravity가 작업 완료 후 DONE.md에 결과 보고
- Claude가 검토 후 git push && vercel --prod

---

## [2025-12-14] 세션 #6

### 주인님 의도
1. SEO 관점에서 신문사 홈페이지 개선 기획
2. 홈페이지 개인화 시스템 기획
   - 부스트 시스템: 특정 지역/기사를 예약 시간에 상단 노출 (영업용)
   - 위치 기반: IP 감지하여 접속 지역 기사 우선 노출
   - 행동 기반: 자주 본 지역/카테고리 학습
   - 상시 가중치: 특정 지역 기본 노출 비율 조정
3. 관리자가 개인화 방식 선택 가능하도록
4. **로그인/비로그인 사용자 모두 지원**
5. 작업지시서 문서화

### 수행 작업

1. **SEO Phase 1 구현** (이전 세션에서 완료)
   - `src/app/(site)/news/[id]/page.tsx` - generateMetadata, JSON-LD 구조화 데이터
   - `src/app/layout.tsx` - 전역 메타데이터 (OG, Twitter, robots)
   - 빌드 오류 수정 (idea/collect/route.ts, idea/raw/page.tsx)

2. **개인화 시스템 기획 문서 작성**
   - `docs/features/PERSONALIZATION_SYSTEM.md` v1.1 완성
   - 로그인/비로그인 사용자 지원 섹션 추가
   - DB 스키마: 5개 테이블 설계
     - personalization_settings (전역 설정)
     - boost_schedules (부스트 예약)
     - region_weights (지역 가중치)
     - user_behavior_logs (행동 로그, 세션ID/유저ID 통합)
     - user_personalization_profiles (로그인 사용자 프로필)
   - 점수 계산 알고리즘 (로그인/비로그인 통합)
   - API 13개 엔드포인트 설계
   - 관리자 UI 와이어프레임

3. **작업지시서 작성**
   - Phase 1: 기반 구축 (DB + API) - 4개 작업
   - Phase 2: 위치 기반 + 쿠키 - 4개 작업
   - Phase 3: 로그인 동기화 + 관리자 UI - 4개 작업
   - Phase 4: 고도화 (선택)

### 주요 변경 파일
```
docs/features/PERSONALIZATION_SYSTEM.md (신규, 1070줄)
src/app/(site)/news/[id]/page.tsx (SEO 강화)
src/app/layout.tsx (메타데이터 추가)
```

### 다음 작업
- 주인님 지시에 따라 Phase 1 구현 시작 (또는 Gemini에게 위임)

---

## [2025-12-12 20:38] 세션 #5

### 주인님 의도
- 강진군 보도자료 스크래퍼 개발
- SCRAPER_GUIDE.md 2번 정독 후 진행 (지침 준수)

### 수행 작업
1. **스크래퍼 개발**
   - `scrapers/gangjin/gangjin_scraper.py` 생성
   - 목록 셀렉터: `a[href*="idx="][href*="mode=view"]`
   - 본문 셀렉터: `div.text_viewbox`
   - 날짜: `div.view_titlebox dd`
   - 담당부서: `#page_info dd`
   - 이미지: `div.image_viewbox img`

2. **디버깅 및 품질 검증**
   - 셀렉터 미스매치 해결 (debug 스크립트 활용)
   - clean_content() 적용 - 메타정보 깨끗이 제거
   - 이미지 로컬 저장 확인

3. **api_client.py 이모지 수정**
   - Windows cp949 인코딩 에러 해결
   - 이모지 → 플레인 텍스트 변경 (`[OK]`, `[SKIP]` 등)

4. **문서화**
   - `scrapers/gangjin/ALGORITHM.md` 작성

### 테스트 결과
```
[완료] 수집 완료 (총 3개, 신규 2개, 이미지 2개, 스킵 0개)
본문 품질: 깨끗함 (메타정보 없음)
```

### 주요 변경 파일
```
scrapers/gangjin/gangjin_scraper.py (신규)
scrapers/gangjin/ALGORITHM.md (신규)
scrapers/utils/api_client.py (이모지 제거)
```

---

## [2025-12-12] 세션 #4

### 주인님 의도
- 기자등록 관리 개선 (지역 기자 제도 도입)
- 직위는 예우용, 권한은 모두 동일
- 사이트 로그인용 계정만 필요 (Supabase Auth)

### 수행 작업
1. **Phase 1: DB 스키마 확장**
   - reporters 테이블에 position, phone, email, bio 컬럼 추가
   - 주인님이 Supabase에서 직접 SQL 실행

2. **Phase 2: API 수정**
   - `GET /api/users/reporters` - position/region/type 필터 추가
   - `POST /api/users/reporters` - 새 필드 저장
   - `PUT /api/users/reporters/[id]` - 새 필드 수정

3. **Phase 3: UI 전면 개선**
   - 직위 데이터 상수 정의 (13개 직위)
   - 지역 데이터 상수 정의 (25개 지역)
   - 필터 기능 확장 (유형/직위/지역)
   - 기자 추가/수정 폼 확장
   - 상세 정보 슬라이드 패널 추가
   - 카드에 직위/연락처 표시

4. **Phase 4: 빌드 검증**
   - Next.js 빌드 성공 확인

### 주요 변경 파일
```
web/src/app/api/users/reporters/route.ts
web/src/app/api/users/reporters/[id]/route.ts
web/src/app/admin/users/reporters/page.tsx
```

### 직위 체계
```
주필 > 지사장 > 편집국장 > 취재부장 > 수석기자 > 기자 > 수습기자
+ 오피니언, 고문, 자문위원, 홍보대사, 서울특파원, 해외특파원
```

---

## [2025-12-12] 세션 #3

### 주인님 의도
- 스크래퍼 관리 페이지 개선
- 2단 레이아웃: 왼쪽(스크래퍼 실행) + 오른쪽(DB 관리)
- DB 기사 삭제 기능으로 중복 문제 해결

### 수행 작업
1. **Phase 1: API 구현**
   - `GET /api/posts/stats/by-region` - 지역별 기사 통계
   - `DELETE /api/posts/bulk-delete` - 지역별 기사 일괄 삭제
   - `POST /api/posts/bulk-delete` - 삭제 전 미리보기

2. **Phase 2-3: 컴포넌트 분리**
   - `components/regionData.ts` - 지역 데이터 공통화
   - `components/RegionCheckboxGroup.tsx` - 재사용 가능한 체크박스 그룹
   - `components/ScraperPanel.tsx` - 스크래퍼 실행 패널
   - `components/DbManagerPanel.tsx` - DB 관리 패널 (삭제 기능)

3. **Phase 4: 2단 레이아웃 통합**
   - `page.tsx` 완전 재구성 (524줄 → 108줄)
   - 반응형 그리드 레이아웃 (lg:grid-cols-2)

4. **Phase 5: 빌드 검증**
   - Next.js 빌드 성공 확인
   - 모든 API 라우트 정상 등록

### 생성 파일
```
web/src/app/api/posts/
├── stats/by-region/route.ts   # 통계 API
└── bulk-delete/route.ts       # 삭제 API

web/src/app/admin/bot/run/
├── page.tsx                   # 메인 페이지 (2단 레이아웃)
└── components/
    ├── index.ts
    ├── regionData.ts
    ├── RegionCheckboxGroup.tsx
    ├── ScraperPanel.tsx
    └── DbManagerPanel.tsx
```

### 주요 기능
- 지역별 기사 수 표시 (DB 통계)
- 지역 선택 후 일괄 삭제
- 삭제 전 미리보기 확인
- 기간 필터 옵션 (선택적)

---

## [2025-12-12] 세션 #2

### 주인님 의도
- 토큰 관리 강조
- 분산형 문서 구조 도입 (필요할 때만 읽기)
- 최적화된 틀 마련

### 수행 작업
1. **분산형 문서 구조 설계 및 적용**
   - scrapers/STATUS.md (전체 현황)
   - scrapers/_queue/PRIORITY.md (작업 우선순위)
   - 완료된 스크래퍼만 README.md 생성

2. **각 영역 README.md 생성**
   - processors/, web/, src/, scripts/

3. **CLAUDE.md v1.2 업데이트**
   - 0.8 분산형 문서 관리 규칙 추가

4. **decisions.md 업데이트**
   - 분산형 문서 구조 결정 기록
   - 토큰 관리 규칙 추가

### 주요 결정
- README.md는 완료/진행중만 생성
- 대기 항목은 STATUS.md에 1줄 목록
- 작업 시작 시 TASK.md 생성

---

## [2025-12-12] 세션 #1

### 주인님 의도
1. 프로젝트 분석 요청
2. 스크래퍼 관련 폴더 및 지침 확인
3. 문서 간 구조적 모순 파악 및 수정
4. AI Agent가 프로젝트를 관리할 수 있도록 지침 정비
5. AI Agent 역할 프롬프트 작성 (호칭, 의도 기록, 세션 프로세스)

### 수행 작업
1. **프로젝트 구조 분석**
   - 전체 폴더 구조 파악
   - 기술 스택 확인 (Next.js 15, Supabase, Playwright, Cloudinary)

2. **문서 모순점 발견 및 수정**
   - `core/` 폴더 언급 → 실제 `[지역명]/` 구조로 수정
   - main_bot.py 임포트 경로 오류 수정
   - Next.js 버전 16→15 수정

3. **문서 v3.0 일괄 업데이트**
   - SCRAPER_GUIDE.md
   - 스크래퍼_개발_지침.md
   - SCRAPER_DEVELOPMENT_GUIDE.md
   - base_scraper_template.py

4. **AI Agent 지침 생성**
   - CLAUDE.md 생성
   - .claude/context/ 폴더 구조 설정
   - 세션 시작 프로세스 정의

### 주요 결정 사항
- fetch_detail 반환형: `Tuple[str, Optional[str], str, Optional[str]]`
- Cloudinary 업로드 필수화
- 주인님 호칭 사용
- 의도 및 작업 내용 누적 기록

### 역할 정의 (추가)
- **Claude:** 프로젝트 총괄 기획자, 직접 작업 X, 작업지시서 작성
- **Gemini Antigravity:** 실제 코드 작업 실행
- **Chrome 확장프로그램:** 보도자료 페이지 구조 분석

### 다음 작업
- 주인님 지시 대기

---

*새 세션 로그는 이 파일 상단에 추가*
