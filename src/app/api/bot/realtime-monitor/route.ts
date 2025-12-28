import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Track the running Python process
let monitorProcess: ChildProcess | null = null;

// Check if running locally (not on Vercel)
const isLocalEnv = !process.env.VERCEL && !process.env.VERCEL_ENV;

/**
 * Start the Python light_monitor.py script
 * Only works in local environment (not on Vercel)
 */
function startMonitorProcess(): { success: boolean; pid?: number; error?: string } {
    if (!isLocalEnv) {
        return {
            success: false,
            error: 'Python execution only available in local environment'
        };
    }

    // If already running, don't start another
    if (monitorProcess && !monitorProcess.killed) {
        return {
            success: true,
            pid: monitorProcess.pid,
            error: 'Monitor already running'
        };
    }

    try {
        // Validate required environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('[Monitor] Missing required environment variables');
            return {
                success: false,
                error: 'Missing Supabase credentials in environment'
            };
        }

        // Path to light_monitor.py
        const scriptPath = path.join(process.cwd(), 'scrapers', 'utils', 'light_monitor.py');

        console.log('[Monitor] Starting Python process:', scriptPath);
        console.log('[Monitor] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');

        // Spawn Python process in background
        // Explicitly pass Supabase credentials for detached process
        monitorProcess = spawn('python', [scriptPath, '--daemon'], {
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            cwd: process.cwd(),
            env: {
                ...process.env,
                PYTHONUNBUFFERED: '1',
                // Explicitly pass critical env vars for detached process on Windows
                NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
                SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
            }
        });

        // Log output
        monitorProcess.stdout?.on('data', (data) => {
            console.log(`[Monitor] ${data.toString().trim()}`);
        });

        monitorProcess.stderr?.on('data', (data) => {
            console.error(`[Monitor Error] ${data.toString().trim()}`);
        });

        monitorProcess.on('exit', (code) => {
            console.log(`[Monitor] Process exited with code ${code}`);
            monitorProcess = null;
        });

        // Don't wait for the process
        monitorProcess.unref();

        console.log(`[Monitor] Process started with PID: ${monitorProcess.pid}`);

        return { success: true, pid: monitorProcess.pid };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Monitor] Failed to start:', message);
        return { success: false, error: message };
    }
}

/**
 * Stop the running Python monitor process
 */
function stopMonitorProcess(): { success: boolean; error?: string } {
    if (!monitorProcess) {
        return { success: true, error: 'No process running' };
    }

    try {
        // Send SIGTERM to gracefully stop
        monitorProcess.kill('SIGTERM');
        monitorProcess = null;
        console.log('[Monitor] Process stopped');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Monitor] Failed to stop:', message);
        return { success: false, error: message };
    }
}

