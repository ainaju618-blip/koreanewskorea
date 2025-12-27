/**
 * Test solar:10.7b with EXPERT recommendations
 * - mirostat: 2, mirostat_tau: 5.0, mirostat_eta: 0.1
 * - temperature: 0.1
 * - dynamic num_predict
 * - stop sequences for Hanja/English
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OLLAMA_URL = 'http://localhost:11434';

// EXPERT: Stop sequences for Hanja/English
const STOP_SEQUENCES = [
    "\u5149", "\u65B0", "\u63D0", "\u967D", "\u85A6", "\u660E", "\u8655", "\u521D", "\u9664", "\u696D", "\u6B23",
    "Sunset", "Sunrise", "Sunshine"
];

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
    console.log('SOLAR:10.7b EXPERT SETTINGS TEST');
    console.log('='.repeat(60));
    console.log('Article:', article.title?.slice(0, 50));
    console.log('Region:', article.region);
    console.log('Input:', article.content.length, 'chars');
    console.log('-'.repeat(60));

    const inputLength = article.content.length;

    // EXPERT: Dynamic num_predict calculation
    const dynamicNumPredict = Math.min(
        Math.floor((inputLength * 1.2) / 2) + 200,
        2048
    );
    console.log('Dynamic num_predict:', dynamicNumPredict);

    const prompt = `# Role: Korean News Editor
You are an editor who rewrites Korean government press releases into Korean news articles.

# CRITICAL RULES
1. OUTPUT MUST BE IN KOREAN (한글)
2. Length: SIMILAR to original (${inputLength} chars, target: ${Math.floor(inputLength * 0.85)}-${Math.floor(inputLength * 1.15)})
3. Keep ALL numbers, dates, names EXACTLY as original
4. NO English, NO Chinese characters (Hanja)
5. NO summarizing - preserve ALL information

# Original Press Release
${article.content}

# Korean News Article (한글 기사):`;

    console.log('Calling solar:10.7b with EXPERT settings...');
    console.log('  mirostat: 2, mirostat_tau: 5.0, mirostat_eta: 0.1');
    console.log('  temperature: 0.1');
    console.log('  stop sequences: enabled');
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
                    num_predict: dynamicNumPredict,
                    temperature: 0.1,        // EXPERT: Much lower
                    repeat_penalty: 1.1,     // EXPERT: Higher
                    mirostat: 2,             // EXPERT: Enable
                    mirostat_tau: 5.0,       // EXPERT: Target entropy
                    mirostat_eta: 0.1,       // EXPERT: Learning rate
                    num_gpu: 35,
                    gpu_layers: 35
                },
                stop: STOP_SEQUENCES
            })
        });

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        const data = await res.json();
        const output = data.response || '';

        const lengthRatio = output.length / inputLength;
        const hasKorean = /[가-힣]/.test(output);
        const hasHanja = /[\u4E00-\u9FFF]/.test(output);
        const hasEnglish = /[a-zA-Z]{5,}/.test(output);  // 5+ consecutive English chars

        console.log('-'.repeat(60));
        console.log('RESULT:');
        console.log('  Time:', elapsed + 's');
        console.log('  Output:', output.length, 'chars');
        console.log('  Ratio:', (lengthRatio * 100).toFixed(1) + '%');
        console.log('  Has Korean:', hasKorean ? 'YES' : 'NO');
        console.log('  Has Hanja:', hasHanja ? 'YES (BAD)' : 'NO (GOOD)');
        console.log('  Has Long English:', hasEnglish ? 'YES (BAD)' : 'NO (GOOD)');
        console.log('  Length Status:', lengthRatio >= 0.85 && lengthRatio <= 1.15 ? 'PASS' : 'FAIL');
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
