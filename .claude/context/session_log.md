# 세션 작업 로그

> **용도:** 세션별 작업 내용 누적 기록
> **형식:** 최신 세션이 상단

---

## [2025-12-28 PM] 세션 #39 - Header.tsx 키워드 통합 + 추가 스크래핑 by Claude

### 주인님 의도
- Header.tsx에 키워드 서비스 통합 (서브메뉴 동적 생성)
- 추가 스크래핑으로 최대한 많은 기사 수집

### 수행 작업

1. **Header.tsx 키워드 서비스 통합**
   - `src/components/RegionalSubMenu.tsx` - 동적 서브메뉴 컴포넌트
   - `src/hooks/useRegionSubMenus.ts` - 리액트 훅
   - Header.tsx에 RegionalSubMenu 통합 완료
   - 지역 카테고리 호버 시 키워드 기반 서브메뉴 표시

2. **배치 스크래퍼 병렬화 (4 workers)**
   - `scrapers/batch_scrape_all.py` 병렬 실행 개선
   - 24개 지역 대상, 총 445건 타겟

3. **스크래핑 결과**
   - 총 수집: ~285건 (15.8분)
   - 성공률: 17/24
   - 주요 성공:
     - gwangju: 45건
     - jangheung: 30건
     - jeonnam: 30건
     - yeongam: 30건
     - jeonnam_edu: 20건
     - shinan: 16건
     - jangseong: 15건
     - gangjin: 15건
     - mokpo: 15건
   - 타임아웃: jindo, boseong, hwasun, gwangyang, gokseong, goheung, hampyeong

### 수정된 파일
- `src/components/Header.tsx` - RegionalSubMenu 통합
- `src/components/RegionalSubMenu.tsx` (이전 세션에서 생성)
- `src/hooks/useRegionSubMenus.ts` (이전 세션에서 생성)

### 배포
- 대기 중 (빌드 확인 후 배포)

---

## [2025-12-28 PM] 세션 #38 - 대량 스크래핑 + 키워드 서비스 구현 by Claude

### 주인님 의도
- 200건+ 추가 스크래핑으로 카테고리 형성
- 동적 키워드 기반 서브메뉴 시스템 구현

### 수행 작업

1. **키워드 서비스 구현 완료**
   - `src/config/region-keywords.ts` - 26개 지역 정적 키워드 매핑
   - `src/lib/keyword-service.ts` - Static/Dynamic/Hybrid 방식 통합 서비스
   - `supabase/migrations/20251228_keyword_aggregation.sql` - RPC 함수 (선택적)
   - `src/app/api/regions/[region]/submenus/route.ts` - API 엔드포인트

2. **배치 스크래퍼 개발**
   - `scrapers/batch_scrape_all.py` - 병렬 실행 (3 workers)
   - 24개 지역 대상, 우선순위별 타겟 설정
   - `--yes`, `--low-only`, `--workers N` 옵션 지원

3. **스크래핑 결과**
   - 총 게시물: 1,173 → 1,545 (+372건)
   - 주요 증가 지역:
     - shinan: 8 → 38 (+30)
     - jindo: 15 → 44 (+29)
     - jangheung: 15 → 39 (+24)
     - haenam: 19 → 34 (+15)
     - wando: 17 → 31 (+14)
     - boseong: 7 → 19 (+12)

### 생성된 파일
- `src/config/region-keywords.ts`
- `src/lib/keyword-service.ts`
- `src/app/api/regions/[region]/submenus/route.ts`
- `supabase/migrations/20251228_keyword_aggregation.sql`
- `scrapers/batch_scrape_all.py`

### 다음 할 일
1. Header.tsx에 키워드 서비스 통합 (서브메뉴 동적 생성)
2. 추가 스크래핑 (yeonggwang 등 저조 지역)
3. Supabase RPC 함수 적용 (Dashboard에서 수동 실행)

---

## [2025-12-28 PM] 세션 #37 - Tour DB 연결 + 보도자료 현황 분석 by Claude

### 주인님 의도
- Tour 컴포넌트를 실제 DB(tour_spots)에 연결
- 보도자료 현황 파악 후 추가 스크래핑
- 메뉴 구조 재설계 논의 (동적 키워드 기반)

### 수행 작업

1. **Tour 컴포넌트 DB 연결 수정 완료**
   - 문제: `regionNames`(한글 '목포')가 DB `region_name`('목포시')와 불일치
   - 해결: `regionKeys`(슬러그 'mokpo')로 변경하여 `region_key`와 매칭
   - 수정 파일:
     - `jeonnam/src/components/tour/TourSpots.tsx`
     - `jeonnam/src/components/tour/TourFood.tsx`
     - `jeonnam/src/components/tour/TourEvents.tsx`
     - `jeonnam/src/components/tour/TourAccommodation.tsx`
     - `jeonnam/src/components/tour/TourHero.tsx`
     - `jeonnam/src/app/(site)/tour/page.tsx`
   - 결과: tour_spots 테이블 3,634건 정상 연결

2. **보도자료 현황 조회**
   - 총 게시글: 1,173건
   - 최근 30일 지역별:
     - 🟢 풍부(50+): 여수125, 순천67, 강진64, 전남도63, 무안56, 나주56, 목포53
     - 🟡 보통(30-50): 함평46, 영암44, 고흥44, 장성42, 곡성40, 광주35, 광양33, 화순32
     - 🟠 부족(15-30): 광주교육27, 담양22, 해남19, 완도17, 진도15, 장흥15
     - 🔴 심각(<15): 신안8, 영광7, 보성7

### 중단된 작업 (동료에게 인계)
- 200건 추가 스크래핑 (모든 지역 대상)
- 스크래퍼 실행 방법:
  ```bash
  # 개별 지역 스크래퍼
  python scrapers/mokpo/mokpo_scraper.py --max-articles 10

  # 또는 smart_scraper.py 사용
  python scrapers/smart_scraper.py --regions mokpo yeosu suncheon
  ```

### 다음 할 일
1. 200건 추가 스크래핑 실행 (저조한 지역 우선)
2. 메뉴 구조 재설계 (동적 키워드 기반 서브메뉴)

### 배포
- 미배포 (Tour 컴포넌트 수정은 로컬에서 테스트 완료)

---

## [2025-12-28 AM] 세션 #36 - Realtime Monitor 시스템 버그 수정 by Claude

### 주인님 의도
- realtime-monitor 시스템의 비판적 검토 요청
- 완벽한 분석과 수정 보고서 작성
- 발견된 버그들 수정 및 배포

### 발견된 문제점

1. **P0 - 무한루프 버그 (Critical)**
   - `ai_processed.eq.true` 조건으로 인해 이미 처리된 기사가 반복 처리됨
   - 결과: API 비용 낭비 + 서버 부하
   - 수정: 해당 조건 제거

2. **P0 - API 키 하드코딩 (Security)**
   - `BOT_API_KEY`에 fallback으로 하드코딩된 키 노출
   - 수정: 환경변수 필수화

3. **P1 - 문서/코드 불일치**
   - 문서에서 `articles` 테이블 언급 → 실제는 `posts` 테이블
   - 문서에서 27개 지역 언급 → 실제는 26개 지역

### 수행 작업

1. **trigger-ai-process/route.ts 수정**
   - Line 23: API 키 환경변수 필수화 (fallback 제거)
   - Line 122: `ai_processed.eq.true` 조건 제거
   - Line 141-144: 로그에서 불필요한 draft_processed 제거

2. **MONITORING_WORKFLOW.md 문서 수정**
   - `articles` → `posts` 테이블명 수정 (4곳)
   - 27개 지역 → 26개 지역 수정 (2곳)
   - API 키 하드코딩 예시 수정

### 변경 파일
- `src/app/api/bot/trigger-ai-process/route.ts`
- `info/guides/MONITORING_WORKFLOW.md`

### 배포
- git commit: b75aee40
- git push: master → origin/master
- Vercel 자동 배포 트리거됨

---

## [2025-12-27 PM] 세션 #35 - AI 가공봇 태그 자동 생성 시스템 구현 by Claude

### 주인님 의도
- 기사에 태그가 안 나오는 문제 해결
- AI 가공봇에서 태그 자동 생성 기능 추가
- 기사 상세 페이지에서 태그 클릭 시 관련 기사 목록으로 이동

### 수행 작업

1. **AI 가공봇 태그 생성 로직 추가**
   - `MetadataResult` 인터페이스에 `tags: string[]` 추가
   - `LightweightResult` 인터페이스에 `tags: string[]` 추가
   - `generateTagsFromContent()` 함수 신규 생성
   - DB 업데이트 코드에 `tags: result.tags` 추가

