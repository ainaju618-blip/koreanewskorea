
import { NextRequest, NextResponse } from 'next/server';
import { createBotLog, executeScraper } from '@/lib/bot-service';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { regions, startDate, endDate, dryRun } = body;

        if (!regions || !Array.isArray(regions) || regions.length === 0) {
            return NextResponse.json({ message: '지역을 선택해주세요.' }, { status: 400 });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 for inclusive

        console.log(`[API] 봇 실행 요청: 지역 ${regions.length}개, 기간 ${diffDays}일, DryRun: ${dryRun}`);

        const jobs: { region: string; id: number }[] = [];

        // 1. 선행 로그 생성 (Running 상태로 DB에 먼저 기록)
        for (const region of regions) {
            const id = await createBotLog(region, diffDays, dryRun);
            if (id) {
                jobs.push({ region, id });
            }
        }

        // 2. 비동기 실행 (Fire and Forget)
        // 클라이언트에게는 jobIds만 먼저 반환하고, 실제 작업은 백그라운드에서 순차 수행
        (async () => {
            for (const job of jobs) {
                await executeScraper(job.id, job.region, startDate, endDate, dryRun);
            }
        })();

        // 3. 응답 (생성된 Job ID 목록 반환 -> 클라이언트 폴링용)
        return NextResponse.json({
            message: '수집 작업이 시작되었습니다.',
            jobIds: jobs.map(j => j.id),
            jobCount: jobs.length
        });

    } catch (error: any) {
        console.error('[API] 에러 발생:', error);
        return NextResponse.json({ message: error.message || '서버 오류' }, { status: 500 });
    }
}
