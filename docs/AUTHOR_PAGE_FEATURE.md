# 기자 페이지 기능 (Author Page Feature)

## 개요
뉴스 기사에서 기자 이름을 클릭하면 해당 기자의 전용 페이지로 이동하는 기능.
기자의 직위, 담당 지역, 작성 기사 목록 등을 확인할 수 있음.

## 구현 날짜
2026-01-09

---

## 주요 파일 구조

```
src/app/author/
├── layout.tsx          # 기자 페이지 레이아웃 (StitchHeader 사용)
├── search/
│   └── page.tsx        # 기자 이름으로 검색 → 리다이렉트
└── [slug]/
    └── page.tsx        # 기자 상세 페이지
```

---

## 1. 기자 직위 표시 (Author Name with Position)

### 위치
- `src/app/api/admin/articles/route.ts` (기사 생성 API)
- `src/app/api/admin/articles/[id]/route.ts` (기사 수정 API)

### 형식
```
author_name = "이름 직위"
예: "허철호 전국총괄본부장"
예: "우미옥 나주지사장"
예: "김철수 기자"
```

### 직위 코드 → 한글 변환
`src/lib/reporter-utils.ts`의 `POSITION_LABELS` 사용:
```typescript
export const POSITION_LABELS: Record<string, string> = {
    national_chief_director: '전국총괄본부장',
    chief_director: '총괄본부장',
    branch_manager: '지사장',
    reporter: '기자',
    // ...
};
```

---

## 2. 뉴스 상세 페이지에서 기자 링크

### 위치
`src/app/(site)/news/[id]/page.tsx`

### 기자 조회 로직 (lines 248-269)
```typescript
// Try 1: author_id로 reporters 테이블에서 검색
if (news.author_id) {
    const { data } = await productionSupabase
        .from('reporters')
        .select('...')
        .eq('user_id', news.author_id)
        .single();
    reporter = data;
}

// Try 2: author_name에서 이름 추출 후 검색
if (!reporter && news.author_name) {
    const reporterName = news.author_name.split(' ')[0]; // "허철호 전국총괄본부장" → "허철호"
    const { data } = await productionSupabase
        .from('reporters')
        .select('...')
        .eq('name', reporterName)
        .eq('status', 'Active')
        .single();
    reporter = data;
}
```

### 바이라인 렌더링 (lines 397-428)
```tsx
{reporter ? (
    // 기자 찾음 → 프로필 링크
    <Link href={`/author/${reporter.id}`}>
        {reporter.name} {reporterTitle}
    </Link>
) : news.author_name ? (
    // 기자 못 찾음, author_name 있음 → 검색 페이지로 링크
    <Link href={`/author/search?name=${encodeURIComponent(news.author_name.split(' ')[0])}`}>
        {news.author_name}
    </Link>
) : (
    // 둘 다 없음 → 기본값
    <div>코리아NEWS 취재팀</div>
)}
```

---

## 3. 기자 검색 페이지

### 위치
`src/app/author/search/page.tsx`

### 기능
- URL: `/author/search?name=허철호`
- 기자 이름으로 검색 후 기자 페이지로 리다이렉트
- 못 찾으면 404

### 코드
```typescript
const { data: reporter } = await supabaseAdmin
    .from("reporters")
    .select("id, name")
    .eq("name", name)
    .eq("status", "Active")
    .single();

if (reporter) {
    redirect(`/author/${encodeURIComponent(reporter.name)}`);
}
notFound();
```

---

## 4. 기자 상세 페이지

### 위치
`src/app/author/[slug]/page.tsx`

### URL 형식
- 이름 기반: `/author/허철호` (권장, SEO 친화적)
- UUID 기반: `/author/9cd3c6e7-a4ff-4395-bca6-b916d734f557` (자동 리다이렉트)

### 기자 조회 (getReporter 함수)
```typescript
async function getReporter(slugOrId: string) {
    // UUID인 경우 id로 검색
    if (UUID_REGEX.test(slugOrId)) {
        return await supabaseAdmin
            .from("reporters")
            .select("*")
            .eq("id", slugOrId)
            .eq("status", "Active")
            .single();
    }

    // UUID가 아닌 경우: name으로 검색
    return await supabaseAdmin
        .from("reporters")
        .select("*")
        .eq("name", decodeURIComponent(slugOrId))
        .eq("status", "Active")
        .single();
}
```

### 기사 조회
```typescript
// author_name 형식: "이름 직위" (예: "허철호 전국총괄본부장")
if (reporter.user_id) {
    articlesQuery = articlesQuery.or(
        `author_id.eq.${reporter.user_id},author_name.ilike.${reporter.name}%`
    );
} else {
    articlesQuery = articlesQuery.ilike("author_name", `${reporter.name}%`);
}
```

---

## 5. 기자 페이지 레이아웃

### 위치
`src/app/author/layout.tsx`

### 중요
메인 사이트와 동일한 레이아웃 사용:
```typescript
import StitchHeader from '@/components/StitchHeader';  // 나주 전용 메뉴
import StitchFooter from '@/components/StitchFooter';
import MobileTabBar from '@/components/MobileTabBar';

export default function AuthorLayout({ children }) {
    return (
        <div className="flex flex-col min-h-screen">
            <StitchHeader />
            <main className="flex-grow pb-16 lg:pb-0">
                {children}
            </main>
            <StitchFooter />
            <MobileTabBar />
        </div>
    );
}
```

**주의**: `Header` 대신 `StitchHeader`를 사용해야 나주 전용 메뉴 표시됨!

---

## 6. 데이터베이스 구조

### reporters 테이블
| 컬럼 | 설명 |
|------|------|
| id | UUID (PK) |
| name | 기자 이름 (예: "허철호") |
| position | 직위 코드 (예: "national_chief_director") |
| region | 담당 지역 (예: "나주시") |
| user_id | profiles 테이블 참조 |
| status | 상태 ("Active", "Inactive") |

### posts 테이블
| 컬럼 | 설명 |
|------|------|
| author_id | profiles.id 참조 |
| author_name | "이름 직위" 형식 (예: "허철호 전국총괄본부장") |

---

## 7. 주의사항

1. **slug 컬럼 없음**: reporters 테이블에 slug 컬럼이 없어서 name으로 검색
2. **author_name 형식**: "이름 직위" 형식이므로 검색 시 split(' ')[0]로 이름만 추출
3. **공유 DB**: koreanewsone과 koreanewskorea가 같은 Supabase DB 사용
4. **레이아웃**: 반드시 StitchHeader 사용 (Header 사용 시 잘못된 메뉴 표시)

---

## 8. 관련 API

- `GET /api/admin/articles/fix-authors-production` - 기존 기사 author_name 일괄 업데이트
  - `mode=diagnose`: 현황 진단
  - `mode=all`: 모든 기사 "이름 직위" 형식으로 업데이트
