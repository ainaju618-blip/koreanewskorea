# Korea NEWS HQ Homepage

> Central headquarters homepage for Korea NEWS brand.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values.

Full credentials are stored in: `../info/config/hq-secrets.md` (gitignored)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel

## Project Structure

```
koreanewshq/
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # React components
│   └── lib/           # Utilities (Supabase client, etc.)
├── plan/              # Specification documents
└── public/            # Static assets
```

## Related Documents

- [HQ Homepage Spec](plan/hq-homepage-spec.md)
- [Main CLAUDE.md](../CLAUDE.md) - Project 2 section

## Deployment

This project deploys to Vercel team: `koreanewskoreas-projects`

Domain: `koreanewskorea.com`
