# 코리아 NEWS 홈페이지 로고 적용 기획안 (Homepage Logo Integration Plan)

## 1. 개요
확정된 '코리아 NEWS' 로고(Large O with Taegeuk)를 웹사이트의 주요 영역(Header, Footer)과 브라우저 리소스(Favicon, OG Image)에 최적화하여 적용하기 위한 가이드입니다.

## 2. 파일 리소스 준비 (Assets Preparation)
원본 이미지(`main_logo.png`)를 바탕으로 다음 3가지 파생 파일을 `public/images/logo/` 디렉토리에 생성합니다.

| 파일명 | 용도 | 규격 (권장) | 비고 |
| :--- | :--- | :--- | :--- |
| `logo_header.png` | PC/Mobile 헤더용 | 높이 60px 내외 (가로 가변) | 원본 유지 (White BG에 적합) |
| `logo_footer.png` | 푸터용 | 높이 40px 내외 | **All White (흰색)** 또는 **Grayscale** 처리 필요 (Dark 배경용) |
| `favicon.ico` / `symbol.png` | 탭 아이콘, 앱 아이콘 | 32x32, 192x192 | 텍스트 제외, **'태극 O' 심볼만 크롭**하여 사용 |

> **Tech Note:** 푸터용 로고는 별도 이미지 생성 없이 CSS `filter: brightness(0) invert(1);`를 적용하여 흰색으로 변환해서 사용하는 방식을 권장합니다. (관리 포인트 절약)

## 3. 영역별 배치 전략 (Placement Strategy)

### 3.1 Global Header (PC/Mobile)
*   **배경색:** White (`#FFFFFF`)
*   **배치:**
    *   **PC:** 좌측 상단 (`align-items: center`).
    *   **Mobile:** 중앙 정렬 또는 좌측 정렬 (햄버거 메뉴와 간섭 주의).
*   **여백:** 로고 상하 15px 이상의 패딩을 주어 '태극 심볼'이 답답하지 않게 숨 쉴 공간 확보.
*   **크기:** 
    *   PC: 높이 40~50px
    *   Mobile: 높이 30~35px

### 3.2 Global Footer
*   **배경색:** Dark Navy (`#003366` - 브랜드 컬러)
*   **배치:** 최상단 또는 좌측.
*   **스타일:** 배경이 어두우므로 로고 텍스트는 **반드시 흰색**이어야 함.
    *   **CSS Solution:** `<img src="/images/logo/logo_header.png" style="filter: brightness(0) invert(1);" alt="Korea News" />`
*   **정보:** 로고 하단에 주소, 등록번호, 카피라이트 텍스트 배치 (Gray Color `#CCCCCC`).

### 3.3 Browser Favicon & Metadata
*   **Favorite Icon:** 'O' (태극) 심볼만 둥글게 잘라서 적용. 브라우저 탭에서 강력한 시각적 인지 효과 제공.
*   **OG Image (SNS 공유 시):** 흰색 배경 중앙에 로고가 배치된 `og_image.png` (1200x630px) 별도 제작 필요.

## 4. 실행 계획 (Action Items)
1.  **디렉토리 생성:** `public/images/logo/`
2.  **파일 이동:** 확정된 로고 이미지를 위 경로에 `logo_main.png`로 저장.
3.  **코드 적용:** 
    *   `src/components/layout/Header.tsx` (또는 유사 파일) 수정.
    *   `src/components/layout/Footer.tsx` 수정 (CSS 필터 적용).
    *   `src/app/layout.tsx` (Metadata) 수정 - 파비콘 적용.

---
**Next Step:** 사용자 승인 후 파일 이동 및 간이 파비콘 생성(크롭) 진행.
