/**
 * Update existing articles with new metadata (title, subtitle, summary, tags)
 * Does NOT delete - only updates
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
    console.log('  Status: ' + article.status);
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
        console.log('  - Grade: ' + data.grade);
        console.log('  - Validated: ' + (data.validated ? 'YES' : 'NO'));
        if (data.title) console.log('  - New Title: ' + data.title.slice(0, 40) + '...');
        if (data.subtitle) console.log('  - Subtitle: ' + data.subtitle.slice(0, 40) + '...');

        return {
            id: article.id,
            title: (article.title || '').slice(0, 30),
            newTitle: (data.title || '').slice(0, 30),
            grade: data.grade,
            validated: data.validated,
            time: parseFloat(elapsed),
            error: data.error
        };
    } catch (err) {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log('\n  ERROR: ' + err.message);
        return {
            id: article.id,
            title: (article.title || '').slice(0, 30),
            grade: 'ERROR',
            validated: false,
            time: parseFloat(elapsed),
            error: err.message
        };
    }
}

async function main() {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let dateFilter = null;
    let regionFilter = null;
    let limit = 100;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--date' && args[i + 1]) {
            dateFilter = args[i + 1];
            i++;
        } else if (args[i] === '--region' && args[i + 1]) {
            regionFilter = args[i + 1];
            i++;
        } else if (args[i] === '--limit' && args[i + 1]) {
            limit = parseInt(args[i + 1]);
            i++;
        } else if (args[i] === '--yesterday') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            dateFilter = yesterday.toISOString().split('T')[0];
        } else if (args[i] === '--today') {
            dateFilter = new Date().toISOString().split('T')[0];
        }
    }

    console.log('='.repeat(70));
    console.log('UPDATE EXISTING ARTICLES (Metadata Only)');
    console.log('Model: benedict/linkbricks-llama3.1-korean:8b');
    console.log('Updates: title, subtitle, summary, paragraph formatting');
    console.log('='.repeat(70));
    console.log('Filters:');
    console.log('  - Date: ' + (dateFilter || 'all'));
    console.log('  - Region: ' + (regionFilter || 'all'));
    console.log('  - Limit: ' + limit);
    console.log('='.repeat(70));

    // Build query
    let query = supabase
        .from('posts')
        .select('id, title, content, region, status, created_at')
        .not('content', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

    // Apply date filter
    if (dateFilter) {
        const startOfDay = dateFilter + 'T00:00:00+09:00';
        const endOfDay = dateFilter + 'T23:59:59+09:00';
        query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
    }

    // Apply region filter
    if (regionFilter) {
        query = query.eq('region', regionFilter);
    }

    const { data: articles, error } = await query;

    if (error) {
        console.error('Failed to fetch articles:', error.message);
        return;
    }

    if (!articles || articles.length === 0) {
        console.log('\nNo articles found matching criteria.');
        return;
    }

    console.log('\nFound ' + articles.length + ' articles to update\n');

    const results = [];
    const stats = { A: 0, B: 0, ERROR: 0 };

    for (let i = 0; i < articles.length; i++) {
        const result = await processArticle(articles[i], i, articles.length);
        results.push(result);
        if (result.grade === 'A') stats.A++;
        else if (result.grade === 'B') stats.B++;
        else stats.ERROR++;
        console.log('\n  [Progress: ' + (i + 1) + '/' + articles.length + '] A:' + stats.A + ' B:' + stats.B + ' ERR:' + stats.ERROR);
    }

    console.log('\n' + '='.repeat(70));
    console.log('FINAL SUMMARY');
    console.log('='.repeat(70));
    console.log('Total: ' + articles.length + ' | A:' + stats.A + ' B:' + stats.B + ' ERR:' + stats.ERROR);
    console.log('Validation Success Rate: ' + ((stats.A / articles.length) * 100).toFixed(1) + '%');
    const avgTime = results.reduce((a, b) => a + (b.time || 0), 0) / results.length;
    console.log('Average Time: ' + avgTime.toFixed(1) + 's');

    const failed = results.filter(r => r.grade === 'ERROR');
    if (failed.length > 0) {
        console.log('\nFailed articles:');
        failed.forEach(f => console.log('  [ERROR] ' + f.title + '... (' + f.error + ')'));
    }

    const notValidated = results.filter(r => r.grade === 'B');
    if (notValidated.length > 0) {
        console.log('\nNot fully validated (B grade):');
        notValidated.forEach(f => console.log('  [B] ' + f.title + ' -> ' + f.newTitle));
    }

    console.log('='.repeat(70));
}

// Show usage
if (process.argv.includes('--help')) {
    console.log(`
Usage: node update_existing_articles.js [options]

Options:
  --yesterday     Update articles from yesterday
  --today         Update articles from today
  --date YYYY-MM-DD  Update articles from specific date
  --region CODE   Filter by region (e.g., gwangyang, damyang)
  --limit N       Maximum articles to process (default: 100)
  --help          Show this help

Examples:
  node update_existing_articles.js --yesterday
  node update_existing_articles.js --date 2025-12-26 --region gwangyang
  node update_existing_articles.js --today --limit 50
`);
    process.exit(0);
}

main().catch(console.error);
