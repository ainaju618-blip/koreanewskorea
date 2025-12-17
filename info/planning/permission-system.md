# Korea NEWS 권한 관리 시스템 기획서

> **버전:** v1.1
> **작성일:** 2025-12-17
> **수정일:** 2025-12-17
> **작성자:** Claude (AI Assistant)
> **상태:** 주인님 검토 대기

---

## 1. 현황 분석

### 1.1 현재 시스템 구조

```
+---------------------------------------------------------------------+
|  현재 인증/인가 시스템                                               |
+---------------------------------------------------------------------+
|                                                                      |
|  [관리자 영역] /admin/*                                              |
|  +-- 보호: AdminAuthGuard (단순 비밀번호)                            |
|  +-- 사용자 식별: 불가능 (누가 접속했는지 모름)                       |
|  +-- 역할 구분: 없음 (비밀번호만 알면 모든 기능 사용)                 |
|  +-- 감사 로그: 없음                                                 |
|                                                                      |
|  [기자 영역] /reporter/*                                             |
|  +-- 보호: Supabase Auth (이메일/비밀번호)                           |
|  +-- 사용자 식별: 가능 (reporters 테이블 연동)                       |
|  +-- 역할 구분: 없음 (모든 기자 동일 권한)                           |
|  +-- access_level: 존재하지만 미사용                                 |
|                                                                      |
|  [API]                                                               |
|  +-- 대부분 인증 체크 없음                                           |
|  +-- 역할 기반 접근 제어 없음                                        |
|                                                                      |
+---------------------------------------------------------------------+
```

### 1.2 DB 스키마 현황

| 테이블.컬럼 | 타입 | 용도 | 현재 사용 |
|------------|------|------|----------|
| `reporters.access_level` | integer | 권한 레벨 | **미사용** |
| `reporters.position` | text | 직위 | 표시용만 |
| `reporters.region` | text | 담당 지역 | 사용 중 |
| `reporters.status` | text | 상태 | 로그인 시 체크 |
| `reporters.user_id` | uuid | Supabase Auth 연동 | 사용 중 |
| `users.role` | text | 역할 | **미사용** |
| `posts.author_id` | uuid | 기자 FK | **미사용** (승인 시 미설정) |
| `posts.author_name` | text | 기자명 | **미사용** |
| `posts.region` | text | 기사 지역 | 사용 중 |

### 1.3 문제점 요약

| 문제 | 영향도 | 설명 |
|------|-------|------|
| 관리자 식별 불가 | **Critical** | 누가 어떤 작업을 했는지 추적 불가 |
| 역할 기반 접근 제어 없음 | **Critical** | 비밀번호만 알면 모든 기능 접근 |
| 기사-기자 연결 없음 | **High** | 승인된 기사에 작성자 정보 없음 |
| API 보호 없음 | **High** | 직접 API 호출로 우회 가능 |
| 감사 로그 없음 | **Medium** | 변경 이력 추적 불가 |

---

## 2. 목표

### 2.1 핵심 목표

1. **역할 기반 접근 제어 (RBAC)** 구현
2. **기사-기자 자동 배정** 시스템 구축 (초창기 운영 최적화)
3. **관리자 식별** 가능하게 (Supabase Auth 통합)
4. **감사 로그** 시스템 구축

### 2.2 비목표 (이번 단계에서 제외)

- 복잡한 권한 커스터마이징 UI
- 실시간 권한 변경 반영
- 외부 SSO 연동

---

## 3. 역할(Role) 설계

### 3.1 역할 정의

