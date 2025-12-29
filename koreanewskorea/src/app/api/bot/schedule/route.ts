
import { NextRequest, NextResponse } from 'next/server';
import { getConfig, getScheduleSettings, updateScheduler } from '@/lib/scheduler';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Return current schedule config (for backward compatibility)
export async function GET() {
    try {
        const config = await getConfig();
        return NextResponse.json(config);
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return NextResponse.json({ message: 'Failed to load settings', error: errorMessage }, { status: 500 });
    }
}

// POST: Update schedule settings (for backward compatibility)
// Note: Use /api/bot/automation-schedule for full settings control
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Support both old format (cronExpression) and new format (settings object)
        if (body.cronExpression) {
            // Old format - convert to new format (approximate)
            // This is for backward compatibility only
            const settings = await getScheduleSettings();
            settings.enabled = body.enabled ?? settings.enabled;

            const { error } = await supabaseAdmin
                .from('site_settings')
                .upsert({
                    key: 'automation_schedule',
                    value: JSON.stringify(settings),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (error) throw error;

        } else {
            // New format - full settings
            const settings = {
                enabled: body.enabled ?? false,
                startHour: body.startHour ?? 9,
                endHour: body.endHour ?? 20,
                intervalMinutes: body.intervalMinutes ?? 60,
                runOnMinute: body.runOnMinute ?? 30
            };

            const { error } = await supabaseAdmin
                .from('site_settings')
                .upsert({
                    key: 'automation_schedule',
                    value: JSON.stringify(settings),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (error) throw error;
        }

        // Update the running scheduler
        await updateScheduler();

        return NextResponse.json({ success: true, config: await getConfig() });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}
