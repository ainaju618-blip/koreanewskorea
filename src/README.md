# src/ - Korea NEWS 메인 애플리케이션

> **기술 스택**: Next.js 16 + React 19 + Supabase + TypeScript

## 폴더 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (site)/            # 공개 사이트 (홈, 카테고리, 기사)
│   ├── admin/             # 관리자 페이지
│   ├── reporter/          # 기자 포털
│   ├── author/            # 기자 프로필 페이지
│   └── api/               # API 엔드포인트 (46개)
├── components/            # React 컴포넌트 (31개)
├── lib/                   # 유틸리티 함수
├── types/                 # TypeScript 타입 정의
└── db/                    # 데이터베이스 스키마
```

## 라우팅 구조

### 공개 페이지 `(site)/`
| 경로 | 용도 |
|------|------|
| `/` | 홈페이지 |
| `/news/[id]` | 기사 상세 |
| `/category/[slug]` | 카테고리 페이지 |
| `/category/jeonnam/[region]` | 전남 시군별 뉴스 |
| `/author/[id]` | 기자 프로필 |
| `/map` | 지역 지도 |

### 관리자 `/admin/`
| 경로 | 용도 |
|------|------|
| `/admin` | 대시보드 |
| `/admin/news` | 기사 관리 |
| `/admin/bot/run` | **수동수집실행** |
| `/admin/bot/schedule` | 스케줄 설정 |
| `/admin/bot/logs` | 봇 로그 |
| `/admin/users/reporters` | 기자 관리 |
| `/admin/settings/*` | 시스템 설정 |

### 기자 `/reporter/`
| 경로 | 용도 |
|------|------|
| `/reporter/write` | 기사 작성 |
| `/reporter/articles` | 내 기사 목록 |
| `/reporter/drafts` | 임시저장 |

## 주요 API 엔드포인트

### 봇/스크래퍼
```
POST /api/bot/run         # 스크래퍼 실행
POST /api/bot/stop        # 봇 중지
POST /api/bot/ingest      # 수집 데이터 저장
GET  /api/bot/logs        # 실행 로그
GET  /api/bot/status      # 봇 상태
```

### 기사 관리
```
GET    /api/posts         # 기사 목록
GET    /api/posts/[id]    # 기사 상세
POST   /api/posts         # 기사 생성
DELETE /api/posts/bulk-delete  # 일괄 삭제
```

### 인증
```
POST /api/auth/login      # 로그인
POST /api/auth/logout     # 로그아웃
GET  /api/auth/me         # 현재 사용자
```

## 핵심 라이브러리

| 패키지 | 용도 |
|--------|------|
| `@supabase/ssr` | Supabase SSR 클라이언트 |
| `@tiptap/react` | 기사 에디터 |
| `openai` | AI 기사 가공 |
| `cloudinary` | 이미지 업로드 |
| `node-cron` | 스케줄러 |
| `framer-motion` | 애니메이션 |

## 환경 변수

```bash
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# 봇 API (필수)
BOT_API_KEY=

# OpenAI (선택)
OPENAI_API_KEY=
```

## 개발 시작

```bash
npm install
npm run dev
# http://localhost:3000
```

## 관련 문서

- [CLAUDE.md](../CLAUDE.md) - 프로젝트 AI Agent 지침
- [scrapers/SCRAPER_GUIDE.md](../scrapers/SCRAPER_GUIDE.md) - 스크래퍼 개발 가이드
- [scrapers/STATUS.md](../scrapers/STATUS.md) - 스크래퍼 현황