```
+---------------------------------------------------------------------+
|  역할 계층 구조                                                      |
+---------------------------------------------------------------------+
|                                                                      |
|  [Level 100] super_admin (슈퍼관리자)                                |
|  +-- 시스템 전체 관리                                                |
|  +-- 다른 관리자 생성/삭제                                           |
|  +-- 모든 설정 변경                                                  |
|  +-- 전체 권한 (모든 지역 기사 배정 가능)                            |
|                                                                      |
|  [Level 80] admin (관리자)                                           |
|  +-- 기사 승인/발행                                                  |
|  +-- 기자 관리                                                       |
|  +-- 봇 실행                                                         |
|  +-- 일반 설정 변경                                                  |
|  +-- 전체 권한 (모든 지역 기사 배정 가능)                            |
|                                                                      |
|  [Level 60] editor (편집자)                                          |
|  +-- 기사 승인/발행                                                  |
|  +-- 모든 기사 수정                                                  |
|  +-- 기사 삭제                                                       |
|  +-- 전체 권한 (모든 지역 기사 배정 가능)                            |
|                                                                      |
|  [Level 40] reporter (기자)                                          |
|  +-- 자신의 기사 작성/수정                                           |
|  +-- 기사 초안 저장                                                  |
|  +-- 수집 로그 조회                                                  |
|  +-- 담당 지역 기사 배정 대상                                        |
|                                                                      |
|  [Level 20] contributor (기고자/시민기자)                            |
|  +-- 기사 작성만 (수정 불가)                                         |
|  +-- 작성 후 승인 대기                                               |
|                                                                      |
+---------------------------------------------------------------------+
```

### 3.2 역할 매핑 (기존 position 활용)

| 기존 position | 신규 role | access_level |
|--------------|-----------|--------------|
| editor_in_chief (주필) | super_admin | 100 |
| branch_manager (지사장) | admin | 80 |
| editor_chief (편집국장) | editor | 60 |
| news_chief (취재부장) | editor | 60 |
| senior_reporter (수석기자) | reporter | 40 |
| reporter (기자) | reporter | 40 |
| intern_reporter (수습기자) | contributor | 20 |
| citizen_reporter (시민기자) | contributor | 20 |

---

## 4. 권한(Permission) 매트릭스

### 4.1 기능별 권한

| 기능 | super_admin | admin | editor | reporter | contributor |
|------|:-----------:|:-----:|:------:|:--------:|:-----------:|
| **기사 관리** |
| 기사 목록 조회 | O | O | O | O | O |
| 기사 작성 | O | O | O | O | O |
| 자신의 기사 수정 | O | O | O | O | X |
| 타인의 기사 수정 | O | O | O | X | X |
| 기사 삭제 | O | O | O | X | X |
| 기사 승인/발행 | O | O | O | X | X |
| 기사 Focus 설정 | O | O | O | X | X |
| **봇 관리** |
| 수집 로그 조회 | O | O | O | O | X |
| 수동 수집 실행 | O | O | X | X | X |
| 스케줄러 설정 | O | O | X | X | X |
| 소스 관리 | O | O | X | X | X |
| **사용자 관리** |
| 기자 목록 조회 | O | O | O | X | X |
| 기자 등록/수정 | O | O | X | X | X |
| 기자 삭제 | O | X | X | X | X |
| 역할 변경 | O | X | X | X | X |
| **시스템 설정** |
| 사이트 정보 수정 | O | O | X | X | X |
| 카테고리 관리 | O | O | X | X | X |
| API 키 설정 | O | X | X | X | X |
| 레이아웃 관리 | O | O | X | X | X |

### 4.2 권한 코드 설계

```typescript
// 권한 상수 정의
const PERMISSIONS = {
  // 기사
  ARTICLE_VIEW: 'article:view',
  ARTICLE_CREATE: 'article:create',
  ARTICLE_EDIT_OWN: 'article:edit:own',
  ARTICLE_EDIT_ALL: 'article:edit:all',
  ARTICLE_DELETE: 'article:delete',
  ARTICLE_PUBLISH: 'article:publish',

  // 봇
  BOT_LOG_VIEW: 'bot:log:view',
  BOT_RUN: 'bot:run',
  BOT_SCHEDULE: 'bot:schedule',
  BOT_SOURCE: 'bot:source',

  // 사용자
  USER_VIEW: 'user:view',
  USER_MANAGE: 'user:manage',
  USER_DELETE: 'user:delete',
  USER_ROLE: 'user:role',

  // 시스템
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_API_KEYS: 'system:api_keys',
} as const;
```

---

## 5. 기사-기자 자동 배정 시스템 (핵심)

### 5.1 자동 배정 개요

> **초창기 운영 최적화**: 기사 승인 시 기자를 자동으로 배정하여 운영 부담을 최소화합니다.

