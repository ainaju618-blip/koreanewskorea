# Gemini 작업지시서: 기사 검증 및 상태 관리 시스템

> **작성일:** 2025-12-14
> **프로젝트:** Korea NEWS
> **작업 목적:** 미완성 기사 노출 방지를 위한 검증 시스템 구축

---

## 1. 작업 개요

스크래퍼 에러 또는 원소스 문제로 인한 미완성 기사가 웹사이트에 노출되지 않도록 검증 시스템을 구축한다.

### 핵심 요구사항
1. **이미지 없는 기사**: 메인/카테고리 페이지 비노출, 지역 게시판만 대체 이미지로 노출
2. **필수 필드 누락 기사**: 완전 비노출 (rejected 처리)
3. **승인 단계에서 상태 표시**: 관리자가 기사 상태를 즉시 파악 가능

---

## 2. 데이터베이스 변경

### 2.1 articles 테이블 status 컬럼 추가

```sql
-- Supabase SQL Editor에서 실행

-- 1. status 컬럼 추가 (이미 없는 경우)
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';

-- 2. status 값 정의
-- 'published' : 전체 공개 (모든 기준 충족)
-- 'limited'   : 제한 공개 (이미지 없음, 지역 게시판만 노출)
-- 'draft'     : 검토 대기
-- 'rejected'  : 노출 불가 (필수 필드 누락)

-- 3. 기존 데이터 마이그레이션 (기존 기사들 상태 설정)
UPDATE articles
SET status = CASE
    -- 필수 필드 누락 → rejected
    WHEN title IS NULL OR LENGTH(title) < 10 THEN 'rejected'
    WHEN content IS NULL OR LENGTH(content) < 100 THEN 'rejected'
    WHEN published_at IS NULL THEN 'rejected'
    WHEN source IS NULL THEN 'rejected'
    -- 이미지 없음 → limited
    WHEN thumbnail IS NULL OR thumbnail = '' THEN 'limited'
    -- 모든 조건 충족 → published
    ELSE 'published'
END
WHERE status IS NULL OR status = 'draft';

-- 4. 인덱스 추가 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
```

---

## 3. API 수정

### 3.1 /api/bot/ingest 검증 로직 추가

**파일 위치:** `src/app/api/bot/ingest/route.ts`

```typescript
// 기사 검증 함수 추가
interface ValidationResult {
  isValid: boolean;
  status: 'published' | 'limited' | 'rejected';
  errors: string[];
  warnings: string[];
}

function validateArticle(article: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // === CRITICAL 체크 (하나라도 실패 시 rejected) ===

  // 제목 검증
  if (!article.title || article.title.trim().length < 10) {
    errors.push('제목 없음 또는 10자 미만');
  }
  // "제목없음", "...", "untitled" 등 무의미한 제목 체크
  const invalidTitles = ['제목없음', '제목 없음', '...', 'untitled', 'no title'];
  if (invalidTitles.some(t => article.title?.toLowerCase().includes(t))) {
    errors.push('무의미한 제목');
  }

  // 본문 검증
  if (!article.content) {
    errors.push('본문 없음');
  } else {
    // HTML 태그 제거 후 길이 체크
    const textContent = article.content.replace(/<[^>]*>/g, '').trim();
    if (textContent.length < 100) {
      errors.push('본문 100자 미만');
    }
    // 본문이 제목과 동일한 경우
    if (textContent === article.title?.trim()) {
      errors.push('본문이 제목과 동일');
    }
  }

  // 날짜 검증
  if (!article.published_at) {
    errors.push('날짜 없음');
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
    if (!dateRegex.test(article.published_at)) {
      errors.push('날짜 형식 오류');
    }
    // 미래 날짜 체크
    const articleDate = new Date(article.published_at);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (articleDate > tomorrow) {
      errors.push('미래 날짜');
    }
  }

  // 출처 검증
  if (!article.source || article.source.trim() === '') {
    errors.push('출처(지역) 없음');
  }

  // 원본 URL 검증
  if (!article.source_url || !article.source_url.startsWith('http')) {
    errors.push('원본 URL 오류');
  }

  // 인코딩 오류 체크
  const brokenChars = /[�]|&#\d+;/;
  if (brokenChars.test(article.title) || brokenChars.test(article.content)) {
    errors.push('인코딩 오류 감지');
  }

  // === WARNING 체크 (limited 처리) ===

  // 이미지 검증
  if (!article.thumbnail || article.thumbnail.trim() === '') {
    warnings.push('썸네일 이미지 없음');
  }

  // 담당부서 검증 (경고만)
  if (!article.department) {
    warnings.push('담당부서 없음');
  }

  // === 최종 상태 결정 ===
  let status: 'published' | 'limited' | 'rejected';

  if (errors.length > 0) {
    status = 'rejected';
  } else if (warnings.includes('썸네일 이미지 없음')) {
    status = 'limited';
  } else {
    status = 'published';
  }

  return {
    isValid: errors.length === 0,
    status,
    errors,
    warnings
  };
}
```

