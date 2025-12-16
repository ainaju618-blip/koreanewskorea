# GitHub Secrets 설정 가이드

> **용도:** GitHub Actions에서 Python 스크래퍼 실행을 위한 환경변수 설정
> **최종 수정:** 2025-12-17

---

## 개요

Vercel 서버리스 환경에서는 Python을 직접 실행할 수 없으므로,
스크래퍼는 **GitHub Actions**에서 실행됩니다.

관리자 UI에서 수동 수집 실행 시:
1. Next.js API가 로그 생성
2. GitHub Actions workflow_dispatch 트리거
3. GitHub Actions에서 Python 스크래퍼 실행
4. 스크래퍼가 수집한 기사를 API로 전송

---

## 필수 Secrets 목록

GitHub 레포지토리 > Settings > Secrets and variables > Actions에서 설정:

| Secret 이름 | 설명 | 예시 값 |
|------------|------|---------|
| `SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Supabase Service Role Key | `eyJhbGciOi...` |
| `BOT_API_URL` | 기사 저장 API (프로덕션) | `https://www.koreanewsone.com/api/bot/ingest` |
| `BOT_LOG_API_URL` | 로그 업데이트 API | `https://www.koreanewsone.com/api/bot/logs` |
| `BOT_API_KEY` | API 인증 키 (선택) | `your-secret-key` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary 클라우드 이름 | `dkz9qbznb` |
| `CLOUDINARY_API_KEY` | Cloudinary API 키 | `364775...` |
| `CLOUDINARY_API_SECRET` | Cloudinary API 시크릿 | `IiKVL8...` |

---

## Vercel 환경변수 (프로덕션)

Vercel 프로젝트 > Settings > Environment Variables에서 설정:

| 변수 이름 | 설명 | 예시 값 |
|----------|------|---------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | `ghp_xxxx...` |
| `GITHUB_OWNER` | GitHub 소유자/조직 | `koreanews` |
| `GITHUB_REPO` | GitHub 레포지토리 이름 | `koreanewsone` |

### GitHub Token 생성 방법

1. GitHub > Settings > Developer settings > Personal access tokens > Fine-grained tokens
2. "Generate new token" 클릭
3. 설정:
   - Token name: `koreanews-actions-trigger`
   - Expiration: 원하는 기간
   - Repository access: Only select repositories > `koreanewsone`
   - Permissions:
     - Actions: Read and write
     - Contents: Read (workflows 읽기용)
4. "Generate token" 클릭 후 토큰 복사
5. Vercel 환경변수에 `GITHUB_TOKEN`으로 추가

---

## 워크플로우 실행 확인

### 스케줄 실행 (자동)
- 매일 09:00, 13:00, 17:00 KST에 자동 실행
- 모든 27개 지역 스크래퍼 순차 실행

### 수동 실행 (관리자 UI)
1. 관리자 > 봇 관리 > 수동수집 실행
2. 지역 선택 후 "수집 시작"
3. GitHub Actions에서 워크플로우 시작
4. 로그 기록 페이지에서 진행 상황 확인

### GitHub에서 직접 실행
1. GitHub > Actions > Daily News Scrape
2. "Run workflow" 클릭
3. 파라미터 입력:
   - region: `all` 또는 특정 지역 (`gwangju`, `naju` 등)
   - days: 수집 기간 (1-7일)
   - log_id: 관리자 UI에서 생성된 로그 ID (선택)

---

## 트러블슈팅

### 1. 워크플로우가 트리거되지 않음
- `GITHUB_TOKEN` 권한 확인 (Actions: Read and write)
- 레포지토리 이름 확인 (`GITHUB_OWNER`, `GITHUB_REPO`)

### 2. 스크래퍼가 기사를 저장하지 않음
- `BOT_API_URL`이 프로덕션 도메인인지 확인
- `BOT_API_KEY` 일치 여부 확인

### 3. 로그가 업데이트되지 않음
- `BOT_LOG_API_URL` 확인
- `BOT_LOG_ID` 환경변수가 워크플로우에 전달되는지 확인

---

*이 가이드는 AI Agent(Claude)가 작성했습니다.*