```
+---------------------------------------------------------------------+
|  자동 배정 시스템 개념                                               |
+---------------------------------------------------------------------+
|                                                                      |
|  [자동 배정 ON] (기본값 - 체크됨)                                    |
|  +-- 승인 버튼 클릭 즉시 자동 배정 로직 실행                         |
|  +-- 기자 선택 모달 표시 안함                                        |
|  +-- 운영자 개입 최소화                                              |
|                                                                      |
|  [자동 배정 OFF] (체크 해제 시)                                      |
|  +-- 기자 선택 모달 표시                                             |
|  +-- 운영자가 직접 기자 선택                                         |
|  +-- 수동 배정 모드                                                  |
|                                                                      |
+---------------------------------------------------------------------+
```

### 5.2 자동 배정 우선순위 로직

```
+---------------------------------------------------------------------+
|  자동 배정 우선순위 (Fallback Chain)                                 |
+---------------------------------------------------------------------+
|                                                                      |
|  Step 1: 담당 지역 기자 확인                                         |
|          +-- 기사의 region과 기자의 region 매칭                      |
|          +-- 1명 있음 -> 해당 기자 배정                              |
|          +-- 2명 이상 -> 랜덤 선택 후 배정                           |
|          +-- 0명 -> Step 2로 이동                                    |
|                              |                                       |
|                              v                                       |
|  Step 2: 전체 권한 기자 확인                                         |
|          +-- role이 'editor' 이상 (access_level >= 60)               |
|          +-- 1명 이상 -> 랜덤 선택 후 배정                           |
|          +-- 0명 -> Step 3으로 이동                                  |
|                              |                                       |
|                              v                                       |
|  Step 3: 기본 계정 배정                                              |
|          +-- news@koreanewsone.com 계정 배정                         |
|          +-- (시스템 기본 기자 계정)                                 |
|                                                                      |
+---------------------------------------------------------------------+
```

### 5.3 자동 배정 상세 로직

```typescript
// 자동 배정 함수 (의사 코드)
async function autoAssignReporter(article: Post): Promise<Reporter> {
  const articleRegion = article.region;

  // Step 1: 담당 지역 기자 찾기
  const regionReporters = await getReportersByRegion(articleRegion);

  if (regionReporters.length === 1) {
    // 담당 기자 1명 -> 바로 배정
    return regionReporters[0];
  }

  if (regionReporters.length > 1) {
    // 담당 기자 2명 이상 -> 랜덤 선택
    const randomIndex = Math.floor(Math.random() * regionReporters.length);
    return regionReporters[randomIndex];
  }

  // Step 2: 전체 권한 기자 찾기 (editor 이상)
  const globalReporters = await getReportersByRole(['super_admin', 'admin', 'editor']);

  if (globalReporters.length > 0) {
    // 전체 권한 기자 중 랜덤 선택
    const randomIndex = Math.floor(Math.random() * globalReporters.length);
    return globalReporters[randomIndex];
  }

  // Step 3: 기본 계정 배정
  const defaultReporter = await getReporterByEmail('news@koreanewsone.com');
  return defaultReporter;
}
```

### 5.4 승인 프로세스 플로우

```
+---------------------------------------------------------------------+
|  기사 승인 프로세스                                                  |
+---------------------------------------------------------------------+
|                                                                      |
|  1. 관리자가 기사 승인 버튼 클릭                                     |
|                     |                                                |
|                     v                                                |
|  2. 자동 배정 설정 확인                                              |
|     +-- [X] 자동 배정 (기본값: 체크됨)                               |
|                     |                                                |
|          +--------------------+--------------------+                 |
|          |                                         |                 |
|          v                                         v                 |
|  [체크됨: 자동 배정]                    [체크 해제: 수동 배정]       |
|          |                                         |                 |
|          v                                         v                 |
|  3a. 자동 배정 로직 실행               3b. 기자 선택 모달 표시       |
|      +-- Step 1: 지역 기자                  +-- 추천: 지역 기자      |
|      +-- Step 2: 전체 권한 기자             +-- 전체 기자 검색       |
|      +-- Step 3: 기본 계정                  +-- 사용자가 선택        |
|          |                                         |                 |
|          +--------------------+--------------------+                 |
|                               |                                      |
|                               v                                      |
|  4. API 호출                                                         |
|     +-- status: 'published'                                          |
|     +-- author_id: 배정된 기자 ID                                    |
|     +-- author_name: 배정된 기자 이름                                |
|     +-- published_at: 현재 시간                                      |
|     +-- approved_by: 승인자 ID (감사용)                              |
|                               |                                      |
|                               v                                      |
|  5. 완료 (토스트 메시지로 배정 결과 알림)                            |
|     "기사가 발행되었습니다. 담당: 홍길동 기자"                       |
|                                                                      |
+---------------------------------------------------------------------+
```

