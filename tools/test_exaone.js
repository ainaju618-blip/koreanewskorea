/**
 * Test EXAONE 3.5:7.8b (LG AI Korean-native model)
 * Compare with Solar 10.7B for pure Korean output
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OLLAMA_URL = 'http://localhost:11434';

// EXAONE optimized settings (no mirostat - expert says disable)
const EXAONE_OPTIONS = {
    num_ctx: 4096,
    temperature: 0.1,
    repeat_penalty: 1.1,
    top_p: 0.8,
    num_gpu: 35,
    gpu_layers: 35
    // No mirostat - expert recommends disabling
};

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
    console.log('EXAONE 3.5:7.8b TEST (Korean-native model)');
    console.log('='.repeat(60));
    console.log('Article:', article.title?.slice(0, 50));
    console.log('Region:', article.region);
    console.log('Input:', article.content.length, 'chars');
    console.log('-'.repeat(60));

    const inputLength = article.content.length;

    // Dynamic num_predict (expert recommendation)
    const dynamicNumPredict = Math.min(
        Math.floor((inputLength * 1.2) / 2) + 200,
        2048
    );
    console.log('Dynamic num_predict:', dynamicNumPredict);

    const prompt = `당신은 한국 지방자치단체 보도자료를 뉴스 기사로 변환하는 편집자입니다.

# 규칙
1. 반드시 한글(가-힣)로만 작성
2. 한자(漢字) 절대 금지
3. 영어 단어 절대 금지
4. 원문 길이와 비슷하게 (${inputLength}자, 목표: ${Math.floor(inputLength * 0.85)}~${Math.floor(inputLength * 1.15)}자)
5. 모든 숫자, 날짜, 이름 정확히 유지

# 원문 보도자료
${article.content}

# 뉴스 기사 (한글만):`;

    console.log('Calling exaone3.5:7.8b...');
    console.log('  temperature: 0.1, repeat_penalty: 1.1, top_p: 0.8');
    console.log('  mirostat: disabled (expert recommendation)');
    const start = Date.now();

    try {
        const res = await fetch(OLLAMA_URL + '/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'exaone3.5:7.8b',
                prompt: prompt,
                stream: false,
                options: {
                    ...EXAONE_OPTIONS,
                    num_predict: dynamicNumPredict
                }
            })
        });

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        const data = await res.json();
        const output = data.response || '';

        const lengthRatio = output.length / inputLength;
        const hasKorean = /[가-힣]/.test(output);
        const koreanCount = (output.match(/[가-힣]/g) || []).length;
        const hasHanja = /[\u4E00-\u9FFF]/.test(output);
        const hanjaCount = (output.match(/[\u4E00-\u9FFF]/g) || []).length;
        const hasEnglish = /[a-zA-Z]{3,}/.test(output);
        const englishWords = (output.match(/[a-zA-Z]{3,}/g) || []);

        console.log('-'.repeat(60));
        console.log('RESULT:');
        console.log('  Time:', elapsed + 's');
        console.log('  Output:', output.length, 'chars');
        console.log('  Ratio:', (lengthRatio * 100).toFixed(1) + '%');
        console.log('');
        console.log('  Korean chars:', koreanCount, `(${(koreanCount/output.length*100).toFixed(1)}%)`);
        console.log('  Hanja chars:', hanjaCount, hanjaCount > 0 ? '(BAD!)' : '(GOOD)');
        console.log('  English words:', englishWords.length, englishWords.length > 0 ? `(BAD: ${englishWords.slice(0,5).join(', ')})` : '(GOOD)');
        console.log('');
        console.log('  Length Status:', lengthRatio >= 0.85 && lengthRatio <= 1.15 ? 'PASS' : 'FAIL');
        console.log('  Pure Korean:', hanjaCount === 0 && englishWords.length === 0 ? 'PASS' : 'FAIL');
        console.log('='.repeat(60));
        console.log('OUTPUT PREVIEW (first 1000 chars):');
        console.log('-'.repeat(60));
        console.log(output.slice(0, 1000));
        console.log('='.repeat(60));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

test().catch(console.error);
