# 🎓 OPUS 작전 지시서: Phase 8 - 교육청 스크래퍼 확장

> **작전명:** Operation Edu Connect (교육청 보도자료 수집)
> **발령일시:** 2025-12-07 12:10 KST
> **발령자:** CSTO (Antigravity)
> **수신자:** Opus 4.5
> **우선순위:** 🟡 High

---

## 📅 작전 개요
발행인님의 특별 지시로 **광주광역시교육청**과 **전라남도교육청**의 보도자료를 수집 범위에 추가합니다.
이는 '교육' 카테고리의 핵심 콘텐츠가 될 것입니다.

---

## ✅ Task Breakdown

### Task 8.1: 교육청 스크래퍼 개발
*   **목표:** 두 교육청의 보도자료 게시판 크롤링
*   **파일 생성:**
    1.  `scrapers/gwangju_edu_scraper.py`
    2.  `scrapers/jeonnam_edu_scraper.py`
*   **요구사항:**
    *   `category` 필드는 반드시 `'education'`으로 저장할 것.
    *   `region` 필드는 각각 `'gwangju'`, `'jeonnam'`으로 하되, `publisher`를 '광주광역시교육청', '전라남도교육청'으로 명시.
    *   게시판 구조 분석 후 CSS Selector 최적화 (제목, 본문, 작성일, 첨부 이미지).

### Task 8.2: 프론트엔드 상수 업데이트
*   **파일:** `web/src/constants/regions.ts` (또는 신규 `agencies.ts`)
*   **내용:** 수집 대상 목록에 교육청 추가
```typescript
export const EDUCATION_AGENCIES = [
    { code: 'gwangju_edu', name: '광주광역시교육청', type: 'agency' },
    { code: 'jeonnam_edu', name: '전라남도교육청', type: 'agency' },
];
```

### Task 8.3: Admin 봇 실행 페이지 UI 수정
*   **파일:** `web/src/app/admin/bot/run/page.tsx`
*   **내용:** '수집 대상 지역' 섹션 하단 또는 별도 섹션으로 '교육청' 선택 체크박스 추가.
    *   기존 `regions` 배열에 섞지 말고, 별도 그룹("교육청")으로 분리하여 UI 가독성 확보 권장.

### Task 8.4: 백엔드 실행 로직 확장
*   **파일:** `web/src/app/api/bot/run/route.ts`
*   **내용:** `gwangju_edu`, `jeonnam_edu` 코드가 들어오면 해당하는 새 스크래퍼 파일(`_edu_scraper.py`)을 실행하도록 분기 처리.

---

## 📡 보고 체계
*   작업 완료 시 `task/plan/OPUS_PROGRESS_LOG.md`에 **Phase 8** 섹션 추가하여 기록.

---

## 🟢 작전 개시
본 파일을 확인하는 즉시 개발에 착수하십시오.