### 5.5 자동 배정 설정 UI

```
+---------------------------------------------------------------------+
|  기사 관리 페이지 상단 설정                                          |
+---------------------------------------------------------------------+
|                                                                      |
|  +---------------------------------------------------------------+  |
|  |  기사 승인 설정                                                |  |
|  |                                                                |  |
|  |  [X] 자동 기자 배정                                            |  |
|  |      승인 시 담당 지역 기자를 자동으로 배정합니다.             |  |
|  |      (지역 기자 -> 전체 권한 기자 -> news@koreanewsone.com)    |  |
|  |                                                                |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
+---------------------------------------------------------------------+
```

### 5.6 기본 계정 설정 (news@koreanewsone.com)

```sql
-- 시스템 기본 기자 계정 (초기 데이터)
INSERT INTO reporters (
  name,
  email,
  position,
  role,
  access_level,
  region,
  status
) VALUES (
  'Korea NEWS',
  'news@koreanewsone.com',
  'editor_in_chief',
  'super_admin',
  100,
  NULL,  -- 지역 없음 (전체)
  'active'
);
```

---

## 6. 구현 방안

### 6.1 단계별 구현 계획

```
+---------------------------------------------------------------------+
|  Phase 1: 기반 작업 (1-2일)                                          |
+---------------------------------------------------------------------+
|  1. DB 스키마 변경                                                   |
|     - reporters.role 컬럼 추가                                       |
|     - reporters.access_level 기본값 설정                             |
|     - audit_logs 테이블 생성                                         |
|     - news@koreanewsone.com 기본 계정 생성                           |
|                                                                      |
|  2. 권한 유틸리티 생성                                               |
|     - lib/permissions.ts (권한 상수, 체크 함수)                      |
|     - lib/auth-utils.ts (현재 사용자 정보 조회)                      |
|     - lib/auto-assign.ts (자동 배정 로직)                            |
+---------------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------------+
|  Phase 2: 인증 통합 (2-3일)                                          |
+---------------------------------------------------------------------+
|  1. Admin 영역 Supabase Auth 통합                                    |
|     - AdminAuthGuard 개선 (비밀번호 -> Supabase Auth)                |
|     - 관리자도 reporters 테이블 사용 (role='admin')                  |
|                                                                      |
|  2. API 권한 체크 미들웨어                                           |
|     - middleware.ts 생성                                             |
|     - API별 필요 권한 정의                                           |
+---------------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------------+
|  Phase 3: 기사-기자 자동 배정 (2일)                                  |
+---------------------------------------------------------------------+
|  1. 승인 UI 개선                                                     |
|     - 자동 배정 토글 추가 (기본값: ON)                               |
|     - 수동 모드용 기자 선택 모달                                     |
|     - 배정 결과 토스트 알림                                          |
|                                                                      |
|  2. API 수정                                                         |
|     - /api/posts/[id] PATCH에 자동 배정 로직 추가                    |
|     - 배정 결과 응답에 포함                                          |
+---------------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------------+
|  Phase 4: 감사 로그 (1일)                                            |
+---------------------------------------------------------------------+
|  1. 감사 로그 기록                                                   |
|     - 주요 동작에 로그 삽입                                          |
|     - 기사 승인/삭제, 사용자 변경 등                                 |
|     - 자동 배정 이력 기록                                            |
|                                                                      |
|  2. 감사 로그 조회 UI                                                |
|     - /admin/audit-logs 페이지                                       |
+---------------------------------------------------------------------+
```

### 6.2 기술적 구현 방식

#### A. 자동 배정 유틸리티

