/**
 * Compare EXAONE 3.5 vs Llama Korean for news conversion
 * Run automatically without user confirmation
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OLLAMA_URL = 'http://localhost:11434';

// Model configurations based on expert recommendations
const MODELS = {
    'exaone3.5:7.8b': {
        name: 'EXAONE 3.5 7.8B',
        options: {
            num_ctx: 4096,
            temperature: 0.1,
            repeat_penalty: 1.1,
            top_p: 0.8,
            num_gpu: 35,
            gpu_layers: 35
        }
    },
    'benedict/linkbricks-llama3.1-korean:8b': {
        name: 'Llama 3.1 Korean 8B (Q8)',
        options: {
            num_ctx: 4096,
            temperature: 0.25,
            repeat_penalty: 1.12,
            top_p: 0.85,
            num_gpu: 30,
            gpu_layers: 30
        }
    }
};

// Stop sequences for all models
const STOP_SEQUENCES = [
    "\u5149", "\u63D0", "\u8FB2", "\u80B2", "\u589E", "\u65B0",
    "Sunset", "Sunrise", "Consulting"
];

async function testModel(modelId, article, inputLength) {
    const config = MODELS[modelId];
    const dynamicNumPredict = Math.min(
        Math.floor((inputLength * 1.2) / 2) + 200,
        2048
    );

    const prompt = `\u{2699}\uFE0F \uC9C0\uC2DC\uC0AC\uD56D:
1\uFE0F\u20E3 \uCD9C\uB825\uC740 \uD55C\uAE00(UTF-8, U+AC00~U+D7A3)\uB9CC \uC0AC\uC6A9\uD569\uB2C8\uB2E4.
2\uFE0F\u20E3 \uC601\uC5B4, \uD55C\uC790, \uC77C\uBCF8\uC5B4 \uB610\uB294 \uC678\uB798\uC5B4 \uD45C\uAE30\uB97C \uC808\uB300 \uD3EC\uD568\uD558\uC9C0 \uB9C8\uC138\uC694.
3\uFE0F\u20E3 \uC6D0\uBB38 \uAE30\uC0AC \uC18D\uC758 \uC22B\uC790, \uB0A0\uC9DC, \uC778\uBB3C\uBA85, \uACE0\uC720\uBA85\uC0AC\uB294 \uADF8\uB300\uB85C \uC720\uC9C0\uD558\uC138\uC694.
4\uFE0F\u20E3 \uCD9C\uB825 \uAE38\uC774\uB294 \uC6D0\uBB38\uC758 85~115% \uC0AC\uC774\uB97C \uBAA9\uD45C\uB85C \uC791\uC131\uD569\uB2C8\uB2E4.
5\uFE0F\u20E3 \uBB38\uCCB4\uB294 \uBCF4\uB3C4\uC790\uB8CC \uAE30\uBC18\uC758 \uAC1D\uAD00\uC801 \uB274\uC2A4 \uAE30\uC0AC \uD615\uC2DD\uC73C\uB85C \uC720\uC9C0\uD569\uB2C8\uB2E4.

[\uC6D0\uBB38 \uBCF4\uB3C4\uC790\uB8CC] (${inputLength}\uC790)
${article.content}

[\uB274\uC2A4 \uAE30\uC0AC] (\uD55C\uAE00\uB9CC):`;

    const start = Date.now();

    try {
        const res = await fetch(OLLAMA_URL + '/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelId,
                prompt: prompt,
                stream: false,
                options: {
                    ...config.options,
                    num_predict: dynamicNumPredict
                },
                stop: STOP_SEQUENCES
            })
        });

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        const data = await res.json();
        const output = data.response || '';

        // Analysis
        const lengthRatio = output.length / inputLength;
        const koreanCount = (output.match(/[\uAC00-\uD7A3]/g) || []).length;
        const hanjaCount = (output.match(/[\u4E00-\u9FFF]/g) || []).length;
        const englishWords = (output.match(/[a-zA-Z]{3,}/g) || []);
        const japaneseCount = (output.match(/[\u3040-\u30FF]/g) || []).length;

        return {
            model: config.name,
            time: parseFloat(elapsed),
            outputLength: output.length,
            lengthRatio: lengthRatio,
            koreanPercent: (koreanCount / output.length * 100).toFixed(1),
            hanjaCount: hanjaCount,
            englishCount: englishWords.length,
            japaneseCount: japaneseCount,
            isPureKorean: hanjaCount === 0 && englishWords.length === 0 && japaneseCount === 0,
            lengthPass: lengthRatio >= 0.85 && lengthRatio <= 1.15,
            preview: output.slice(0, 500),
            output: output
        };
    } catch (err) {
        return {
            model: config.name,
            error: err.message
        };
    }
}

async function main() {
    console.log('='.repeat(70));
    console.log('MODEL COMPARISON: EXAONE 3.5 vs Llama Korean');
    console.log('='.repeat(70));

    // Get test articles (3 articles for comparison)
    const { data: articles } = await supabase
        .from('posts')
        .select('id, title, content, region')
        .eq('status', 'draft')
        .not('content', 'is', null)
        .order('created_at', { ascending: false })
        .limit(3);

    if (!articles || articles.length === 0) {
        console.log('No articles found');
        return;
    }

    const results = {
        'exaone3.5:7.8b': [],
        'benedict/linkbricks-llama3.1-korean:8b': []
    };

    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        console.log(`\nArticle ${i + 1}: ${article.title?.slice(0, 40)}...`);
        console.log(`Input: ${article.content.length} chars`);
        console.log('-'.repeat(70));

        for (const modelId of Object.keys(MODELS)) {
            console.log(`Testing ${MODELS[modelId].name}...`);
            const result = await testModel(modelId, article, article.content.length);
            results[modelId].push(result);

            if (result.error) {
                console.log(`  ERROR: ${result.error}`);
            } else {
                console.log(`  Time: ${result.time}s | Output: ${result.outputLength} chars (${(result.lengthRatio * 100).toFixed(1)}%)`);
                console.log(`  Hanja: ${result.hanjaCount} | English: ${result.englishCount} | Japanese: ${result.japaneseCount}`);
                console.log(`  Pure Korean: ${result.isPureKorean ? 'YES' : 'NO'} | Length: ${result.lengthPass ? 'PASS' : 'FAIL'}`);
            }
        }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));

    for (const modelId of Object.keys(MODELS)) {
        const modelResults = results[modelId].filter(r => !r.error);
        if (modelResults.length === 0) continue;

        const avgTime = modelResults.reduce((a, b) => a + b.time, 0) / modelResults.length;
        const avgRatio = modelResults.reduce((a, b) => a + b.lengthRatio, 0) / modelResults.length;
        const pureKoreanCount = modelResults.filter(r => r.isPureKorean).length;
        const lengthPassCount = modelResults.filter(r => r.lengthPass).length;
        const totalHanja = modelResults.reduce((a, b) => a + b.hanjaCount, 0);
        const totalEnglish = modelResults.reduce((a, b) => a + b.englishCount, 0);

        console.log(`\n${MODELS[modelId].name}:`);
        console.log(`  Avg Time: ${avgTime.toFixed(1)}s`);
        console.log(`  Avg Length Ratio: ${(avgRatio * 100).toFixed(1)}%`);
        console.log(`  Pure Korean: ${pureKoreanCount}/${modelResults.length}`);
        console.log(`  Length Pass: ${lengthPassCount}/${modelResults.length}`);
        console.log(`  Total Hanja: ${totalHanja}`);
        console.log(`  Total English words: ${totalEnglish}`);
    }

    // Recommendation
    console.log('\n' + '='.repeat(70));
    console.log('RECOMMENDATION');
    console.log('='.repeat(70));

    const exaoneResults = results['exaone3.5:7.8b'].filter(r => !r.error);
    const llamaResults = results['benedict/linkbricks-llama3.1-korean:8b'].filter(r => !r.error);

    let recommendation = '';
    let winner = '';

    if (exaoneResults.length > 0 && llamaResults.length > 0) {
        const exaonePure = exaoneResults.filter(r => r.isPureKorean).length;
        const llamaPure = llamaResults.filter(r => r.isPureKorean).length;
        const exaoneAvgRatio = exaoneResults.reduce((a, b) => a + Math.abs(1 - b.lengthRatio), 0) / exaoneResults.length;
        const llamaAvgRatio = llamaResults.reduce((a, b) => a + Math.abs(1 - b.lengthRatio), 0) / llamaResults.length;

        // Score calculation
        let exaoneScore = 0;
        let llamaScore = 0;

        // Pure Korean (most important)
        if (exaonePure > llamaPure) exaoneScore += 3;
        else if (llamaPure > exaonePure) llamaScore += 3;
        else { exaoneScore += 1.5; llamaScore += 1.5; }

        // Length ratio (closer to 1.0 is better)
        if (exaoneAvgRatio < llamaAvgRatio) exaoneScore += 2;
        else if (llamaAvgRatio < exaoneAvgRatio) llamaScore += 2;
        else { exaoneScore += 1; llamaScore += 1; }

        // Speed
        const exaoneAvgTime = exaoneResults.reduce((a, b) => a + b.time, 0) / exaoneResults.length;
        const llamaAvgTime = llamaResults.reduce((a, b) => a + b.time, 0) / llamaResults.length;
        if (exaoneAvgTime < llamaAvgTime) exaoneScore += 1;
        else if (llamaAvgTime < exaoneAvgTime) llamaScore += 1;

        winner = exaoneScore > llamaScore ? 'EXAONE 3.5:7.8b' : 'benedict/linkbricks-llama3.1-korean:8b';
        recommendation = `
Based on ${exaoneResults.length} tests:
  EXAONE Score: ${exaoneScore}
  Llama Korean Score: ${llamaScore}

WINNER: ${winner}
Reason: ${exaoneScore > llamaScore
    ? 'Better pure Korean output and length control'
    : 'Better quality and fact preservation'}
`;
    }

    console.log(recommendation);
    console.log('='.repeat(70));

    // Return winner for programmatic use
    return winner;
}

main().catch(console.error);
