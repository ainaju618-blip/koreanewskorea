import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { autoAssignReporter } from '@/lib/auto-assign';

/**
 * POST /api/admin/bulk-assign-authors
 * Bulk assign authors to articles that don't have author_id set
 * This fixes the author page showing 0 articles issue
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const limit = body.limit || 100; // Process in batches
        const dryRun = body.dryRun === true; // Preview mode

        // 1. Get articles without author_id
        const { data: articles, error: fetchError } = await supabaseAdmin
            .from('posts')
            .select('id, region, title, author_id, author_name')
            .eq('status', 'published')
            .is('author_id', null)
            .order('published_at', { ascending: false })
            .limit(limit);

        if (fetchError) {
            console.error('[Bulk Assign] Fetch error:', fetchError);
            return NextResponse.json({
                success: false,
                message: 'Failed to fetch articles'
            }, { status: 500 });
        }

        if (!articles || articles.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No articles need author assignment',
                stats: { total: 0, assigned: 0, failed: 0 }
            });
        }

        console.log(`[Bulk Assign] Found ${articles.length} articles without author_id`);

        // 2. Group articles by region for efficient assignment
        const regionGroups: Record<string, typeof articles> = {};
        for (const article of articles) {
            const region = article.region || 'unknown';
            if (!regionGroups[region]) {
                regionGroups[region] = [];
            }
            regionGroups[region].push(article);
        }

        // 3. Assign reporters by region
        const results: {
            articleId: string;
            title: string;
            region: string;
            assignedTo: string | null;
            authorId: string | null;
            error?: string;
        }[] = [];

        let assigned = 0;
        let failed = 0;

        for (const [region, regionArticles] of Object.entries(regionGroups)) {
            // Get a reporter for this region
            const assignResult = await autoAssignReporter(region === 'unknown' ? null : region);

            if (!assignResult || !assignResult.reporter) {
                // No reporter found for this region
                for (const article of regionArticles) {
                    results.push({
                        articleId: article.id,
                        title: article.title,
                        region,
                        assignedTo: null,
                        authorId: null,
                        error: 'No reporter found for region'
                    });
                    failed++;
                }
                continue;
            }

            const reporter = assignResult.reporter;

            // Verify reporter's user_id exists in profiles
            let authorId: string | null = null;
            if (reporter.user_id) {
                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('id', reporter.user_id)
                    .single();

                if (profile) {
                    authorId = reporter.user_id;
                }
            }

            // Update articles in this region
            for (const article of regionArticles) {
                if (dryRun) {
                    // Preview mode - don't actually update
                    results.push({
                        articleId: article.id,
                        title: article.title,
                        region,
                        assignedTo: reporter.name,
                        authorId
                    });
                    assigned++;
                } else {
                    // Actually update the article
                    const updateData: { author_name: string; author_id?: string } = {
                        author_name: reporter.name
                    };
                    if (authorId) {
                        updateData.author_id = authorId;
                    }

                    const { error: updateError } = await supabaseAdmin
                        .from('posts')
                        .update(updateData)
                        .eq('id', article.id);

                    if (updateError) {
                        results.push({
                            articleId: article.id,
                            title: article.title,
                            region,
                            assignedTo: null,
                            authorId: null,
                            error: updateError.message
                        });
                        failed++;
                    } else {
                        results.push({
                            articleId: article.id,
                            title: article.title,
                            region,
                            assignedTo: reporter.name,
                            authorId
                        });
                        assigned++;
                    }
                }
            }
        }

        console.log(`[Bulk Assign] Complete: ${assigned} assigned, ${failed} failed`);

        return NextResponse.json({
            success: true,
            message: dryRun
                ? `Preview: Would assign ${assigned} articles`
                : `Assigned authors to ${assigned} articles`,
            stats: {
                total: articles.length,
                assigned,
                failed
            },
            results: results.slice(0, 20), // Return first 20 for preview
            dryRun
        });

    } catch (error: unknown) {
        console.error('[Bulk Assign] Error:', error);
        const message = error instanceof Error ? error.message : 'Server error';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}

/**
 * GET /api/admin/bulk-assign-authors
 * Get stats about articles needing author assignment
 */
export async function GET() {
    try {
        // Count articles without author_id
        const { count: noAuthorCount, error: countError } = await supabaseAdmin
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'published')
            .is('author_id', null);

        if (countError) {
            return NextResponse.json({
                success: false,
                message: 'Failed to count articles'
            }, { status: 500 });
        }

        // Get region breakdown
        const { data: regionStats } = await supabaseAdmin
            .from('posts')
            .select('region')
            .eq('status', 'published')
            .is('author_id', null);

        const regionCounts: Record<string, number> = {};
        if (regionStats) {
            for (const article of regionStats) {
                const region = article.region || 'unknown';
                regionCounts[region] = (regionCounts[region] || 0) + 1;
            }
        }

        return NextResponse.json({
            success: true,
            stats: {
                articlesWithoutAuthor: noAuthorCount || 0,
                byRegion: regionCounts
            }
        });

    } catch (error: unknown) {
        console.error('[Bulk Assign] GET Error:', error);
        const message = error instanceof Error ? error.message : 'Server error';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
