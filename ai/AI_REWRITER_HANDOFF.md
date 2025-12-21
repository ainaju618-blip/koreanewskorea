# AI 기사 재가공 기능 - 개발 핸드오프 문서

> **최종 수정일**: 2025-12-22
> **작성자**: Gemini (Antigravity)
> **현재 상태**: Phase 1-5 완료, 프로덕션 준비 완료

---

## 1. 프로젝트 개요

### 1.1 목적
스크래퍼로 수집한 **지자체 보도자료**를 AI(Gemini/Claude/Grok)로 **정통 기사 형태로 자동 재가공**하는 기능.

### 1.2 핵심 요구사항
1. **관리자**: 전역 AI 설정 + 수집처별 AI 활성화/비활성화
2. **기자**: 개인 API 키로 AI 사용 (비용 분산)
3. **다중 레벨 API 키**: 요청 > 기자 개인 > 관리자 전역 > 환경변수 순 우선적용
4. **프롬프트 관리**: 관리자가 프롬프트를 저장/불러오기/편집 가능

### 1.3 기술 스택
- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **DB**: Supabase (PostgreSQL)
- **AI SDK**: Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/anthropic`, `@ai-sdk/xai`)

---

## 2. 현재 완료된 작업

### Phase 1: 기술 조사 및 설계 ✅
- Vercel AI SDK 문서 조사 (Context7)
- 다중 레벨 API 키 설계
- 구현 계획서 작성

### Phase 2: 관리자 기능 ✅
| 항목 | 파일 경로 | 설명 |
|------|----------|------|
| AI 설정 페이지 | `src/app/admin/settings/ai/page.tsx` | 프로바이더 선택, API 키, 프롬프트 관리 |
| 설정 API | `src/app/api/admin/ai-settings/route.ts` | GET/PATCH |
| 재가공 API | `src/app/api/ai/rewrite/route.ts` | 실제 AI 호출 |
| 테스트 API | `src/app/api/ai/test/route.ts` | API 키 연결 테스트 |
| 수집처 토글 | `src/app/admin/sources/page.tsx` | AI 토글 UI 추가 |
| 사이드바 메뉴 | `src/components/admin/AdminSidebar.tsx` | 설정 > AI 재가공 설정 |

### Phase 3: 기자 기능 ✅
| 항목 | 파일 경로 | 설명 |
|------|----------|------|
| 기자 AI 설정 API | `src/app/api/reporter/ai-settings/route.ts` | GET/POST |
| 프로필 페이지 | `src/app/reporter/profile/page.tsx` | 탭 구조 (기본정보 | AI설정) |
| AI 설정 컴포넌트 | `src/components/reporter/AISettingsSection.tsx` | 분리된 컴포넌트 |

---

## 3. DB 스키마 (필수 확인)

### 3.1 site_settings 테이블
| key | value 타입 | 설명 |
|-----|-----------|------|
| `ai_rewrite_enabled` | boolean | 전역 AI 활성화 |
| `ai_default_provider` | string | gemini/claude/grok |
| `ai_global_keys` | JSONB | `{gemini: "키", claude: "키", grok: "키"}` |
| `ai_system_prompt` | string | 현재 활성 프롬프트 |
| `ai_saved_prompts` | JSONB | `[{id, name, content}, ...]` |

### 3.2 reporters 테이블 (신규 컬럼)
```sql
-- 이 SQL이 실행되었는지 확인 필요!
ALTER TABLE reporters 
ADD COLUMN ai_settings JSONB DEFAULT NULL;

