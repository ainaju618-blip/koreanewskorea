
import cron, { ScheduledTask } from 'node-cron';
import { supabaseAdmin } from './supabase-admin';
import { createBotLog, executeScraper, ALL_REGIONS } from './bot-service';

export interface SchedulerConfig {
    enabled: boolean;
    cronExpression: string;
    lastRun?: string;
}

let task: ScheduledTask | null = null;

const defaultConfig: SchedulerConfig = {
    enabled: false,
    cronExpression: '0 9,13,17 * * *'
};

export async function getConfig(): Promise<SchedulerConfig> {
    try {
        const { data } = await supabaseAdmin
            .from('system_settings')
            .select('value')
            .eq('key', 'scheduler_config')
            .single();

        if (data && data.value) {
            return { ...defaultConfig, ...data.value };
        }
    } catch (e) {
        console.error('[Scheduler] DB read error:', e);
    }
    return defaultConfig;
}

export async function saveConfig(config: SchedulerConfig) {
    try {
        const { error } = await supabaseAdmin
            .from('system_settings')
            .upsert({ key: 'scheduler_config', value: config });

        if (error) throw error;
        await updateScheduler();
    } catch (e) {
        console.error('[Scheduler] Config save error:', e);
        throw e;
    }
}

export async function initScheduler() {
    console.log('[Scheduler] Initializing (DB mode)...');
    await updateScheduler();
}

async function updateScheduler() {
    const config = await getConfig();

    if (task) {
        task.stop();
        task = null;
    }

    if (config.enabled) {
        console.log(`[Scheduler] Starting cron job: "${config.cronExpression}"`);

        if (cron.validate(config.cronExpression)) {
            task = cron.schedule(config.cronExpression, () => {
                console.log(`[Scheduler] 🚀 Triggering bot from Local Scheduler (Direct Service)`);
                runBot();
            });
        }
    } else {
        console.log('[Scheduler] 🛑 Scheduler is DISABLED');
    }
}

async function runBot() {
    try {
        console.log(`[Scheduler] Starting batch job for ${ALL_REGIONS.length} regions...`);

        // 직접 서비스 함수 호출 (API 오버헤드 없이 바로 실행)
        // 오늘 날짜 기준 수집
        const dryRun = false;
        const today = new Date();
        const startDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const endDate = startDate; // 같은 날짜 (1일치)

        for (const region of ALL_REGIONS) {
            const id = await createBotLog(region, 1, dryRun);
            if (id) {
                // await를 사용하여 순차 실행 (서버 부하 조절)
                await executeScraper(id, region, startDate, endDate, dryRun);
            }
        }

        console.log(`[Scheduler] ✅ Batch job completed.`);

        const config = await getConfig();
        config.lastRun = new Date().toISOString();
        await supabaseAdmin
            .from('system_settings')
            .upsert({ key: 'scheduler_config', value: config });

    } catch (e) {
        console.error('[Scheduler] ❌ Batch job failed:', e);
    }
}
