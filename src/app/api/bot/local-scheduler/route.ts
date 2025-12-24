import { NextRequest, NextResponse } from 'next/server';
import { getScheduleSettings, updateScheduler } from '@/lib/scheduler';

// Track scheduler state (node-cron runs in-process)
let schedulerInitialized = false;

// GET: Check scheduler status
export async function GET() {
    try {
        const settings = await getScheduleSettings();

        return NextResponse.json({
            running: settings.enabled && schedulerInitialized,
            enabled: settings.enabled,
            settings: {
                startHour: settings.startHour,
                endHour: settings.endHour,
                intervalMinutes: settings.intervalMinutes,
                runOnMinute: settings.runOnMinute,
                lastRun: settings.lastRun
            },
            message: settings.enabled
                ? (schedulerInitialized ? 'Scheduler is running' : 'Scheduler enabled but not initialized (restart server)')
                : 'Scheduler is disabled'
        });
    } catch (error) {
        console.error('[local-scheduler] GET error:', error);
        return NextResponse.json(
            { error: 'Failed to check scheduler status' },
            { status: 500 }
        );
    }
}

// POST: Reload scheduler (re-read settings from DB)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { action } = body;

        if (action === 'reload' || action === 'start') {
            // Reload scheduler with current DB settings
            await updateScheduler();
            schedulerInitialized = true;

            const settings = await getScheduleSettings();

            return NextResponse.json({
                success: true,
                running: settings.enabled,
                message: settings.enabled
                    ? 'Scheduler reloaded and running'
                    : 'Scheduler reloaded but disabled in settings'
            });

        } else if (action === 'stop') {
            // Note: This doesn't actually stop the cron job permanently
            // It just marks it as not initialized for status reporting
            // The actual cron is controlled by the enabled setting in DB
            schedulerInitialized = false;

            return NextResponse.json({
                success: true,
                running: false,
                message: 'Scheduler marked as stopped. Change enabled setting in DB to permanently disable.'
            });

        } else {
            // Default: reload
            await updateScheduler();
            schedulerInitialized = true;

            const settings = await getScheduleSettings();

            return NextResponse.json({
                success: true,
                running: settings.enabled,
                message: 'Scheduler updated with current settings'
            });
        }

    } catch (error) {
        console.error('[local-scheduler] POST error:', error);
        return NextResponse.json(
            { error: 'Failed to control scheduler' },
            { status: 500 }
        );
    }
}

// Note: schedulerInitialized is set to true when updateScheduler is called via POST