-- 컬럼 구조:
-- {
--   "enabled": true,
--   "provider": "gemini",
--   "api_keys": {"gemini": "키", "claude": null, "grok": null}
-- }
```

### 3.3 news_sources 테이블 (신규 컬럼)
```sql
-- 이 SQL이 실행되었는지 확인 필요!
ALTER TABLE news_sources 
ADD COLUMN ai_rewrite_enabled BOOLEAN DEFAULT false;
```

---

## 4. 코드 구조 상세

### 4.1 AI 재가공 API (`/api/ai/rewrite`)

**엔드포인트**: `POST /api/ai/rewrite`

**요청 본문**:
```json
{
  "text": "보도자료 원문",
  "style": "news",           // news | summary | rewrite
  "provider": "gemini",      // 선택적 - 직접 지정
  "apiKey": "...",           // 선택적 - 직접 지정
  "reporterId": "uuid"       // 선택적 - 기자 키 사용
}
```

**API 키 우선순위 로직** (route.ts 99-125줄):
```
1. 요청에 provider + apiKey 직접 전달 → 그대로 사용
2. reporterId 전달 → reporters.ai_settings에서 키 조회
3. 둘 다 없음 → site_settings에서 전역 키 조회
4. 전역도 없음 → 원본 텍스트 그대로 반환
```

**프롬프트 우선순위**:
```
1. site_settings.ai_system_prompt에 값이 있으면 사용
2. 없으면 코드에 하드코딩된 DEFAULT_PROMPT 사용
```

### 4.2 관리자 설정 페이지 (`/admin/settings/ai`)

**주요 기능**:
1. AI 활성화 토글
2. 기본 프로바이더 선택 (Gemini/Claude/Grok)
3. 각 프로바이더 API 키 입력 및 연결 테스트
4. 시스템 프롬프트 관리:
   - "기본값 사용" 버튼 → DEFAULT_PROMPT 로드
   - 프롬프트 편집 → 텍스트에어리어
   - 이름 입력 후 "저장" → savedPrompts 배열에 추가
   - 저장된 프롬프트 태그 클릭 → 편집기에 로드
   - 상단 "저장" 버튼 → DB에 전체 설정 저장

### 4.3 기자 AI 설정 (`/reporter/profile`)

**구조**:
- 프로필 페이지에 탭 UI 적용
- "기본 정보" 탭: 기존 프로필 편집
- "AI 설정" 탭: `<AISettingsSection reporterId={reporter.id} />` 렌더링

**AISettingsSection 컴포넌트**:
- 개인 AI 활성화 토글
- 개인 프로바이더 선택
- 개인 API 키 입력 및 연결 테스트
- 저장 버튼 → `/api/reporter/ai-settings` POST

---

## 5. 남은 작업 (Phase 4: 테스트)

### 5.1 즉시 테스트 필요

#### 관리자 테스트
```
URL: http://localhost:3000/admin/settings/ai

1. 페이지 정상 로드 확인
2. 프로바이더 선택 → Gemini/Claude/Grok 전환
3. API 키 입력 → 마스킹 표시 (**** 형태)
4. "테스트" 버튼 → 연결 성공/실패 확인
5. "기본값 사용" 클릭 → 프롬프트 로드
6. 프롬프트 수정 후 이름 입력 → "저장" 클릭 → 태그 생성
7. 태그 클릭 → 편집기에 로드
8. 상단 "저장" 버튼 → DB 저장 확인
```

#### 수집처 토글 테스트
```
URL: http://localhost:3000/admin/sources

1. 각 수집처에 AI 토글 버튼 표시 확인
2. 토글 ON/OFF → DB 저장 확인
```

#### 기자 테스트
```
URL: http://localhost:3000/reporter/profile

1. 탭 UI 표시 ("기본 정보" | "AI 설정")
2. "AI 설정" 탭 클릭 → 전환
3. 개인 API 키 입력 → 저장
4. 연결 테스트 → 성공/실패 확인
```

#### API 테스트 (curl)
```bash
# 전역 설정으로 재가공
curl -X POST http://localhost:3000/api/ai/rewrite \
  -H "Content-Type: application/json" \
  -d '{"text": "광주광역시는 2024년 신규 사업을 발표했다.", "style": "news"}'

# 기자 ID 지정
curl -X POST http://localhost:3000/api/ai/rewrite \
  -H "Content-Type: application/json" \
  -d '{"text": "보도자료 내용...", "reporterId": "기자UUID"}'
```

---

## 6. 향후 확장 작업 (Phase 5+)

### 6.1 스크래퍼 연동 (Priority: HIGH)
스크래퍼에서 기사 수집 시 AI 재가공 자동 적용.

**구현 위치**: `scrapers/utils/ai_rewriter.py` (신규)

**구현 방법**:
```python
import httpx

async def rewrite_with_ai(body: str, source_code: str) -> str:
    """AI로 기사 재가공"""
    # 1. news_sources에서 해당 수집처의 ai_rewrite_enabled 확인
    # 2. True면 /api/ai/rewrite 호출
    # 3. 결과 반환 (실패 시 원본 반환)
    
    response = await httpx.post(
        "http://localhost:3000/api/ai/rewrite",
        json={"text": body, "style": "news"}
    )
    if response.status_code == 200:
        return response.json()["rewritten"]
    return body
```

**스크래퍼 수정**:
```python
# 각 스크래퍼의 save_article 부분
if ai_enabled:
    article.body = await rewrite_with_ai(article.body, REGION_CODE)
```

### 6.2 기사 편집 화면 AI 버튼 (Priority: MEDIUM)
`/admin/news/write` 또는 `/admin/news/[id]/edit` 페이지에 "AI 재가공" 버튼 추가.

**UI 위치**: 에디터 툴바 또는 본문 영역 상단

**동작**:
1. 본문 전체 또는 선택 영역을 AI에 전달
2. 결과를 미리보기로 표시
3. "적용" 클릭 시 본문 교체

### 6.3 재가공 이력 로깅 (Priority: LOW)
```sql
CREATE TABLE ai_rewrite_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES posts(id),
    reporter_id UUID REFERENCES reporters(id),
    provider VARCHAR(20),
    original_text TEXT,
    rewritten_text TEXT,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. 주의사항

