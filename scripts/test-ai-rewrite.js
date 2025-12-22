/**
 * Test script for AI rewrite functionality
 * Run: node scripts/test-ai-rewrite.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTestArticle() {
    // Get a recent article for testing
    const { data, error } = await supabase
        .from('posts')
        .select('id, title, content, source, region, status')
        .in('status', ['draft', 'published'])
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.log('Error:', error.message);
        return null;
    }

    if (!data || data.length === 0) {
        console.log('No articles found');
        return null;
    }

    return data[0];
}

async function testAIRewrite(article) {
    console.log('\n=== Testing AI Rewrite API ===\n');

    const response = await fetch('http://localhost:3000/api/ai/rewrite', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: article.content,
            style: 'news',
            parseJson: true,
            region: article.region || 'unknown'
            // Note: Not passing articleId to avoid modifying the actual article
        }),
    });

    const result = await response.json();
    return result;
}

async function main() {
    console.log('=== AI Rewrite Test Script ===\n');

    // 1. Get test article
    const article = await getTestArticle();
    if (!article) {
        console.log('No article to test');
        return;
    }

    console.log('Test Article:');
    console.log('  ID:', article.id);
    console.log('  Title:', article.title);
    console.log('  Source:', article.source);
    console.log('  Region:', article.region);
    console.log('  Status:', article.status);
    console.log('  Content Length:', article.content?.length || 0);
    console.log('\n  Content Preview (500 chars):');
    console.log('  ', article.content?.substring(0, 500).replace(/\n/g, '\n  '));

    // 2. Test AI rewrite
    console.log('\n\n=== Calling AI Rewrite API... ===\n');

    try {
        const result = await testAIRewrite(article);

        console.log('API Response:');
        console.log('  Success:', result.success);
        console.log('  Provider:', result.provider);

        if (result.parsed) {
            console.log('\n  Parsed Result:');
            console.log('    Title:', result.parsed.title);
            console.log('    Summary:', result.parsed.summary);
            console.log('    Keywords:', result.parsed.keywords);
            console.log('    Tags:', result.parsed.tags);
            console.log('    Extracted Numbers:', result.parsed.extracted_numbers);
            console.log('    Extracted Quotes:', result.parsed.extracted_quotes);
            console.log('    Content Length:', result.parsed.content?.length || 0);
        }

        if (result.validation) {
            console.log('\n  Validation Result:');
            console.log('    Grade:', result.validation.grade);
            console.log('    Is Valid:', result.validation.isValid);
            console.log('    Warnings:', result.validation.warnings);
            console.log('    Number Check:', result.validation.numberCheck);
            console.log('    Quote Check:', result.validation.quoteCheck);
        }

        if (result.error) {
            console.log('  Error:', result.error);
        }

    } catch (err) {
        console.log('API Call Error:', err.message);
        console.log('Make sure the dev server is running (npm run dev)');
    }
}

main().catch(console.error);
