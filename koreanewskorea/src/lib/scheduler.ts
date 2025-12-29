
import cron, { ScheduledTask } from 'node-cron';
import { supabaseAdmin } from './supabase-admin';
import { createBotLog, executeScraper, ALL_REGIONS } from './bot-service';

// Unified schedule settings interface (same as automation-schedule API)
export interface ScheduleSettings {
    enabled: boolean;
    startHour: number;   // e.g., 9 for 09:00
    endHour: number;     // e.g., 20 for 20:00
    intervalMinutes: number;  // e.g., 60 for every hour
    runOnMinute: number; // e.g., 30 for XX:30
    lastRun?: string;
}

let task: ScheduledTask | null = null;

const defaultSettings: ScheduleSettings = {
    enabled: false,
    startHour: 9,
    endHour: 20,
    intervalMinutes: 60,
    runOnMinute: 30
};

// Read from site_settings.automation_schedule (unified with UI)
export async function getScheduleSettings(): Promise<ScheduleSettings> {
    try {
        const { data, error } = await supabaseAdmin
            .from('site_settings')
            .select('value')
            .eq('key', 'automation_schedule')
            .single();

        if (error && error.code === 'PGRST116') {
            // Not found, return defaults
            return defaultSettings;
        }

        if (error) throw error;

        if (data && data.value) {
            const parsed = typeof data.value === 'string'
                ? JSON.parse(data.value)
                : data.value;
            return { ...defaultSettings, ...parsed };
        }
    } catch (e) {
        console.error('[Scheduler] DB read error:', e);
    }
    return defaultSettings;
}

// Convert settings to cron expression
function settingsToCron(settings: ScheduleSettings): string {
    const { startHour, endHour, intervalMinutes, runOnMinute } = settings;

    if (intervalMinutes === 60) {
        // Every hour at runOnMinute
        return `${runOnMinute} ${startHour}-${endHour} * * *`;
    } else if (intervalMinutes === 30) {
        // Every 30 minutes
        return `${runOnMinute},${(runOnMinute + 30) % 60} ${startHour}-${endHour} * * *`;
    } else {
        // For other intervals, use step syntax or fallback to hourly
        const step = Math.floor(60 / intervalMinutes);
        if (step > 0 && 60 % intervalMinutes === 0) {
            return `${runOnMinute}/${intervalMinutes} ${startHour}-${endHour} * * *`;
        }
        // Fallback: hourly
        return `${runOnMinute} ${startHour}-${endHour} * * *`;
    }
}

// Check if current time is within schedule window
function isWithinScheduleWindow(settings: ScheduleSettings): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= settings.startHour && currentHour <= settings.endHour;
}

export async function initScheduler() {
    console.log('[Scheduler] Initializing (Unified DB mode - site_settings.automation_schedule)...');
    await updateScheduler();
}

export async function updateScheduler() {
    const settings = await getScheduleSettings();

    if (task) {
        task.stop();
        task = null;
        console.log('[Scheduler] Previous task stopped.');
    }

    if (settings.enabled) {
        const cronExpression = settingsToCron(settings);
        console.log(`[Scheduler] Settings: startHour=${settings.startHour}, endHour=${settings.endHour}, interval=${settings.intervalMinutes}min, runOn=${settings.runOnMinute}min`);
        console.log(`[Scheduler] Starting cron job: "${cronExpression}"`);

        if (cron.validate(cronExpression)) {
            task = cron.schedule(cronExpression, () => {
                const now = new Date();
                console.log(`[Scheduler] Cron triggered at ${now.toLocaleString('ko-KR')}`);

                // Double-check time window
                if (isWithinScheduleWindow(settings)) {
                    console.log(`[Scheduler] Within schedule window, starting bot...`);
                    runBot();
                } else {
                    console.log(`[Scheduler] Outside schedule window (${settings.startHour}:00 - ${settings.endHour}:59), skipping.`);
                }
            });
            console.log('[Scheduler] Cron job scheduled successfully.');
        } else {
            console.error(`[Scheduler] Invalid cron expression: "${cronExpression}"`);
        }
    } else {
        console.log('[Scheduler] Scheduler is DISABLED in settings.');
    }
}

async function runBot() {
    try {
        console.log(`[Scheduler] Starting PARALLEL batch job for ${ALL_REGIONS.length} regions...`);

        const dryRun = false;
        const today = new Date();
        const startDate = today.toISOString().split('T')[0];
        const endDate = startDate;

        // Parallel execution for all regions
        const tasks = ALL_REGIONS.map(async (region) => {
            try {
                const id = await createBotLog(region, 1, dryRun);
                if (id) {
                    await executeScraper(id, region, startDate, endDate, dryRun);
                }
                return { region, success: true };
            } catch (e) {
                console.error(`[Scheduler] Region ${region} failed:`, e);
                return { region, success: false, error: e };
            }
        });

        const results = await Promise.allSettled(tasks);
        const succeeded = results.filter(r => r.status === 'fulfilled' && (r.value as { success: boolean }).success).length;
        const failed = results.length - succeeded;

        console.log(`[Scheduler] Batch job completed: ${succeeded} succeeded, ${failed} failed`);

        // Update lastRun in site_settings
        const settings = await getScheduleSettings();
        settings.lastRun = new Date().toISOString();

        await supabaseAdmin
            .from('site_settings')
            .upsert({
                key: 'automation_schedule',
                value: JSON.stringify(settings),
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

    } catch (e) {
        console.error('[Scheduler] Batch job failed:', e);
    }
}

// Export for API compatibility
export async function getConfig() {
    const settings = await getScheduleSettings();
    return {
        enabled: settings.enabled,
        cronExpression: settingsToCron(settings),
        lastRun: settings.lastRun
    };
}

export { getScheduleSettings as getSettings };