```typescript
// lib/auto-assign.ts

import { createClient } from '@/lib/supabase-server';

interface Reporter {
  id: string;
  name: string;
  email: string;
  region: string | null;
  role: string;
  access_level: number;
}

interface AssignResult {
  reporter: Reporter;
  reason: 'region' | 'global' | 'default';
}

const DEFAULT_EMAIL = 'news@koreanewsone.com';

export async function autoAssignReporter(articleRegion: string | null): Promise<AssignResult> {
  const supabase = await createClient();

  // Step 1: 담당 지역 기자 찾기
  if (articleRegion) {
    const { data: regionReporters } = await supabase
      .from('reporters')
      .select('id, name, email, region, role, access_level')
      .eq('region', articleRegion)
      .eq('status', 'active');

    if (regionReporters && regionReporters.length > 0) {
      const selected = regionReporters.length === 1
        ? regionReporters[0]
        : regionReporters[Math.floor(Math.random() * regionReporters.length)];

      return { reporter: selected, reason: 'region' };
    }
  }

  // Step 2: 전체 권한 기자 찾기 (editor 이상, access_level >= 60)
  const { data: globalReporters } = await supabase
    .from('reporters')
    .select('id, name, email, region, role, access_level')
    .gte('access_level', 60)
    .eq('status', 'active')
    .neq('email', DEFAULT_EMAIL);  // 기본 계정 제외

  if (globalReporters && globalReporters.length > 0) {
    const selected = globalReporters[Math.floor(Math.random() * globalReporters.length)];
    return { reporter: selected, reason: 'global' };
  }

  // Step 3: 기본 계정 배정
  const { data: defaultReporter } = await supabase
    .from('reporters')
    .select('id, name, email, region, role, access_level')
    .eq('email', DEFAULT_EMAIL)
    .single();

  if (defaultReporter) {
    return { reporter: defaultReporter, reason: 'default' };
  }

  throw new Error('No reporter available for assignment');
}
```

#### B. 권한 체크 유틸리티

```typescript
// lib/permissions.ts

// 역할별 권한 매핑
const ROLE_PERMISSIONS = {
  super_admin: ['*'],  // 모든 권한
  admin: [
    'article:*',
    'bot:*',
    'user:view', 'user:manage',
    'system:settings'
  ],
  editor: [
    'article:*',
    'bot:log:view',
    'user:view'
  ],
  reporter: [
    'article:view', 'article:create', 'article:edit:own',
    'bot:log:view'
  ],
  contributor: [
    'article:view', 'article:create'
  ]
};

// 권한 체크 함수
function hasPermission(userRole: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  if (permissions.includes('*')) return true;

  // 와일드카드 체크 (article:* -> article:view 허용)
  const [category, action] = permission.split(':');
  if (permissions.includes(`${category}:*`)) return true;

  return permissions.includes(permission);
}
```

#### C. API 미들웨어

```typescript
// middleware.ts

// 경로별 필요 권한
const ROUTE_PERMISSIONS = {
  '/api/posts/*/publish': 'article:publish',
  '/api/bot/run': 'bot:run',
  '/api/users/reporters': 'user:manage',
  // ...
};
```

---

## 7. DB 변경 사항

### 7.1 reporters 테이블 변경

```sql
-- role 컬럼 추가 (position과 별개로 실제 권한용)
ALTER TABLE reporters
ADD COLUMN role TEXT DEFAULT 'reporter'
CHECK (role IN ('super_admin', 'admin', 'editor', 'reporter', 'contributor'));

-- access_level 기본값 설정
ALTER TABLE reporters
ALTER COLUMN access_level SET DEFAULT 40;

-- 기존 데이터 마이그레이션 (position 기반)
UPDATE reporters SET role = 'super_admin', access_level = 100
WHERE position = 'editor_in_chief';

UPDATE reporters SET role = 'admin', access_level = 80
WHERE position = 'branch_manager';

UPDATE reporters SET role = 'editor', access_level = 60
WHERE position IN ('editor_chief', 'news_chief');

UPDATE reporters SET role = 'reporter', access_level = 40
WHERE position IN ('senior_reporter', 'reporter');

UPDATE reporters SET role = 'contributor', access_level = 20
WHERE position IN ('intern_reporter', 'citizen_reporter');
```

