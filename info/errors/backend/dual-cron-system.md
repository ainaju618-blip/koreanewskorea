# Dual Cron System Warning

> **Category:** Backend / Scheduler
> **Severity:** High (Potential Resource Duplication)
> **Status:** Known Issue - Manual Resolution Required
> **Documented:** 2024-12-18

---

## Issue Description

The scraper bot system has **two cron mechanisms** that can potentially run simultaneously:

1. **Vercel Cron** (`vercel.json`)
   - Configured in `vercel.json` under `crons` section
   - Triggers `/api/cron/scrape` endpoint
   - Runs in Vercel's serverless environment

2. **node-cron** (`src/lib/scheduler.ts`)
   - Initialized via `initScheduler()` in `instrumentation.ts`
   - Runs inside the Next.js server process
   - Uses `node-cron` package

## Problem

If both systems are enabled with the same schedule:
- **27 regions x 2 = 54 scraper processes** could run simultaneously
- Database load doubles
- Duplicate article collection attempts
- Resource exhaustion possible

## Current Architecture

```
vercel.json (crons)
    └── /api/cron/scrape → executeScraper() for all regions

instrumentation.ts
    └── initScheduler() → node-cron job → executeScraper() for all regions
```

## Resolution Options

### Option 1: Disable Vercel Cron (Recommended for Local Dev)
```json
// vercel.json - Remove or comment out crons section
{
  // "crons": [ ... ]  // Disabled
}
```

### Option 2: Disable node-cron (Recommended for Production)
```typescript
// instrumentation.ts
export async function register() {
    // Comment out scheduler initialization for production
    // if (process.env.VERCEL !== '1') {
    //     await initScheduler();
    // }
}
```

### Option 3: Environment-Based Selection (Best Practice)
```typescript
// instrumentation.ts
export async function register() {
    // Only use node-cron in local development
    if (process.env.NODE_ENV === 'development' && process.env.USE_NODE_CRON === 'true') {
        const { initScheduler } = await import('@/lib/scheduler');
        await initScheduler();
    }
    // Production uses Vercel Cron exclusively
}
```

## Current Status

- **Vercel Production**: Uses Vercel Cron (vercel.json)
- **Local Development**: Uses node-cron (scheduler.ts)
- **Admin UI Schedule Settings**: Controls node-cron only

## Related Files

- `vercel.json` - Vercel cron configuration
- `src/lib/scheduler.ts` - node-cron implementation
- `src/instrumentation.ts` - Scheduler initialization
- `src/app/api/cron/scrape/route.ts` - Vercel cron endpoint

---

*Documented: 2024-12-18*