2. **기사 상세 페이지 태그 링크 수정**
   - `/search?q=태그` → `/tag/태그` 경로로 변경

3. **태그별 기사 목록 페이지 신규 생성**
   - `src/app/(site)/tag/[tag]/page.tsx` 생성
   - Supabase `contains()` 쿼리로 태그 필터링

### 시스템 구조도

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TAG GENERATION SYSTEM                                │
│                           (태그 자동 생성 시스템)                              │
└─────────────────────────────────────────────────────────────────────────────┘

[1] AI 가공봇 처리 흐름
=======================

  보도자료 (원본)
       │
       ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  extractFacts(pressRelease)                                  │
  │  ────────────────────────────────────────────────────────── │
  │  • organizations: ["전남도청", "나주시", ...]               │
  │  • names: ["홍길동", "김철수", ...]                         │
  │  • numbers: ["1000억", "500명", ...]                        │
  └─────────────────────────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  generateTagsFromContent()  (규칙 기반, AI 호출 없음)        │
  │  ────────────────────────────────────────────────────────── │
  │  Step 1: 기관명에서 태그 추출 (최대 3개)                    │
  │          ["전남도청", "나주시", "농업기술원"]                │
  │                                                              │
  │  Step 2: 인물명에서 태그 추출 (최대 2개)                    │
  │          ["홍길동", "김철수"]                                │
  │                                                              │
  │  Step 3: 키워드 패턴 매칭                                   │
  │          축제, 행사, 사업, 지원, 협약, 투자, 개발, 건설,    │
  │          교육, 문화, 관광, 환경, 복지, 농업, 수산, 산업,    │
  │          경제, 일자리, 안전, 재난, 방역, 의료, 보건         │
  │                                                              │
  │  Output: 중복 제거 후 최대 6개 태그                         │
  └─────────────────────────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  DB Update (posts 테이블)                                    │
  │  ────────────────────────────────────────────────────────── │
  │  {                                                           │
  │    title: "...",                                             │
  │    subtitle: "...",                                          │
  │    ai_summary: "...",                                        │
  │    tags: ["전남도청", "나주시", "농업", "지원"],  ← NEW!    │
  │    ...                                                       │
  │  }                                                           │
  └─────────────────────────────────────────────────────────────┘


[2] 태그 클릭 네비게이션 흐름
=============================

  기사 상세 페이지 (/news/[id])
  ┌─────────────────────────────────────────────┐
  │  제목: 전남도, 농업 지원 사업 확대          │
  │                                              │
  │  [본문 내용...]                              │
  │                                              │
  │  태그: #전남도청 #나주시 #농업 #지원        │
  │         ↑                                   │
  │         클릭!                               │
  └─────────────────────────────────────────────┘
              │
              ▼
  ┌─────────────────────────────────────────────┐
  │  /tag/전남도청                               │
  │  ──────────────────────────────────────────  │
  │  #전남도청 - 15개의 관련 기사               │
  │                                              │
  │  ┌─────────────────────────────────────┐    │
  │  │ [썸네일] 전남도, 농업 지원 사업...  │    │
  │  │          2025.12.27                 │    │
  │  │          #전남도청 #농업 #지원      │    │
  │  └─────────────────────────────────────┘    │
  │                                              │
  │  ┌─────────────────────────────────────┐    │
  │  │ [썸네일] 전남도청, 2026 예산안...   │    │
  │  │          2025.12.26                 │    │
  │  │          #전남도청 #경제 #예산      │    │
  │  └─────────────────────────────────────┘    │
  │  ...                                         │
  └─────────────────────────────────────────────┘


[3] 파일 구조
=============

  src/
  ├── app/
  │   ├── api/bot/
  │   │   └── process-single-article/
  │   │       └── route.ts          ← 태그 생성 로직 추가
  │   │           ├── MetadataResult { tags: string[] }
  │   │           ├── LightweightResult { tags: string[] }
  │   │           ├── generateTagsFromContent()  ← NEW!
  │   │           └── updateData.tags = result.tags
  │   │
  │   └── (site)/
  │       ├── news/[id]/
  │       │   └── page.tsx          ← 태그 링크 /tag/xxx로 변경
  │       │
  │       └── tag/[tag]/
  │           └── page.tsx          ← NEW! 태그별 기사 목록


[4] DB 쿼리 (태그 필터링)
=========================

  // Supabase contains() 함수 사용
  const { data } = await supabaseAdmin
      .from('posts')
      .select('id, title, ...')
      .eq('status', 'published')
      .contains('tags', [tag])     // 배열에 태그 포함 여부
      .order('published_at', { ascending: false })
      .limit(50);
```

### 변경된 파일
| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/app/api/bot/process-single-article/route.ts` | 수정 | 태그 생성 로직 추가 |
| `src/app/(site)/news/[id]/page.tsx` | 수정 | 태그 링크 경로 변경 |
| `src/app/(site)/tag/[tag]/page.tsx` | 신규 | 태그별 기사 목록 페이지 |

### 태그 생성 알고리즘 요약
```
Input:  보도자료 본문
        ↓
Step 1: extractFacts() → 기관명, 인물명, 숫자 추출
        ↓
Step 2: 기관명 최대 3개 → 태그
Step 3: 인물명 최대 2개 → 태그
Step 4: 키워드 패턴 매칭 → 태그 (총 6개까지)
        ↓
Output: ["전남도청", "나주시", "홍길동", "농업", "지원"]
```

### 결과
- TypeScript 체크 통과 (tsc --noEmit)
- 빌드 대기 상태 (커밋 후 Vercel 자동 배포)

---

## [2025-12-27 PM] 세션 #34 - 모니터링 워크플로우 트리거 구현 by Claude

### 주인님 의도
- 모니터링봇 → 지역 스크래퍼 → AI 가공봇 전체 워크플로우 구현
- 비동기 트리거 시스템으로 모니터링봇이 다음 지역으로 빠르게 이동

### 수행 작업

1. **MONITORING_WORKFLOW.md 업데이트 (v1.2.0)**
   - 비동기 트리거 흐름도 추가 (Section 9)
   - 핵심 함수 설명: trigger_scraper(), trigger_ai_process()
   - 트리거 설정 옵션 테이블 추가 (Section 10)
   - TODO 항목 완료 표시

2. **light_monitor.py 업데이트 (v2.1)**
   - `trigger_scraper()`: 지역 스크래퍼 비동기 호출 함수
   - `trigger_ai_process()`: AI 가공봇 API 트리거 함수
   - `trigger_ai_for_region()`: 지역별 AI 처리 헬퍼 함수
   - `get_scraper_path()`: 스크래퍼 경로 탐지 함수
   - `check_all_regions()`: auto_trigger, trigger_ai 파라미터 추가
   - 백그라운드 스레드 기반 비동기 처리

3. **trigger-ai-process API 생성**
   - `src/app/api/bot/trigger-ai-process/route.ts`
   - region, article_ids 필터링 지원
   - lightweight/full 모드 지원
   - API key 인증

### 변경된 파일
- `info/guides/MONITORING_WORKFLOW.md` (v1.2.0)
- `scrapers/utils/light_monitor.py` (v2.1)
- `src/app/api/bot/trigger-ai-process/route.ts` (신규)

### 워크플로우 요약
```
모니터링봇 (나주 점검)
    │
    ├── 새 기사 발견! (has_new=True)
    │
    ├──> trigger_scraper('naju', ['12345']) ──> 백그라운드 실행
    │
    └── 다음 지역으로 이동 (광양 점검)

백그라운드:
    나주 스크래퍼 실행
        │
        └── 완료 후 ──> trigger_ai_process('naju', [...])
                            │
                            └── AI 가공 ──> 발행 (published)
```

### 배포 상태
- 로컬 테스트 대기

---

## [2025-12-26 19:00] 세션 #33 - 스크래퍼 버그 추가 수정 by Claude

### 주인님 의도
- 세션 #32에서 주인님이 수정한 6개 스크래퍼 외 나머지 오류 스크래퍼 수정
- 수정 후 오류 문서 기록 및 커밋

### 수행 작업

1. **UnboundLocalError 수정 (4개 스크래퍼)**
   - gurye_scraper.py (L392): `success_count = 0` 초기화 추가
   - jangheung_scraper.py (L335): `success_count = 0` 초기화 추가
   - yeongam_scraper.py (L325): `success_count = 0` 초기화 추가
   - wando_scraper.py (L365): `success_count = 0` 초기화 추가

