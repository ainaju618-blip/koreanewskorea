
import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/scheduler';
import { ALL_REGIONS } from '@/lib/bot-service';

export async function GET(request: Request) {
    try {
        const config = await getConfig();
        if (!config.enabled) {
            return NextResponse.json({ message: 'Scheduler is disabled in settings', skipped: true });
        }

        const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
        const host = process.env.VERCEL_URL
            ? `${protocol}://${process.env.VERCEL_URL}`
            : 'http://localhost:3001';

        const apiUrl = `${host}/api/bot/run`;
        const today = new Date().toISOString().split('T')[0];

        console.log(`[Vercel Cron] Triggering: ${apiUrl}`);

        // Vercel Cron은 API 호출 방식을 유지 (Serverless Timeout 회피 및 환경 격리)
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                regions: ALL_REGIONS, // bot-service에서 가져온 상수 사용
                startDate: today,
                endDate: today,
                dryRun: false
            })
        });

        if (!res.ok) {
            throw new Error(`API responded with ${res.status}`);
        }

        const data = await res.json();
        return NextResponse.json({ success: true, jobCount: data.jobCount });

    } catch (e: any) {
        console.error('[Vercel Cron] Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
