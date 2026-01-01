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

## 우선순위 답변 요청

1. **[긴급]** Cloudinary API 키 문제 해결
2. **[중요]** 장기적 이미지 호스팅 전략 결정
3. **[참고]** 순천/영광 이미지 직접 URL 가능 여부

---

*질의서 작성: Claude AI*
*검토 요청: 주인님*
