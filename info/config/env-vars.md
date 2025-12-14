# 환경변수 목록

## 필수 (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cloudinary (레거시, 선택)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Vercel 환경변수

```bash
# 확인
vercel env ls

# 추가
vercel env add VARIABLE_NAME

# 로컬에 가져오기
vercel env pull .env.local
```

## 환경별

| 변수 | Development | Production |
|------|-------------|------------|
| NEXT_PUBLIC_SUPABASE_URL | 동일 | 동일 |
| SUPABASE_SERVICE_ROLE_KEY | .env.local | Vercel 설정 |