### 3.2 ingest API 메인 로직 수정

```typescript
// POST 핸들러 내부에 검증 로직 추가

export async function POST(request: Request) {
  try {
    const article = await request.json();

    // 기사 검증
    const validation = validateArticle(article);

    // rejected 상태면 저장하되 로그 남김
    if (validation.status === 'rejected') {
      console.warn(`[REJECTED] ${article.title}`, validation.errors);
      // 선택: rejected 기사도 DB에 저장할지 여부
      // 저장하면 관리자가 확인 가능, 안하면 완전 차단
    }

    // status 필드 추가하여 저장
    const articleWithStatus = {
      ...article,
      status: validation.status,
      validation_errors: validation.errors.length > 0 ? validation.errors : null,
      validation_warnings: validation.warnings.length > 0 ? validation.warnings : null,
    };

    // 기존 저장 로직 실행...
    const { data, error } = await supabase
      .from('articles')
      .insert(articleWithStatus);

    return Response.json({
      success: true,
      status: validation.status,
      errors: validation.errors,
      warnings: validation.warnings
    });

  } catch (error) {
    // 에러 처리...
  }
}
```

---

## 4. 프론트엔드 수정

### 4.1 기사 목록 조회 쿼리 수정

**메인 페이지 / 카테고리 페이지:**
```typescript
// published 상태만 조회 (이미지 있는 기사만)
const { data } = await supabase
  .from('articles')
  .select('*')
  .eq('status', 'published')
  .order('published_at', { ascending: false });
```

**지역 게시판 페이지:**
```typescript
// published + limited 모두 조회
const { data } = await supabase
  .from('articles')
  .select('*')
  .in('status', ['published', 'limited'])
  .eq('source', regionCode)
  .order('published_at', { ascending: false });
```

### 4.2 이미지 없는 기사 대체 이미지 컴포넌트

**파일 생성:** `src/components/ui/NoImagePlaceholder.tsx`

```tsx
interface NoImagePlaceholderProps {
  regionName?: string;
  className?: string;
}

export function NoImagePlaceholder({ regionName, className }: NoImagePlaceholderProps) {
  return (
    <div className={`
      flex flex-col items-center justify-center
      bg-gray-100 text-gray-500
      ${className}
    `}>
      {/* 지역 로고 또는 기본 아이콘 */}
      <svg
        className="w-12 h-12 mb-2 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span className="text-sm">이미지가 없는 기사입니다</span>
      {regionName && (
        <span className="text-xs mt-1">{regionName}</span>
      )}
    </div>
  );
}
```

### 4.3 기사 카드 컴포넌트 수정

**기존 ArticleCard 수정:**

