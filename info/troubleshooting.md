# 공통 문제 해결 가이드

> 분류가 어려운 복합적인 문제 해결

---

## 빠른 진단 체크리스트

### 1. 배포 안됨
- [ ] `git push` 완료? → `git status`
- [ ] Vercel 자동 배포 작동? → `vercel ls`
- [ ] 수동 배포 시도 → `vercel --prod`
- [ ] Git 연결 복구 → `vercel git connect`

### 2. 빌드 실패
- [ ] 로컬 빌드 테스트 → `npm run build`
- [ ] TypeScript 오류? → `npx tsc --noEmit`
- [ ] 환경 변수 확인 → `vercel env ls`
- [ ] 의존성 문제? → `rm package-lock.json && npm install`

### 3. 데이터 안보임
- [ ] API 응답 확인 → 브라우저 개발자도구 Network
- [ ] Supabase 연결? → 환경변수 확인
- [ ] RLS 정책? → supabaseAdmin 사용
- [ ] 데이터 존재? → Supabase 대시보드

### 4. 이미지 안보임
- [ ] 파일 존재? → `public/images/` 확인
- [ ] 경로 형식? → `/images/...` (절대경로 아님)
- [ ] next.config.js 도메인 허용?

---

## 긴급 대응 절차

### 프로덕션 장애

```bash
# 1. 즉시 이전 버전으로 롤백
vercel ls                    # 정상 배포 URL 찾기
vercel rollback [URL]        # 롤백

# 2. 로컬에서 문제 파악
npm run build                # 빌드 오류 확인
npm run dev                  # 런타임 오류 확인

# 3. 수정 후 재배포
git add . && git commit -m "fix: [문제]" && git push
```

### DB 장애

```bash
# 1. Supabase 대시보드 상태 확인
# 2. 환경 변수 확인
vercel env ls

# 3. 연결 테스트
# API 직접 호출로 확인
```

---

## 분야별 상세 가이드 링크

| 문제 분야 | 참조 문서 |
|----------|----------|
| Git/배포 | [git.md](./git.md) |
| 스크래퍼 | [scraper.md](./scraper.md) |
| 프론트엔드 | [frontend.md](./frontend.md) |
| 백엔드/API | [backend.md](./backend.md) |
| 데이터베이스 | [database.md](./database.md) |

---

## 복합 문제 사례

### 사례 1: 기사는 있는데 이미지 안보임

**진단:**
1. DB에 `thumbnail_url` 값 있음?
2. 경로가 `/images/...` 형태?
3. `public/images/` 폴더에 파일 존재?
4. 파일 확장자 일치?

**해결:**
```bash
# 1. DB 확인
# Supabase에서 thumbnail_url 컬럼 확인

# 2. 파일 확인
dir public\images\[지역]\

# 3. 스크래퍼 다시 실행 (이미지만)
python scrapers/[지역]/[지역]_scraper.py --max-articles 1
```

---

### 사례 2: 로컬 OK, Vercel 에러

**진단:**
1. 환경변수 차이?
2. Node.js 버전 차이?
3. 빌드 캐시 문제?

**해결:**
```bash
# 1. 환경변수 동기화
vercel env pull .env.local

# 2. 캐시 없이 빌드
vercel --prod --force

# 3. Vercel 로그 확인
vercel logs [deployment-url]
```

---

### 사례 3: 스크래퍼 OK, 웹에 안보임

**진단:**
1. API 응답에 데이터 있음?
2. status가 'published'?
3. 프론트엔드 필터 조건?

**해결:**
```bash
# 1. DB 직접 확인 (Supabase 대시보드)
# status, published_at 확인

# 2. API 직접 호출
curl http://localhost:3000/api/posts

# 3. 상태 변경 (필요시)
# 관리자 페이지에서 승인 처리
```

---

### 사례 4: 특정 페이지만 500 에러

**진단:**
1. 해당 API 로그 확인
2. 특정 데이터 문제?
3. 타입 불일치?

**해결:**
```bash
# 1. 개발 서버에서 확인
npm run dev
# 해당 페이지 접속 후 터미널 에러 확인

# 2. API에 로그 추가
console.log('[DEBUG]', data);

# 3. try-catch 추가
try {
  // 처리
} catch (error) {
  console.error('Error:', error);
}
```

---

## 유용한 디버깅 명령어

```bash
# Git 상태 전체 확인
git status && git log --oneline -5

# Vercel 상태 확인
vercel ls && vercel inspect [url]

# 빌드 테스트
npm run build 2>&1 | head -50

# TypeScript 오류만 확인
npx tsc --noEmit 2>&1 | grep error

# 프로세스 확인 (Windows)
tasklist | findstr node

# 포트 사용 확인 (Windows)
netstat -ano | findstr :3000
```

---

## 문제 보고 양식

새 문제 발견 시 아래 형식으로 해당 분야 문서에 추가:

```markdown
## [카테고리] 제목

### 문제/증상
- 발생 조건
- 에러 메시지

### 원인
- 근본 원인

### 해결
```bash
# 명령어 또는 코드
```

### 참고
- 관련 링크

---
*추가일: YYYY-MM-DD*
```

---

*최종 업데이트: 2025-12-15*
