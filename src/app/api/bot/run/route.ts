
import { NextRequest, NextResponse } from 'next/server';
import { createBotLog, executeScraper } from '@/lib/bot-service';

// GitHub Actions 트리거 함수
async function triggerGitHubAction(region: string, days: number, logId: number): Promise<boolean> {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER || 'korea-news';
    const repo = process.env.GITHUB_REPO || 'koreanewsone';
    const workflowId = 'daily_scrape.yml';

    if (!token) {
        console.error('[GitHub] GITHUB_TOKEN not configured');
        return false;
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ref: 'master',
                    inputs: {
                        region: region,
                        days: String(days),
                        log_id: String(logId)
                    }
                })
            }
        );

        if (response.status === 204) {
            console.log(`[GitHub] Workflow dispatched successfully for ${region}`);
            return true;
        } else {
            const errorText = await response.text();
            console.error(`[GitHub] Workflow dispatch failed: ${response.status} - ${errorText}`);
            return false;
        }
    } catch (error: any) {
        console.error('[GitHub] Error triggering workflow:', error.message);
        return false;
    }
}

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

        // 2. 실행 모드 결정
        // - VERCEL 환경 또는 USE_GITHUB_ACTIONS=true인 경우: GitHub Actions 사용
        // - 로컬 개발 환경: 직접 Python 실행
        const useGitHubActions = process.env.VERCEL === '1' || process.env.USE_GITHUB_ACTIONS === 'true';

        if (useGitHubActions) {
            // GitHub Actions 트리거 (Vercel 프로덕션)
            console.log('[API] GitHub Actions 모드로 실행');

            // 여러 지역이면 각각 트리거
            if (regions.length === 1) {
                // 단일 지역: 해당 지역만 트리거
                const success = await triggerGitHubAction(regions[0], diffDays, jobs[0].id);
                if (!success) {
                    console.error('[API] GitHub Actions 트리거 실패');
                }
            } else {
                // 다중 지역: 각 지역별로 트리거
                for (const job of jobs) {
                    await triggerGitHubAction(job.region, diffDays, job.id);
                    // Rate limiting 방지를 위한 딜레이
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        } else {
            // 로컬 개발: 직접 Python 실행 (Fire and Forget)
            console.log('[API] 로컬 Python 실행 모드');

            (async () => {
                for (const job of jobs) {
                    await executeScraper(job.id, job.region, startDate, endDate, dryRun);
                }
            })();
        }

        // 3. 응답 (생성된 Job ID 목록 반환 -> 클라이언트 폴링용)
        return NextResponse.json({
            message: useGitHubActions
                ? 'GitHub Actions에서 수집 작업이 시작되었습니다.'
                : '수집 작업이 시작되었습니다.',
            jobIds: jobs.map(j => j.id),
            jobCount: jobs.length,
            mode: useGitHubActions ? 'github-actions' : 'local'
        });

    } catch (error: any) {
        console.error('[API] 에러 발생:', error);
        return NextResponse.json({ message: error.message || '서버 오류' }, { status: 500 });
    }
}
