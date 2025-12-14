# [ERROR] Supabase 연결 오류

> **발생 빈도:** 중간
> **최종 수정:** 2025-12-15

## 증상
```
Error: supabaseUrl is required
```

## 원인
환경 변수 누락 또는 잘못된 설정

## 해결

### 1. 환경 변수 확인
```bash
# .env.local 필수 변수
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # 서버 전용
```

### 2. Admin 클라이언트 (서버용)
```typescript
// lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### 3. Vercel 환경 변수
```bash
vercel env ls          # 확인
vercel env add NAME    # 추가
vercel env pull .env.local  # 로컬에 가져오기
```

## 관련
- `supabase-rls.md` - RLS 정책 오류
- `config/env-vars.md` - 환경변수 목록
