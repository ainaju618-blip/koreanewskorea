import { NextRequest, NextResponse } from 'next/server';
import { getTestConfig, saveTestConfig, runManualTest, TestSchedulerConfig } from '@/lib/test-scheduler';

/**
 * 테스트 스케줄러 설정 API
 * GET: 현재 설정 및 마지막 결과 조회
 * POST: 설정 변경 (enabled, cronExpression)
 */

export async function GET(req: NextRequest) {
    try {
        const config = await getTestConfig();
        return NextResponse.json(config);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { enabled, cronExpression, runNow } = body;

        // 수동 테스트 실행
        if (runNow) {
            await runManualTest();
            return NextResponse.json({
                success: true,
                message: '테스트 실행이 시작되었습니다.'
            });
        }

        // 설정 업데이트
        const currentConfig = await getTestConfig();
        const newConfig: TestSchedulerConfig = {
            ...currentConfig,
            enabled: enabled !== undefined ? enabled : currentConfig.enabled,
            cronExpression: cronExpression || currentConfig.cronExpression
        };

        await saveTestConfig(newConfig);

        return NextResponse.json({
            success: true,
            config: newConfig,
            message: enabled ? '테스트 스케줄러 활성화' : '테스트 스케줄러 비활성화'
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