### 7.2 기본 계정 생성

```sql
-- 시스템 기본 기자 계정 (news@koreanewsone.com)
INSERT INTO reporters (
  name,
  email,
  position,
  role,
  access_level,
  region,
  status,
  avatar_icon
) VALUES (
  'Korea NEWS',
  'news@koreanewsone.com',
  'editor_in_chief',
  'super_admin',
  100,
  NULL,
  'active',
  'newspaper'
) ON CONFLICT (email) DO UPDATE SET
  role = 'super_admin',
  access_level = 100;
```

### 7.3 audit_logs 테이블 생성

```sql
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES reporters(id),
    user_name TEXT,
    action TEXT NOT NULL,           -- 'article.publish', 'article.assign', etc.
    target_type TEXT,               -- 'post', 'reporter', 'settings'
    target_id TEXT,                 -- 대상 ID
    details JSONB,                  -- 추가 정보 (배정 사유 등)
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

### 7.4 posts 테이블 변경

```sql
-- 승인자 정보 추가
ALTER TABLE posts
ADD COLUMN approved_by UUID REFERENCES reporters(id),
ADD COLUMN approved_at TIMESTAMPTZ;
```

### 7.5 설정 저장 (자동 배정 토글)

```sql
-- site_settings 테이블에 자동 배정 설정 추가
-- (기존 설정 테이블이 없으면 생성)
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 자동 배정 기본값: true (체크됨)
INSERT INTO site_settings (key, value) VALUES
('auto_assign_reporter', 'true')
ON CONFLICT (key) DO NOTHING;
```

---

## 8. UI/UX 설계

### 8.1 메뉴 구조 변경

```
관리
+-- 사용자 관리
|   +-- 기자 등록/관리      (기존)
|   +-- 회원 관리           (기존)
|   +-- 권한 관리           (신규 - 강화)  <- 권한 매트릭스 + 역할 설정
|   +-- 감사 로그           (신규)
+-- 시스템 설정
    +-- ...
```

### 8.2 기사 관리 페이지 - 자동 배정 토글

```
+---------------------------------------------------------------------+
|  /admin/news                                                         |
+---------------------------------------------------------------------+
|                                                                      |
|  +---------------------------------------------------------------+  |
|  |  [기사 관리]                                     [설정 아이콘] |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  설정 패널 (아이콘 클릭 시 표시):                                    |
|  +---------------------------------------------------------------+  |
|  |                                                                |  |
|  |  [X] 자동 기자 배정 (기본값: 체크됨)                           |  |
|  |                                                                |  |
|  |  승인 시 기자를 자동으로 배정합니다:                           |  |
|  |  1순위: 해당 지역 담당 기자                                    |  |
|  |  2순위: 전체 권한 기자 (editor 이상)                           |  |
|  |  3순위: news@koreanewsone.com                                  |  |
|  |                                                                |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  [필터] [검색]                                                       |
|  +---------------------------------------------------------------+  |
|  | 제목 | 지역 | 상태 | 담당기자 | 작업 |                         |  |
|  +---------------------------------------------------------------+  |
|  | ...  | 나주 | 대기 |    -     | [승인] [편집] [삭제]          |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
+---------------------------------------------------------------------+
```

### 8.3 수동 배정 모달 (자동 배정 OFF 시)

```
+---------------------------------------------------------------------+
|  기자 배정 모달                                                      |
+---------------------------------------------------------------------+
|                                                                      |
|  이 기사를 발행할 기자를 선택하세요                                  |
|                                                                      |
|  기사 정보:                                                          |
|  - 제목: OOOO                                                        |
|  - 지역: 나주시                                                      |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  | [추천] 나주시 담당 기자                                        |  |
|  |   홍길동 기자 (나주시)                                         |  |
|  |   김철수 기자 (나주시)                                         |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  | 전체 기자 검색...                                              |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  전체 권한 기자:                                                     |
|  [이영희 편집장] [박지성 관리자]                                     |
|                                                                      |
|  [취소]                                            [선택 및 발행]    |
|                                                                      |
+---------------------------------------------------------------------+
```

### 8.4 승인 완료 토스트 메시지

```
자동 배정 시:
+---------------------------------------------------------------+
| [체크] 기사가 발행되었습니다.                                  |
|       담당: 홍길동 기자 (나주시 담당)                          |
+---------------------------------------------------------------+

