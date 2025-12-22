/**
 * Test AI rewrite with raw (unprocessed) article
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getRawArticle() {
    // Get an article NOT processed by AI
    const { data, error } = await supabase
        .from('posts')
        .select('id, title, content, source, region, status, ai_processed')
        .or('ai_processed.is.null,ai_processed.eq.false')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error || !data || data.length === 0) {
        console.log('Error or no data:', error?.message);
        return null;
    }

    return data[0];
}

async function testAIRewrite(article) {
    const response = await fetch('http://localhost:3000/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: article.content,
            style: 'news',
            parseJson: true,
            region: article.region || 'unknown'
        }),
    });

    return response.json();
}

async function main() {
    console.log('=== AI Rewrite Test (Raw Article) ===\n');

    const article = await getRawArticle();
    if (!article) {
        console.log('No raw article found');
        return;
    }

    console.log('Test Article (Not AI Processed):');
    console.log('  ID:', article.id);
    console.log('  Title:', article.title);
    console.log('  Source:', article.source);
    console.log('  Region:', article.region);
    console.log('  AI Processed:', article.ai_processed);
    console.log('  Content Length:', article.content?.length || 0);
    console.log('\n  Original Content:\n');
    console.log('  ---');
    console.log(article.content?.substring(0, 800).split('\n').map(l => '  ' + l).join('\n'));
    console.log('  ---');

    console.log('\n\n=== Calling AI Rewrite API... ===\n');

    try {
        const result = await testAIRewrite(article);

        console.log('API Response:');
        console.log('  Success:', result.success);
        console.log('  Provider:', result.provider);

        if (result.parsed) {
            console.log('\n=== AI Rewritten Result ===\n');
            console.log('  NEW Title:', result.parsed.title);
            console.log('\n  Summary:', result.parsed.summary);
            console.log('\n  Keywords:', result.parsed.keywords);
            console.log('  Tags:', result.parsed.tags);
            console.log('\n  Extracted Numbers:', result.parsed.extracted_numbers);
            console.log('  Extracted Quotes:', result.parsed.extracted_quotes);
            console.log('\n  Content Preview (500 chars):');
            console.log('  ---');
            console.log(result.parsed.content?.substring(0, 500).split('\n').map(l => '  ' + l).join('\n'));
            console.log('  ---');
        }

        if (result.validation) {
            console.log('\n=== Validation Result ===\n');
            console.log('  Grade:', result.validation.grade);
            console.log('  Is Valid:', result.validation.isValid);
            console.log('  Warnings:', result.validation.warnings.length > 0 ? result.validation.warnings : '(none)');
            console.log('\n  Number Check:');
            console.log('    Passed:', result.validation.numberCheck.passed);
            console.log('    Extra Numbers (hallucination):', result.validation.numberCheck.extraNumbers.length > 0 ? result.validation.numberCheck.extraNumbers : '(none)');
            console.log('\n  Quote Check:');
            console.log('    Passed:', result.validation.quoteCheck.passed);
            console.log('    Extra Quotes (hallucination):', result.validation.quoteCheck.extraQuotes.length > 0 ? result.validation.quoteCheck.extraQuotes : '(none)');
        }

        if (result.error) {
            console.log('  Error:', result.error);
        }

    } catch (err) {
        console.log('API Call Error:', err.message);
    }
}

main().catch(console.error);
