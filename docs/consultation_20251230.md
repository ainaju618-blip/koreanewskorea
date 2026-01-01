# 외부 컨설턴트 자문 질의서

> 작성일: 2025-12-30
> 프로젝트: Korea NEWS (koreanewsone.com)
> 작성자: Claude AI (개발 담당)

---

## 1. Cloudinary API 인식 실패 문제

### 현상
- Cloudinary API가 이전에는 정상 작동했으나, 현재 API 키를 인식하지 못함
- 에러 메시지: `Must supply api_key`

### 현재 설정 (cloudinary_uploader.py)
```python
CLOUDINARY_ENABLED = True
CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME', 'dkz9qbznb')
CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY', '')
CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET', '')
```

### 질문
1. **.env 파일에 Cloudinary 환경변수가 설정되어 있습니까?**
   - `CLOUDINARY_API_KEY=...`
   - `CLOUDINARY_API_SECRET=...`

2. **Cloudinary 대시보드에서 API 키가 재발급되거나 변경된 적이 있습니까?**
   - 계정: `dkz9qbznb`

3. **Cloudinary 무료 플랜 한도 초과 가능성이 있습니까?**
   - 월간 변환 크레딧 또는 저장 용량 제한

4. **이전에 Cloudinary가 작동했던 시점의 환경변수 값을 확인할 수 있습니까?**

---

## 2. 순천/영광 첨부파일 이미지 참조 문제

### 현상
- 순천/영광 시군 홈페이지는 이미지를 직접 URL로 제공하지 않음
- JavaScript `goDownLoad()` 함수를 통한 POST 방식 다운로드만 가능
- 예: `javascript:goDownLoad('1234', 'image.jpg')`

### 현재 처리 방식
```
1. Playwright로 첨부파일 다운로드 (POST → FileDownNew.jsp)
2. 로컬 임시파일로 저장
3. Cloudinary 업로드 시도 (실패시 Supabase Storage로 fallback)
4. 임시파일 삭제
```

### 질문
1. **순천/영광 홈페이지에서 이미지 직접 URL을 얻을 수 있는 다른 방법이 있습니까?**
   - 예: 숨겨진 API, 다른 접근 경로 등

2. **첨부파일 다운로드 시 세션/쿠키 문제가 발생할 가능성이 있습니까?**

3. **다른 시군(목포, 나주 등)은 이미지 직접 URL을 제공하는데, 순천/영광만 다른 이유가 있습니까?**
   - 동일 CMS 사용 여부
   - 보안 정책 차이

---

## 3. Supabase Storage 대안 구현

### 완료된 작업
- `news-images` 버킷 생성 (public, 5MB 제한)
- Cloudinary 실패 시 Supabase Storage로 자동 fallback
- 이미지 압축 (800px 너비, JPEG quality 85)

### 질문
1. **Supabase Storage 무료 플랜 용량 제한은 얼마입니까?**
   - 현재 사용량 확인 방법

2. **이미지 최적화 설정이 적절합니까?**
   - 800px 너비
   - JPEG quality 85
   - WebP 변환 미적용 (Supabase Storage 직접 업로드 시)

3. **Cloudinary vs Supabase Storage 장기적 선택 기준은 무엇입니까?**

---

## 4. Python 모듈 캐싱 문제

### 현상
- Python 스크래퍼 코드를 수정해도 이미 실행 중인 프로세스는 이전 코드 사용
- GitHub Actions에서는 매번 새로 시작하므로 문제 없음
- 로컬 실행 시 문제 발생 가능

### 질문
1. **로컬에서 스크래퍼 실행 시 모듈 리로드 방법이 있습니까?**

2. **`importlib.reload()`를 사용해야 합니까?**

---

## 5. 아키텍처 관련 질문

### 현재 구조
```
이미지 수집 흐름:
  원본 사이트 → 스크래퍼 → [Cloudinary / Supabase Storage] → DB 저장 → 프론트엔드 표시
```

### 질문
1. **이미지 호스팅을 단일 서비스로 통일하는 것이 좋습니까?**
   - 현재: Cloudinary (주) + Supabase Storage (fallback)
   - 대안: Supabase Storage만 사용

2. **이미지 CDN 캐싱 전략이 필요합니까?**

3. **이미지 URL이 변경될 경우 기존 게시물의 이미지 처리 방안은?**

---

## 6. 참고 정보

