# Korea NEWS Design System

> **최종 수정:** 2025-12-16
> **핵심 파일:** `src/app/globals.css` (@theme 블록)

---

## 1. 설계 원칙

**중앙 집중식 색상 관리**: 모든 색상은 `globals.css`의 `@theme` 블록에서 정의
**변경 용이성**: `@theme` 값만 수정하면 전체 사이트 디자인 일괄 변경

---

## 2. 색상 시스템

### 2.1 핵심 색상

| 이름 | CSS 변수 | 코드 | 용도 |
|------|---------|------|------|
| **Primary** | `--color-primary` | `#A6121D` | 포인트/강조 색상만 (버튼, 액센트) |
| **Secondary** | `--color-secondary` | `#0a192f` | 배경, 헤더, 푸터, 기본 텍스트 |

### 2.2 색상 사용 규칙

```
Primary (빨강 #A6121D)
  - CTA 버튼
  - 강조 텍스트
  - 활성 상태 표시
  - 경고/중요 표시

Secondary (네이비 #0a192f)
  - 헤더/푸터 배경
  - 사이드바 배경
  - 기본 텍스트 색상
  - 카드/박스 배경
```

---

## 3. @theme 블록 구조

```css
/* src/app/globals.css */
@theme {
  /* 핵심 색상 */
  --color-primary: #A6121D;
  --color-secondary: #0a192f;

  /* 확장 색상 (필요시 추가) */
  --color-primary-light: #c41e2a;
  --color-primary-dark: #8a0f18;
  --color-secondary-light: #1a3a5c;
  --color-secondary-dark: #050d1a;
}
```

---

## 4. 컴포넌트에서 사용법

### 4.1 올바른 사용

```jsx
// 배경색
<div className="bg-primary">강조 배경</div>
<div className="bg-secondary">기본 배경</div>

// 텍스트색
<span className="text-primary">강조 텍스트</span>
<span className="text-secondary">기본 텍스트</span>

// 테두리
<div className="border-primary">강조 테두리</div>
```

### 4.2 금지 사항

```jsx
// P1 위반: 하드코딩된 hex 값 사용 금지
<div className="bg-[#A6121D]">...</div>  // X
<div className="text-[#0a192f]">...</div>  // X

// 올바른 사용
<div className="bg-primary">...</div>  // O
<div className="text-secondary">...</div>  // O
```

---

## 5. 색상 변경 가이드

### 5.1 전체 사이트 색상 변경

```css
/* globals.css의 @theme 블록에서 값만 변경 */
@theme {
  --color-primary: #새로운색상코드;
  --color-secondary: #새로운색상코드;
}
```

### 5.2 변경 시 확인 사항

1. `npm run build` 실행하여 빌드 확인
2. 주요 페이지에서 색상 적용 확인
   - 헤더/푸터
   - 버튼/CTA
   - 카드 컴포넌트
   - 사이드바

---

## 6. Tailwind CSS v4 참고

Tailwind CSS v4에서는 `@theme` 지시어를 사용하여 CSS 변수를 직접 정의합니다.
정의된 변수는 자동으로 `bg-`, `text-`, `border-` 등의 유틸리티 클래스로 사용 가능합니다.

```css
@theme {
  --color-brand: #ff6600;
}

/* 자동으로 생성되는 클래스 */
/* bg-brand, text-brand, border-brand 등 */
```

---

*이 문서는 디자인/색상 관련 작업 시 MUST READ 문서입니다.*
