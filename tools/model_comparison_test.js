/**
 * Ollama Model Comparison Test
 * - Fetches 5 real articles from Supabase
 * - Tests multiple Korean models
 * - Compares output length, time, and quality
 * - Expert recommended params: temp 0.35, repeat_penalty 1.02
 *
 * Usage: node tools/model_comparison_test.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const OLLAMA_BASE_URL = 'http://localhost:11434';
const TIMEOUT_MS = 180000;  // 3 minutes (reduced for Korean models)
const NUM_CTX = 4096;       // Reduced from 8192 (Korean KV cache optimization)
const NUM_PREDICT = 2048;   // Reduced from 4096

// Expert recommended parameters
const TEMPERATURE = 0.35;       // Balanced output
const REPEAT_PENALTY = 1.02;    // Preserve length (lowered from 1.1)

// Models to test - Add new models here after download
// Format: { name: 'ollama-model-name', shortName: 'display-name' }
const MODELS = [
    { name: 'qwen2.5:14b', shortName: 'qwen2.5:14b' },
    { name: 'solar:10.7b', shortName: 'solar:10.7b' },
    { name: 'exaone3.5:7.8b', shortName: 'exaone3.5' },
];

// Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function createPrompt(pressRelease) {
    const inputLength = pressRelease.length;
    const minOutputLength = Math.floor(inputLength * 0.85);

    // Split sentences for 1:1 mapping
    const sentences = pressRelease
        .split(/(?<=[.?!])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 5);
    const sentenceCount = sentences.length;

    // Expert-optimized prompt: Minimal repetition, quantitative conditions
    return `# 역할
당신은 한국 지방정부 보도자료를 기사 형식으로 재구성하는 전문 편집기자입니다.
요약 없이, 모든 문장과 정보를 그대로 다른 표현으로 옮기세요.

# 출력 구조 (이 형식만 사용)
[제목]
[부제목]
[리드]
[본문]

# 핵심 재작성 규칙
- 원문 문장 수: ${sentenceCount}개 (동일하게 유지)
- 각 문장의 길이: 원문 대비 90% 이상
- 전체 길이: ${inputLength}자 이상, 최소 ${minOutputLength}자 (85%)
- 문장 삭제/합치기 금지
- 인물, 기관, 숫자, 날짜 일치 유지
- HTML, 연락처 제거, 새로운 정보 추가 금지

# 원문 전체
${pressRelease}

# 사실확인
위 기사에 원문에 등장한 사실(숫자, 인명, 기관명, 날짜)이 모두 포함되도록 본문에 반영하라.
O/X 표시는 하지 않는다.

[뉴스 기사]`;
}

async function callOllama(model, prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const startTime = Date.now();

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    num_ctx: NUM_CTX,
                    num_predict: NUM_PREDICT,
                    temperature: TEMPERATURE,     // Expert: 0.35
                    top_p: 0.9,
                    repeat_penalty: REPEAT_PENALTY, // Expert: 1.02 (preserve length)
                    num_gpu: 32,                  // GPU layers limit for Korean models
                    gpu_layers: 32                // Prevent VRAM overflow
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;

        if (!response.ok) {
            return { success: false, error: `HTTP ${response.status}`, elapsed };
        }

        const data = await response.json();
        const output = data.response || '';

        return {
            success: true,
            output: output,
            outputLength: output.length,
            elapsed: elapsed
        };
    } catch (error) {
        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        return {
            success: false,
            error: error.name === 'AbortError' ? 'TIMEOUT' : error.message,
            elapsed
        };
    }
}

async function fetchArticles(limit = 5) {
    console.log('Fetching articles from Supabase...');

    const { data, error } = await supabase
        .from('posts')
        .select('id, title, content, region')
        .eq('status', 'pending')
        .not('content', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Supabase error:', error);
        return [];
    }

    // Filter articles with content length 400-2000 chars
    const filtered = data.filter(a =>
        a.content &&
        a.content.length >= 400 &&
        a.content.length <= 2000
    );

    console.log(`Found ${filtered.length} articles with valid length`);
    return filtered.slice(0, 5);
}

async function runTest() {
    console.log('='.repeat(70));
    console.log('OLLAMA MODEL COMPARISON TEST');
    console.log('='.repeat(70));
    console.log(`Models: ${MODELS.map(m => m.shortName).join(', ')}`);
    console.log(`Settings: num_ctx=${NUM_CTX}, num_predict=${NUM_PREDICT}, timeout=${TIMEOUT_MS / 1000}s`);
    console.log('='.repeat(70));

    // Fetch articles
    const articles = await fetchArticles(5);
    if (articles.length === 0) {
        console.log('No articles found. Using sample data...');
        articles.push({
            id: 'sample-1',
            title: 'Sample Article',
            content: `전라남도는 2024년 농촌 활력 증진을 위한 종합 지원 사업을 본격 추진한다고 밝혔다. 이번 사업은 총 500억원의 예산을 투입하여 도내 22개 시군의 농촌 지역 활성화를 도모한다.

주요 사업 내용으로는 첫째, 귀농귀촌 정착 지원금 확대로 가구당 최대 3천만원까지 지원된다. 둘째, 농산물 직거래 플랫폼 구축에 50억원을 투자하여 농가 소득 증대를 꾀한다. 셋째, 청년 농업인 육성을 위해 연간 100명에게 월 100만원의 영농정착금을 지급한다.

김영록 전남도지사는 "농촌 인구 감소와 고령화 문제를 해결하기 위해 다각적인 지원 정책을 펼치겠다"며 "특히 젊은 층의 농촌 유입을 위한 주거, 교육, 의료 인프라 확충에 집중할 것"이라고 말했다.

한편, 도는 이번 사업의 효과적인 추진을 위해 각 시군에 전담 부서를 설치하고, 분기별 성과 점검 회의를 개최할 예정이다. 사업 신청은 오는 3월 1일부터 각 읍면동 주민센터에서 접수받는다.

문의: 전라남도 농업정책과 061-286-5000`,
            region: 'jeonnam'
        });
    }

    console.log(`\nTesting with ${articles.length} articles\n`);

    // Results storage
    const results = {};
    MODELS.forEach(m => {
        results[m.shortName] = {
            times: [],
            ratios: [],
            passed: 0,
            failed: 0
        };
    });

    // Test each article with each model
    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const inputLength = article.content.length;
        const minOutput = Math.floor(inputLength * 0.85);

        console.log('-'.repeat(70));
        console.log(`Article ${i + 1}/${articles.length}: "${article.title?.slice(0, 40)}..."`);
        console.log(`  Input: ${inputLength} chars, Min output: ${minOutput} chars`);
        console.log('-'.repeat(70));

        const prompt = createPrompt(article.content);

        for (const model of MODELS) {
            console.log(`\n  [${model.shortName}] Testing...`);

            const result = await callOllama(model.name, prompt);

            if (result.success) {
                const ratio = (result.outputLength / inputLength * 100).toFixed(1);
                const passed = result.outputLength >= minOutput;
                const time = (result.elapsed / 1000).toFixed(1);

                console.log(`    Time: ${time}s`);
                console.log(`    Output: ${result.outputLength} chars (${ratio}%)`);
                console.log(`    Status: ${passed ? 'PASS' : 'FAIL'}`);

                results[model.shortName].times.push(result.elapsed);
                results[model.shortName].ratios.push(parseFloat(ratio));
                if (passed) results[model.shortName].passed++;
                else results[model.shortName].failed++;
            } else {
                console.log(`    ERROR: ${result.error}`);
                console.log(`    Time: ${(result.elapsed / 1000).toFixed(1)}s`);
                results[model.shortName].failed++;
            }

            // Wait between models to avoid GPU overload
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));

    console.log('\n| Model | Avg Time | Avg Ratio | Pass Rate | Verdict |');
    console.log('|-------|----------|-----------|-----------|---------|');

    for (const model of MODELS) {
        const r = results[model.shortName];
        const avgTime = r.times.length > 0
            ? (r.times.reduce((a, b) => a + b, 0) / r.times.length / 1000).toFixed(1)
            : 'N/A';
        const avgRatio = r.ratios.length > 0
            ? (r.ratios.reduce((a, b) => a + b, 0) / r.ratios.length).toFixed(1)
            : 'N/A';
        const total = r.passed + r.failed;
        const passRate = total > 0 ? ((r.passed / total) * 100).toFixed(0) : '0';

        let verdict = '';
        if (r.times.length === 0) verdict = 'FAILED';
        else if (parseFloat(avgRatio) >= 85 && parseFloat(avgTime) <= 60) verdict = 'OPTIMAL';
        else if (parseFloat(avgRatio) >= 85) verdict = 'QUALITY';
        else if (parseFloat(avgTime) <= 30) verdict = 'SPEED';
        else verdict = 'BALANCED';

        console.log(`| ${model.shortName.padEnd(13)} | ${avgTime.padStart(6)}s | ${avgRatio.padStart(8)}% | ${passRate.padStart(8)}% | ${verdict.padEnd(7)} |`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('TEST COMPLETE');
    console.log('='.repeat(70));

    return results;
}

// Run test
runTest().catch(console.error);
