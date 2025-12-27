/**
 * Workflow Monitoring Script
 * - Check article status
 * - Check job logs
 * - Monitor AI processing status
 *
 * Usage: node tools/monitor_workflow.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function monitor() {
    console.log('='.repeat(60));
    console.log('KOREA NEWS WORKFLOW MONITOR');
    console.log('Time:', new Date().toLocaleString('ko-KR'));
    console.log('='.repeat(60));

    // 1. Article Status Summary
    console.log('\n[1] ARTICLE STATUS SUMMARY');
    console.log('-'.repeat(40));

    const { count: publishedCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

    const { count: draftCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

    const { count: pendingCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    console.log(`  Published: ${publishedCount || 0}`);
    console.log(`  Draft:     ${draftCount || 0}`);
    console.log(`  Pending:   ${pendingCount || 0}`);

    // 2. AI Processing Status
    console.log('\n[2] AI PROCESSING STATUS');
    console.log('-'.repeat(40));

    const { count: aiProcessed } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('ai_processed', true);

    const { count: aiPending } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .or('ai_processed.is.null,ai_processed.eq.false');

    const { count: gradeA } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('ai_validation_grade', 'A');

    const { count: gradeB } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('ai_validation_grade', 'B');

    const { count: gradeC } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('ai_validation_grade', 'C');

    const { count: gradeD } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('ai_validation_grade', 'D');

    console.log(`  AI Processed:  ${aiProcessed || 0}`);
    console.log(`  AI Pending:    ${aiPending || 0}`);
    console.log(`  Grade A:       ${gradeA || 0}`);
    console.log(`  Grade B:       ${gradeB || 0}`);
    console.log(`  Grade C:       ${gradeC || 0}`);
    console.log(`  Grade D:       ${gradeD || 0}`);

    // 3. Recent AI Processed Articles
    console.log('\n[3] RECENT AI PROCESSED (Last 10)');
    console.log('-'.repeat(40));

    const { data: recentAI } = await supabase
        .from('posts')
        .select('id, title, region, ai_validation_grade, ai_processed_at, status')
        .eq('ai_processed', true)
        .order('ai_processed_at', { ascending: false })
        .limit(10);

    if (recentAI && recentAI.length > 0) {
        recentAI.forEach((r, i) => {
            const time = r.ai_processed_at
                ? new Date(r.ai_processed_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                : 'N/A';
            const title = (r.title || 'No title').slice(0, 25);
            console.log(`  ${i+1}. [${r.ai_validation_grade || '-'}] ${r.region}: ${title}... (${time}) -> ${r.status}`);
        });
    } else {
        console.log('  No AI processed articles found');
    }

    // 4. Job Logs (if table exists)
    console.log('\n[4] RECENT JOB LOGS');
    console.log('-'.repeat(40));

    try {
        const { data: logs, error } = await supabase
            .from('job_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.log('  Job logs table not available:', error.message);
        } else if (logs && logs.length > 0) {
            logs.forEach((log, i) => {
                const time = new Date(log.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                console.log(`  ${i+1}. [${time}] ${log.job_type}: ${log.status} - ${log.message || ''}`);
            });
        } else {
            console.log('  No job logs found');
        }
    } catch (e) {
        console.log('  Job logs check failed:', e.message);
    }

    // 5. Pending for AI Processing (need attention)
    console.log('\n[5] WAITING FOR AI PROCESSING');
    console.log('-'.repeat(40));

    const { data: waitingAI } = await supabase
        .from('posts')
        .select('id, title, region, created_at')
        .eq('status', 'draft')
        .or('ai_processed.is.null,ai_processed.eq.false')
        .order('created_at', { ascending: true })
        .limit(5);

    if (waitingAI && waitingAI.length > 0) {
        console.log(`  ${waitingAI.length} articles waiting:`);
        waitingAI.forEach((w, i) => {
            const time = new Date(w.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            console.log(`  ${i+1}. ${w.region}: ${(w.title || 'No title').slice(0, 30)}... (${time})`);
        });
    } else {
        console.log('  No articles waiting for AI processing');
    }

    // 6. Failed Articles (C/D grade, need retry)
    console.log('\n[6] FAILED ARTICLES (Need Retry)');
    console.log('-'.repeat(40));

    const { data: failed } = await supabase
        .from('posts')
        .select('id, title, region, ai_validation_grade, ai_processed_at')
        .eq('status', 'draft')
        .eq('ai_processed', true)
        .in('ai_validation_grade', ['C', 'D'])
        .order('ai_processed_at', { ascending: false })
        .limit(5);

    if (failed && failed.length > 0) {
        console.log(`  ${failed.length} articles need retry:`);
        failed.forEach((f, i) => {
            console.log(`  ${i+1}. [${f.ai_validation_grade}] ${f.region}: ${(f.title || 'No title').slice(0, 30)}...`);
        });
    } else {
        console.log('  No failed articles (all passed or pending)');
    }

    console.log('\n' + '='.repeat(60));
    console.log('MONITOR COMPLETE');
    console.log('='.repeat(60));
}

monitor().catch(console.error);
