# 코리아NEWS 기자 배정 시스템 컨설팅 의뢰서

**작성일:** 2025-12-31
**프로젝트:** Korea NEWS (koreanewsone.com)
**기술 스택:** Next.js 16 (App Router), React 19, Supabase (PostgreSQL), TypeScript

---

## 1. 문제 요약

### 핵심 증상
1. **기자 이름이 페이지 새로고침마다 랜덤하게 변경됨**
2. **기자의 실제 직위가 표시되지 않고 "시정전문기자"로 고정 표시됨**
3. **기자가 등록되어 있는 지역의 기사도 "코리아NEWS 취재팀"으로 표시됨**

### 현재 상황 (스크린샷 기준)
- URL: `localhost:3000/news/f4c64ca7-88f1-4f2d-93c4-00ca79ecf7cd`
- 기사 제목: "박천복 일원산업 대표, 나주 문평면에 인재육성 장학금 500만 원 기탁"
- 표시된 기자: **"코리아NEWS 취재팀"** (기자 정보 없음)
- 실제 상황: **나주시에 기자 2명이 등록되어 있음**

---

## 2. 데이터베이스 구조

### 2.1 관련 테이블

#### `posts` 테이블 (기사)
```sql
- id: UUID (PK)
- title: TEXT
- content: TEXT
- category: TEXT
- region: TEXT (예: 'naju', 'gwangju', 'mokpo')
- author_id: UUID (FK → profiles.id) -- 기자의 프로필 ID
- author_name: TEXT -- 기자 이름 (fallback용)
- status: TEXT ('draft', 'pending', 'published')
- published_at: TIMESTAMP
```

#### `reporters` 테이블 (기자)
```sql
- id: UUID (PK)
- name: TEXT
- email: TEXT
- position: TEXT (예: 'chief_director', 'editor_in_chief', 'reporter')
- region: TEXT (예: '나주시', '광주광역시') -- 한글로 저장됨!
- status: TEXT ('Active', 'Inactive')
- user_id: UUID (FK → profiles.id) -- Auth 연동 계정의 프로필 ID
- specialty: TEXT (예: 'city', 'education')
```

#### `profiles` 테이블 (사용자 프로필)
```sql
- id: UUID (PK, Supabase Auth user.id와 동일)
- email: TEXT
- name: TEXT
- role: TEXT
```

### 2.2 테이블 관계도
```
posts.author_id ──────► profiles.id ◄────── reporters.user_id
                              │
                              └── posts와 reporters를 연결하는 중간 테이블
```

**문제점:** `posts.author_id`와 `reporters.id`가 직접 연결되지 않음!
- posts.author_id → profiles.id
- reporters.user_id → profiles.id
- 따라서 reporter를 찾으려면: posts.author_id = reporters.user_id 로 조회해야 함

---

## 3. 현재 코드 분석

### 3.1 기사 상세 페이지의 기자 조회 로직
**파일:** `src/app/(site)/news/[id]/page.tsx`

```typescript
// 현재 수정된 코드 (아직 배포 안됨)
let reporter = null;

// Try 1: author_id로 매칭 (posts.author_id = reporters.user_id)
if (news.author_id) {
    const { data } = await supabaseAdmin
        .from('reporters')
        .select('id, name, email, region, position, specialty, bio, profile_image, avatar_icon, user_id')
        .eq('user_id', news.author_id)  // ← profiles.id로 매칭
        .single();
    reporter = data;
}

// Try 2: author_name으로 매칭 (fallback)
if (!reporter && news.author_name) {
    const { data } = await supabaseAdmin
        .from('reporters')
        .select('...')
        .eq('name', news.author_name)
        .eq('status', 'Active')
        .single();
    reporter = data;
}

// 기자를 못 찾으면 → "코리아NEWS 취재팀" 표시
```

### 3.2 기존 코드의 문제점 (수정 전)
```typescript
// 이전 코드 - 문제가 있었음
async function getRandomReporter(region: string | null) {
    // 1. 지역 기자 찾기
    // 2. 없으면 글로벌 기자 찾기
    // 3. 없으면 기본 기자
    // → 매번 랜덤하게 선택하여 새로고침마다 다른 기자 표시!
}

// 페이지 로드시 호출
const reporter = await getRandomReporter(news.region);
```

**핵심 문제:** 기사에 `author_id`가 NULL이면 매번 랜덤으로 기자를 선택했음

---

## 4. 문제 원인 분석

### 4.1 "코리아NEWS 취재팀" 표시 원인

가능한 원인들:

1. **posts.author_id가 NULL**
   - 기사 승인 시 author_id가 저장되지 않았음
   - 기존 기사들은 author_id 없이 저장됨

2. **posts.author_name도 NULL이거나 매칭 안됨**
   - author_name이 reporters.name과 정확히 일치하지 않음

