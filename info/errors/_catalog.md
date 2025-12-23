# 에러 카탈로그

> **용도:** 키워드로 에러 파일 검색
> **사용법:** 키워드 매칭 → 해당 파일 읽기

---

## 배포 (deploy/)

| 키워드 | 파일 | 증상 |
|--------|------|------|
| vercel, 자동, 배포, webhook, 반영 | `vercel-auto.md` | push 후 배포 안됨 |
| vercel, build, 빌드, 실패 | `vercel-build.md` | Vercel 빌드 에러 |
| git, webhook, 연결, hook | `git-webhook.md` | GitHub 웹훅 없음 |
| vercel, utf-8, encoding, stream, 인코딩, 한글 | `vercel-utf8-build.md` | UTF-8 인코딩 빌드 실패 |

---

## 스크래퍼 (scraper/)

| 키워드 | 파일 | 증상 |
|--------|------|------|
| 이미지, 썸네일, 없음, null, 빈박스 | `image-missing.md` | 이미지 수집 안됨 |
| 이미지, 403, forbidden, 핫링크 | `image-403.md` | 이미지 다운 거부 |
| 본문, 작성자, 조회수, 담당부서, 오염 | `content-dirty.md` | 본문에 메타정보 포함 |
| javascript, download, expect, 다운로드 | `js-download.md` | JS 다운로드 이미지 |
| argparse, exit, code 2, 인자 | `argparse-exit2.md` | CLI 인자 오류 |
| encoding, cp949, utf-8, 인코딩 | `encoding.md` | 인코딩 에러 |

---

## 프론트엔드 (frontend/)

| 키워드 | 파일 | 증상 |
|--------|------|------|
| hydration, ssr, mismatch, 불일치 | `hydration.md` | 서버/클라이언트 불일치 |
| typescript, tsc, type, 타입 | `typescript.md` | TypeScript 빌드 에러 |
| image, 404, 경로, 이미지 | `image-404.md` | 이미지 경로 못찾음 |
| params, dynamic, route, 라우트 | `nextjs-params.md` | Next.js 동적 라우트 |
| image, loading, slow, LCP, 느림, 이미지 | `image-loading-slow.md` | 이미지 로딩 속도 느림 |
| powershell, encoding, 한글, 깨짐, 인코딩 | `powershell-encoding.md` | PowerShell 한글 인코딩 손상 |
| sidearticles, preparing, 사이드, 홈페이지 | `sidearticles-preparing.md` | 홈페이지 사이드 기사 안 보임 |

---

## 백엔드 (backend/)

| 키워드 | 파일 | 증상 |
|--------|------|------|
| supabase, url, key, 연결, connection | `supabase-conn.md` | DB 연결 실패 |
| rls, policy, security, 권한 | `supabase-rls.md` | RLS 정책 위반 |
| 500, internal, server, 서버 | `api-500.md` | API 500 에러 |
| 기자, reporter, assign, author, 배정 | `reporter-assign.md` | 기자 배정 문제 |
| supabase, column, not exist, select, 컬럼 | `supabase-column-not-exist.md` | SELECT에 없는 컬럼 포함 |
| cors, origin, 교차 | `cors.md` | CORS 에러 |
| bulk, approval, 승인, 실패, approved_at | `bulk-approval.md` | 일괄 승인 실패 |
| cron, scheduler, 크론, 스케줄, 중복, dual | `dual-cron-system.md` | 이중 크론 실행 문제 |

---

## 데이터베이스 (database/)

| 키워드 | 파일 | 증상 |
|--------|------|------|
| status_check, constraint, 상태 | `constraint-status.md` | posts 상태값 제약 |
| type_check, reporter, 타입 | `constraint-type.md` | reporters 타입 제약 |
| migration, alter, schema, 스키마 | `migration.md` | 스키마 변경 오류 |
| ai, column, schema cache, ai_validation_grade, 컬럼 없음 | `ai-column-missing.md` | AI 컬럼 누락으로 DB 업데이트 실패 |

---

*최종 업데이트: 2025-12-23*
