import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Load full automation settings and stats
export async function GET(req: NextRequest) {
    console.log('========================================');
    console.log('[full-automation API] GET request received');
    console.log('[full-automation API] Timestamp:', new Date().toISOString());

    try {
        // Step 1: Get enabled status from site_settings
        console.log('[full-automation API] Step 1: Fetching enabled status...');
        const { data: enabledData, error: enabledError } = await supabaseAdmin
            .from('site_settings')
            .select('value')
            .eq('key', 'full_automation_enabled')
            .single();

        if (enabledError) {
            console.log('[full-automation API] Step 1 Error:', enabledError.message);
            // If not found, return default (disabled)
            if (enabledError.code === 'PGRST116') {
                console.log('[full-automation API] Setting not found, returning default');
                return NextResponse.json({
                    enabled: false,
                    lastRun: null,
                    todayStats: { processed: 0, published: 0, held: 0 }
                });
            }
            throw enabledError;
        }

        const enabled = enabledData?.value === 'true' || enabledData?.value === true;
        console.log('[full-automation API] Step 1 Result: enabled =', enabled);

        // Step 2: Get last run info
        console.log('[full-automation API] Step 2: Fetching last run info...');
        const { data: lastRunData, error: lastRunError } = await supabaseAdmin
            .from('site_settings')
            .select('value')
            .eq('key', 'full_automation_last_run')
            .single();

        if (lastRunError && lastRunError.code !== 'PGRST116') {
            console.log('[full-automation API] Step 2 Error:', lastRunError.message);
        }

        const lastRun = lastRunData?.value || null;
        console.log('[full-automation API] Step 2 Result:', lastRun);

        // Step 3: Get today's stats from automation_logs
        console.log('[full-automation API] Step 3: Fetching today stats...');
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: todayLogs, error: logsError } = await supabaseAdmin
            .from('automation_logs')
            .select('articles_processed, articles_published, articles_held')
            .gte('started_at', todayStart.toISOString());

        if (logsError) {
            console.log('[full-automation API] Step 3 Error:', logsError.message);
            // Table might not exist yet
        }

        const todayStats = {
            processed: todayLogs?.reduce((sum, log) => sum + (log.articles_processed || 0), 0) || 0,
            published: todayLogs?.reduce((sum, log) => sum + (log.articles_published || 0), 0) || 0,
            held: todayLogs?.reduce((sum, log) => sum + (log.articles_held || 0), 0) || 0,
        };
        console.log('[full-automation API] Step 3 Result:', todayStats);

        console.log('[full-automation API] GET Success');
        console.log('========================================');

        return NextResponse.json({
            enabled,
            lastRun,
            todayStats
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[full-automation API] GET Error:', errorMessage);
        console.log('========================================');

        return NextResponse.json(
            { error: 'Failed to load automation settings', details: errorMessage },
            { status: 500 }
        );
    }
}

// POST: Toggle full automation enabled/disabled
export async function POST(req: NextRequest) {
    console.log('========================================');
    console.log('[full-automation API] POST request received');
    console.log('[full-automation API] Timestamp:', new Date().toISOString());

    try {
        // Step 1: Parse request body
        console.log('[full-automation API] Step 1: Parsing request body...');
        const body = await req.json();
        console.log('[full-automation API] Step 1 Result:', body);

        const { enabled } = body;

        if (typeof enabled !== 'boolean') {
            console.log('[full-automation API] Error: enabled must be boolean');
            return NextResponse.json(
                { error: 'enabled must be a boolean' },
                { status: 400 }
            );
        }

        // Step 2: Upsert the setting
        console.log('[full-automation API] Step 2: Upserting site_settings...');
        console.log('[full-automation API] Setting full_automation_enabled to:', enabled);

        const { error: upsertError } = await supabaseAdmin
            .from('site_settings')
            .upsert({
                key: 'full_automation_enabled',
                value: String(enabled),
                description: 'Full automation master switch - true/false',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'key'
            });

        if (upsertError) {
            console.error('[full-automation API] Step 2 Error:', upsertError.message);
            throw upsertError;
        }

        console.log('[full-automation API] Step 2 Success: Setting saved');

        // Step 3: Verify the setting was saved
        console.log('[full-automation API] Step 3: Verifying saved setting...');
        const { data: verifyData, error: verifyError } = await supabaseAdmin
            .from('site_settings')
            .select('value')
            .eq('key', 'full_automation_enabled')
            .single();

        if (verifyError) {
            console.error('[full-automation API] Step 3 Error:', verifyError.message);
        } else {
            console.log('[full-automation API] Step 3 Verified value:', verifyData?.value);
        }

        console.log('[full-automation API] POST Success');
        console.log('========================================');

        return NextResponse.json({
            success: true,
            enabled,
            message: enabled ? 'Full automation enabled' : 'Full automation disabled'
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[full-automation API] POST Error:', errorMessage);
        console.log('========================================');

        return NextResponse.json(
            { success: false, error: 'Failed to save automation settings', details: errorMessage },
            { status: 500 }
        );
    }
}