```tsx
import { NoImagePlaceholder } from '@/components/ui/NoImagePlaceholder';

// 기사 카드 내 이미지 렌더링 부분
{article.thumbnail ? (
  <Image
    src={article.thumbnail}
    alt={article.title}
    fill
    className="object-cover"
  />
) : (
  <NoImagePlaceholder
    regionName={article.source_name}
    className="w-full h-full"
  />
)}
```

---

## 5. 관리자 페이지 수정

### 5.1 기사 목록에 상태 배지 표시

**파일 위치:** `src/app/admin/` 관련 파일

```tsx
// 상태 배지 컴포넌트
function StatusBadge({ status }: { status: string }) {
  const config = {
    published: { label: '공개', color: 'bg-green-100 text-green-800' },
    limited: { label: '제한공개', color: 'bg-yellow-100 text-yellow-800' },
    draft: { label: '검토대기', color: 'bg-gray-100 text-gray-800' },
    rejected: { label: '노출불가', color: 'bg-red-100 text-red-800' },
  };

  const { label, color } = config[status] || config.draft;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
```

### 5.2 승인 페이지 필터 추가

```tsx
// 상태별 필터 탭
<div className="flex gap-2 mb-4">
  <button onClick={() => setFilter('all')}>전체</button>
  <button onClick={() => setFilter('draft')}>검토대기</button>
  <button onClick={() => setFilter('limited')}>제한공개</button>
  <button onClick={() => setFilter('rejected')}>노출불가</button>
  <button onClick={() => setFilter('published')}>공개중</button>
</div>

// 검증 오류/경고 표시
{article.validation_errors && (
  <div className="text-red-600 text-sm">
    오류: {article.validation_errors.join(', ')}
  </div>
)}
{article.validation_warnings && (
  <div className="text-yellow-600 text-sm">
    경고: {article.validation_warnings.join(', ')}
  </div>
)}
```

### 5.3 상태 변경 기능

```tsx
// 관리자가 수동으로 상태 변경 가능
async function updateArticleStatus(articleId: string, newStatus: string) {
  const { error } = await supabase
    .from('articles')
    .update({ status: newStatus })
    .eq('id', articleId);

  if (!error) {
    showSuccess('상태가 변경되었습니다.');
    refreshList();
  }
}
```

---

## 6. 체크리스트

### 데이터베이스
- [ ] status 컬럼 추가
- [ ] 기존 데이터 마이그레이션
- [ ] 인덱스 생성

### API
- [ ] validateArticle 함수 구현
- [ ] /api/bot/ingest 검증 로직 추가
- [ ] validation_errors, validation_warnings 필드 저장

### 프론트엔드
- [ ] 메인/카테고리 페이지: published만 조회
- [ ] 지역 게시판: published + limited 조회
- [ ] NoImagePlaceholder 컴포넌트 생성
- [ ] ArticleCard 이미지 없는 경우 처리

### 관리자 페이지
- [ ] StatusBadge 컴포넌트 추가
- [ ] 상태별 필터 탭 추가
- [ ] 검증 오류/경고 표시
- [ ] 상태 수동 변경 기능

---

## 7. 참고 파일

| 파일 | 용도 |
|------|------|
| `src/app/api/bot/ingest/route.ts` | 기사 수집 API |
| `src/app/(site)/page.tsx` | 메인 페이지 |
| `src/app/(site)/[category]/page.tsx` | 카테고리 페이지 |
| `src/app/(site)/news/[region]/page.tsx` | 지역 게시판 |
| `src/app/admin/articles/page.tsx` | 관리자 기사 목록 |
| `src/components/ArticleCard.tsx` | 기사 카드 컴포넌트 |

---

## 8. 주의사항

1. **시스템 모달 사용 금지**: alert, confirm 대신 useToast, useConfirm 사용
2. **기존 패턴 유지**: 프로젝트의 기존 코드 스타일 따르기
3. **Supabase 타입**: 타입 정의 업데이트 필요 시 `src/types/` 확인
4. **테스트**: 각 단계별 테스트 후 다음 단계 진행

---

*작성자: Claude Code*
*검토 요청: 주인님*
