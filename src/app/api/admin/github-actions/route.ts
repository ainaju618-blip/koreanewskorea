import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Supabase client for bot logs
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const REPO_OWNER = 'korea-news';
const REPO_NAME = 'koreanewsone';
const WORKFLOW_FILE = 'daily_scrape.yml';

interface WorkflowRun {
    id: number;
    status: string;
    conclusion: string | null;
    created_at: string;
    updated_at: string;
    event: string;
    html_url: string;
}

// GET: Fetch workflow runs and schedule info
export async function GET(req: NextRequest) {
    if (!GITHUB_TOKEN) {
        return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
    }

    try {
        // Fetch recent workflow runs
        const runsResponse = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=10`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
                next: { revalidate: 60 }
            }
        );

        if (!runsResponse.ok) {
            throw new Error(`GitHub API error: ${runsResponse.status}`);
        }

        const runsData = await runsResponse.json();

        // Fetch workflow file content to get schedule (no cache for fresh data after save)
        const workflowResponse = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/.github/workflows/${WORKFLOW_FILE}`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
                cache: 'no-store'
            }
        );

        let schedules: string[] = [];
        if (workflowResponse.ok) {
            const workflowData = await workflowResponse.json();
            const content = Buffer.from(workflowData.content, 'base64').toString('utf-8');

            const cronMatches = content.match(/cron:\s*'([^']+)'/g);
            if (cronMatches) {
                schedules = cronMatches.map(match => {
                    const cronMatch = match.match(/cron:\s*'([^']+)'/);
                    return cronMatch ? cronMatch[1] : '';
                }).filter(Boolean);
            }
        }

        const runs = runsData.workflow_runs?.map((run: WorkflowRun) => ({
            id: run.id,
            status: run.status,
            conclusion: run.conclusion,
            createdAt: run.created_at,
            updatedAt: run.updated_at,
            event: run.event,
            url: run.html_url,
        })) || [];

        // Fetch jobs for the latest run to get detailed progress
        let jobStats = { total: 0, completed: 0, in_progress: 0, queued: 0, failed: 0 };
        if (runs.length > 0 && (runs[0].status === 'queued' || runs[0].status === 'in_progress')) {
            const jobsResponse = await fetch(
                `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runs[0].id}/jobs`,
                {
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json',
                    },
                    cache: 'no-store'
                }
            );

            if (jobsResponse.ok) {
                const jobsData = await jobsResponse.json();
                const jobs = jobsData.jobs || [];
                // Filter out scrape-single job (it's skipped when running all)
                const scrapeJobs = jobs.filter((j: any) => j.name !== 'scrape-single');
                jobStats.total = scrapeJobs.length;
                jobStats.completed = scrapeJobs.filter((j: any) => j.status === 'completed' && j.conclusion === 'success').length;
                jobStats.failed = scrapeJobs.filter((j: any) => j.status === 'completed' && j.conclusion === 'failure').length;
                jobStats.in_progress = scrapeJobs.filter((j: any) => j.status === 'in_progress').length;
                jobStats.queued = scrapeJobs.filter((j: any) => j.status === 'queued').length;
            }
        }

        // Fetch recent bot logs (last 10, optimized query)
        const { data: botLogs } = await supabaseAdmin
            .from('bot_logs')
            .select('id, region, status, articles_count, started_at, ended_at, metadata')
            .order('started_at', { ascending: false })
            .limit(10);

        return NextResponse.json({
            schedules,
            runs,
            jobStats,
            botLogs: botLogs || [],
            workflowUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}`,
        });

    } catch (error: any) {
        console.error('[GitHub Actions API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Update workflow schedules
export async function PUT(req: NextRequest) {
    if (!GITHUB_TOKEN) {
        return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { schedules } = body; // Array of KST times like ["05:20", "06:20", "12:30"]

        if (!Array.isArray(schedules)) {
            return NextResponse.json({ error: 'Schedules must be an array' }, { status: 400 });
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
        for (const time of schedules) {
            if (!timeRegex.test(time)) {
                return NextResponse.json({ error: `Invalid time format: ${time}. Use HH:MM` }, { status: 400 });
            }
        }

        // Fetch current workflow file to get SHA
        const workflowResponse = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/.github/workflows/${WORKFLOW_FILE}`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
                cache: 'no-store'
            }
        );

        if (!workflowResponse.ok) {
            throw new Error(`Failed to fetch workflow file: ${workflowResponse.status}`);
        }

        const workflowData = await workflowResponse.json();
        const currentContent = Buffer.from(workflowData.content, 'base64').toString('utf-8');
        const sha = workflowData.sha;

        // Convert KST times to UTC cron expressions
        const cronLines: string[] = [];
        const today = new Date().toISOString().split('T')[0];

        for (const time of schedules) {
            const [kstHour, kstMinute] = time.split(':').map(Number);
            // KST to UTC: subtract 9 hours
            let utcHour = kstHour - 9;
            if (utcHour < 0) utcHour += 24;

            const cronExpr = `${kstMinute} ${utcHour} * * *`;
            const comment = `# ${String(kstHour).padStart(2, '0')}:${String(kstMinute).padStart(2, '0')} KST (${String(utcHour).padStart(2, '0')}:${String(kstMinute).padStart(2, '0')} UTC)`;
            cronLines.push(`    ${comment}`);
            cronLines.push(`    - cron: '${cronExpr}'`);
        }

        // Build new schedule section
        let scheduleSection: string;
        if (schedules.length === 0) {
            // Empty schedule - comment out the schedule section
            scheduleSection = `on:
  # schedule: (disabled - no schedules configured)
  workflow_dispatch:`;
        } else {
            scheduleSection = `on:
  schedule:
    # Daily schedules - Updated ${today}
${cronLines.join('\n')}
  workflow_dispatch:`;
        }

        // Replace the schedule section in the workflow file
        // Pattern handles both active schedule and commented-out schedule
        const newContent = currentContent.replace(
            /on:\s*\n\s*(?:schedule:\s*\n[\s\S]*?|# schedule:.*\n\s*)workflow_dispatch:/,
            scheduleSection
        );

        // Update the file via GitHub API
        const updateResponse = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/.github/workflows/${WORKFLOW_FILE}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Update scraper schedule: ${schedules.join(', ')} KST`,
                    content: Buffer.from(newContent).toString('base64'),
                    sha: sha,
                    branch: 'master',
                }),
            }
        );

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Failed to update workflow: ${updateResponse.status} - ${errorText}`);
        }

        // VERIFICATION: Re-fetch the workflow file to confirm the save actually worked
        const verifyResponse = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/.github/workflows/${WORKFLOW_FILE}`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
                cache: 'no-store'
            }
        );

        if (!verifyResponse.ok) {
            throw new Error('Failed to verify save - could not re-fetch workflow file');
        }

        const verifyData = await verifyResponse.json();
        const verifiedContent = Buffer.from(verifyData.content, 'base64').toString('utf-8');

        // Check that all scheduled times are actually in the file
        const savedCrons: string[] = [];
        for (const time of schedules) {
            const [kstHour, kstMinute] = time.split(':').map(Number);
            let utcHour = kstHour - 9;
            if (utcHour < 0) utcHour += 24;
            const expectedCron = `${kstMinute} ${utcHour} * * *`;

            if (verifiedContent.includes(expectedCron)) {
                savedCrons.push(time);
            }
        }

        // If not all schedules were saved, throw error
        if (savedCrons.length !== schedules.length) {
            const missedSchedules = schedules.filter(t => !savedCrons.includes(t));
            throw new Error(`Verification failed: These times were not saved: ${missedSchedules.join(', ')}`);
        }

        return NextResponse.json({
            success: true,
            message: 'Schedule updated and verified successfully',
            schedules: schedules,
            verified: true
        });

    } catch (error: any) {
        console.error('[GitHub Actions API] Update schedule error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Trigger workflow dispatch
export async function POST(req: NextRequest) {
    if (!GITHUB_TOKEN) {
        return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { region = 'all', days = '1' } = body;

        const response = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ref: 'master',
                    inputs: {
                        region,
                        days: String(days),
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
        }

        return NextResponse.json({ success: true, message: 'Workflow triggered successfully' });

    } catch (error: any) {
        console.error('[GitHub Actions API] Trigger error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