기본 계정 배정 시:
+---------------------------------------------------------------+
| [체크] 기사가 발행되었습니다.                                  |
|       담당: Korea NEWS (담당 기자 없음)                        |
+---------------------------------------------------------------+
```

---

## 9. 마이그레이션 계획

### 9.1 단계별 마이그레이션

```
+---------------------------------------------------------------------+
|  Step 1: DB 스키마 변경 (무중단)                                     |
|  - 새 컬럼 추가 (기존 서비스 영향 없음)                              |
|  - 기존 데이터 마이그레이션                                          |
|  - news@koreanewsone.com 계정 생성                                   |
+---------------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------------+
|  Step 2: 권한 체크 코드 배포 (호환 모드)                             |
|  - 권한 체크 실패해도 경고만 (차단 안함)                             |
|  - 로그로 문제점 파악                                                |
+---------------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------------+
|  Step 3: 자동 배정 기능 배포                                         |
|  - 자동 배정 토글 (기본값: ON)                                       |
|  - 배정 로직 테스트                                                  |
+---------------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------------+
|  Step 4: 관리자 계정 설정                                            |
|  - 주인님 계정 super_admin 설정                                      |
|  - 필요한 관리자 계정 생성                                           |
+---------------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------------+
|  Step 5: 권한 체크 활성화                                            |
|  - 호환 모드 해제                                                    |
|  - 실제 권한 차단 적용                                               |
+---------------------------------------------------------------------+
```

### 9.2 롤백 계획

- 각 단계별 롤백 SQL 준비
- 권한 체크 비활성화 플래그 (환경변수)
- 자동 배정 토글로 즉시 OFF 가능
- 문제 발생 시 이전 버전 배포

---

## 10. 예상 일정

| 단계 | 작업 | 예상 소요 |
|------|------|----------|
| Phase 1 | DB 스키마 + 권한/배정 유틸리티 | 1.5일 |
| Phase 2 | Admin 인증 통합 + API 미들웨어 | 2일 |
| Phase 3 | 기사-기자 자동 배정 UI/API | 2일 |
| Phase 4 | 감사 로그 | 1일 |
| 테스트 | 통합 테스트 + 버그 수정 | 0.5일 |
| **합계** | | **7일** |

---

## 11. 위험 요소 및 대응

| 위험 | 영향 | 대응 |
|------|------|------|
| 기존 사용자 로그인 불가 | High | 마이그레이션 스크립트 사전 테스트 |
| 권한 체크로 기능 차단 | Medium | 호환 모드 우선 적용 |
| 자동 배정 오류 | Medium | 토글로 즉시 OFF 가능 |
| 담당 기자 없는 지역 | Low | 기본 계정 폴백 보장 |
| 감사 로그 과다 | Low | 중요 동작만 기록 |

---

## 12. 승인 체크리스트

- [ ] 역할 구조 승인 (super_admin ~ contributor)
- [ ] 권한 매트릭스 승인
- [ ] **자동 배정 로직 승인**
  - [ ] 1순위: 지역 담당 기자 (2명 이상 시 랜덤)
  - [ ] 2순위: 전체 권한 기자 중 랜덤
  - [ ] 3순위: news@koreanewsone.com
  - [ ] 자동 배정 토글 기본값: ON (체크됨)
- [ ] 구현 일정 승인 (7일)
- [ ] 착수 승인

---

## 13. 요약

### 자동 기자 배정 핵심

| 항목 | 내용 |
|------|------|
| **기본 설정** | 자동 배정 ON (체크됨) |
| **1순위** | 기사 지역 담당 기자 (2명 이상 시 랜덤) |
| **2순위** | 전체 권한 기자 (editor 이상) 중 랜덤 |
| **3순위** | news@koreanewsone.com (기본 계정) |
| **수동 모드** | 토글 해제 시 기자 선택 모달 표시 |

---

*이 기획서는 주인님의 검토 및 승인 후 구현을 시작합니다.*
