# UI Components (src/components/ui) AI Guide

> **Summary:** Reusable UI components for Korea NEWS platform.

---

## Components

| Component | Description | Usage |
|-----------|-------------|-------|
| `Toast.tsx` | Toast notification system | Feedback messages |
| `ConfirmModal.tsx` | Confirmation dialog modal | Destructive actions |
| `Pagination.tsx` | Page navigation component | News lists |
| `ShareToast.tsx` | Share action toast | Article sharing |
| `OptimizedImage.tsx` | Next.js Image with optimization | Images |
| `NoImagePlaceholder.tsx` | Placeholder for missing images | Fallback |
| `NoImageCard.tsx` | Card component without image | News cards |
| `CategoryIcon.tsx` | Category icon component | Category display |

---

## Toast System

**Import:**
```typescript
import { useToast } from '@/components/ui/Toast';

const { showSuccess, showError } = useToast();
showSuccess('Saved!');
showError('Failed!');
```

**Note:** Use this instead of `alert()` (P0 Rule)

---

## ConfirmModal

**Import:**
```typescript
import { useConfirm } from '@/components/ui/ConfirmModal';

const { confirm } = useConfirm();
const result = await confirm('Delete this item?');
```

**Note:** Use this instead of `confirm()` (P0 Rule)

---

## FAQ

| Question | Answer |
|----------|--------|
| "알림 메시지 띄우는 거?" | `Toast.tsx` - useToast hook |
| "성공/에러 메시지?" | `Toast.tsx` - showSuccess, showError |
| "Toast notification?" | `Toast.tsx` |
| "alert 대신 뭐 써?" | `Toast.tsx` - P0 규칙: alert() 금지 |
| "확인 창? 삭제 확인?" | `ConfirmModal.tsx` - useConfirm hook |
| "confirm 대신 뭐 써?" | `ConfirmModal.tsx` - P0 규칙: confirm() 금지 |
| "Confirmation dialog?" | `ConfirmModal.tsx` |
| "페이지 넘기기? 페이지네이션?" | `Pagination.tsx` |
| "Pagination?" | `Pagination.tsx` |
| "이미지 최적화?" | `OptimizedImage.tsx` |
| "Image optimization?" | `OptimizedImage.tsx` |
| "이미지 없을 때 대체?" | `NoImagePlaceholder.tsx`, `NoImageCard.tsx` |
| "카테고리 아이콘?" | `CategoryIcon.tsx` |
| "공유 버튼 눌렀을 때 알림?" | `ShareToast.tsx` |

---

## Related Documents

| Document | Path |
|----------|------|
| Components Guide | `src/components/README.md` |
| Design System | `info/design-system.md` |

---

*Last updated: 2025-12-17*
