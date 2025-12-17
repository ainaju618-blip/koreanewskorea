# Config & Settings AI Guide

> **Summary:** Configuration files, environment variables, and account information for Korea NEWS.

---

## Config Files in This Folder

| File | Description | Contains Sensitive Info |
|------|-------------|------------------------|
| `accounts.md` | Git, Vercel, Supabase account info | Yes |
| `env-vars.md` | Environment variables list | Yes (keys masked) |
| `gemini_accounts.md` | Gemini API accounts | Yes |

---

## Environment Variables

### Required (.env.local)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key (server-side) |
| `OPENAI_API_KEY` | OpenAI API key for AI features |

### Optional
| Variable | Description |
|----------|-------------|
| `CLOUDINARY_*` | Image upload (currently disabled) |
| `TELEGRAM_*` | Telegram notifications |
| `BOT_API_KEY` | Bot authentication |

---

## FAQ

| Question | Answer |
|----------|--------|
| "Where is env vars list?" | `info/config/env-vars.md` |
| "Git account for this project?" | `info/config/accounts.md` - email: `kyh6412057153@gmail.com` |
| "Vercel team?" | `koreanews-projects` |
| "Where to set env vars?" | `.env.local` (local) or Vercel dashboard (production) |
| "환경변수 목록?" | `env-vars.md` |
| "Git 계정? 이메일?" | `accounts.md` - `kyh6412057153@gmail.com` |
| "Vercel 팀?" | `koreanews-projects` |
| "환경변수 어디서 설정?" | `.env.local` (로컬) 또는 Vercel 대시보드 (프로덕션) |
| "Supabase 설정?" | `env-vars.md` - NEXT_PUBLIC_SUPABASE_* |
| "API 키 어디?" | `env-vars.md` - OPENAI_API_KEY, BOT_API_KEY 등 |
| "설정 파일 어디?" | 이 폴더 (`info/config/`) |
| "Gemini 계정?" | `gemini_accounts.md` |

---

## Related Files

| File | Location |
|------|----------|
| `.env.local` | Project root (gitignored) |
| `.env.example` | Project root (template) |
| `vercel.json` | Project root (Vercel config) |
| `next.config.ts` | Project root (Next.js config) |

---

## Important Rules

1. **Never commit `.env.local`** - Contains secrets
2. **Use correct Git email** - `kyh6412057153@gmail.com` for this project
3. **Vercel project name** - `koreanewsone` (DO NOT create new project)

---

*Last updated: 2025-12-17*
