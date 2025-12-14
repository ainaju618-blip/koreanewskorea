# Korea NEWS 프로젝트 정보 허브

> 프로젝트 개발 중 발생하는 모든 정보, 에러, 가이드를 체계적으로 관리

---

## 폴더 구조

```
info/
├── README.md              # 이 파일 (인덱스)
├── git.md                 # Git/Vercel/배포 관련
├── scraper.md             # 스크래퍼 개발/에러
├── frontend.md            # Next.js/React/UI 관련
├── backend.md             # API/Supabase/인증
├── database.md            # DB 스키마/마이그레이션
├── collaboration.md       # AI 협업 (Claude ↔ Gemini)
└── troubleshooting.md     # 공통 문제 해결
```

---

## 빠른 참조

### 자주 발생하는 문제

| 문제 | 해결 위치 |
|------|----------|
| Vercel 자동 배포 안됨 | [git.md](./git.md) 섹션 5 |
| 스크래퍼 이미지 안나옴 | [scraper.md](./scraper.md) 섹션 3 |
| TypeScript 빌드 에러 | [frontend.md](./frontend.md) 섹션 4 |
| Supabase 연결 오류 | [backend.md](./backend.md) 섹션 3 |
| DB 제약 조건 오류 | [database.md](./database.md) 섹션 3 |
| Git 계정 혼동 | [git.md](./git.md) 섹션 8 |
| AI 협업 문제 | [collaboration.md](./collaboration.md) 섹션 4-6 |

### 핵심 정보

| 항목 | 값 |
|------|-----|
| **Git 계정** | kyh6412057153@gmail.com / 유향 |
| **GitHub** | korea-news/koreanewsone |
| **Vercel 프로젝트** | koreanewsone |
| **Production URL** | https://koreanews.vercel.app |
| **Supabase 프로젝트** | koreanews |

---

## 문서 관리 규칙

### 1. 새 정보 추가 시
```markdown
## [카테고리] 제목

### 문제/상황
- 발생 조건
- 증상

### 원인
- 근본 원인

### 해결
```bash
# 명령어 또는 코드
```

### 참고
- 관련 링크/문서

---
*추가일: YYYY-MM-DD*
```

### 2. 카테고리별 담당 파일
| 카테고리 | 파일 | 담당 |
|---------|------|------|
| Git, Vercel, 배포, CI/CD | git.md | 인프라 |
| 스크래퍼 개발, 셀렉터, 크롤링 | scraper.md | 데이터 수집 |
| Next.js, React, CSS, UI | frontend.md | 프론트엔드 |
| API, 인증, 서버 로직 | backend.md | 백엔드 |
| Supabase, 스키마, 쿼리 | database.md | 데이터베이스 |
| Claude-Gemini 협업 | collaboration.md | AI 협업 |
| 범용 문제 해결 | troubleshooting.md | 공통 |

### 3. 태그 시스템
- `[CRITICAL]` - 긴급 장애 대응
- `[ERROR]` - 에러 해결
- `[GUIDE]` - 개발 가이드
- `[TIP]` - 유용한 팁
- `[DEPRECATED]` - 더 이상 사용 안함

---

## 관련 문서 (외부)

| 위치 | 용도 |
|------|------|
| `CLAUDE.md` | AI Agent 지침 |
| `.claude/context/` | 세션별 작업 기록 |
| `.ai-collab/` | Claude-Gemini 협업 |
| `scrapers/SCRAPER_GUIDE.md` | 스크래퍼 상세 가이드 |
| `scrapers/[지역]/ALGORITHM.md` | 지역별 알고리즘 |

---

*최종 업데이트: 2025-12-15*
