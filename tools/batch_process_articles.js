/**
 * Batch process all draft articles with real-time monitoring
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_URL = 'http://localhost:3000/api/bot/process-single-article';
const API_KEY = 'korea-news-bot-secret-2024';

async function processArticle(article, index, total) {
    console.log('\n[' + '='.repeat(60) + ']');
    console.log('[' + (index + 1) + '/' + total + '] ' + (article.title || '').slice(0, 50) + '...');
    console.log('  ID: ' + article.id);
    console.log('  Region: ' + article.region);
    console.log('  Input: ' + (article.content?.length || 0) + ' chars');
    console.log('[' + '='.repeat(60) + ']');

    const start = Date.now();

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({ articleId: article.id, mode: 'lightweight' })
        });

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        const data = await res.json();

        console.log('\n  RESULT:');
        console.log('  - Time: ' + elapsed + 's');
        console.log('  - Mode: ' + (data.mode || 'full'));
        console.log('  - Grade: ' + data.grade);
        console.log('  - Success: ' + data.success);
        console.log('  - Published: ' + data.published);
        if (data.title) console.log('  - Title: ' + data.title.slice(0, 40) + '...');
        if (data.mode !== 'lightweight') {
            console.log('  - Attempts: ' + data.attempts + '/' + data.maxRetries);
            console.log('  - Length Ratio: ' + data.lengthRatio + '%');
        }

        if (data.error) {
            console.log('  - ERROR: ' + data.error);
        }

        return {
            id: article.id,
            title: (article.title || '').slice(0, 30),
            grade: data.grade,
            success: data.success,
            published: data.published,
            time: parseFloat(elapsed),
            lengthRatio: data.lengthRatio,
            crossValidation: data.crossValidationScore,
            error: data.error
        };
    } catch (err) {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log('\n  ERROR: ' + err.message);
        return {
            id: article.id,
            title: (article.title || '').slice(0, 30),
            grade: 'ERROR',
            success: false,
            published: false,
            time: parseFloat(elapsed),
            error: err.message
        };
    }
}

async function main() {
    console.log('='.repeat(70));
    console.log('BATCH PROCESSING ALL DRAFT ARTICLES (LIGHTWEIGHT MODE)');
    console.log('Model: benedict/linkbricks-llama3.1-korean:8b');
    console.log('Mode: LIGHTWEIGHT (title/subtitle/summary only, body preserved)');
    console.log('='.repeat(70));

    const { data: articles, error } = await supabase
        .from('posts')
        .select('id, title, content, region')
        .eq('status', 'draft')
        .not('content', 'is', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch articles:', error.message);
        return;
    }

    console.log('\nFound ' + articles.length + ' draft articles to process\n');

    const results = [];
    const stats = { A: 0, B: 0, C: 0, D: 0, ERROR: 0 };

    for (let i = 0; i < articles.length; i++) {
        const result = await processArticle(articles[i], i, articles.length);
        results.push(result);
        if (result.grade) stats[result.grade] = (stats[result.grade] || 0) + 1;
        console.log('\n  [Progress: ' + (i + 1) + '/' + articles.length + '] A:' + stats.A + ' B:' + stats.B + ' C:' + stats.C + ' D:' + stats.D + ' ERR:' + stats.ERROR);
    }

    console.log('\n' + '='.repeat(70));
    console.log('FINAL SUMMARY');
    console.log('='.repeat(70));
    console.log('Total: ' + articles.length + ' | A:' + stats.A + ' B:' + stats.B + ' C:' + stats.C + ' D:' + stats.D + ' ERR:' + stats.ERROR);
    console.log('Success Rate: ' + ((stats.A / articles.length) * 100).toFixed(1) + '%');
    const avgTime = results.reduce((a, b) => a + (b.time || 0), 0) / results.length;
    console.log('Average Time: ' + avgTime.toFixed(1) + 's');

    const failed = results.filter(r => r.grade !== 'A');
    if (failed.length > 0) {
        console.log('\nNon-A articles:');
        failed.forEach(f => console.log('  [' + f.grade + '] ' + f.title + '... (' + (f.error || 'ratio:' + f.lengthRatio + '%') + ')'));
    }
    console.log('='.repeat(70));
}

main().catch(console.error);
