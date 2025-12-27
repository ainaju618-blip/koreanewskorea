/**
 * Test solar:10.7b with a single real article
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OLLAMA_URL = 'http://localhost:11434';

async function test() {
    // Get one draft article
    const { data: article } = await supabase
        .from('posts')
        .select('id, title, content, region')
        .eq('status', 'draft')
        .not('content', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!article) {
        console.log('No article found');
        return;
    }

    console.log('='.repeat(60));
    console.log('SOLAR:10.7b SINGLE ARTICLE TEST');
    console.log('='.repeat(60));
    console.log('Article:', article.title?.slice(0, 50));
    console.log('Region:', article.region);
    console.log('Input:', article.content.length, 'chars');
    console.log('-'.repeat(60));

    const inputLength = article.content.length;
    const prompt = `# Role: Press Release Editor
Rewrite this press release as a news article.

# Rules
1. Length: Similar to original (${inputLength} chars)
2. Keep all numbers, dates, names exactly
3. No summarizing, preserve all information

# Original
${article.content}

[News Article]`;

    console.log('Calling solar:10.7b...');
    const start = Date.now();

    try {
        const res = await fetch(OLLAMA_URL + '/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'solar:10.7b',
                prompt: prompt,
                stream: false,
                options: {
                    num_ctx: 4096,
                    num_predict: 2048,
                    temperature: 0.35,
                    repeat_penalty: 1.02,
                    num_gpu: 32,
                    gpu_layers: 32
                }
            })
        });

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        const data = await res.json();
        const output = data.response || '';

        console.log('-'.repeat(60));
        console.log('RESULT:');
        console.log('  Time:', elapsed + 's');
        console.log('  Output:', output.length, 'chars');
        console.log('  Ratio:', (output.length / inputLength * 100).toFixed(1) + '%');
        console.log('  Status:', output.length >= inputLength * 0.85 ? 'PASS' : 'FAIL');
        console.log('='.repeat(60));
        console.log('OUTPUT PREVIEW (first 800 chars):');
        console.log('-'.repeat(60));
        console.log(output.slice(0, 800));
        console.log('='.repeat(60));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

test().catch(console.error);
