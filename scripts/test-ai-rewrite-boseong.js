/**
 * Test AI rewrite with Boseong region article (allowed region)
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getRawArticle() {
    // Get an article from boseong NOT processed by AI
    const { data, error } = await supabase
        .from('posts')
        .select('id, title, content, source, region, status, ai_processed')
        .eq('region', 'boseong')
        .or('ai_processed.is.null,ai_processed.eq.false')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.log('Error:', error?.message);
        return null;
    }

    if (!data || data.length === 0) {
        // If no unprocessed boseong articles, get any unprocessed article from allowed region
        const { data: data2, error: error2 } = await supabase
            .from('posts')
            .select('id, title, content, source, region, status, ai_processed')
            .or('ai_processed.is.null,ai_processed.eq.false')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error2 || !data2 || data2.length === 0) {
            return null;
        }

        // Return the first one and override region to boseong for testing
        const article = data2[0];
        console.log('Note: Using article from', article.region, 'but testing with boseong region');
        return { ...article, testRegion: 'boseong' };
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
            region: article.testRegion || article.region || 'boseong'
        }),
    });

    return response.json();
}

async function main() {
    console.log('=== AI Rewrite Test (Raw Article - Boseong) ===\n');

    const article = await getRawArticle();
    if (!article) {
        console.log('No raw article found');
        return;
    }

    console.log('Test Article:');
    console.log('  ID:', article.id);
    console.log('  Title:', article.title);
    console.log('  Source:', article.source);
    console.log('  Original Region:', article.region);
    console.log('  Test Region:', article.testRegion || article.region);
    console.log('  AI Processed:', article.ai_processed);
    console.log('  Content Length:', article.content?.length || 0);
    console.log('\n  Original Content (first 600 chars):\n');
    console.log('  ---');
    console.log(article.content?.substring(0, 600).split('\n').map(l => '  ' + l).join('\n'));
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
            console.log('\n  Rewritten Content (first 600 chars):');
            console.log('  ---');
            console.log(result.parsed.content?.substring(0, 600).split('\n').map(l => '  ' + l).join('\n'));
            console.log('  ---');
        }

        if (result.validation) {
            console.log('\n=== Validation Result (Hallucination Check) ===\n');
            console.log('  Grade:', result.validation.grade);
            console.log('  Is Valid (No Hallucination):', result.validation.isValid);

            if (result.validation.warnings.length > 0) {
                console.log('  Warnings:', result.validation.warnings);
            } else {
                console.log('  Warnings: (none - all facts verified)');
            }

            console.log('\n  Number Check:');
            console.log('    Passed:', result.validation.numberCheck.passed);
            if (result.validation.numberCheck.extraNumbers.length > 0) {
                console.log('    HALLUCINATED Numbers:', result.validation.numberCheck.extraNumbers);
            } else {
                console.log('    Extra Numbers: (none - no hallucinated numbers)');
            }

            console.log('\n  Quote Check:');
            console.log('    Passed:', result.validation.quoteCheck.passed);
            if (result.validation.quoteCheck.extraQuotes.length > 0) {
                console.log('    HALLUCINATED Quotes:', result.validation.quoteCheck.extraQuotes);
            } else {
                console.log('    Extra Quotes: (none - no hallucinated quotes)');
            }
        }

        if (result.error) {
            console.log('  Error:', result.error);
        }

    } catch (err) {
        console.log('API Call Error:', err.message);
    }
}

main().catch(console.error);