// GET: Get current monitor status and recent activity
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const includeActivity = searchParams.get('activity') === 'true';
        const activityLimit = parseInt(searchParams.get('limit') || '50');

        // Get monitor status
        const { data: status, error: statusError } = await supabase
            .from('realtime_monitor')
            .select('*')
            .single();

        if (statusError && statusError.code !== 'PGRST116') {
            throw statusError;
        }

        // Get recent activity if requested
        let activity = null;
        if (includeActivity) {
            const { data: activityData, error: activityError } = await supabase
                .from('monitor_activity_log')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(activityLimit);

            if (!activityError) {
                activity = activityData;
            }
        }

        // Get region stats
        const { data: regionStats, error: regionError } = await supabase
            .from('scraper_state')
            .select('region_code, last_check_at, last_article_at, total_articles');

        // Get block status from recent activity
        const { data: blockEvents } = await supabase
            .from('monitor_activity_log')
            .select('region_code, created_at, details')
            .eq('event_type', 'block')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false });

        // Get today's stats
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: todayStats } = await supabase
            .from('monitor_activity_log')
            .select('event_type')
            .gte('created_at', todayStart.toISOString());

        const todaySummary = {
            checks: todayStats?.filter(e => e.event_type === 'check').length || 0,
            newArticles: todayStats?.filter(e => e.event_type === 'new_article').length || 0,
            scrapes: todayStats?.filter(e => e.event_type === 'scrape').length || 0,
            blocks: todayStats?.filter(e => e.event_type === 'block').length || 0,
            errors: todayStats?.filter(e => e.event_type === 'error').length || 0,
        };

        return NextResponse.json({
            status: status || { is_running: false },
            regions: regionStats || [],
            blockedRegions: blockEvents?.map(e => e.region_code) || [],
            todaySummary,
            activity: activity || [],
        });

    } catch (error: unknown) {
        console.error('Monitor status error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST: Toggle monitor on/off or update config
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, config, startedBy } = body;

        if (action === 'start') {
            // Start Python monitor process (local only)
            const processResult = startMonitorProcess();

            // Update DB status
            const { data, error } = await supabase
                .from('realtime_monitor')
                .update({
                    is_running: true,
                    started_at: new Date().toISOString(),
                    stopped_at: null,
                    started_by: startedBy || 'admin',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', (await supabase.from('realtime_monitor').select('id').single()).data?.id)
                .select()
                .single();

            if (error) throw error;

            // Log activity
            await supabase.from('monitor_activity_log').insert({
                event_type: 'start',
                message: '모니터링이 시작되었습니다',
                details: {
                    started_by: startedBy,
                    pid: processResult.pid,
                    local_env: isLocalEnv,
                    process_started: processResult.success,
                },
            });

            return NextResponse.json({
                success: true,
                status: data,
                process: processResult,
                isLocalEnv,
            });

        } else if (action === 'stop') {
            // Stop Python monitor process
            const processResult = stopMonitorProcess();

            // Update DB status
            const { data, error } = await supabase
                .from('realtime_monitor')
                .update({
                    is_running: false,
                    stopped_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', (await supabase.from('realtime_monitor').select('id').single()).data?.id)
                .select()
                .single();

            if (error) throw error;

            // Log activity
            await supabase.from('monitor_activity_log').insert({
                event_type: 'stop',
                message: '모니터링이 중지되었습니다',
                details: {
                    process_stopped: processResult.success,
                },
            });

            return NextResponse.json({
                success: true,
                status: data,
                process: processResult,
            });

        } else if (action === 'update_config') {
            // Update config
            const { data, error } = await supabase
                .from('realtime_monitor')
                .update({
                    config: config,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', (await supabase.from('realtime_monitor').select('id').single()).data?.id)
                .select()
                .single();

            if (error) throw error;

            return NextResponse.json({ success: true, status: data });

        } else if (action === 'check_now') {
            // Trigger immediate check by logging a special event
            // The Python daemon will detect this and run immediately
            await supabase.from('monitor_activity_log').insert({
                event_type: 'trigger',
                message: '즉시 점검 요청됨 (수동)',
                details: { triggered_by: startedBy || 'admin', trigger_type: 'manual' },
            });

            // Also set a flag in realtime_monitor to trigger immediate check
            const { data: currentStatus } = await supabase
                .from('realtime_monitor')
                .select('id, config')
                .single();

            if (currentStatus) {
                await supabase
                    .from('realtime_monitor')
                    .update({
                        config: {
                            ...(currentStatus.config || {}),
                            force_check: true,
                            force_check_at: new Date().toISOString(),
                        },
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', currentStatus.id);
            }

            return NextResponse.json({ success: true, message: 'Immediate check triggered' });

        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error: unknown) {
        console.error('Monitor control error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE: Clear activity logs
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const olderThanDays = parseInt(searchParams.get('days') || '7');

        const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

        const { error } = await supabase
            .from('monitor_activity_log')
            .delete()
            .lt('created_at', cutoff.toISOString());

        if (error) throw error;

        return NextResponse.json({ success: true, message: `Deleted logs older than ${olderThanDays} days` });

    } catch (error: unknown) {
        console.error('Clear logs error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
