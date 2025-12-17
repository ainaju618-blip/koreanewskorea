# 데이터베이스 정보

> Supabase, 스키마, 마이그레이션 관련 모든 정보

---

## 1. 기본 정보

| 항목 | 값 |
|------|-----|
| **서비스** | Supabase |
| **DB** | PostgreSQL |
| **프로젝트** | koreanews |
| **대시보드** | https://supabase.com/dashboard |

---

## 2. 주요 테이블

### posts (기사)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | PK, 자동생성 |
| `title` | text | 기사 제목 |
| `content` | text | 본문 |
| `ai_summary` | text | AI 요약 |
| `original_link` | text | 원본 URL (중복체크 키) |
| `source` | text | 출처 기관명 |
| `category` | text | 카테고리 (광주/전남) |
| `region` | text | 지역 코드 (gwangju 등) |
| `thumbnail_url` | text | 이미지 경로 |
| `status` | text | 상태 (draft/published 등) |
| `author_id` | uuid | 기자 ID (FK) |
| `author_name` | text | 기자 이름 |
| `published_at` | timestamp | 발행일 |
| `created_at` | timestamp | 생성일 |
| `view_count` | integer | 조회수 |
| `is_focus` | boolean | 포커스 기사 여부 |
| `approved_by` | uuid | 승인자 ID (FK → reporters) |
| `approved_at` | timestamptz | 승인 일시 |

### reporters (기자)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | PK |
| `name` | text | 이름 |
| `type` | text | 유형 ('Human', 'AI Bot') |
| `position` | text | 직위 |
| `region` | text | 담당 지역 |
| `email` | text | 이메일 |
| `phone` | text | 전화번호 |
| `bio` | text | 소개 |
| `avatar_icon` | text | 아이콘 |
| `status` | text | 상태 ('Active', 'Inactive') |
| `user_id` | uuid | Supabase Auth ID |
| `access_level` | integer | 권한 레벨 |
| `role` | text | 역할 (super_admin/admin/editor/reporter/contributor) |

### site_settings (사이트 설정)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `key` | text | PK, 설정 키 |
| `value` | jsonb | 설정 값 (boolean/string/object) |
| `description` | text | 설정 설명 |
| `updated_at` | timestamptz | 마지막 수정일 |

**주요 설정 키:**
- `auto_assign_reporter`: 기사 승인 시 기자 자동 배정 (true/false)

### audit_logs (감사 로그)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | PK, 자동생성 |
| `user_id` | uuid | 수행자 ID (FK → reporters) |
| `action` | text | 수행 작업 (approve/reject/delete 등) |
| `target_type` | text | 대상 유형 (post/reporter/setting) |
| `target_id` | uuid | 대상 ID |
| `details` | jsonb | 상세 정보 |
| `created_at` | timestamptz | 수행 시각 |

---

## 3. [ERROR] 제약 조건 오류

### 3.1 posts_status_check
```
Error: new row violates check constraint "posts_status_check"
```

**원인:**
status 컬럼에 허용되지 않은 값 입력

**해결:**
```sql
-- 현재 제약 조건 확인
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'posts_status_check';

-- 제약 조건 수정 (trash 추가)
ALTER TABLE posts DROP CONSTRAINT posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check
  CHECK (status IN ('draft', 'review', 'published', 'rejected', 'archived', 'trash'));
```

### 3.2 reporters_type_check
```
Error: violates check constraint "reporters_type_check"
```

**해결:**
```sql
-- type은 'Human' 또는 'AI Bot'만 가능
-- position에 실제 직위 저장 (editor_in_chief, reporter 등)
```

---
*추가일: 2025-12-15*

---

## 4. [ERROR] 외래 키 오류

### 4.1 author_id 참조 오류
```
Error: violates foreign key constraint
```

**원인:**
존재하지 않는 reporter ID 참조