3. **reporters.user_id가 NULL**
   - 기자가 등록되었지만 Supabase Auth 계정이 연동되지 않음
   - user_id가 없으면 posts.author_id와 매칭 불가

4. **지역 코드 불일치**
   - posts.region: 영어 ('naju', 'gwangju')
   - reporters.region: 한글 ('나주시', '광주광역시')
   - 자동 배정 시 변환 로직이 필요하지만 실패할 수 있음

### 4.2 직위가 "시정전문기자"로 표시되는 원인

**파일:** `src/lib/reporter-utils.ts`

```typescript
// 이전 로직 (문제)
export function getSpecialtyTitle(reporter: ReporterInfo): string {
    // 지역 기반으로 자동 감지 → 나주 = CITY_REGIONS → "시정전문기자"
    if (CITY_REGIONS.includes(reporter.region)) {
        return '시정전문기자';
    }
    // position 필드 무시됨!
}

// 수정된 로직 (아직 배포 안됨)
export function getSpecialtyTitle(reporter: ReporterInfo): string {
    // 1. position 필드 우선 사용
    if (reporter.position) {
        const firstPosition = reporter.position.split(',')[0].trim();
        if (POSITION_LABELS[firstPosition]) {
            return POSITION_LABELS[firstPosition];  // "총괄본부장", "지사장" 등
        }
    }
    // 2. specialty 필드 (fallback)
    // 3. 기본값 "기자"
}
```

---

## 5. 자동 배정 시스템 분석

### 5.1 기사 승인 시 기자 자동 배정
**파일:** `src/lib/auto-assign.ts`

```typescript
export async function autoAssignReporter(articleRegion: string | null): Promise<AssignResult> {
    // 1. 영어 지역코드 → 한글 변환 (예: 'naju' → '나주시')
    const koreanRegionName = getRegionByCode(articleRegion)?.name;

    // 2. 해당 지역의 기자 조회
    const { data: regionReporters } = await supabaseAdmin
        .from('reporters')
        .select('...')
        .eq('region', koreanRegionName)  // 한글로 매칭
        .eq('status', 'Active')
        .not('user_id', 'is', null);     // user_id 있어야 함!

    // 3. 여러 명이면 랜덤 선택
    if (regionReporters.length > 1) {
        const randomIndex = Math.floor(Math.random() * regionReporters.length);
        return regionReporters[randomIndex];
    }

    // 4. 없으면 글로벌 기자 → 기본 계정
}
```

### 5.2 문제점
- `user_id`가 NULL인 기자는 배정 대상에서 제외됨
- 배정된 기자의 `user_id`가 posts.author_id로 저장되어야 함
- 기존 기사들은 author_id가 NULL 상태로 남아있음

---

## 6. 데이터 검증 필요 사항

외부 전문가님께서 확인해주셔야 할 항목:

### 6.1 해당 기사의 데이터 확인
```sql
-- 문제의 기사 조회
SELECT id, title, region, author_id, author_name, status
FROM posts
WHERE id = 'f4c64ca7-88f1-4f2d-93c4-00ca79ecf7cd';
```

예상 결과:
- `author_id`: NULL (문제)
- `author_name`: NULL 또는 매칭 안되는 값
- `region`: 'naju' 또는 'jeonnam_edu' 등

### 6.2 나주시 기자 데이터 확인
```sql
-- 나주시 기자 조회
SELECT id, name, position, region, status, user_id, email
FROM reporters
WHERE region = '나주시' AND status = 'Active';
```

확인 사항:
- 기자가 실제로 존재하는가?
- `user_id`가 NULL이 아닌가?
- `position` 값이 올바른가? (예: 'chief_director', 'reporter')

### 6.3 profiles 테이블 연동 확인
```sql
-- 기자의 user_id가 profiles에 존재하는지 확인
SELECT r.name, r.user_id, p.id as profile_id, p.email
FROM reporters r
LEFT JOIN profiles p ON r.user_id = p.id
WHERE r.region = '나주시';
```

---

## 7. 현재 로컬 수정 사항 (미배포)

### 7.1 수정된 파일 목록
```
M src/lib/reporter-utils.ts           -- 직위 표시 로직 수정
M src/app/(site)/news/[id]/page.tsx   -- 랜덤 기자 선택 제거
M src/app/admin/users/reporters/page.tsx -- 복수 직위 UI
M src/app/api/users/reporters/route.ts   -- 기자 생성 API
M src/app/api/users/reporters/[id]/route.ts -- 기자 삭제 API
```

### 7.2 수정 내용 요약

1. **reporter-utils.ts**
   - `getSpecialtyTitle()`: position 필드 우선 사용
   - `chief_director: '총괄본부장'` 추가

