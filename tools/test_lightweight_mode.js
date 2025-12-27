/**
 * Test Lightweight Mode - Generate title/subtitle/summary only
 * Body content stays 100% original from DB
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_URL = 'http://localhost:3000/api/bot/process-single-article';
const API_KEY = 'korea-news-bot-secret-2024';

async function test() {
    console.log('='.repeat(70));
    console.log('LIGHTWEIGHT MODE TEST');
    console.log('Body stays 100% original - only title/subtitle/summary generated');
    console.log('='.repeat(70));

    // Get one draft article
    const { data: article, error } = await supabase
        .from('posts')
        .select('id, title, content, region')
        .eq('status', 'draft')
        .not('content', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !article) {
        console.log('No draft article found');
        return;
    }

    console.log('\nArticle:', article.title?.slice(0, 50));
    console.log('ID:', article.id);
    console.log('Original content length:', article.content.length, 'chars');
    console.log('-'.repeat(70));

    // Save original content for comparison
    const originalContent = article.content;

    console.log('\nCalling API with mode=lightweight...');
    const start = Date.now();

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({
                articleId: article.id,
                mode: 'lightweight'  // Explicitly request lightweight mode
            })
        });

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        const data = await res.json();

        console.log('\n' + '='.repeat(70));
        console.log('RESULT:');
        console.log('='.repeat(70));
        console.log('  Time:', elapsed + 's');
        console.log('  Success:', data.success);
        console.log('  Mode:', data.mode);
        console.log('  Grade:', data.grade);
        console.log('  Published:', data.published);
        console.log('');
        console.log('  Generated Title:', data.title);
        console.log('  Generated Subtitle:', data.subtitle);
        console.log('  Generated Summary:', data.summary?.slice(0, 100) + '...');
        console.log('');
        console.log('  Message:', data.message);
        if (data.error) {
            console.log('  ERROR:', data.error);
        }
        console.log('  Full response:', JSON.stringify(data, null, 2));

        // Verify content was NOT modified
        console.log('\n' + '='.repeat(70));
        console.log('VERIFICATION: Content unchanged?');
        console.log('='.repeat(70));

        const { data: updated } = await supabase
            .from('posts')
            .select('content')
            .eq('id', article.id)
            .single();

        if (updated) {
            const contentUnchanged = updated.content === originalContent;
            console.log('  Original length:', originalContent.length, 'chars');
            console.log('  Updated length:', updated.content.length, 'chars');
            console.log('  Content identical:', contentUnchanged ? 'YES (CORRECT!)' : 'NO (ERROR!)');

            if (!contentUnchanged) {
                console.log('\n  WARNING: Content was modified! This should not happen.');
            }
        }

        console.log('='.repeat(70));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

test().catch(console.error);
