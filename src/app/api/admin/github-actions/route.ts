import { NextRequest, NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
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

        // Fetch workflow file content to get schedule
        const workflowResponse = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/.github/workflows/${WORKFLOW_FILE}`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
                next: { revalidate: 300 }
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

        return NextResponse.json({
            schedules,
            runs,
            jobStats,
            workflowUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}`,
        });

    } catch (error: any) {
        console.error('[GitHub Actions API] Error:', error);
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
