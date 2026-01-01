# 레이아웃 에디터 개발 문제 - 외부 전문가 질의서

## 작성일: 2026-01-02

---

## 1. 프로젝트 개요

### 기술 스택
| 항목 | 버전 |
|------|------|
| Next.js | 15.5.9 (App Router) |
| React | 19.x |
| Node.js | 20.x |
| TypeScript | 5.x |

### 개발 환경
- OS: Windows 11
- 개발 서버: `npm run dev` (localhost:3000 또는 3001)
- 배포: Vercel

---

## 2. 구현 목표

**"레이아웃 에디터" 관리자 페이지 개발**

### 기능 요구사항
1. **페이지 선택**: 좌측 사이드바에서 프로젝트 내 페이지 목록 표시 및 선택
2. **실시간 미리보기**: 중앙 iframe에서 선택한 페이지 렌더링
3. **요소 선택**: iframe 내 요소 클릭 시 해당 요소 선택 (postMessage 통신)
4. **CSS 속성 편집**: 우측 패널에서 선택된 요소의 CSS 속성 수정
5. **변경사항 반영**: "반영" 버튼 클릭 시 미리보기에 스타일 적용
6. **저장**: "저장" 버튼 클릭 시 localStorage에 영구 저장

### UI 레이아웃 구상
```
┌──────────────────────────────────────────────────────────────────┐
│                        헤더 (도구 모음)                           │
├────────────┬─────────────────────────────────┬───────────────────┤
│   페이지   │                                  │    속성 패널      │
│   목록     │       iframe 미리보기            │   (CSS 편집)     │
│   (좌측)   │          (중앙)                  │     (우측)       │
│            │                                  │                  │
│  - 홈      │    ┌─────────────────────────┐   │  - 너비          │
│  - 기사    │    │                         │   │  - 높이          │
│  - 카테고리│    │   [선택된 페이지 표시]   │   │  - 색상          │
│  - 관리자  │    │                         │   │  - 여백          │
│            │    └─────────────────────────┘   │  - 폰트          │
│            │                                  │                  │
└────────────┴─────────────────────────────────┴───────────────────┘
                    ↑ 고정(fixed) 전체화면 오버레이로 구현
```

---

## 3. 현재 문제점

### 주요 증상: 404 Not Found

라우트 파일을 생성했음에도 페이지가 404 오류를 반환합니다.

```
경로: /admin/layout-editor (또는 /admin/layouteditor)
응답: 404 Not Found
```

### 시도한 방법들

#### 시도 1: (standalone) 라우트 그룹 사용
```
src/app/(standalone)/layout-editor/
├── layout.tsx   # 독립 레이아웃 (AdminSidebar 제외)
└── page.tsx     # 에디터 페이지
```
**결과**: Webpack 오류 발생
```
TypeError: __webpack_modules__[moduleId] is not a function
```

#### 시도 2: admin 폴더 내 fixed overlay
```
src/app/admin/layout-editor/
└── page.tsx     # position: fixed; inset: 0; z-index: 9999;
```
**결과**:
- 동일한 Webpack 오류
- "missing required error components, refreshing..." 무한 루프

#### 시도 3: 최소화된 테스트 페이지
```typescript
// src/app/admin/layout-editor/page.tsx
'use client';

import { useState } from 'react';

export default function LayoutEditorPage() {
  const [count, setCount] = useState(0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#0d1117',
        color: '#e6edf3',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
      }}
    >
      <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>
        레이아웃 에디터 테스트
      </h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Click me</button>
      <a href="/admin">Back to Admin</a>
    </div>
  );
}
```
**결과**: 여전히 404 Not Found

#### 시도 4: 폴더명 변경 (하이픈 제거)
```
layout-editor → layouteditor
```
**결과**: 아직 테스트 중

---

## 4. 상세 에러 로그

### Webpack 모듈 오류
```
TypeError: __webpack_modules__[moduleId] is not a function
    at __webpack_require__ (webpack.js?v=...)
    at ...
```

### 콘솔 오류
```
GET http://localhost:3001/admin/layout-editor 404 (Not Found)
Failed to load resource: the server responded with a status of 404 (Not Found)
```

### Next.js 오류 메시지
```
missing required error components, refreshing...
```

---

## 5. 관련 파일 목록

### 이미 작성된 컴포넌트/훅
| 파일 | 설명 | 상태 |
|------|------|------|
| `src/lib/layout-editor/types.ts` | 타입 정의 (PropertyDef, ElementInfo 등) | 완료 |
| `src/lib/layout-editor/storage.ts` | localStorage 유틸리티, CSS 생성 | 완료 |
| `src/hooks/useLayoutEditor.ts` | 상태 관리 훅 (pending/applied/saved) | 완료 |
| `src/components/layout-editor/PageList.tsx` | 페이지 목록 컴포넌트 | 완료 |
| `src/components/layout-editor/PreviewFrame.tsx` | iframe 미리보기 | 완료 |
| `src/components/layout-editor/PropertyPanel.tsx` | CSS 속성 편집 패널 | 완료 |

### 라우트 파일 (문제 발생 지점)
| 파일 | 상태 |
|------|------|
| `src/app/admin/layout-editor/page.tsx` | 삭제됨 (404 오류) |
| `src/app/admin/layouteditor/page.tsx` | 생성 예정 |

---

## 6. 프로젝트 구조

```
src/app/
├── (public)/           # 공개 페이지
├── admin/              # 관리자 영역
│   ├── layout.tsx      # 관리자 공통 레이아웃 (AdminSidebar 포함)
│   ├── page.tsx        # 관리자 대시보드
│   ├── news/           # 뉴스 관리
│   ├── settings/       # 설정
│   ├── bot/            # 스크래퍼 관리
│   └── layouteditor/   # << 문제의 폴더
│       └── page.tsx
├── layout.tsx          # 루트 레이아웃
└── globals.css         # 전역 스타일
```

---

## 7. 질문 사항

1. **Next.js App Router에서 특정 라우트만 404가 발생하는 원인은?**
   - 다른 admin 하위 페이지들은 정상 동작
   - `layout-editor` 또는 `layouteditor` 경로만 인식 안 됨

2. **Webpack 모듈 오류 해결 방법은?**
   - `__webpack_modules__[moduleId] is not a function` 오류의 원인
   - 캐시 삭제 (`.next` 폴더 삭제) 후에도 동일

3. **"missing required error components" 오류 해결 방법은?**
   - error.tsx 파일이 없어서 발생하는지?
   - 무한 리프레시 루프 발생

4. **권장되는 구현 방식은?**
   - admin 레이아웃(Sidebar)을 제외한 전체화면 페이지
   - Route Group 사용 vs Fixed Overlay vs 다른 방법?

---

## 8. 요청 사항

1. 위 문제의 **원인 분석**
2. **해결 방안** 제시 (코드 예시 포함)
3. Next.js 15 App Router에서 **권장되는 전체화면 페이지 구현 패턴**

---

## 9. 참고 자료

### Next.js 버전 정보
```json
{
  "next": "15.5.9",
  "react": "^19.0.0",
  "typescript": "^5"
}
```

### 관리자 레이아웃 코드
```typescript
// src/app/admin/layout.tsx
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
```

---

## 연락처

프로젝트: Korea NEWS (koreanewsone.com)
문의: [이메일 주소]