### 관련 파일
- `scrapers/utils/cloudinary_uploader.py` - 이미지 업로드 유틸리티
- `scrapers/suncheon/suncheon_scraper.py` - 순천 스크래퍼 (첨부파일 다운로드)
- `scrapers/yeonggwang/yeonggwang_scraper.py` - 영광 스크래퍼

### 환경
- Framework: Next.js 16 + React 19
- Database: Supabase (PostgreSQL)
- Image Storage: Cloudinary / Supabase Storage
- Scraper: Python + Playwright

---

## 7. Ollama 자동 시작 타이밍 문제

### 현상
- AI 처리 시작 시 Ollama가 오프라인이면 자동 시작하도록 구현
- 그러나 "Ollama 시작 완료" 메시지 후에도 계속 에러 발생
- 수동으로 Ollama를 실행하면 정상 작동

### 에러 로그 (2025-12-30 07:40~07:45)
```
7:40:23 [AI] AI 처리 시작 (200건)
7:40:57 Ollama: 오프라인
7:40:58 [AI] 상태 조회 오류, 재시도...
7:41:03 [AI] 상태 조회 오류, 재시도...
... (반복)
7:43:42 [SYSTEM] Ollama 시작 중...
7:43:43 [SYSTEM] Ollama 시작 완료
7:43:48 [AI] 상태 조회 오류, 재시도... (여전히 에러)
```

### 원인 분석
1. **React State 캐싱 문제**
   - `ollamaStatus` state가 실제 상태와 동기화되지 않음
   - AI 처리 시작 시점에 state는 'online'이지만 실제로는 offline
   - State 기반 조건문이 자동 시작 로직을 우회함

2. **현재 코드 (문제)**
```typescript
// ollamaStatus는 React state - 실시간 상태가 아님
if (ollamaStatus !== 'online') {
  // 자동 시작 로직 - 실행되지 않음 (state가 stale)
  await fetch('/api/bot/start-ollama', { method: 'POST' });
}
```

3. **타이밍 이슈**
   - Ollama 프로세스는 시작되었으나 API 응답 준비 안됨
   - 30초 대기 후에도 실제 준비 상태 확인 실패

### 질문
1. **React State 대신 실시간 API 체크가 올바른 해결책입니까?**
```typescript
// 제안: 실시간 API 체크
const checkRes = await fetch('http://localhost:11434/api/tags');
if (!checkRes.ok) {
  // Ollama 실제로 오프라인 - 자동 시작
}
```

2. **Ollama 프로세스 시작 후 API 준비까지 얼마나 기다려야 합니까?**
   - 현재: 30초 (2초 간격 폴링)
   - Windows 환경에서 더 오래 걸릴 수 있는지?

3. **spawn()으로 시작한 Ollama가 detached 모드에서 정상 작동합니까?**
   - 현재 설정: `stdio: 'pipe'`, `detached: true`, `windowsHide: true`

### 관련 파일
- `src/app/admin/dec30/page.tsx` - AI 처리 시작 로직
- `src/app/api/bot/start-ollama/route.ts` - Ollama 시작 API

---

## 8. Next.js 빌드 캐시 손상 문제

### 현상
- 개발 서버 실행 중 새 API 라우트 추가 후 500 에러 발생
- 에러: `Cannot find module './5611.js'`
- 서버 재시작 없이는 복구 안됨

### 에러 메시지
```
Error: Cannot find module './5611.js'
Require stack:
- d:\cbt\koreanews\.next\server\webpack-runtime.js
- d:\cbt\koreanews\.next\server\app\api\bot\write-log\route.js
```

### 발생 상황
1. 개발 서버 실행 중 (`npm run dev`)
2. 새 API 라우트 생성 (`src/app/api/bot/write-log/route.ts`)
3. Hot reload 발생
4. Webpack chunk 불일치로 500 에러

### 현재 해결 방법 (비효율적)
```bash
# 매번 캐시 삭제 + 재시작 필요
rmdir /s /q .next
npm run dev
```

### 질문
1. **새 파일 추가 시 Hot reload가 실패하는 근본 원인은 무엇입니까?**
   - Next.js 16 + React 19 환경
   - Turbopack 사용 여부에 따른 차이?

2. **webpack-runtime.js가 chunk 파일을 찾지 못하는 이유는?**
   - 동적 chunk 생성 시점과 참조 시점 불일치?

