# Admin 공통 컴포넌트

> **경로:** `web/src/components/admin/shared/`
> **버전:** v1.0
> **최종수정:** 2025-12-12

---

## 개요

관리자 페이지에서 공통으로 사용되는 UI 컴포넌트 모음입니다.
토큰 절약과 일관된 UI를 위해 분리되었습니다.

---

## 컴포넌트 목록

| 컴포넌트 | 파일 | 용도 |
|----------|------|------|
| StatusBadge | `StatusBadge.tsx` | 상태 표시 배지 (기사/사용자/봇) |
| ConfirmModal | `ConfirmModal.tsx` | 확인/취소 모달 |
| FilterTabs | `FilterTabs.tsx` | 필터 탭 (pills/buttons) |
| PageHeader | `PageHeader.tsx` | 페이지 헤더 (제목+설명+액션) |
| Pagination | `Pagination.tsx` | 페이지네이션 |
| SlidePanel | `SlidePanel.tsx` | 우측 슬라이드 패널 |

---

## 사용법

### Import

```tsx
// 개별 import
import { StatusBadge } from "@/components/admin/shared/StatusBadge";

// 일괄 import (권장)
import {
    StatusBadge,
    ConfirmModal,
    FilterTabs,
    PageHeader,
    Pagination,
    SlidePanel,
} from "@/components/admin/shared";
```

---

## 컴포넌트 상세

### 1. StatusBadge

상태를 시각적으로 표시하는 배지 컴포넌트.

```tsx
// 기사 상태
<StatusBadge type="article" status="published" />
<StatusBadge type="article" status="draft" />

// 사용자 상태 (클릭 가능)
<StatusBadge
    type="user"
    status="active"
    onClick={() => toggleStatus()}
/>

// 봇 상태
<StatusBadge type="bot" status="running" />
```

**Props:**
- `type`: "article" | "user" | "bot"
- `status`: 상태 문자열
- `onClick?`: 클릭 핸들러 (있으면 클릭 가능)
- `showIcon?`: 아이콘 표시 여부 (기본: true)

---

### 2. ConfirmModal

확인/취소 모달 다이얼로그.

```tsx
<ConfirmModal
    isOpen={showConfirm}
    title="삭제 확인"
    message="정말 삭제하시겠습니까?"
    confirmLabel="삭제"
    variant="danger"
    onConfirm={() => handleDelete()}
    onCancel={() => setShowConfirm(false)}
/>
```

**Props:**
- `isOpen`: 모달 표시 여부
- `title?`: 제목 (기본: "확인")
- `message`: 메시지 내용
- `confirmLabel?`: 확인 버튼 텍스트 (기본: "확인")
- `cancelLabel?`: 취소 버튼 텍스트 (기본: "취소")
- `variant?`: "default" | "danger" | "warning"
- `onConfirm`: 확인 클릭 핸들러
- `onCancel`: 취소 클릭 핸들러

---

### 3. FilterTabs

필터 탭 컴포넌트.

```tsx
// Pills 스타일 (기본)
<FilterTabs
    tabs={[
        { key: "all", label: "전체" },
        { key: "draft", label: "승인 대기", count: 5 },
        { key: "published", label: "발행됨" },
    ]}
    activeTab={filterStatus}
    onChange={(key) => setFilterStatus(key)}
/>

// Buttons 스타일
<FilterTabs
    tabs={[...]}
    activeTab={filterRole}
    onChange={setFilterRole}
    variant="buttons"
/>
```

**Props:**
- `tabs`: 탭 배열 `{ key, label, count? }[]`
- `activeTab`: 현재 선택된 탭 key
- `onChange`: 탭 변경 핸들러
- `variant?`: "pills" | "buttons"

---

### 4. PageHeader

페이지 상단 헤더.

```tsx
import { FileEdit } from "lucide-react";

<PageHeader
    title="기사 관리"
    description="전체 기사를 검색하고 승인/반려 처리를 수행합니다."
    icon={FileEdit}
    iconBgColor="bg-blue-600"
    actions={
        <button className="btn-primary">새 기사 작성</button>
    }
/>
```

**Props:**
- `title`: 페이지 제목
- `description?`: 설명 텍스트
- `icon?`: Lucide 아이콘 컴포넌트
- `iconBgColor?`: 아이콘 배경색 (기본: "bg-blue-600")
- `actions?`: 우측 액션 버튼 영역