2. **news/[id]/page.tsx**
   - `getRandomReporter()` 함수 완전 제거
   - author_id → author_name 순서로 기자 조회
   - 못 찾으면 "코리아NEWS 취재팀" 표시 (랜덤 없음)

---

## 8. 근본적 해결 방안 제안

### 8.1 데이터 정합성 확보
```sql
-- 1. author_id가 NULL인 기사에 기자 배정 (수동 또는 배치)
UPDATE posts p
SET author_id = (
    SELECT r.user_id
    FROM reporters r
    WHERE r.region = (
        SELECT name FROM regions WHERE code = p.region
    )
    AND r.status = 'Active'
    AND r.user_id IS NOT NULL
    LIMIT 1
)
WHERE p.author_id IS NULL AND p.status = 'published';
```

### 8.2 기자 등록 시 필수 검증
- Auth 계정 생성 → profiles에 자동 생성 → reporters.user_id 연결
- user_id가 NULL인 기자는 기사 배정 불가 경고

### 8.3 기사 승인 프로세스
- 승인 시 반드시 author_id 저장
- 지역 기자 없으면 글로벌 기자 자동 배정
- 배정 결과 로그 저장

---

## 9. 질문 사항

1. **posts.author_id와 reporters를 직접 연결하는 것이 나은가?**
   - 현재: posts.author_id → profiles.id ← reporters.user_id
   - 대안: posts.reporter_id → reporters.id (직접 연결)

2. **기존 기사들의 author_id 일괄 배정 방법은?**
   - 지역 기준 자동 배정?
   - 관리자가 수동 지정?

3. **랜덤 배정 vs 고정 배정**
   - 복수 기자가 있는 지역에서 어떻게 배정할 것인가?
   - 한번 배정되면 영구적으로 유지?

---

## 10. 첨부 자료

### 10.1 관련 파일 경로
- 기자 유틸리티: `src/lib/reporter-utils.ts`
- 자동 배정: `src/lib/auto-assign.ts`
- 기사 상세 페이지: `src/app/(site)/news/[id]/page.tsx`
- 기자 관리 UI: `src/app/admin/users/reporters/page.tsx`
- 기자 API: `src/app/api/users/reporters/route.ts`
- 기사 승인 API: `src/app/api/admin/approve/route.ts`

### 10.2 Git 상태
```
현재 브랜치: master
수정된 파일: 5개 (미커밋, 미푸시)
프로덕션: koreanewsone.com (수정 전 코드)
로컬: localhost:3000 (수정 후 코드, 테스트 중)
```

---

## 11. 실제 데이터 확인 결과 (2025-12-31 조회)

### 11.1 문제의 기사 데이터
```json
{
  "id": "f4c64ca7-88f1-4f2d-93c4-00ca79ecf7cd",
  "title": "박천복 일원산업 대표, 나주 문평면에 인재육성 장학금 500만 원 기탁",
  "region": "naju",
  "author_id": null,    // ← 문제! 기자 ID가 없음
  "author_name": null,  // ← 문제! 기자 이름도 없음
  "status": "published"
}
```

**결론:** 기사에 author_id와 author_name이 모두 NULL이므로 기자를 매칭할 수 없음.

### 11.2 나주시 등록 기자 (정상)
```json
[
  {
    "id": "7905b995-3cc2-4993-9442-753021807b41",
    "name": "우미옥",
    "position": "editor_chief",  // 편집국장
    "region": "나주시",
    "status": "Active",
    "user_id": "662daeb1-1a33-4942-a75c-41fcbfa2175a",  // ✅ 있음
    "email": "umo7384@koreanewsone.com"
  },
  {
    "id": "9cd3c6e7-a4ff-4395-bca6-b916d734f557",
    "name": "허철호",
    "position": "chief_director",  // 총괄본부장
    "region": "나주시",
    "status": "Active",
    "user_id": "bd77d1ba-0507-4a0f-948f-47703a59fbbd",  // ✅ 있음
    "email": "naju@koreanewsone.com"
  }
]
```

**결론:** 나주시 기자 2명 모두 정상 등록됨. user_id도 있음.

### 11.3 전체 기자 user_id 상태
- **user_id 있는 기자:** 34명 ✅
- **user_id 없는 기자:** 2명 (Admin, Korea NEWS - 시스템 계정)

---

## 12. 확정된 문제 원인

### 근본 원인
**기사 승인(approval) 시점에 author_id가 저장되지 않음**

### 데이터 흐름 분석
```
스크래퍼 → posts 테이블 (author_id: NULL, author_name: NULL)
         ↓
관리자 승인 → status: 'published' (author_id는 여전히 NULL)
         ↓
기사 표시 → author_id로 기자 조회 → 못 찾음 → "코리아NEWS 취재팀"
```

