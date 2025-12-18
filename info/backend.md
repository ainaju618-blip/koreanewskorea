# 백엔드 개발 정보

> API, Supabase, 인증, 서버 로직 관련 모든 정보

---

## 1. 기술 스택

| 항목 | 값 |
|------|-----|
| **API** | Next.js API Routes (App Router) |
| **데이터베이스** | Supabase (PostgreSQL) |
| **인증** | Supabase Auth |
| **이미지** | **Cloudinary** (필수, 실패 시 에러) |

---

## 2. API 구조

```
src/app/api/
├── posts/                  # 기사 CRUD
│   ├── route.ts            # GET (목록), POST (생성)
│   └── [id]/route.ts       # PATCH, DELETE
├── users/
│   └── reporters/          # 기자 관리
│       ├── route.ts        # GET, POST
│       └── [id]/route.ts   # PATCH, DELETE
├── bot/
│   └── ingest/route.ts     # 스크래퍼 → DB 저장
└── auth/
    └── login/route.ts      # 관리자 로그인
```

---

## 3. [ERROR] Supabase 연결 오류

### 3.1 환경 변수 누락
```
Error: supabaseUrl is required
```

**확인:**
```bash
# .env.local 필수 변수
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # 서버 전용
```

### 3.2 Admin 클라이언트 사용
```typescript
// lib/supabase-admin.ts (서버에서만 사용)
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Admin 권한
);
```

### 3.3 RLS 정책 문제
```
Error: new row violates row-level security policy
```

**해결:**
- Admin 작업은 `supabaseAdmin` 사용 (RLS 우회)
- 또는 Supabase 대시보드에서 RLS 정책 수정

---
*추가일: 2025-12-15*

---

## 4. [ERROR] API 응답 오류

### 4.1 500 Internal Server Error
```typescript
// 디버깅 로그 추가
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();

    console.log('[PATCH] ID:', id, 'Body:', JSON.stringify(body));

    // ... 처리 ...

  } catch (error: unknown) {
    console.error('[PATCH] Error:', error);
    const message = error instanceof Error ? error.message : '서버 오류';
    return NextResponse.json({ message }, { status: 500 });
  }
}
```

### 4.2 CORS 오류
```typescript
// middleware.ts 또는 API에서 헤더 추가
return NextResponse.json(data, {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE',
  }
});
```

---
*추가일: 2025-12-15*

---

## 5. [ERROR] 기자 배정 오류

### 증상
기사에 기자가 배정되지 않거나 잘못된 기자 표시

### 해결 (v1.0 → v2.0)
```typescript
// posts 테이블 필드
author_id: string     // 기자 UUID
author_name: string   // 기자 이름 (표시용)

// API에서 기자 배정
const randomReporter = reporters[Math.floor(Math.random() * reporters.length)];
article.author_id = randomReporter.id;
article.author_name = randomReporter.name;
```

### 참고
- `author_name`은 DB 컬럼명 (`reporter_name`에서 변경)
- `src/types/news.ts`에 타입 정의됨

---
*추가일: 2025-12-15*

---

## 6. [GUIDE] 기사 상태 관리

### 상태 값
| 상태 | 의미 |
|------|------|
| `draft` | 초안 (스크래퍼 수집) |
| `review` | 검토 대기 |
| `published` | 발행됨 (메인 노출) |
| `rejected` | 반려됨 |
| `archived` | 보관됨 |
| `trash` | 휴지통 |

### 승인 시 Touch-to-Top
```typescript
// PATCH /api/posts/[id]
if (body.status === 'published') {
  const now = new Date().toISOString();
  body.published_at = now;  // 현재 시간으로 갱신 → 메인 상단 노출
}
```

---
*추가일: 2025-12-15*

---

## 7. [GUIDE] 스크래퍼 Ingest API

### 엔드포인트
```
POST /api/bot/ingest
```