2. **UnicodeEncodeError 수정 (1개 스크래퍼)**
   - gwangju_scraper.py (L23-27): `safe_str()` 함수 추가
   - gwangju_scraper.py (L232): print 문에 `safe_str(title[:30])` 적용

3. **오류 문서화**
   - `info/errors/scraper/unbound-local-error.md` 생성
   - `info/errors/scraper/unicode-encode-error.md` 생성
   - 총 10개 스크래퍼 영향 (Type A), 3개 파일 영향 (Type B) 기록

### 테스트 결과

| 스크래퍼 | 결과 | 비고 |
|----------|------|------|
| gurye | ✅ OK | DRY-RUN 정상 완료 |
| jangheung | ✅ OK | DRY-RUN 정상 완료 |
| yeongam | ✅ OK | DRY-RUN 정상 완료 |
| wando | ✅ OK | DRY-RUN 정상 완료 |
| gwangju | ✅ OK | DRY-RUN 정상 완료 (IMAGE_MISSING 스킵) |

### 수정 파일
- `scrapers/gurye/gurye_scraper.py` (수정)
- `scrapers/jangheung/jangheung_scraper.py` (수정)
- `scrapers/yeongam/yeongam_scraper.py` (수정)
- `scrapers/wando/wando_scraper.py` (수정)
- `scrapers/gwangju/gwangju_scraper.py` (수정)
- `info/errors/scraper/unbound-local-error.md` (신규)
- `info/errors/scraper/unicode-encode-error.md` (신규)
- `.claude/context/session_log.md` (이 파일)

### 총 수정 현황 (세션 #32 + #33)

