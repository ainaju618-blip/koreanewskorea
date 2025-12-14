# [ERROR] Hydration 불일치

> **발생 빈도:** 중간
> **최종 수정:** 2025-12-15

## 증상
```
Hydration failed because the initial UI does not match
```

## 원인
서버/클라이언트 렌더링 결과가 다름

## 해결

### 1. useEffect로 클라이언트에서만 렌더링
```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

### 2. suppressHydrationWarning
```typescript
<time suppressHydrationWarning>
  {new Date().toLocaleString()}
</time>
```

### 3. dynamic import (SSR 비활성화)
```typescript
import dynamic from 'next/dynamic';
const ClientComponent = dynamic(
  () => import('./Component'),
  { ssr: false }
);
```

## 자주 발생하는 경우
- 날짜/시간 표시
- localStorage 접근
- window 객체 사용
- 랜덤 값 사용