---

### 5. Pagination

페이지네이션 컴포넌트.

```tsx
// 기본 (Page X of Y)
<Pagination
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={(page) => setCurrentPage(page)}
/>

// 페이지 번호 표시
<Pagination
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={setCurrentPage}
    showPageNumbers
    maxVisiblePages={5}
/>
```

**Props:**
- `currentPage`: 현재 페이지
- `totalPages`: 전체 페이지 수
- `onPageChange`: 페이지 변경 핸들러
- `showPageNumbers?`: 페이지 번호 표시 (기본: false)
- `maxVisiblePages?`: 표시할 최대 페이지 수 (기본: 5)

---

### 6. SlidePanel

우측에서 슬라이드되는 패널.

```tsx
<SlidePanel
    isOpen={isPanelOpen}
    onClose={() => setIsPanelOpen(false)}
    title="기사 상세"
    subtitle="ID: abc-123"
    width="lg"
    headerActions={
        <>
            <button>저장</button>
            <button>삭제</button>
        </>
    }
>
    <div>패널 내용...</div>
</SlidePanel>
```

**Props:**
- `isOpen`: 패널 표시 여부
- `onClose`: 닫기 핸들러
- `title?`: 헤더 제목
- `subtitle?`: 헤더 부제목
- `headerActions?`: 헤더 우측 액션 버튼
- `children`: 패널 내용
- `width?`: "sm" | "md" | "lg" | "xl" (기본: "lg")

---

## 마이그레이션 가이드

기존 페이지에서 공통 컴포넌트로 전환 시:

### Before (news/page.tsx)
```tsx
// 896줄의 단일 파일
function StatusBadge({ status }) { ... }  // 13줄
// 확인 모달 JSX inline                    // 24줄
// 필터 탭 JSX inline                      // 26줄
// 페이지네이션 JSX inline                 // 21줄
// 슬라이드 패널 JSX inline               // 140줄
```

### After
```tsx
import {
    StatusBadge,
    ConfirmModal,
    FilterTabs,
    Pagination,
    SlidePanel,
} from "@/components/admin/shared";

// 컴포넌트 사용
<StatusBadge type="article" status={article.status} />
<ConfirmModal isOpen={...} onConfirm={...} onCancel={...} />
```

**예상 절감:** 약 200줄 (22% 감소)

---

## 폴더 구조

```
web/src/components/admin/
├── shared/                    # 공통 컴포넌트 (이 폴더)
│   ├── StatusBadge.tsx
│   ├── ConfirmModal.tsx
│   ├── FilterTabs.tsx
│   ├── PageHeader.tsx
│   ├── Pagination.tsx
│   ├── SlidePanel.tsx
│   ├── index.ts              # 내보내기
│   └── README.md             # 이 문서
├── AdminSidebar.tsx          # 사이드바
└── NewsEditor.tsx            # 기사 편집기
```

---

## 확장 계획

추후 추가 예정:
- `DataTable.tsx` - 재사용 가능한 데이터 테이블
- `FormModal.tsx` - 폼 입력 모달
- `SearchBar.tsx` - 검색 입력창
- `LoadingSpinner.tsx` - 로딩 표시

---

---

## FAQ (검색용)

| Question | Answer |
|----------|--------|
| "상태 배지? 상태 표시?" | `StatusBadge.tsx` - article/user/bot 상태 |
| "확인 모달? 삭제 확인?" | `ConfirmModal.tsx` |
| "alert 대신? confirm 대신?" | `ConfirmModal.tsx` (P0 규칙: alert/confirm 금지) |
| "필터 탭?" | `FilterTabs.tsx` - pills/buttons 스타일 |
| "페이지 헤더?" | `PageHeader.tsx` - 제목+설명+액션 |
| "페이지네이션?" | `Pagination.tsx` |
| "슬라이드 패널?" | `SlidePanel.tsx` - 우측 슬라이드 |
| "공통 컴포넌트 임포트?" | `@/components/admin/shared` 에서 일괄 import |
| "관리자 UI 재사용?" | 이 폴더 - StatusBadge, ConfirmModal, FilterTabs 등 |

---

*이 문서는 AI Agent가 관리자 컴포넌트 작업 시 참조합니다.*
