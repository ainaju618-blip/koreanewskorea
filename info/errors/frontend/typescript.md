# [ERROR] TypeScript 빌드 에러

> **발생 빈도:** 높음
> **최종 수정:** 2025-12-15

## 증상
- `npm run build` 실패
- `npx tsc --noEmit` 에러

## 주요 에러 유형

### 1. 타입 불일치
```
Type 'string | undefined' is not assignable to type 'string'
```

**해결:**
```typescript
// 옵셔널 체이닝
const value = data?.field ?? '';

// 타입 단언 (확실할 때만)
const value = data.field as string;

// 타입 가드
if (data.field) {
  // 여기서 data.field는 string
}
```

### 2. import 에러
```
Cannot find module '@/lib/xxx'
```

**확인:** tsconfig.json
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 3. Next.js 동적 라우트 (16+)
```typescript
// ❌ 이전 방식
export async function GET(req, { params }) {
  const { id } = params;
}

// ✅ Next.js 16+ 방식
interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
}
```

## 빌드 명령어
```bash
# 타입 체크만
npx tsc --noEmit

# 빌드
npm run build
```

## 관련
- `nextjs-params.md` - 동적 라우트 상세
