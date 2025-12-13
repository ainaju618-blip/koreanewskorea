# 코리아 NEWS 로고 디자인 실행 계획 (Logo Design Action Plan)

## 1. 개요
본 문서는 `designplan.md`에서 수립된 브랜드 정체성과 3가지 디자인 컨셉을 실제 시각 결과물(로고)로 구현하기 위한 구체적인 실행 계획입니다. AI 이미지 생성 도구를 활용하여 시안을 도출하고, 사용자 피드백을 통해 최종안을 확정하는 프로세스를 따릅니다.

## 2. 디자인 타겟 (Design Target)
-   **브랜드명:** 코리아 NEWS (KOREA NEWS)
-   **핵심 가치:** 신뢰(Trust), 신속(Speed), 통찰(Insight)
-   **주요 색상:** Royal Navy (#003366), Crimson Red (#D32F2F)

## 3. 컨셉별 프롬프트 설계 (Prompt Engineering)
AI 생성 도구에 입력할 구체적인 프롬프트 전략입니다.

### **Type A. The Heritage (정통 언론형)**
*   **Visual Key:** Classic, Serif font, Newspaper texture, Minimalist quill or torch icon.
*   **Style:** Minimalist, Flat design, Corporate identity.
*   **Prompt Keyword:** 
    > "A professional logo design for a news company named 'KOREA NEWS'. Classic serif typography, strong and bold 'KOREA', elegant 'NEWS'. Icon featuring a modern quill pen or a simplified torch. Color scheme: Royal Navy Blue and deep Crimson Red. White background, vector style, flat design, high readability, authority, trust."

### **Type B. Digital Pulse (디지털 혁신형)**
*   **Visual Key:** Sans-serif font, Digital waveform, Pixel, Connection, Speed.
*   **Style:** Tech-oriented, Modern, Sleek, Futuristic.
*   **Prompt Keyword:**
    > "A modern tech-inspired logo design for 'KOREA NEWS'. Geometric sans-serif typography. The letter 'K' incorporates a digital pulse line or data signal wave. Color scheme: Electric Blue, white, and dark gray. Minimalist, futuristic, high speed, connection, clean lines, flat vector logo."

### **Type C. Global Harmony (융합 모델)**
*   **Visual Key:** Taegeuk (Yin-Yang) reimagined, Globe, Circle, Harmony.
*   **Style:** Balanced, Global, Symbolic.
*   **Prompt Keyword:**
    > "A logo design for 'KOREA NEWS' featuring a stylized emblem. The emblem abstracts the Korean Taegeuk symbol (red and blue swirls) into a modern globe shape or two connecting arcs. Typography is clean and balanced. Color scheme: Navy Blue background with Red and Blue gradient accents. Harmoniuos, global standard, news agency branding, vector graphic."

## 4. 작업 프로세스 (Work Process)

### Phase 1. 시안 생성 (Generation)
-   각 컨셉(A, B, C)별로 4개 이상의 고품질 로고 변형(Variation)을 생성합니다.
-   텍스트의 가독성과 심볼의 인지도를 중점으로 1차 필터링을 수행합니다.

### Phase 2. 사용자 리뷰 및 선정 (Review & Selection)
-   생성된 시안을 사용자에게 제시합니다.
-   사용자는 가장 마음에 드는 **단 하나의 컨셉** 또는 **수정하고 싶은 요소**를 피드백합니다.
    -   *예: "Type B가 좋은데 색감은 Type A처럼 진하게 가고 싶어."*

### Phase 3. 디벨롭 및 파생형 제작 (Refinement & Variations)
-   확정된 로고를 바탕으로 실제 서비스에 적용할 다양한 포맷을 제작합니다.
    1.  **Main Logo (Horizontal):** 웹사이트 헤더용 (가로형).
    2.  **Symbol Icon:** 모바일 앱 아이콘, 파비콘, 프로필 사진용 (심볼 단독).
    3.  **Wordmark:** 심볼 없는 텍스트 전용 로고.
    4.  **Dark/Light Mode:** 배경색에 따른 반전 버전.

## 5. 최종 산출물 (Final Deliverables)
-   **Logo Images:** `.png` (투명 배경), 전용 폴더 `web/public/images/logo/`에 저장.
-   **Design Guide Update:** 최종 확정된 로고를 `designplan.md`에 반영 업데이트.

---
**Next Step:** `generate_image` 툴을 사용하여 Phase 1(시안 생성) 즉시 시작 가능.
