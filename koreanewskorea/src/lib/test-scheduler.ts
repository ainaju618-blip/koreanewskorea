/**
 * 스크래퍼 자동 테스트 스케줄러
 * - 관리자가 설정한 시간에 1건씩 dry-run 테스트
 * - 결과 기록 및 온/오프 기능
 */

import cron, { ScheduledTask } from 'node-cron';
import { supabaseAdmin } from './supabase-admin';
import { createBotLog, executeScraper, ALL_REGIONS } from './bot-service';

export interface TestSchedulerConfig {
    enabled: boolean;
    cronExpression: string;  // 예: '0 6 * * *' (매일 오전 6시)
    lastRun?: string;
    lastResult?: {
        timestamp: string;
        totalRegions: number;
        successRegions: number;
        failedRegions: string[];
    };
}

let testTask: ScheduledTask | null = null;
let testTasks: ScheduledTask[] = [];  // 여러 스케줄 지원

// 하루 3번 실행 시간 (하드코딩)
const TEST_SCHEDULES = [
    { cron: '0 4 * * *', label: '새벽 4시' },
    { cron: '0 12 * * *', label: '낮 12시' },
    { cron: '0 20 * * *', label: '저녁 8시' }
];

const defaultTestConfig: TestSchedulerConfig = {
    enabled: false,
    cronExpression: '0 4,12,20 * * *'  // 표시용 (실제는 위 배열 사용)
};

/**
 * 테스트 스케줄러 설정 가져오기
 */
export async function getTestConfig(): Promise<TestSchedulerConfig> {
    try {
        const { data } = await supabaseAdmin
            .from('system_settings')
            .select('value')
            .eq('key', 'test_scheduler_config')
            .single();

        if (data && data.value) {
            return { ...defaultTestConfig, ...data.value };
        }
    } catch (e) {
        console.error('[Test Scheduler] DB read error:', e);
    }
    return defaultTestConfig;
}

/**
 * 테스트 스케줄러 설정 저장
 */
export async function saveTestConfig(config: TestSchedulerConfig) {
    try {
        const { error } = await supabaseAdmin
            .from('system_settings')
            .upsert({ key: 'test_scheduler_config', value: config });

        if (error) throw error;
        await updateTestScheduler();
    } catch (e) {
        console.error('[Test Scheduler] Config save error:', e);
        throw e;
    }
}

/**
 * 테스트 스케줄러 초기화
 */
export async function initTestScheduler() {
    console.log('[Test Scheduler] Initializing...');
    await updateTestScheduler();
}

/**
 * 테스트 스케줄러 업데이트
 */
async function updateTestScheduler() {
    const config = await getTestConfig();

    // 기존 스케줄 모두 정리
    if (testTask) {
        testTask.stop();
        testTask = null;
    }
    testTasks.forEach(task => task.stop());
    testTasks = [];

    if (config.enabled) {
        console.log(`[Test Scheduler] 🧪 Starting test schedules: 새벽 4시, 낮 12시, 저녁 8시 (하루 3회)`);

        // 3개의 스케줄 모두 등록
        TEST_SCHEDULES.forEach(schedule => {
            if (cron.validate(schedule.cron)) {
                const task = cron.schedule(schedule.cron, () => {
                    console.log(`[Test Scheduler] 🚀 Running scraper test (${schedule.label})...`);
                    runScraperTest();
                });
                testTasks.push(task);
                console.log(`[Test Scheduler] ✅ Scheduled: ${schedule.label} (${schedule.cron})`);
            }
        });
    } else {
        console.log('[Test Scheduler] 🛑 Test scheduler is DISABLED');
    }
}

/**
 * 스크래퍼 테스트 실행 (각 지역 1건씩 dry-run)
 */
async function runScraperTest() {
    const startTime = new Date();
    const results: { region: string; success: boolean; message: string }[] = [];

    console.log(`[Test Scheduler] 🧪 Testing ${ALL_REGIONS.length} scrapers...`);

    for (const region of ALL_REGIONS) {
        try {
            console.log(`[Test Scheduler] Testing: ${region}`);

            // 테스트용 로그 생성 (dry-run)
            const id = await createBotLog(region, 1, true);
            if (id) {
                // 오늘 날짜
                const today = new Date().toISOString().split('T')[0];
                await executeScraper(id, region, today, today, true);

                // 결과 확인 (간단히 로그 상태 체크)
                const { data: log } = await supabaseAdmin
                    .from('bot_logs')
                    .select('status')
                    .eq('id', id)
                    .single();

                const success = log?.status === 'success';
                results.push({
                    region,
                    success,
                    message: success ? 'OK' : log?.status || 'Unknown'
                });
            }
        } catch (e: any) {
            results.push({
                region,
                success: false,
                message: e.message || 'Error'
            });
        }
    }

    // 결과 저장
    const successCount = results.filter(r => r.success).length;
    const failedRegions = results.filter(r => !r.success).map(r => r.region);

    const config = await getTestConfig();
    config.lastRun = startTime.toISOString();
    config.lastResult = {
        timestamp: startTime.toISOString(),
        totalRegions: ALL_REGIONS.length,
        successRegions: successCount,
        failedRegions
    };

    await supabaseAdmin
        .from('system_settings')
        .upsert({ key: 'test_scheduler_config', value: config });

    // 별도 테스트 결과 테이블에도 기록
    await supabaseAdmin
        .from('scraper_test_results')
        .insert({
            tested_at: startTime.toISOString(),
            total_regions: ALL_REGIONS.length,
            success_count: successCount,
            failed_regions: failedRegions,
            details: results
        });

    console.log(`[Test Scheduler] ✅ Test completed: ${successCount}/${ALL_REGIONS.length} success`);
    if (failedRegions.length > 0) {
        console.log(`[Test Scheduler] ⚠️ Failed regions: ${failedRegions.join(', ')}`);
    }
}

/**
 * 수동 테스트 실행
 */
export async function runManualTest() {
    await runScraperTest();
}
