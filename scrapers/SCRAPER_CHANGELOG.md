# 🔄 스크래퍼 변경 이력 (CHANGELOG)

> **형식**: `[YYYY-MM-DD] [작업자] [파일명] - 변경 내용`

---

## 2025-12-12

### 문서 체계 정비
- **[AI Agent]** 가이드 문서 v3.0 일괄 업데이트
  - `SCRAPER_GUIDE.md` v3.0: 실제 폴더 구조 반영, fetch_detail 반환형 명세
  - `스크래퍼_개발_지침.md` v3.0: 외부 협업 지침 정리
  - `SCRAPER_DEVELOPMENT_GUIDE.md` v3.0: 영문 가이드 동기화
  - `templates/base_scraper_template.py` v3.0: Cloudinary 업로드, max_articles 파라미터 추가

### 코드 수정
- **[AI Agent]** `main_bot.py`
  - 임포트 경로 수정: `scrapers.naju_scraper` → `scrapers.naju.naju_scraper`

### 프로젝트 관리
- **[AI Agent]** `CLAUDE.md` 생성
  - AI Agent용 프로젝트 관리 지침서 작성
  - 스크래퍼 개발 규칙, 작업 절차, 금지 사항 정의

---

## 2025-12-10

### 구조 개편
- **[System]** 스크래퍼 관리 체계 도입
  - `[지역명]/` 폴더: 지역별 스크래퍼 (27개)
  - `backup/` 폴더: 버전 백업용
  - `debug/` 폴더: 테스트/디버그 파일 정리
  - `templates/` 폴더: 스크래퍼 템플릿
  - `SCRAPER_GUIDE.md`: AI/개발자 가이드라인

### 스크래퍼 수정
- **[AI Agent]** `jeonnam_scraper.py`
  - 본문 셀렉터 변경: `div.bbs_view_contnet` 추가 (사이트 오타 대응)
  - 이미지 추출: 첨부파일 다운로드 링크에서 jpg/png 추출 로직 추가

---

## 변경 기록 작성 가이드

```markdown
### YYYY-MM-DD
- **[작업자]** `파일명.py`
  - 변경 내용 1
  - 변경 내용 2
```

| 작업자 표기 | 설명 |
|------------|------|
| `[AI Agent]` | AI 자동 작업 |
| `[Human]` | 사람 직접 작업 |
| `[System]` | 시스템/구조 변경 |

---

*새로운 변경 사항은 이 파일 상단에 추가하세요.*