### 해결해야 할 지점
1. **기사 승인 API** (`/api/admin/approve/route.ts`)에서 author_id 저장 로직 확인
2. **자동 배정 시스템** (`/lib/auto-assign.ts`)이 승인 시 호출되는지 확인
3. **기존 기사** author_id 일괄 업데이트 필요

---

## 13. 즉시 해결 가능한 쿼리

### 13.1 나주시 기사에 기자 일괄 배정 (예시)
```sql
-- 나주시(naju) 기사에 허철호 총괄본부장 배정
UPDATE posts
SET
  author_id = 'bd77d1ba-0507-4a0f-948f-47703a59fbbd',  -- 허철호 user_id
  author_name = '허철호'
WHERE region = 'naju'
  AND author_id IS NULL
  AND status = 'published';
```

### 13.2 모든 지역 기사에 기자 배정
각 지역별 대표 기자를 선정하여 배정 필요. (별도 작업)

---

## 14. 결정적 발견 (2025-12-31 추가 조사)

### 14.1 승인 API 확인
**파일:** `src/app/api/posts/[id]/route.ts` (PATCH)

```typescript
// 승인 시 자동 배정 로직 (이미 구현됨!)
if (body.status === 'published') {
    body.published_at = now;
    body.approved_at = now;  // ← 이게 설정되어야 함!

    const shouldAutoAssign = !body.author_id && !body.skip_auto_assign;
    if (shouldAutoAssign) {
        assignResult = await autoAssignReporter(articleRegion);
        body.author_name = assignResult.reporter.name;
        body.author_id = assignResult.reporter.user_id;  // ← author_id 설정
    }
}
```

### 14.2 site_settings 확인
```json
{
  "key": "auto_assign_reporter",
  "value": true,  // ← 활성화됨!
  "updated_at": "2025-12-17T02:03:58"
}
```

### 14.3 문제의 기사 데이터 (결정적 증거)
```json
{
  "id": "f4c64ca7-88f1-4f2d-93c4-00ca79ecf7cd",
  "published_at": "2025-12-30T09:46:38",
  "approved_at": null,     // ← 승인 API를 거치지 않음!
  "author_id": null,
  "author_name": null
}
```

### 14.4 최근 7일 기사 현황
```
X | 2025-12-31 | jeonnam | NULL
X | 2025-12-31 | jeonnam | NULL
X | 2025-12-31 | jindo | NULL
...
(최근 기사 전부 author_id가 NULL)
```

### 14.5 통계
- **author_id NULL 기사:** 1,256개
- **author_id 있는 기사:** 593개

---

## 15. 확정된 근본 원인

### 원인
**기사가 승인 API(`PATCH /api/posts/[id]`)를 거치지 않고 직접 `published` 상태로 저장됨**

### 증거
1. `approved_at`이 NULL → PATCH API의 승인 로직을 안 탔음
2. 최근 기사들도 전부 author_id가 NULL
3. auto_assign 설정은 true로 되어 있음 (API만 타면 작동함)

### 가능한 저장 경로 (확인 필요)
1. **스크래퍼가 직접 INSERT 시 status='published'로 저장**
2. **봇/자동화 API가 승인 로직 없이 저장**
3. **관리자가 DB에서 직접 status 변경**

---

## 16. 해결 방안

### 16.1 즉시 해결 (기존 1,256개 기사)
```sql
-- 지역별 대표 기자 배정 예시 (나주시)
UPDATE posts
SET
  author_id = 'bd77d1ba-0507-4a0f-948f-47703a59fbbd',
  author_name = '허철호'
WHERE region = 'naju'
  AND author_id IS NULL
  AND status = 'published';
```

또는 기존 API `/api/admin/bulk-assign-authors` 사용.

### 16.2 근본 해결 (향후 기사)
1. **기사 저장 경로 수정**: 모든 경로에서 승인 API 호출
2. **스크래퍼/봇 수정**: status='pending'으로만 저장, 별도 승인 필요
3. **DB 트리거**: INSERT/UPDATE 시 status='published'이면 자동 배정

---

## 17. 핵심 질문 (외부 전문가에게)

1. **기사가 승인 API를 거치지 않는 이유는?**
   - 스크래퍼/봇이 직접 published로 저장?
   - 의도된 동작인가, 버그인가?

2. **기존 1,256개 기사 일괄 배정 전략은?**
   - 지역별 대표 기자 1명 고정?
   - bulk-assign-authors API로 랜덤 배정?

3. **향후 프로세스 설계**
   - 모든 기사 저장 경로에서 autoAssign 강제?
   - DB 트리거로 해결?

---

**작성자:** Claude AI Assistant
**작성일:** 2025-12-31
**파일 위치:** `docs/consultation_reporter_issue_20251231.md`

**검토 요청:**
1. 스크래퍼/봇의 기사 저장 로직 확인
2. 기존 기사 일괄 배정 실행 여부 결정
3. 향후 자동 배정 프로세스 통합 방안
