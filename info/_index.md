# Info 허브

> **용도:** 프로젝트 정보/에러/가이드 통합 허브
> **사용법:** AI(Claude/Gemini)가 "인포 참조해" 명령 시 이 파일부터 읽기

---

## 빠른 검색

| 상황 | 경로 |
|------|------|
| **에러 발생** | `errors/_catalog.md` -> 키워드 검색 |
| **개발 방법** | `guides/_catalog.md` -> 주제 검색 |
| **계정/설정** | `config/accounts.md` |
| **AI 협업** | `ai-collab/_index.md` |
| **성능 최적화** | `performance.md` -> PageSpeed 관리 |

---

## 자주 찾는 에러 TOP 5

| 에러 | 파일 |
|------|------|
| 이미지 안나옴 | `errors/scraper/image-missing.md` |
| Vercel 배포 안됨 | `errors/deploy/vercel-auto.md` |
| TS 빌드 실패 | `errors/frontend/typescript.md` |
| Supabase 연결 | `errors/backend/supabase-conn.md` |
| 본문 오염 | `errors/scraper/content-dirty.md` |

---

## 핵심 정보

| 항목 | 값 |
|------|-----|
| **Git 계정** | kyh6412057153@gmail.com / 유향 |
| **GitHub** | korea-news/koreanewsone |
| **Vercel** | koreanewsone |
| **Supabase** | koreanews |
| **Production** | https://koreanews.vercel.app |

---

## 폴더 구조

```
info/
├── _index.md           # 이 파일 (1차 진입점)
├── performance.md      # PageSpeed 성능 관리 (NEW)
├── errors/             # 에러 해결
│   ├── _catalog.md     # 에러 카탈로그 (키워드 검색)
│   ├── deploy/         # 배포 관련
│   ├── scraper/        # 스크래퍼 관련
│   ├── frontend/       # 프론트엔드 관련
│   ├── backend/        # 백엔드 관련
│   └── database/       # DB 관련
├── guides/             # 개발 가이드
│   ├── _catalog.md     # 가이드 카탈로그
│   ├── scraper/        # 스크래퍼 개발
│   ├── frontend/       # 프론트엔드 개발
│   ├── backend/        # 백엔드 개발
│   └── workflow/       # 작업 흐름
├── config/             # 설정 정보
│   ├── accounts.md     # 계정 정보
│   ├── env-vars.md     # 환경변수
│   └── project.md      # 프로젝트 정보
└── ai-collab/          # AI 협업
    ├── _index.md       # AI 협업 가이드
    ├── claude.md       # Claude 전용
    └── gemini.md       # Gemini 전용
```

---

## AI 사용법

### Claude
```
주인님: "인포 찾아봐"
→ info/_index.md 읽기 → 상황에 맞는 카탈로그 → 해당 파일
```

### Gemini
```
주인님: "인포 참조해"
→ info/_index.md 읽기 → 상황에 맞는 카탈로그 → 해당 파일
```

---

*최종 업데이트: 2025-12-17*