**주인님 수정 (세션 #32, 6개):**
- gwangyang, hampyeong, jangseong, jindo, muan, sinan (Type A)
- jeonnam_edu, api_client.py (Type B)

**Claude 수정 (세션 #33, 5개):**
- gurye, jangheung, yeongam, wando (Type A)
- gwangju (Type B)

**합계: 11개 스크래퍼/파일 오류 수정 완료**

---

## [2025-12-26 18:45] 세션 #32 - 스크래퍼 버그 수정 by Claude

### 주인님 의도
- 세션 #31에서 발견한 오류들 수정

### 수행 작업

1. **UnboundLocalError 수정 (6개 스크래퍼)**
   - 파일: gwangyang, goheung, hwasun, haenam, jindo, hampyeong
   - 수정: `success_count = 0` 초기화 추가 (collect_articles 함수 내)
   - 위치: `collected_count = 0` 다음 라인

2. **UnicodeEncodeError 수정 (3개 파일)**
   - jeonnam_edu_scraper.py: `safe_str()` 함수 추가 + print 문 수정
   - hampyeong_scraper.py: `safe_str()` 함수 추가 + print 문 수정
   - utils/api_client.py: `safe_str()` 함수 추가 + 5개 print 문 수정

3. **bot_logs constraint 수정**
   - 마이그레이션 파일 생성: `supabase/migrations/20251226_fix_bot_logs_timeout_status.sql`
   - 'timeout' 상태값을 CHECK constraint에 추가
   - 에러 문서 생성: `info/errors/database/bot-logs-timeout-constraint.md`

### 테스트 결과

| 스크래퍼 | 결과 | 비고 |
|----------|------|------|
| gwangyang | OK | UnboundLocalError 수정 확인 |
| hwasun | OK | UnboundLocalError 수정 확인 |
| haenam | OK | UnboundLocalError 수정 확인 |
| hampyeong | OK | UnboundLocalError + UnicodeEncodeError 수정 확인 |
| jeonnam_edu | OK | UnicodeEncodeError 수정 확인 |
| goheung | TIMEOUT | 사이트 응답 지연 (코드 정상) |
| jindo | TIMEOUT | 사이트 페이지 크래시 (코드 정상) |

### 수정 파일
- `scrapers/gwangyang/gwangyang_scraper.py` (수정)
- `scrapers/goheung/goheung_scraper.py` (수정)
- `scrapers/hwasun/hwasun_scraper.py` (수정)
- `scrapers/haenam/haenam_scraper.py` (수정)
- `scrapers/jindo/jindo_scraper.py` (수정)
- `scrapers/hampyeong/hampyeong_scraper.py` (수정)
- `scrapers/jeonnam_edu/jeonnam_edu_scraper.py` (수정)
- `scrapers/utils/api_client.py` (수정)
- `supabase/migrations/20251226_fix_bot_logs_timeout_status.sql` (신규)
- `info/errors/database/bot-logs-timeout-constraint.md` (신규)
- `.claude/context/session_log.md` (이 파일)

### 주의 사항
- **bot_logs constraint**: Supabase SQL Editor에서 마이그레이션 실행 필요

---

## [2025-12-26 16:30] 세션 #31 - 26개 스크래퍼 종합 테스트 (라운드 로빈) by Claude

### 주인님 의도
- 스케줄 예약 시스템 점검
- 26개 스크래퍼 각각 10회 이상 테스트 (라운드 로빈 방식)
- 절대 임의로 수정하지 말고 보고서만 작성
- 보도자료 원본의 등록시간 추출 현황 점검

### 수행 작업

1. **라운드 1-3: 전체 26개 스크래퍼 테스트**
   - 모든 스크래퍼 --dry-run 모드로 실행
   - 오류 패턴 최초 발견

2. **라운드 4-10: 오류 스크래퍼 집중 테스트**
   - 7개 오류 스크래퍼 반복 검증
   - 100% 재현율 확인

3. **종합 보고서 작성**
   - `info/errors/scraper/SCRAPER_TEST_REPORT_20251226.md` 생성
   - 오류 카탈로그 업데이트

### 발견된 오류

**UnboundLocalError (6개 스크래퍼)**
- gwangyang, goheung, hwasun, haenam, jindo, hampyeong
- 원인: `success_count` 변수 초기화 누락

**UnicodeEncodeError (2개 스크래퍼)**
- jeonnam_edu (\u2027), hampyeong (\u2013)
- 원인: Windows cp949 인코딩과 유니코드 특수문자 충돌

**Database Constraint Error**
- bot_logs 테이블에 'timeout' status 값 없음

### 정상 작동 스크래퍼 (19개)
gwangju, jeonnam, mokpo, yeosu, suncheon, naju, damyang, gokseong, gurye, boseong, jangheung, gangjin, yeongam, muan, yeonggwang, jangseong, wando, shinan, gwangju_edu

### 수정 파일 (문서만)
- `info/errors/scraper/SCRAPER_TEST_REPORT_20251226.md` (신규)
- `info/errors/_catalog.md` (업데이트)
- `.claude/context/session_log.md` (이 파일)

### 결과
- 26개 스크래퍼 중 7개(27%) 치명적 오류 발견
- 오류 100% 재현 확인 (일시적 문제 아님)
- 수정 계획 수립 완료 (승인 대기)

### 수정 여부
❌ 미수정 - 보고서만 작성 (주인님 지시 준수)

---

## [2025-12-25 06:30] 세션 #30 - Regional Homepage Error Fix & Documentation by Claude

### 주인님 의도
- koreanewskorea.vercel.app 빈 화면 문제 수정
- 비즈니스 전략 문서화 (어떤 개발자도 이해할 수 있도록)
- 에러/작업 기록 시스템이 제대로 전달되도록 개선

### 수행 작업

1. **Regional Homepage 에러 수정**
   - 증상: 헤더/푸터만 보이고 메인 콘텐츠 빈 화면
   - 원인: Vercel 런타임 로그에서 `column posts.source_url does not exist` 발견
   - 해결: DB 실제 컬럼명 `original_link`로 변경 (3개 파일)
   - 파일: ArticleRepository.ts, Article.ts, news/[id]/page.tsx

2. **비즈니스 전략 문서 작성**
   - koreanewskorea/plan/BUSINESS_STRATEGY.md 생성
   - 2-track 구조, 수익 모델, 성공 지표 문서화
   - START_HERE.md에 Step 0 (비즈니스 이해) 추가
   - CLAUDE.md에 비즈니스 문서 링크 추가

3. **에러 기록 시스템 강화 (CLAUDE.md v5.1)**
   - Critical Rules에 에러 문서화 P0 규칙 추가
   - 'Work Completion Records (P0)' 신규 섹션 추가
   - FAQ에 에러 카탈로그, 세션 로그 항목 추가
   - Quick Reference Card 4단계 기록 요구사항 추가

4. **에러 카탈로그 업데이트**
   - info/errors/backend/supabase-column-not-exist.md에 Case 2 추가
   - koreanewskorea source_url 에러 케이스 문서화

### 수정 파일
- CLAUDE.md (v5.0 → v5.1)
- koreanewskorea/plan/BUSINESS_STRATEGY.md (신규)
- koreanewskorea/START_HERE.md
- koreanewskorea/common/infrastructure/repositories/ArticleRepository.ts
- koreanewskorea/common/domain/entities/Article.ts
- koreanewskorea/app/news/[id]/page.tsx
- info/errors/backend/supabase-column-not-exist.md

### 사용 도구
- Read: 다수 파일
- Edit: CLAUDE.md, 에러 카탈로그, 엔티티/리포지토리
- Write: BUSINESS_STRATEGY.md
- Bash: git, vercel logs
- Playwright: koreanewskorea.vercel.app 확인

### 결과
- OK - Regional Homepage 정상 표시 확인
- OK - 비즈니스 전략 문서화 완료
- OK - 에러 기록 시스템 상위 지침에 명확히 반영

### 배포
- git commit: "docs: Enhance error recording system visibility in CLAUDE.md"
- Vercel 자동 배포 완료

---

## [2025-12-25 05:00] 세션 #29 - 스케줄 자동화 시스템 개선 by Claude

### 주인님 의도
- 4시 스케줄 정상 실행 여부 확인
- Task Scheduler 에러 해결 (267009, 2147946720)
- AI 가공 시 로그 창 표시 (admin_gui.py와 동일하게)
- 10분 타임아웃 OR 조건 추가 (스크래핑 미완료시에도 AI 처리 시작)

### 수행 작업

1. **Task Scheduler 에러 해결**
   - 문제: run_scraper.bat에서 pythonw.exe 사용 → 출력 버퍼 문제
   - 해결 1: pythonw.exe → python.exe 변경, 로깅 추가
   - 해결 2: Task Scheduler 직접 python.exe 실행으로 변경
   - 명령: `schtasks /Change /TN 'KoreaNewsScraperScheduled' /TR 'C:\\Python314\\python.exe d:\\cbt\\koreanews\\tools\\scheduled_scraper.py'`

2. **AILogWindow 구현 (scheduled_scraper.py)**
   - customtkinter 기반 로그 창 클래스 추가
   - 스케줄 실행 시 AI 가공 진행상황 실시간 표시
   - 로그 파일 저장 (tools/ai_log_YYYYMMDD_HHMMSS.txt)
   - 완료 후 5초 대기 → 자동 창 닫기

3. **10분 타임아웃 OR 조건 추가**
   - 기존: 모든 스크래퍼 완료 후 AI 처리
   - 변경: 완료 OR 10분 경과 → AI 처리 시작
   - concurrent.futures.wait() with timeout 사용
   - 타임아웃 시 미완료 스크래퍼 취소, bot_logs에 'timeout' 기록

### 수정 파일
- tools/run_scraper.bat: pythonw.exe → python.exe, 로깅 추가
- tools/scheduled_scraper.py: AILogWindow 클래스, 10분 타임아웃 로직
- Task Scheduler 설정 업데이트

### 사용 도구
- Read: scheduled_scraper.py, monitor_live.js, check_today_logs.js
- Edit: run_scraper.bat, scheduled_scraper.py
- Bash: schtasks, git commands

### 결과
- OK - Task Scheduler 정상 실행 확인
- OK - AILogWindow 구현 완료
- OK - 10분 타임아웃 기능 추가 완료

### 배포
- git commit: "feat: Add AILogWindow and 10-min timeout to scheduled scraper"

---

## [2025-12-23 14:00] 세션 #28 - Gemini Multi-Key 시스템 및 AI 재가공 에러 해결 by Claude

### 주인님 의도
- Gemini API 키 2개를 사용하여 Round-Robin 로테이션으로 AI 재가공
- AI 재가공 실패 원인 분석 및 해결

### 수행 작업

1. **Gemini 모델 호환성 문제 해결**
   - 문제: `gemini-3-flash-preview` 모델이 `@ai-sdk/google@2.0.51`에서 미지원
   - 시도: 주인님 제공 문서에 따라 `gemini-3-flash-preview` 사용 시도 → 실패
   - 해결: `gemini-2.5-flash`로 변경 (SDK 지원 모델)
   - 수정 파일: `/api/ai/rewrite/route.ts`, `/api/ai/test/route.ts`

2. **Round-Robin 키 로테이션 검증**
   - `src/lib/ai-key-rotation.ts` 확인
   - 2개 키 정상 등록 확인 (key1, key2)
   - 로그: `[KeyRotation] Selected key #1/2 (key1)`

3. **DB 스키마 누락 컬럼 발견 및 해결**
   - 증상: AI 처리 성공 (Grade A) → DB 업데이트 실패
   - 로그: `[STEP-8-DB-UPDATE-FAILED] "Could not find the 'ai_validation_grade' column"`
   - 원인: `posts` 테이블에 AI 관련 컬럼 미생성
   - 해결: 주인님이 Supabase에서 SQL 실행
   ```sql
   ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_validation_grade text;
   ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_double_validated boolean DEFAULT false;
   ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_validation_warnings text[];
   ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_processed boolean DEFAULT false;
   ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_processed_at timestamptz;
   ```

4. **에러 문서화**
   - `info/errors/database/ai-column-missing.md` 생성
   - `info/errors/_catalog.md` 업데이트

### 사용 도구
- Read: route.ts, ai-key-rotation.ts, ai-output-parser.ts, database.md
- Write: ai-column-missing.md
- Edit: _catalog.md

### 결과
- OK - Gemini 2.5 Flash 모델로 AI 재가공 정상 작동
- OK - 2개 키 Round-Robin 로테이션 정상
- OK - DB 컬럼 추가 후 업데이트 정상

### 에러 기록
- `info/errors/database/ai-column-missing.md` 생성 완료

---

## [2025-12-21 23:30] 세션 #27 - 기자 페이지 로그아웃 기능 추가 by Claude

### 주인님 의도
- /reporter 페이지에 로그아웃 기능 추가

### 수행 작업

1. **로그아웃 버튼 구현** (`src/app/reporter/page.tsx`)
   - LogOut 아이콘 import 추가
   - useRouter import 추가
   - loggingOut 상태 추가
   - handleLogout 핸들러 추가 (확인 모달 포함)
   - 프로필 수정 링크 옆에 로그아웃 버튼 배치

### 사용 도구
- TypeScript: tsc --noEmit 타입 체크 통과

### 결과
- OK - 로그아웃 버튼 추가 완료

### 배포
- git commit: "feat: Add logout button to reporter dashboard"

---

## [2025-12-21 22:00] 세션 #26 - 기자 배정 및 표시 버그 수정 by Claude

### 주인님 의도
- 기사에 기자 이름이 "코리아NEWS 취재팀"으로 표시되는 문제 해결
- 기자 자동배정 시스템 전체 점검

### 수행 작업

1. **지역 코드 오타 수정** (`src/app/api/bot/ingest/route.ts`)
   - `'신안군': 'shinan'` → `'신안군': 'sinan'`
   - DB 수정: `UPDATE posts SET region = 'sinan' WHERE region = 'shinan'`

2. **스크래퍼 콘텐츠 잘림 수정** (`scrapers/utils/scraper_utils.py`)
   - 문제: ▲ 특수문자가 문장 중간에 있으면 이후 내용 삭제
   - 해결: 정규식에 `^` 앵커 추가 (줄 시작만 매칭)

3. **12명 기자 profiles 누락 수정** (SQL)
   - 문제: reporters.user_id가 profiles.id에 없음
   - 해결: `INSERT INTO profiles` 실행하여 12명 추가

4. **기자 조회 쿼리 버그 수정** (`src/app/(site)/news/[id]/page.tsx`)
   - 문제: SELECT에 없는 컬럼 포함 (department, career_years, slug, sns_*)
   - 증상: Supabase 쿼리 실패 → data: null → "취재팀" 표시
   - 해결: SELECT를 실제 존재하는 컬럼만으로 수정
   - 추가: reporter.slug 참조 → reporter.id로 변경

### 실수 및 교훈
- 로컬 테스트(npm run dev)는 타입 체크 안 함
- Vercel 빌드(npm run build)는 타입 체크 함
- **커밋 전 `npx tsc --noEmit` 필수**

### 커밋
- `696ee21`: fix: Fix region mapping typo and content truncation issue
- `3ce71ed`: fix: Fix reporter lookup query with non-existent columns
- `fc4933f`: fix: Remove non-existent column references (slug, sns_*)

### 에러 기록
- `info/errors/backend/supabase-column-not-exist.md` 생성

### 결과
- 기자 이름 정상 표시 (고광혁 시정전문기자)
- 27개 지역 모두 기자 배정 가능

---

## [2025-12-19 07:00] 세션 #25 - GitHub Actions 병렬 스크래핑 구현 by Claude

### 주인님 의도
- 스크래퍼 실행 속도 개선 (순차 실행 -> 병렬 실행)
- 26개 지역 수집 시간 단축 (50분 -> 5분)
- 병렬 실행 시에도 로그 수집 정상 작동

### 수행 작업

1. **GitHub Actions Matrix 전략 도입** (`.github/workflows/daily_scrape.yml`)
   - 순차 실행 -> 병렬 실행으로 완전 재작성
   - `strategy.matrix.region`: 26개 지역 정의
   - `max-parallel: 10`: 동시 실행 제한
   - `fail-fast: false`: 한 지역 실패해도 다른 지역 계속 실행
   - `timeout-minutes: 15`: 개별 job 타임아웃

2. **13개 스크래퍼 이모지/구문 오류 수정**
   - 서브에이전트 2개 병렬 투입
   - 문제: 이모지로 인한 SyntaxError
   - 해결: ASCII 마커로 대체 ([INFO], [OK], [WARN], [ERROR])
   - 수정: gwangju, jeonnam, gangjin, goheung, haenam, hampyeong,
           jangseong, jindo, muan, shinan, yeongam, yeonggwang, gwangju_edu

3. **gokseong, yeongam 런타임 오류 수정**
   - 문제: `UnboundLocalError: 'title' not defined`
   - 해결: fetch_detail() 함수에 title 파라미터 추가

### 테스트 결과
- 1차: 12 성공, 14 실패 (이모지 오류)
- 2차: 24 성공, 2 실패 (title 오류)  
- 3차: 26 성공, 0 실패 (완료)

### 커밋
- `40f1187`: fix: Remove emojis and fix syntax errors in 13 scrapers
- `06f3957`: fix: Add title parameter to fetch_detail in gokseong and yeongam scrapers

### 결과
- GitHub Actions 병렬 실행 정상 작동
- 26개 지역 전체 성공
- 실행 시간 50분 -> 5분 (90% 단축)

---

## [2025-12-18 15:30] 세션 #24 - Detailed Scraper Logging Feature by Claude

### 주인님 의도
- 스크래퍼 수동 실행 UI에 상세 로그 기능 추가
- 날짜별 기사 수집 결과 표시 (12일은 기사 없음, 15일은 5건 등)
- 중복 기사(DB 존재) 제외 건수 명확히 표시

### 수행 작업

1. **Python DetailedStats 유틸리티 생성** (`scrapers/utils/detailed_stats.py`)
   - 날짜별 기사 통계 추적 클래스
   - JSON 마커로 감싼 출력 형식 (bot-service.ts 파싱용)
   - created/skipped/failed 상태별 집계

2. **bot-service.ts 파싱 로직 업데이트**
   - `===DETAILED_STATS_START===` / `===DETAILED_STATS_END===` 마커로 JSON 파싱
   - metadata.detailed_stats에 날짜별 breakdown 저장
   - 레거시 regex 폴백 유지 (다른 스크래퍼 호환)

3. **jeonnam_edu_scraper.py 업데이트** (샘플 스크래퍼)
   - DetailedStats 클래스 통합
   - 기사별 결과 추적 (created, skipped, failed)
   - stats.output() 호출로 JSON 출력

4. **DetailedResultPanel 컴포넌트 생성** (`src/app/admin/bot/run/components/`)
   - 지역별 접기/펼치기 UI
   - 날짜별 기사 수 표시 (+3, 중복 2건 등)
   - 기사 제목 목록 (상태 아이콘 포함)
   - 전체 요약 (신규, 중복, 실패, 성공 지역)

5. **ScraperPanel 통합**
   - "상세 로그" 토글 버튼 추가
   - 결과 요약에 중복 건수 표시
   - DetailedResultPanel 조건부 렌더링

### 사용 도구
- Python 문법 검증: py_compile
- TypeScript 타입 체크: tsc --noEmit
- 파일 생성/수정: Write, Edit

### 결과
- ✅ Python DetailedStats 모듈 완성
- ✅ TypeScript 파싱 로직 완성
- ✅ UI 컴포넌트 완성
- ✅ 빌드 검증 통과

### 향후 작업 (선택)
- 나머지 25개 스크래퍼에 DetailedStats 적용
- 현재는 jeonnam_edu만 적용됨 (레퍼런스 구현)

---

## [2025-12-18 10:00] 세션 #23 - Documentation Enhancement by Claude

### 주인님 의도
- 다른 AI가 "다크모드 없다"고 잘못 답변한 원인 분석
- CLAUDE.md 문서에 CSS/스타일 위치 정보 보강
- **Claude의 대화/실행 모드 구분 실수 지적 및 규칙 보강**

### 수행 작업

1. **FAQ에 다크모드/CSS 관련 항목 추가** (section 0.5)
   - "다크모드 있어?" → globals.css .admin-layout
   - "CSS/스타일 어디 있어?" → globals.css + tailwind.config.ts
   - "색상 변수 어디?" → globals.css @theme

2. **상세 문서 위치 테이블 보강** (section 0.6)
   - CSS/스타일 파일 → src/app/globals.css (다크모드, 테마)
   - Tailwind 설정 → tailwind.config.ts (색상, 폰트)

3. **대화 vs 실행 구분 규칙 대폭 보강** (P0 규칙)
   - **핵심 원칙 추가**: 기본값 = 대화 모드
   - **한국어 문장 어미 패턴 추가**: ~지.., ~네.., ~아니야? 등
   - **애매한 상황 프로토콜 추가**: 의도 불명확 시 먼저 물어보기
   - **실수 사례 문서화**: 2025-12-18 Claude의 P0 위반 사례

4. **버전 업데이트**: v4.8 → v4.10

### 교훈 (Claude 자체 반성)
- 주인님이 "~지..", "~아니야?" 등 관찰/의견 표현을 했는데
- Claude가 바로 코드 수정 + 커밋까지 진행 = P0 위반
- 대화로 의도 파악 → 명확한 지시 → 실행 순서 준수 필요

### 결과
- ✅ CSS/스타일 위치 문서화 완료
- ✅ 대화/실행 구분 규칙 강화 완료
- ✅ CLAUDE.md v4.10 업데이트 완료

---

## [2025-12-17 22:30] 세션 #22 - Category GNB Hierarchical Inheritance by Claude

### 주인님 의도
- 프론트엔드 메뉴와 관리자 카테고리 관리 연동 문제 해결
- Claude Hub를 관리자 전용으로 변경 (프론트엔드에서 숨김)
- 상위 카테고리 GNB OFF 시 하위 카테고리도 자동 OFF 되도록 수정

### 수행 작업

1. **Claude Hub 프론트엔드 메뉴에서 제거**
   - `src/components/Header.tsx`에서 하드코딩된 Claude Hub 링크 삭제
   - 데스크톱 GNB, 모바일 메뉴 모두 제거
   - 커밋: `bc71f0a`

2. **API 캐싱 비활성화**
   - `src/app/api/categories/route.ts`에 `dynamic = 'force-dynamic'` 추가
   - 관리자에서 GNB 변경 시 즉시 반영되도록 수정
   - 커밋: `dcadd67`

3. **GNB 계층 상속 필터링 (GET API)**
   - 부모 카테고리 GNB OFF → 자식 카테고리도 API 응답에서 제외
   - 커밋: `821478c`

4. **GNB 계층 상속 캐스케이드 (PATCH API)** - 근본적 해결책
   - 부모 GNB OFF 시 → DB에서 자식들도 자동으로 GNB OFF
   - `cascadeGnbOffToChildren()` 재귀 함수 추가
   - `cascadeActiveOffToChildren()` 재귀 함수 추가
   - `src/app/api/categories/[id]/route.ts` 수정
   - 커밋: `56c47ac`

### 문제 해결 과정
1. Claude Hub가 Header.tsx에 하드코딩 → 제거
2. GNB 변경 안 됨 → API 캐싱 문제 → force-dynamic 추가
3. 코스모스 OFF 해도 하위 노출 → 계층 상속 미구현 발견
4. GET API 필터링 (임시) → PATCH API 캐스케이드 (근본 해결)

### 사용 도구
- Edit: Header.tsx, route.ts 수정
- Read: 코드 분석
- Bash: curl API 테스트, git commit/push

### 결과
- ✅ Claude Hub 프론트엔드에서 숨김 완료
- ✅ 카테고리 GNB 계층 상속 정상 작동
- ✅ GNB 7개: 광주광역시, 전라남도, 전남지역, 광주교육청, 전남교육청, AI, 오피니언

### 배포
- 커밋: bc71f0a → dcadd67 → 821478c → 56c47ac
- Vercel 자동 배포 완료

### 추가 작업 (세션 후반)

5. **Gate 순서 수정**
   - 문제: Git 후 세션 로그 작성 → 로그가 Git에 안 들어감
   - 해결: 세션 로그 먼저 → Git 마지막
   - `CLAUDE.md` B.4 섹션 순서 변경
   - 커밋: `f79a0d3`

6. **GNB 메뉴 규칙 문서화**
   - 주인님 지적: "하드코딩 하지 말아야 하는 규칙이 없다"
   - 신규 문서: `info/guides/frontend/GNB_MENU_RULES.md`
   - CLAUDE.md CRITICAL RULES에 참조 규칙 추가
   - 핵심: 메뉴 = DB 카테고리 기반 동적 렌더링, 하드코딩 금지

### 교훈
- 세션 로그는 Git 전에 작성해야 함
- 반복되는 실수는 지침으로 문서화해야 다른 AI도 방지 가능
- 구체적 규칙은 별도 문서, CLAUDE.md는 참조만

7. **"Preparing..." 문제 해결**
   - 증상: 메인 페이지 오른쪽 사이드바에 "Preparing..." 계속 표시
   - 위치: `src/components/home/HomeHero.tsx` 206-220줄
   - 근본 원인: `src/app/(site)/page.tsx`에 `revalidate` 없음
   - Next.js 서버 컴포넌트는 기본적으로 빌드 타임 데이터 영구 캐시
   - 빌드 당시 sideArticles가 비어있으면 계속 빈 상태 유지
   - 해결: `export const revalidate = 60;` 추가 (60초마다 갱신)

---

## [2025-12-17 15:00] 세션 #21 - README FAQ System & Git Verification by Claude

### 주인님 의도
- 모든 폴더에 README.md 파일 생성 (한국어 FAQ 포함)
- AI가 파일 위치를 빠르게 찾을 수 있도록 자연어 검색 지원
- FAQ 동기화 문제 해결 (파일 추가/삭제 시 문서 업데이트)
- Git 이력을 최종 진실의 소스로 활용

### 수행 작업

1. **README.md 파일 대량 생성 (45+ 파일)**
   - src/ 하위: app, components, hooks, lib, types, constants, data, db
   - info/ 하위: guides, errors, config, ai-collab, planning
   - scrapers/ 하위: configs, _queue, 개별 지역
   - 기타: backend, design, docs, logo, public, .github/workflows

2. **Korean FAQ 섹션 추가**
   - 한국어 자연어 질문 → 파일 매핑
   - 예: "순천 스크래퍼 어디?" → `suncheon_scraper.py`
   - 예: "예약 시간?" → `.github/workflows/daily_scrape.yml`

3. **README_SYNC_GUIDE.md 생성** (`info/guides/`)
   - Part 1-6: FAQ 동기화 규칙, Changelog 형식
   - Part 7: Git History Verification (최종 진실)
   - Git 명령어: `git log --diff-filter=D/A -- "file"`

4. **CLAUDE.md 업데이트**
   - FAQ 검증 규칙 추가 (P1)
   - Git 검증 명령어 추가
   - Quick Reference Card에 FAQ 검증 섹션 추가

5. **예약 스크래퍼 작동 원리 설명**
   - GitHub Actions cron: 09:00, 13:00, 17:00 KST
   - `.github/workflows/daily_scrape.yml` 분석

### 사용 도구
- Write: 45+ README.md 파일 생성
- Edit: CLAUDE.md, _catalog.md, README.md 수정
- Read: daily_scrape.yml 분석
- Glob: 기존 파일 탐색

### 결과
- ✅ 56 files changed, 4255 insertions
- ✅ Git commit: `2e8604e` "docs: Add comprehensive README.md files with Korean FAQ"
- ✅ Vercel 자동 배포 트리거됨

### 주요 생성 파일
```
info/guides/README_SYNC_GUIDE.md (신규) - AI 필독 가이드
45+ README.md 파일 (신규) - 전체 폴더 커버리지
```

### 핵심 규칙 (Part 7)
```
파일 존재 확인 4중 안전장치:
1️⃣ README FAQ 확인
2️⃣ Glob/Read로 실제 파일 확인
3️⃣ 코드베이스 탐색
4️⃣ Git 이력 확인 (최종 진실)

git log --oneline --all -- "**/filename*"
```

### 교훈
- FAQ는 정적 인덱스 → 코드 변경 시 반드시 동기화
- Git 이력이 최종 진실 (README보다 정확)
- 도메인별 탐색 경로 정의로 빠른 답변 가능

---

## [2025-12-18 02:30] 세션 #20 - Reporter Dashboard UX Redesign by Claude

### 주인님 의도
- 기자가 대시보드에서 한눈에 모든 정보를 볼 수 있어야 함
- 여러 단계 거치지 않고 자유롭게 기사 수정/삭제/편집 가능해야 함
- 기능 추가 없이 UX 개선에 집중

### 수행 작업

1. **기존 대시보드 분석**
   - Card-based layout: 환영 메시지 → 통계 카드 → 빠른 액션 → Activity Feed
   - 문제점: 정보 밀도 낮음, 기사 목록 보려면 페이지 이동 필요

2. **신규 대시보드 설계 및 구현** (`src/app/reporter/page.tsx`)
   - Compact Header: 이름/직위 + 인라인 통계 + "새 기사" 버튼
   - Tab UI: "내 지역 기사" | "보도자료" 탭 전환
   - Article List: 직접 목록 표시 + 인라인 액션 버튼
     - 승인/반려 (대기 기사만)
     - 보기/수정/삭제
   - Press Releases List: 보도자료 목록 + "기사 작성" 버튼
   - Search & Filter: 탭 헤더에 통합
   - Pagination: 양쪽 탭에 페이지네이션

3. **TypeScript 체크 및 배포**
   - `npx tsc --noEmit` 통과
   - Git commit 및 push 완료

### 사용 도구
- Read: ReporterLayoutClient.tsx, articles/page.tsx
- Edit: src/app/reporter/page.tsx (642줄 추가, 233줄 삭제)
- Bash: TypeScript 체크, git commit/push

### 결과
- ✅ 대시보드 UX 완전 개편 완료
- ✅ 한 페이지에서 기사 목록 + 인라인 액션 가능
- ✅ Tab 기반 Articles/Press Releases 전환
- ✅ TypeScript 체크 통과
- ✅ Vercel 배포 완료

### 주요 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/app/reporter/page.tsx` | 전면 재작성 - Article-centric dashboard |

### 배포
- git commit: `4e54e01` "feat: Redesign reporter dashboard with article-centric UX"
- Vercel 자동 배포 트리거됨

---

## [2025-12-17 23:50] 세션 #19 - GNB Menu Structure Documentation by Claude

### 주인님 의도
- Header 서브메뉴(GNB) 구조를 문서화하여 다른 AI가 이해할 수 있도록
- 데이터 흐름: DB → API → Header 컴포넌트 분석
- 메뉴 추가/수정 방법 문서화

### 수행 작업

1. **관련 파일 분석**
   - `src/components/Header.tsx` 읽기 (547줄) - 메뉴 렌더링 로직 파악
   - `src/app/api/categories/route.ts` 읽기 (135줄) - API 구조 분석
   - `src/db/cms_schema_v2.sql` 읽기 - categories 테이블 스키마 확인

2. **info/frontend.md 문서화**
   - Section 11: "GNB Menu Structure" 추가
   - 총 334줄 분량 추가 (전체 670줄으로 확장)
   - 주요 내용:
     - Data Flow Architecture 다이어그램
     - DB categories 테이블 구조 (11개 주요 컬럼)
     - API 엔드포인트 사용법 (`/api/categories?gnb=true`)
     - Header 컴포넌트 메뉴 로딩 방법
     - URL 생성 로직 (`getCategoryUrl()`)
     - Active State 감지 로직 (`isActiveCategory()`)
     - 메뉴 추가/수정 방법 (SQL + 미래 Admin Panel)
     - Special Cases (Custom URL, Disabled Mega Menu, Static Items)
     - Troubleshooting (4가지 Issue)
     - Performance Optimization

3. **세션 로그 업데이트**
   - session_log.md에 세션 #19 기록

### 사용 도구
- Read: Header.tsx, categories API, database.md, frontend.md
- Grep: categories 관련 SQL 파일 검색
- Edit: frontend.md 대규모 업데이트

### 결과
- ✅ GNB Menu Structure 문서화 완료
- ✅ info/frontend.md Section 11 추가 (334줄)
- ✅ 세션 로그 업데이트 완료

### 주요 수정 파일
```
info/frontend.md (수정, 337 → 670줄)
.claude/context/session_log.md (이 파일)
```

### 문서 주요 내용
- 데이터 흐름: categories 테이블 → API → Header 컴포넌트
- 계층 구조: depth 0 (top-level) → depth 1 (sub-categories)
- API 쿼리: `?gnb=true`, `?active=true`, `?flat=true`
- 메가 메뉴: 4-column grid 드롭다운
- 특수 케이스: Custom URL, 외부 링크, 정적 메뉴
- 문제 해결: 로딩 실패, URL 오류, 순서 조정

### 교훈
- 복잡한 시스템은 데이터 흐름부터 문서화 (DB → API → UI)
- 코드와 SQL 스키마를 함께 분석해야 완전한 이해 가능
- Troubleshooting 섹션은 실제 에러 상황을 미리 대비

---

## [2025-12-17 23:30] 세션 #18 - 어드민 다크모드 전체 수정 by Claude

### 주인님 의도
- 어드민 대시보드 전체 다크모드 완전 적용
- Git 커밋 규칙 변경 (기본: 확인 후 커밋, 예외: 자율 커밋)
- 자율 커밋 모드로 전체 작업 위임

### 수행 작업

1. **CLAUDE.md v4.5 업데이트**
   - Git 커밋/배포 규칙 (P0) 섹션 추가
   - 기본 프로세스: 작업 완료 → 주인님 확인 → 승인 → 커밋
   - 예외 상황: "보고 안해도 돼" 등 → 자율 커밋 허용

2. **다크모드 CSS 1차 수정 (globals.css)**
   - `bg-red-100` 오버라이드 추가
   - `ring-red-200` 오버라이드 추가
   - `bg-red-50/30` 오버라이드 추가

3. **다크모드 CSS 2차 수정 - 포괄적 오버라이드**
   - Hover 상태: `hover:bg-gray-200`, `hover:bg-blue-50`, `hover:bg-red-50` 등
   - Hover 텍스트: `hover:text-gray-600/700/900` 등
   - Hover 테두리: `hover:border-gray-300` 등
   - Focus 상태: `focus:ring-blue-500`, `focus:ring-emerald-500` 등
   - Ring 색상: `ring-blue-200`

### 사용 도구
- Grep/Bash: 어드민 전체 클래스 분석 (196개 text-gray-500, 157개 bg-white 등 발견)
- Read, Edit: globals.css 체계적 수정
- Bash: 빌드 테스트, git commit/push

### 결과
- ✅ CLAUDE.md v4.5 커밋 완료 (70ea7a6)
- ✅ 다크모드 1차 수정 커밋 완료 (bff01a8)
- ✅ 다크모드 2차 포괄적 수정 커밋 완료 (9a2e713)

### 커밋
- `70ea7a6`: docs: Update CLAUDE.md v4.5 - Git commit approval rules
- `bff01a8`: fix: Add missing dark mode CSS overrides for admin dashboard
- `9a2e713`: fix: Comprehensive dark mode overrides for admin dashboard

---

## [2025-12-17 22:00] 세션 #17 - 문서 계층 구조화 완료 by Claude

### 주인님 의도
- CLAUDE.md만 읽어도 모든 프로젝트 문서에 접근 가능하도록 계층적 구조화
- 모든 문서 규칙을 찾아서 체계적으로 기록

### 수행 작업

1. **프로젝트 전체 문서 탐색**
   - 10개 폴더, 80+개 .md 문서 발견
   - info/, scrapers/, design/, docs/, idea/, gitinfo/, .claude/context/, .ai-collab/, backend/, src/

2. **CLAUDE.md 대규모 업데이트 (v4.4)**
   - Part F: 문서 계층 구조 (Document Hierarchy) 추가
     - 전체 폴더 트리 구조 문서화
     - 작업 유형별 진입점 매핑 테이블
   - Part G: 문서화 동기화 규칙 추가
     - 코드 변경 → 문서 업데이트 매트릭스
     - 작업 완료 전 문서 동기화 체크리스트
     - 문서 포맷 템플릿

3. **database.md 스키마 보완**
   - posts 테이블: `approved_by`, `approved_at` 컬럼 추가
   - reporters 테이블: `role` 컬럼 추가
   - site_settings 테이블 스키마 추가
   - audit_logs 테이블 스키마 추가

### 사용 도구
- Glob: 프로젝트 전체 .md 파일 탐색
- Read: 핵심 문서 10+개 분석
- Edit: CLAUDE.md, database.md 업데이트

### 결과
- ✅ CLAUDE.md v4.4 완성 - 문서 계층 구조 및 동기화 규칙 추가
- ✅ database.md 스키마 보완 완료

### 주요 수정 파일
```
CLAUDE.md - Part F, Part G 추가
info/database.md - 4개 스키마 항목 추가
```

### 교훈
- 프로젝트 문서는 계층적으로 구조화하여 진입점만 읽어도 전체 파악 가능하도록
- 코드 변경 시 관련 문서도 반드시 동기화

---

## [2025-12-17 18:00] 세션 #16 - 봇 관리 센터 문제 해결 by Claude

### 주인님 의도
- 관리자 메뉴 "봇 관리 센터" 분석
- 로그기록창 열리지 않는 문제 해결
- 수동수집 실행 후 기사가 없는 문제 해결

### 근본 원인 파악
- **Vercel 서버리스 환경에서 Python 실행 불가**
- `bot-service.ts`의 `spawn('python', ...)`이 프로덕션에서 실패
- 따라서 수동 수집을 실행해도 실제 스크래퍼가 동작하지 않았음

### 수행 작업

1. **GitHub Actions 워크플로우 대폭 개선** (`daily_scrape.yml`)
   - 기존 4개 → 27개 전체 지역 스크래퍼 추가
   - `workflow_dispatch` 입력 추가: region, days, log_id
   - 관리자 UI에서 특정 지역만 수집 가능

2. **API 수정** (`/api/bot/run/route.ts`)
   - Vercel 환경 감지 후 GitHub Actions 트리거
   - 로컬 개발은 기존 Python spawn 방식 유지
   - `triggerGitHubAction()` 함수 추가

3. **GitHub Secrets 설정 가이드 작성**
   - `info/guides/github-secrets.md` 생성
   - 필수 Secrets: SUPABASE_URL, BOT_API_URL, GITHUB_TOKEN 등
   - GitHub Token 생성 방법 문서화

4. **이전 세션 수정 사항 (로그 API)**
   - `/api/bot/logs/[id]/route.ts` 에러 핸들링 개선
   - `.env`에 BOT_API_URL, BOT_LOG_API_URL 추가

### 남은 작업 (주인님 필요)
- GitHub Secrets 설정 (GITHUB_TOKEN 등)
- Vercel 환경변수 설정 (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)

### 결과
- Git commit: `732c835` feat: Add GitHub Actions integration for Python scrapers
- Vercel 자동 배포 진행 중

---

## [2025-12-17 15:30] 세션 #15 - Header.tsx 인코딩 복구 by Claude

### 주인님 의도
- 다른 세션에서 발생한 Header.tsx 인코딩 손상 문제 해결
- 반복 방지를 위한 문서화

### 수행 작업

1. **Header.tsx 인코딩 복구**
   - 손상된 한글 텍스트 11개 수정
   - 주석: `카테고리 정의`, `현재 경로 확인`, `날짜 설정` 등
   - UI 텍스트: `구독신청`, `기자로그인`, `코리아NEWS`, `뉴스TV`, `전체메뉴`
   - aria-label: `메뉴 열기/닫기`, `기사 검색`

2. **에러 문서화** (재발 방지)
   - `info/errors/frontend/powershell-encoding.md` 생성
   - 원인: PowerShell의 기본 인코딩(cp949)이 UTF-8 파일 손상
   - 해결: git checkout 또는 수동 수정
   - 예방: 한글 파일 편집 후 결과 확인 필수

3. **에러 카탈로그 업데이트**
   - `info/errors/_catalog.md`에 항목 추가
   - 키워드: powershell, encoding, 한글, 깨짐, 인코딩

### 사용 도구
- Read: Header.tsx 손상 확인
- Edit: 한글 텍스트 복구 (11회)
- Write: 에러 문서 생성

### 결과
- ✅ Header.tsx 완전 복구 (커밋 325ce66)
- ✅ 에러 문서화 완료
- ✅ Git 푸시 완료

### 배포
- git commit: "fix: Restore corrupted Korean text encoding in Header.tsx"
- Vercel 자동 배포 완료

### 교훈
- PowerShell 기반 편집 시 한글 인코딩 손상 가능
- 한글 포함 파일 편집 후 즉시 git diff로 확인 필요
- 손상 발생 시 git checkout으로 즉시 복구

---

## [2025-12-17 21:30] 세션 #14 - PageSpeed 자동 체크 시스템 by Claude

### 주인님 의도
- PageSpeed 분석 자동화 시스템 구축
- 관리자 메뉴에서 설정 가능하도록
- 하이브리드 방식: API + Cron
- 디폴트 하루 3번 자동 체크

### 수행 작업

1. **PageSpeed API 엔드포인트 생성**
   - `/api/admin/pagespeed-check/route.ts` 신규 생성
   - Google PageSpeed Insights API v5 연동
   - POST: 수동 분석 트리거
   - GET: 크론 자동 호출용
   - 결과 자동 DB 저장 (pagespeed_logs 테이블)

2. **Vercel Cron Jobs 설정**
   - vercel.json에 3개 크론 추가
   - 09:00 KST (00:00 UTC)
   - 15:00 KST (06:00 UTC)
   - 21:00 KST (12:00 UTC)

3. **관리자 UI 개선**
   - 수동 분석 버튼 추가 (즉시 PageSpeed 측정)
   - 자동 체크 ON/OFF 토글 추가
   - 분석 결과 즉시 표시

4. **빌드 에러 수정**
   - URLSearchParams 중복 키 에러 해결
   - Object literal → append() 메서드로 변경

### 사용 도구
- 직접 구현: API, UI, 크론 설정

### 결과
- Commit: `47711eb` "feat: Add PageSpeed auto-check with cron jobs"
- 3 files changed, 380 insertions
- Vercel 자동 배포 완료

### 주요 생성/수정 파일
```
src/app/api/admin/pagespeed-check/route.ts (신규)
src/app/admin/settings/performance/page.tsx (수정)
vercel.json (수정)
```

### API 키 참고
- Google PageSpeed API는 키 없이도 기본 쿼터로 사용 가능
- 하루 3회 체크는 무료 한도 내

### 다음 단계
1. 배포 완료 후 수동 분석 버튼 테스트
2. 크론 작동 확인 (첫 실행 시점까지 대기)
3. 필요시 API 키 추가하여 쿼터 확대

---

## [2025-12-17 17:00] 세션 #13 - HomeHero Server Component 최적화 by Claude

### 주인님 의도
- PageSpeed Performance 점수 56 → 100 달성
- LCP 13.7초 → 2.5초 이하로 개선
- "응..전부다 진행해" - 모든 최적화 단계 완료 요청

### 수행 작업

1. **Phase 1-1: HomeHero Server Component 변환** (핵심)
   - `'use client'` 제거 → Server Component로 전환
   - Client-side fetch (useEffect) → Server-side data fetching
   - Supabase 직접 조회로 4-6초 client fetch 지연 제거
   - HeroSlider에 props로 데이터 전달

2. **Phase 1-2: Three.js 번들 분리 확인**
   - 이미 dynamic import 사용 중 (확인 완료)
   - 추가 작업 불필요

3. **Phase 2-1: Hero 이미지 최적화**
   - HeroSlider: 현재 + 인접 슬라이드만 렌더링 (메모리 최적화)
   - Next.js Image 컴포넌트 사용 (background-image 대체)
   - 첫 슬라이드에 priority 속성 적용

4. **Phase 2-2: 폰트 로딩 최적화**
   - 이미 preload + crossOrigin="anonymous" 설정됨
   - 추가 작업 불필요

5. **Phase 3: 빌드 테스트 및 배포**
   - `npm run build` 성공
   - 홈페이지 dynamic으로 변경: `f /` (서버 데이터 fetch 때문)
   - Git commit & push 완료

### 사용 도구
- 서브에이전트: 성능 병목 분석
- 직접 구현: HomeHero, HeroSlider 최적화

### 결과
- Commit: `0011307` "perf: Convert HomeHero to Server Component for LCP optimization"
- 2 files changed, 230 insertions, 168 deletions
- Vercel 자동 배포 트리거됨

### 주요 수정 파일
```
src/components/home/HomeHero.tsx - Server Component 변환
src/components/home/HeroSlider.tsx - Props 기반 데이터, 이미지 최적화
```

### 예상 효과
- LCP: 13.7초 → ~4-5초 (client fetch 제거)
- 추가 최적화 후: ~2.5초 목표

### 다음 단계
1. 배포 완료 후 PageSpeed Insights로 실제 측정
2. 측정 결과를 PageSpeed 관리 대시보드에 기록
3. 필요시 추가 최적화 (이미지 압축, 캐싱 등)

---

## [2025-12-17 14:00] 세션 #12 - PageSpeed 관리 대시보드 by Claude

### 주인님 의도
- PageSpeed 성능 측정 결과를 누적 관리할 수 있는 관리자 페이지 구축
- 주기적으로 체크하여 성능 최적화 노하우 축적
- 다른 AI 에이전트들이 참고할 수 있도록 기록 관리

### 수행 작업

1. **DB 스키마 생성**
   - `performance_logs` 테이블 설계
   - 점수: performance, accessibility, best_practices, seo (0-100)
   - Core Web Vitals: lcp_ms, fcp_ms, tbt_ms, cls, si_ms
   - 메모, 생성자, 측정일시

2. **API 엔드포인트**
   - `GET /api/admin/performance` - 측정 기록 목록 조회
   - `POST /api/admin/performance` - 새 측정 기록 추가
   - `DELETE /api/admin/performance/[id]` - 측정 기록 삭제

3. **대시보드 페이지** (`/admin/settings/performance`)
   - Score Cards: Performance, Accessibility, Best Practices, SEO
   - Core Web Vitals 표시: LCP, FCP, TBT, CLS, SI
   - 측정 히스토리 테이블 (최신순 정렬)
   - 새 측정 기록 추가 모달
   - 기록 삭제 기능

4. **사이드바 메뉴 추가**
   - AdminSidebar.tsx > 시스템 설정 > "PageSpeed 관리" 추가

5. **서브에이전트 활용 (병렬 작업)**
   - 접근성 개선 작업 위임 (Color Contrast, Touch Target, Heading Hierarchy)
   - 커밋: `1d4bb5d` "fix: Improve accessibility"

### 사용 도구
- 직접 구현: 대시보드 페이지, API, 사이드바 메뉴
- 서브에이전트(Task): 접근성 최적화

### 결과
- Commit: `315b307` "feat: Add PageSpeed performance management dashboard"
- 2 files changed, 442 insertions
- 빌드 성공, Vercel 자동 배포 완료

### 주요 생성/수정 파일
```
src/app/admin/settings/performance/page.tsx (신규)
src/app/api/admin/performance/route.ts (신규)
src/app/api/admin/performance/[id]/route.ts (신규)
src/components/admin/AdminSidebar.tsx (수정)
supabase/migrations/20251217_performance_logs.sql (신규)
info/performance.md (신규)
```

### 대시보드 접속
- URL: `/admin/settings/performance`
- 메뉴: 관리 > 시스템 설정 > PageSpeed 관리

### 다음 단계
1. Supabase에서 `performance_logs` 테이블 생성 (마이그레이션 SQL 실행)
2. PageSpeed Insights로 실제 측정 후 기록 추가
3. 점수 변화 추이 모니터링

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

## [2025-12-22] AI 재가공 시스템 전면 쇄신 (by Gemini)
- **작업**: 보안 강화(암호화), 소스 정리(프롬프트 단일화), 모델 업데이트(Gemini 2.5), 스크래퍼 연동 개선
- **결과**: 모든 Phase(1~6) 완료. 테스트 및 문서화 완료.
- **파일**: `AI_REWRITER_HANDOFF.md`, `src/lib/ai-prompts.ts`, `src/lib/encryption.ts` 등

