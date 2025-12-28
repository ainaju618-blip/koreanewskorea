import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/bot/reset-all
 * Full schedule system initialization:
 * 1. Stop scheduler and reset enabled status
 * 2. Reset schedule settings to defaults
 * 3. Reset running bot_logs to failed
 * 4. Clear any pending automation state
 */
export async function POST() {
    const results: {
        scheduler: boolean;
        settings: boolean;
        automation: boolean;
        botLogs: { success: boolean; count: number };
    } = {
        scheduler: false,
        settings: false,
        automation: false,
        botLogs: { success: false, count: 0 }
    };

    try {
        // 1. Reset schedule settings to defaults
        const defaultSettings = {
            enabled: false,
            startHour: 9,
            endHour: 20,
            intervalMinutes: 60,
            runOnMinute: 30
        };

        const { error: settingsError } = await supabaseAdmin
            .from('site_settings')
            .upsert({
                key: 'automation_schedule',
                value: JSON.stringify(defaultSettings),
                description: 'Local automation schedule settings',
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (!settingsError) {
            results.settings = true;
            console.log('[Reset-All] Schedule settings reset to defaults');
        } else {
            console.error('[Reset-All] Failed to reset settings:', settingsError);
        }

        // 2. Reset full-automation enabled status
        const { error: automationError } = await supabaseAdmin
            .from('site_settings')
            .upsert({
                key: 'full_automation_enabled',
                value: JSON.stringify({ enabled: false }),
                description: 'Full automation enabled status',
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (!automationError) {
            results.automation = true;
            console.log('[Reset-All] Automation disabled');
        } else {
            console.error('[Reset-All] Failed to disable automation:', automationError);
        }

        // 3. Reset running bot_logs to failed
        const { data: runningLogs, error: fetchError } = await supabaseAdmin
            .from('bot_logs')
            .select('id, region')
            .eq('status', 'running');

        if (!fetchError && runningLogs && runningLogs.length > 0) {
            let resetCount = 0;
            for (const log of runningLogs) {
                const { error: updateError } = await supabaseAdmin
                    .from('bot_logs')
                    .update({
                        status: 'failed',
                        log_message: '[Force reset by full initialization]'
                    })
                    .eq('id', log.id);

                if (!updateError) {
                    resetCount++;
                    console.log(`[Reset-All] Bot log ${log.region} (ID: ${log.id}) -> failed`);
                }
            }
            results.botLogs = { success: true, count: resetCount };
        } else {
            results.botLogs = { success: true, count: 0 };
        }

        // 4. Notify scheduler to reload (will pick up disabled state)
        try {
            // Call the local-scheduler API to stop
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            await fetch(`${baseUrl}/api/bot/local-scheduler`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop' })
            });
            results.scheduler = true;
            console.log('[Reset-All] Scheduler stopped');
        } catch (schedError) {
            console.error('[Reset-All] Failed to stop scheduler:', schedError);
            // Not critical, continue
        }

        const allSuccess = results.settings && results.automation && results.botLogs.success;

        return NextResponse.json({
            success: allSuccess,
            message: allSuccess
                ? 'All schedule settings initialized successfully'
                : 'Partial initialization completed',
            results: {
                scheduler: results.scheduler ? 'Stopped' : 'Failed to stop',
                settings: results.settings ? 'Reset to defaults' : 'Failed',
                automation: results.automation ? 'Disabled' : 'Failed',
                botLogs: results.botLogs.success
                    ? `${results.botLogs.count} running logs reset`
                    : 'Failed'
            }
        });

    } catch (error) {
        console.error('[Reset-All] Error:', error);
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
            results
        }, { status: 500 });
    }
}
