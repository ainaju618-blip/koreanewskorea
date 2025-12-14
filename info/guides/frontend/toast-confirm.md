# [GUIDE] Toast/Confirm 사용법

> **중요:** 시스템 모달(alert, confirm, prompt) 사용 금지!

## 왜 금지?
1. 항상 화면 상단에 표시 (마우스 이동 많음)
2. 브라우저마다 디자인 다름
3. 커스텀 스타일링 불가

## Toast 사용
```typescript
import { useToast } from '@/components/ui/Toast';

const { showSuccess, showError, showInfo } = useToast();

// 성공
showSuccess('저장되었습니다.');

// 에러
showError('오류가 발생했습니다.');

// 정보
showInfo('처리 중입니다.');
```

## Confirm 사용
```typescript
import { useConfirm } from '@/components/ui/ConfirmModal';

const { confirm, confirmDelete } = useConfirm();

// 일반 확인
const ok = await confirm({
  title: '확인',
  message: '진행하시겠습니까?'
});

// 삭제 확인
const ok = await confirmDelete('이 항목');
```

## 컴포넌트 위치
```
src/components/ui/
├── Toast.tsx
├── ConfirmModal.tsx
└── ShareToast.tsx
```