**해결:**
```typescript
// API에서 유효한 기자만 조회
const { data: reporters } = await supabaseAdmin
  .from('reporters')
  .select('id, name')
  .eq('status', 'Active');

if (reporters && reporters.length > 0) {
  const reporter = reporters[Math.floor(Math.random() * reporters.length)];
  article.author_id = reporter.id;
  article.author_name = reporter.name;
}
```

---
*추가일: 2025-12-15*

---

## 5. [ERROR] RLS 정책 오류

### 증상
```
Error: new row violates row-level security policy
```

### 해결 방법

#### 방법 1: Admin 클라이언트 사용
```typescript
// lib/supabase-admin.ts
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // RLS 우회
);
```

#### 방법 2: RLS 정책 추가
```sql
-- Supabase SQL Editor에서 실행
CREATE POLICY "Allow insert for service role"
ON posts
FOR INSERT
TO service_role
WITH CHECK (true);
```

---
*추가일: 2025-12-15*

---

## 6. [GUIDE] 쿼리 패턴

### 기본 조회
```typescript
const { data, error } = await supabaseAdmin
  .from('posts')
  .select('*')
  .eq('status', 'published')
  .order('published_at', { ascending: false })
  .limit(10);
```

### 조인 조회
```typescript
const { data } = await supabaseAdmin
  .from('posts')
  .select(`
    *,
    reporter:reporters(id, name, avatar_icon)
  `)
  .eq('id', postId)
  .single();
```

### 필터링
```typescript
// 여러 조건
.eq('status', 'published')
.gte('published_at', startDate)
.lte('published_at', endDate)

// OR 조건
.or('status.eq.published,status.eq.review')

// 텍스트 검색
.ilike('title', `%${keyword}%`)
```

### 페이지네이션
```typescript
const pageSize = 10;
const page = 1;

const { data, count } = await supabaseAdmin
  .from('posts')
  .select('*', { count: 'exact' })
  .range((page - 1) * pageSize, page * pageSize - 1);
```

---
*추가일: 2025-12-15*

---

## 7. [GUIDE] 마이그레이션

### 스키마 변경 절차
1. Supabase 대시보드 > SQL Editor
2. SQL 실행
3. 로컬 타입 업데이트 (`src/types/`)
4. API 코드 수정
5. 테스트

### 예시: 컬럼 추가
```sql
-- 1. 컬럼 추가
ALTER TABLE posts ADD COLUMN subtitle text;

-- 2. 기본값 설정 (선택)
ALTER TABLE posts ALTER COLUMN subtitle SET DEFAULT '';
```

### 예시: 컬럼명 변경
```sql
-- reporter_name → author_name
ALTER TABLE posts RENAME COLUMN reporter_name TO author_name;
```

---
*추가일: 2025-12-15*

---

## 8. [GUIDE] 백업 및 복구

### Supabase 자동 백업
- Pro 플랜: 매일 자동 백업
- Free 플랜: 수동 백업 필요

### 수동 백업 (pg_dump)
```bash
# 연결 정보는 Supabase 대시보드에서 확인
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

### 데이터 내보내기
```typescript
// API로 JSON 내보내기
const { data } = await supabaseAdmin
  .from('posts')
  .select('*');

fs.writeFileSync('posts_backup.json', JSON.stringify(data));
```

---
*추가일: 2025-12-15*

---

## 9. 인덱스 권장

### 자주 검색하는 컬럼
```sql
-- 상태별 조회
CREATE INDEX idx_posts_status ON posts(status);

-- 날짜별 조회
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);

-- 원본 링크 (중복 체크)
CREATE UNIQUE INDEX idx_posts_original_link ON posts(original_link);

-- 지역별 조회
CREATE INDEX idx_posts_region ON posts(region);
```

---
*추가일: 2025-12-15*

---

## 10. 연결 정보

### 환경 변수
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### 대시보드
- URL: https://supabase.com/dashboard
- 프로젝트: koreanews

### 직접 연결 (필요시)
```
Host: db.xxx.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: (대시보드에서 확인)
```

---

*최종 업데이트: 2025-12-15*