3. **개발 중 서버 재시작 없이 새 라우트를 안전하게 추가하는 방법은?**
   - next.config.js 설정 변경?
   - 특정 파일 감시 제외?

4. **프로덕션 빌드에도 영향을 줄 수 있습니까?**

### 관련 파일
- `next.config.ts` - Next.js 설정
- `.next/server/webpack-runtime.js` - Webpack 런타임
- `src/app/api/bot/write-log/route.ts` - 새로 추가된 라우트 (트리거)

---

## 9. 스크래핑 0건 저장 문제

### 현상
- 스크래핑이 정상 완료되었다고 표시되지만 실제 저장된 건수가 0건
- 로그: `[OK] 완료: 0건 저장`
- 영향받는 지역: 신안, 진도, 완도, 장성 등

### 로그 예시
```
○ [신안] ================================================ [OK] 완료: 0건 저장
○ 신안: ================================================ [OK] 완료: 0건 저장
○ 진도: ================================================ [OK] 완료: 0건 저장
○ 완도: ================================================ [OK] 완료: 0건 저장
○ 장성: ================================================ [완료] 완료: 0건 저장
```

### 가능한 원인
1. **중복 체크 로직**
   - 이미 수집된 기사는 건너뛰도록 구현됨
   - 새 기사가 없으면 0건 저장 정상

2. **셀렉터 변경**
   - 시군 홈페이지 구조 변경으로 셀렉터가 맞지 않음
   - 기사 목록 자체를 가져오지 못함

3. **네트워크/타임아웃**
   - 페이지 로딩 실패
   - JavaScript 렌더링 대기 부족

### 질문
1. **0건 저장이 "새 기사 없음"인지 "수집 실패"인지 구분하는 방법이 있습니까?**
   - 현재 로그만으로는 구분 불가

2. **각 시군별 마지막 성공적 수집 시점을 확인할 수 있습니까?**

3. **스크래퍼 디버그 모드로 상세 로그를 출력하는 방법이 있습니까?**

### 관련 파일
- `scrapers/sinan/sinan_scraper.py`
- `scrapers/jindo/jindo_scraper.py`
- `scrapers/wando/wando_scraper.py`
- `scrapers/jangseong/jangseong_scraper.py`

---

## 10. Admin UI 강제 리셋 버튼 필요

### 현상
- 스크래핑/AI 처리 중 오류 발생 시 UI 상태가 "실행 중"으로 고정
- 새로고침해도 상태 복구 안됨
- 수동으로 상태 초기화 필요

### 요청 기능
```
[강제 리셋] 버튼 클릭 시:
1. 모든 실행 중 상태 초기화 (isScrapingRunning, isAiRunning)
2. 진행률 0으로 리셋
3. 로그 영역 초기화 (선택사항)
4. Ollama 상태 재확인
```

### 현재 문제점
- `isScrapingRunning = true` 상태에서 오류 발생 시 false로 전환 안됨
- API 호출 실패 시 catch 블록에서 상태 리셋 누락
- 페이지 새로고침 시 상태는 초기화되지만 실제 백그라운드 프로세스는 계속 실행 중일 수 있음

### 질문
1. **React 상태 초기화와 백그라운드 프로세스 중단을 동시에 처리하는 방법은?**

2. **실행 중인 스크래퍼 프로세스를 안전하게 종료하는 API가 필요합니까?**
   - 현재: 프론트엔드 상태만 관리
   - 필요: 백엔드 프로세스 관리

3. **AbortController를 사용한 fetch 취소가 충분합니까?**

### 관련 파일
- `src/app/admin/dec30/page.tsx` - Admin 컨트롤 패널
- `src/app/api/bot/run-scraper/route.ts` - 스크래퍼 실행 API

---

## 우선순위 답변 요청

1. **[긴급]** Cloudinary API 키 문제 해결
2. **[긴급]** Ollama 자동 시작 타이밍 문제 해결
3. **[긴급]** Next.js 빌드 캐시 손상 방지
4. **[긴급]** 스크래핑 0건 저장 원인 파악
5. **[중요]** Admin UI 강제 리셋 기능 구현
6. **[중요]** 장기적 이미지 호스팅 전략 결정
7. **[참고]** 순천/영광 이미지 직접 URL 가능 여부

---

*질의서 작성: Claude AI*
*검토 요청: 주인님*