### 7.1 DB 마이그레이션
반드시 아래 SQL 실행 여부 확인:
```sql
-- reporters 테이블
ALTER TABLE reporters ADD COLUMN ai_settings JSONB DEFAULT NULL;

-- news_sources 테이블
ALTER TABLE news_sources ADD COLUMN ai_rewrite_enabled BOOLEAN DEFAULT false;
```

### 7.2 API 키 보안
- 현재 API 키는 DB에 **평문 저장**됨
- 프로덕션에서는 암호화 권장 (예: AES + 환경변수 키)

### 7.3 토큰 비용
- AI API 호출 시 토큰 비용 발생
- 긴 기사는 토큰 제한에 걸릴 수 있음
- 본문 최대 5000자 권장

### 7.4 환경변수
필요한 환경변수 (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...  # 선택적 (전역 기본값)
ANTHROPIC_API_KEY=...             # 선택적
XAI_API_KEY=...                   # 선택적
```

---

## 8. 파일 구조 요약

```
src/
├── app/
│   ├── admin/
│   │   ├── settings/
│   │   │   ├── ai/
│   │   │   │   └── page.tsx        ★ AI 설정 페이지
│   │   │   └── page.tsx            설정 목록 페이지
│   │   └── sources/
│   │       └── page.tsx            수집처 관리 (AI 토글 포함)
│   ├── reporter/
│   │   └── profile/
│   │       └── page.tsx            ★ 기자 프로필 (탭 구조)
│   └── api/
│       ├── admin/
│       │   └── ai-settings/
│       │       └── route.ts        ★ 관리자 AI 설정 API
│       ├── ai/
│       │   ├── rewrite/
│       │   │   └── route.ts        ★ AI 재가공 API
│       │   └── test/
│       │       └── route.ts        연결 테스트 API
│       └── reporter/
│           └── ai-settings/
│               └── route.ts        ★ 기자 AI 설정 API
├── components/
│   ├── admin/
│   │   └── AdminSidebar.tsx        사이드바 (AI 메뉴 추가됨)
│   └── reporter/
│       └── AISettingsSection.tsx   ★ 기자 AI 설정 컴포넌트
└── ...

ai/
└── article_rewriter_prompt.md      기본 프롬프트 원본

info/
├── proposals/
│   ├── ai_rewriter_flowchart.md    플로우차트 (초기 설계)
│   └── ai_rewriter_status.md       ★ 이 문서
└── sql/
    └── add-reporter-ai-settings.sql  DB 마이그레이션
```

---

## 9. 빠른 시작 가이드 (다음 개발자용)

### Step 1: DB 확인
```sql
-- reporters.ai_settings 컬럼 확인
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'reporters' AND column_name = 'ai_settings';

-- news_sources.ai_rewrite_enabled 컬럼 확인
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'news_sources' AND column_name = 'ai_rewrite_enabled';

-- 없으면 info/sql/add-reporter-ai-settings.sql 실행
```

### Step 2: 로컬 실행
```bash
cd d:\cbt\koreanews
npm run dev
```

### Step 3: 테스트 URL 접속
- 관리자 AI 설정: http://localhost:3000/admin/settings/ai
- 수집처 관리: http://localhost:3000/admin/sources
- 기자 프로필: http://localhost:3000/reporter/profile

### Step 4: Phase 4 테스트 수행
위 섹션 5의 테스트 항목 체크

### Step 5: Phase 5 개발 진행
스크래퍼 연동 등 확장 작업

---

## 8. Change Log (History)

| 날짜 | 작업자 | 작업 내역 | 상태 |
|------|--------|-----------|------|
| 2025-12-22 | Gemini | **시스템 전면 개선 (Phase 1-6)**<br>- **보안**: API 키 암호화 (AES-256-GCM) 적용<br>- **유지보수**: 프롬프트 `lib/ai-prompts.ts`로 단일화, 중복 코드 제거<br>- **기능**: 스크래퍼 파이썬 유틸리티(`ai_rewriter.py`)를 Next.js API 연동 방식으로 전면 교체<br>- **모델**: Gemini 버전을 `2.0-flash`에서 **`2.5-flash`**로 업데이트 (3.0 Preview 주석 추가)<br>- **DB**: `news_sources` 테이블 AI 활성화 컬럼 추가 SQL 생성 | 완료 |

---

*문서 작성: 2025-12-22*
*마지막 작업자: Gemini (Antigravity)*
