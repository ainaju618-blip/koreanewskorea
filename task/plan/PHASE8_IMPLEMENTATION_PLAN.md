# 📝 Phase 8 마무리 및 UI 복구 계획

> **작성자:** CSTO (Antigravity)
> **상태:** 🔴 긴급 (UI 렌더링 에러 발생 중)
> **목표:** `page.tsx` 문법 오류 수정 및 교육청 스크래퍼 기능 최종 확인

## 1. 현재 상황 분석
*   **완료된 작업:**
    *   `web/src/constants/regions.ts`: 교육청(Agency) 타입 및 데이터 추가 완료.
    *   `scrapers/gwangju_edu_scraper.py`: 개발 완료.
    *   `scrapers/jeonnam_edu_scraper.py`: 개발 완료.
    *   `web/src/app/api/bot/run/route.ts`: 교육청 스크래퍼 분기 로직 추가 완료.
*   **문제 상황:**
    *   `web/src/app/admin/bot/run/page.tsx`: 체크박스 UI 추가 중 코드 병합 실패로 심각한 문법 오류 발생 (컴파일 불가).

## 2. 해결 방안 (Implementation Steps)

### Step 1: `page.tsx` 긴급 복구
*   **전략:** `replace_file_content`가 아닌 `write_to_file`로 파일 전체를 깔끔하게 다시 작성.
*   **수정 내용:**
    *   `agencyRegions`, `localRegions` 변수 정의 위치 정리.
    *   체크박스 렌더링 로직(교육기관/지자체 분리) 정상화.
    *   JSX 태그 닫힘 상태 점검.

### Step 2: 스크래퍼 Dry Run 테스트
*   백엔드 로직(`route.ts`)이 정상 작동하는지 확인하기 위해 터미널 명령어 테스트 수행.
*   `python ../scrapers/universal_scraper.py ...` 가 아닌 개별 파일 실행 테스트.

### Step 3: 최종 보고
*   `OPUS_PROGRESS_LOG.md` 업데이트.

## 3. 검증 계획
1.  **빌드 확인:** `npm run dev` 터미널에서 에러가 사라져야 함.
2.  **화면 확인:** Admin > 수동 수집 실행 페이지에 '교육기관' 섹션이 파란색으로 예쁘게 떠야 함.
3.  **기능 확인:** '광주광역시교육청' 선택 후 Dry Run 버튼 클릭 시 로그 생성 확인.