### 요청 형식
```json
{
  "title": "기사 제목",
  "content": "본문 내용",
  "original_link": "https://원본URL",
  "source": "광주광역시",
  "category": "광주",
  "region": "gwangju",
  "thumbnail_url": "/images/gwangju/xxx.jpg",
  "published_at": "2025-12-15T10:00:00Z"
}
```

### 중복 체크
- `original_link` 기준 중복 확인
- 중복 시 `{ duplicate: true }` 반환

### 기자 자동 배정
- 활성 기자 중 랜덤 선택
- `author_id`, `author_name` 자동 설정

---
*추가일: 2025-12-15*

---

## 8. [GUIDE] 인증 구조

### 관리자 인증
```typescript
// localStorage 기반 (모든 탭 공유)
localStorage.setItem('admin_auth', 'true');

// 확인
const isAdmin = localStorage.getItem('admin_auth') === 'true';
```

### Supabase Auth
```typescript
// 사용자 생성 (기자 등록 시)
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: body.email,
  password: password,
  email_confirm: true,
  user_metadata: {
    name: body.name,
    role: 'reporter'
  }
});
```

---
*추가일: 2025-12-15*

---

## 9. [GUIDE] 에러 처리 패턴

### 표준 형식
```typescript
export async function handler(req: NextRequest) {
  try {
    // 처리 로직

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('[API] Error:', error);

    const message = error instanceof Error
      ? error.message
      : '서버 오류가 발생했습니다.';

    return NextResponse.json({ message }, { status: 500 });
  }
}
```

### 특정 에러 처리
```typescript
// DB 제약 조건 에러
if (message.includes('posts_status_check')) {
  return NextResponse.json({
    message: 'DB 스키마를 업데이트해주세요.'
  }, { status: 500 });
}
```

---
*추가일: 2025-12-15*

---

## 10. 환경 변수

### 필수
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudinary (레거시, 선택)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Vercel에서 설정
```bash
vercel env ls          # 확인
vercel env add NAME    # 추가
vercel env pull .env.local  # 로컬에 가져오기
```

---

## 11. 외부 서비스 의존성 (External Service Dependencies)

> **기능별 외부 서비스 및 환경변수 매핑**

### 11.1 서비스별 매핑

| 기능 | 외부 서비스 | 환경변수 | 사용 위치 |
|------|-------------|----------|-----------|
| **봇 실행** | GitHub Actions | `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO` | `/api/bot/run` |
| **이미지 업로드** | Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | `/api/upload/*` |
| **데이터베이스** | Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | 전역 |
| **AI 번역/리라이트** | OpenAI | `OPENAI_API_KEY` | `/api/ai/*` |
| **지도** | Naver Map | `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | `NaverMap.tsx` |
| **자동 배포** | Vercel | `VERCEL_URL`, `VERCEL` | `/api/bot/cron` |

### 11.2 GitHub Actions 트리거 메뉴

| 메뉴 | 경로 | 설명 |
|------|------|------|
| **봇 실행** | `/admin/bot/run` | 수동 스크래퍼 실행 |
| **스케줄 설정** | `/admin/bot/schedule` | Cron 스케줄 설정 |
| **자동 실행** | Vercel Cron | 매일 09:00 UTC 자동 트리거 |

**동작 흐름:**
```
수동: /admin/bot/run → /api/bot/run → GitHub Actions
자동: vercel.json cron → /api/bot/cron → /api/bot/run → GitHub Actions
```

### 11.3 Cloudinary 사용 메뉴

| 메뉴 | 경로 | 설명 |
|------|------|------|
| **이미지 업로드** | `/api/upload/image` | 파일 직접 업로드 |
| **URL 업로드** | `/api/upload/from-url` | 외부 URL → Cloudinary 전송 |
| **사용량 확인** | `/admin/usage` | Cloudinary 사용량 조회 |

### 11.4 OpenAI 사용 메뉴

| 메뉴 | 경로 | 설명 |
|------|------|------|
| **AI 번역** | `/api/ai/translate` | 텍스트 번역 |
| **AI 리라이트** | `/api/ai/rewrite` | 기사 리라이트 |

---

*최종 업데이트: 2025-12-19*
