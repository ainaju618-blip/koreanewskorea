import { NextResponse } from 'next/server';

/**
 * GitHub Actions Usage & Status API
 * Returns workflow run history and usage statistics
 */
export async function GET() {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER || 'korea-news';
    const repo = process.env.GITHUB_REPO || 'koreanewsone';

    if (!token) {
        return NextResponse.json({
            error: 'GITHUB_TOKEN not configured',
            runs: [],
            usage: null
        });
    }

    try {
        // Get recent workflow runs
        const runsResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=10`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                },
                next: { revalidate: 60 } // 1 minute cache
            }
        );

        let runs: any[] = [];
        let totalRuns = 0;

        if (runsResponse.ok) {
            const runsData = await runsResponse.json();
            runs = runsData.workflow_runs?.map((run: any) => ({
                id: run.id,
                name: run.name,
                status: run.status,
                conclusion: run.conclusion,
                created_at: run.created_at,
                updated_at: run.updated_at,
                run_started_at: run.run_started_at,
                html_url: run.html_url,
                event: run.event,
                run_number: run.run_number
            })) || [];
            totalRuns = runsData.total_count || 0;
        }

        // Get billing/usage for the current month (only works for orgs or enterprise)
        // For personal repos, we estimate based on run history
        let usage = {
            total_minutes_used: 0,
            included_minutes: 2000, // Free tier for private repos
            used_this_month: 0,
            remaining: 2000
        };

        // Calculate estimated usage from recent runs
        // Average scraper run takes about 2-5 minutes
        const thisMonth = new Date().toISOString().slice(0, 7);
        const monthlyRuns = runs.filter(run =>
            run.created_at?.startsWith(thisMonth) &&
            run.conclusion === 'success'
        );

        // Estimate 3 minutes per successful run
        const estimatedMinutes = monthlyRuns.length * 3;
        usage.used_this_month = estimatedMinutes;
        usage.total_minutes_used = estimatedMinutes;
        usage.remaining = Math.max(0, usage.included_minutes - estimatedMinutes);

        // Get success/failure stats
        const successRuns = runs.filter(r => r.conclusion === 'success').length;
        const failedRuns = runs.filter(r => r.conclusion === 'failure').length;
        const inProgressRuns = runs.filter(r => r.status === 'in_progress').length;

        return NextResponse.json({
            runs,
            totalRuns,
            usage,
            stats: {
                success: successRuns,
                failed: failedRuns,
                inProgress: inProgressRuns,
                total: runs.length
            },
            config: {
                owner,
                repo,
                hasToken: true
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[GitHub Actions API Error]', error);
        return NextResponse.json({
            error: error.message,
            runs: [],
            usage: null
        }, { status: 500 });
    }
}
