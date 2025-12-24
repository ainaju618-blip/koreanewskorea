import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ScheduleSettings {
    enabled: boolean;
    startHour: number;  // e.g., 9 for 09:00
    endHour: number;    // e.g., 20 for 20:00
    intervalMinutes: number;  // e.g., 60 for every hour
    runOnMinute: number;  // e.g., 30 for XX:30
}

// GET: Load schedule settings
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('site_settings')
            .select('value')
            .eq('key', 'automation_schedule')
            .single();

        if (error && error.code === 'PGRST116') {
            // Not found, return defaults
            return NextResponse.json({
                enabled: false,
                startHour: 9,
                endHour: 20,
                intervalMinutes: 60,
                runOnMinute: 30
            });
        }

        if (error) throw error;

        const settings = JSON.parse(data.value);
        return NextResponse.json(settings);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[automation-schedule] GET Error:', errorMessage);
        return NextResponse.json(
            { error: 'Failed to load schedule settings' },
            { status: 500 }
        );
    }
}

// POST: Save schedule settings
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const settings: ScheduleSettings = {
            enabled: body.enabled ?? false,
            startHour: body.startHour ?? 9,
            endHour: body.endHour ?? 20,
            intervalMinutes: body.intervalMinutes ?? 60,
            runOnMinute: body.runOnMinute ?? 30
        };

        // Validate
        if (settings.startHour < 0 || settings.startHour > 23) {
            return NextResponse.json({ error: 'Invalid startHour' }, { status: 400 });
        }
        if (settings.endHour < 0 || settings.endHour > 23) {
            return NextResponse.json({ error: 'Invalid endHour' }, { status: 400 });
        }
        if (settings.intervalMinutes < 30 || settings.intervalMinutes > 240) {
            return NextResponse.json({ error: 'Interval must be 30-240 minutes' }, { status: 400 });
        }
        if (settings.runOnMinute < 0 || settings.runOnMinute > 59) {
            return NextResponse.json({ error: 'Invalid runOnMinute' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('site_settings')
            .upsert({
                key: 'automation_schedule',
                value: JSON.stringify(settings),
                description: 'Local automation schedule settings',
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) throw error;

        return NextResponse.json({ success: true, settings });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[automation-schedule] POST Error:', errorMessage);
        return NextResponse.json(
            { error: 'Failed to save schedule settings' },
            { status: 500 }
        );
    }
}
