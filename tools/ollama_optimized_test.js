/**
 * Ollama Optimized Settings Test
 * - Tests the new optimized configuration
 * - 5 iterations with detailed metrics
 */

const OLLAMA_BASE_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'qwen2.5:14b';
const NUM_CTX = 8192;
const NUM_PREDICT = 4096;
const TIMEOUT_MS = 180000;

const TEST_ITERATIONS = 5;

// Sample Korean press releases (1000+ characters)
const SAMPLE = `전라남도는 2024년 농촌 활력 증진을 위한 종합 지원 사업을 본격 추진한다고 밝혔다. 이번 사업은 총 500억원의 예산을 투입하여 도내 22개 시군의 농촌 지역 활성화를 도모한다.

주요 사업 내용으로는 첫째, 귀농귀촌 정착 지원금 확대로 가구당 최대 3천만원까지 지원된다. 둘째, 농산물 직거래 플랫폼 구축에 50억원을 투자하여 농가 소득 증대를 꾀한다. 셋째, 청년 농업인 육성을 위해 연간 100명에게 월 100만원의 영농정착금을 지급한다.

김영록 전남도지사는 "농촌 인구 감소와 고령화 문제를 해결하기 위해 다각적인 지원 정책을 펼치겠다"며 "특히 젊은 층의 농촌 유입을 위한 주거, 교육, 의료 인프라 확충에 집중할 것"이라고 말했다.

한편, 도는 이번 사업의 효과적인 추진을 위해 각 시군에 전담 부서를 설치하고, 분기별 성과 점검 회의를 개최할 예정이다. 사업 신청은 오는 3월 1일부터 각 읍면동 주민센터에서 접수받는다.

문의: 전라남도 농업정책과 061-286-5000`;

const inputLength = SAMPLE.length;
const minOutputLength = Math.floor(inputLength * 0.85);

function createPrompt(pressRelease) {
    return `# Role
You are an expert editor who ONLY reformats government press releases.
You have 20 years of experience at a regional newspaper in Gwangju/Jeonnam.
Your ONLY job is to restructure - NEVER add any new information.

---

# ABSOLUTE RULES (Violation = Immediate Rejection)

## 1. Source Truth ONLY
- Use ONLY facts explicitly stated in the press release
- NEVER add numbers, statistics, analysis, or predictions

## 2. Preserve Numbers & Names EXACTLY
- Copy all numbers, dates, amounts, names EXACTLY as written

## 3. LENGTH REQUIREMENT (CRITICAL - MOST IMPORTANT!)
#########################################################
# WARNING: YOUR OUTPUT MUST MATCH THE ORIGINAL LENGTH!  #
# DO NOT SUMMARIZE! DO NOT SHORTEN! PRESERVE ALL INFO!  #
#########################################################
- Original: ${inputLength} characters
- TARGET output: ${inputLength} characters (100% of original)
- MINIMUM output: ${minOutputLength} characters (85%+ of original)
- You MUST include EVERY piece of information from the original.

---

# Output Format
[Subtitle: One sentence summary]

Body content...

---

[Press Release]
${pressRelease}

---
#################################################################
# FINAL REMINDER - PRESERVE ORIGINAL LENGTH! (MOST IMPORTANT!)  #
#################################################################
- Original length: ${inputLength} characters
- Your TARGET: ${inputLength} characters (match the original!)
- DO NOT SUMMARIZE! This is a REWRITE, not a summary!
---

[News Article]`;
}

async function callOllama(prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const startTime = Date.now();

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                options: {
                    num_ctx: NUM_CTX,
                    num_predict: NUM_PREDICT,
                    temperature: 0.3,
                    top_p: 0.9,
                    repeat_penalty: 1.1
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
            elapsed: elapsed,
            evalCount: data.eval_count || 0,
            promptEvalCount: data.prompt_eval_count || 0,
            totalDuration: data.total_duration || 0
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

async function runTests() {
    console.log('='.repeat(70));
    console.log('OLLAMA OPTIMIZED SETTINGS TEST');
    console.log('='.repeat(70));
    console.log(`Model: ${OLLAMA_MODEL}`);
    console.log(`num_ctx: ${NUM_CTX}`);
    console.log(`num_predict: ${NUM_PREDICT}`);
    console.log(`timeout: ${TIMEOUT_MS / 1000}s`);
    console.log(`Input length: ${inputLength} chars`);
    console.log(`Min output: ${minOutputLength} chars (85%)`);
    console.log('='.repeat(70));

    const results = [];

    for (let i = 0; i < TEST_ITERATIONS; i++) {
        console.log(`\n[Test ${i + 1}/${TEST_ITERATIONS}]`);
        console.log('Calling Ollama...');

        const prompt = createPrompt(SAMPLE);
        const result = await callOllama(prompt);

        if (result.success) {
            const ratio = (result.outputLength / inputLength * 100).toFixed(1);
            const passed = result.outputLength >= minOutputLength;

            console.log(`  Status: SUCCESS`);
            console.log(`  Time: ${(result.elapsed / 1000).toFixed(2)}s`);
            console.log(`  Output: ${result.outputLength} chars (${ratio}% of original)`);
            console.log(`  Length Check: ${passed ? 'PASS' : 'FAIL'} (min: ${minOutputLength})`);
            console.log(`  Tokens: prompt=${result.promptEvalCount}, output=${result.evalCount}`);

            results.push({
                success: true,
                elapsed: result.elapsed,
                outputLength: result.outputLength,
                ratio: parseFloat(ratio),
                passed: passed,
                promptTokens: result.promptEvalCount,
                outputTokens: result.evalCount
            });
        } else {
            console.log(`  Status: FAILED`);
            console.log(`  Error: ${result.error}`);
            console.log(`  Time: ${(result.elapsed / 1000).toFixed(2)}s`);

            results.push({
                success: false,
                error: result.error,
                elapsed: result.elapsed
            });
        }

        // Wait between tests
        if (i < TEST_ITERATIONS - 1) {
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const passed = successful.filter(r => r.passed);

    console.log(`\nTotal Tests: ${TEST_ITERATIONS}`);
    console.log(`Successful: ${successful.length}`);
    console.log(`Failed: ${failed.length}`);
    console.log(`Length Check Passed: ${passed.length}/${successful.length}`);

    if (successful.length > 0) {
        const avgTime = successful.reduce((a, b) => a + b.elapsed, 0) / successful.length;
        const avgOutput = successful.reduce((a, b) => a + b.outputLength, 0) / successful.length;
        const avgRatio = successful.reduce((a, b) => a + b.ratio, 0) / successful.length;
        const minOutput = Math.min(...successful.map(r => r.outputLength));
        const maxOutput = Math.max(...successful.map(r => r.outputLength));
        const minTime = Math.min(...successful.map(r => r.elapsed));
        const maxTime = Math.max(...successful.map(r => r.elapsed));

        console.log(`\nPerformance Metrics:`);
        console.log(`  Avg Response Time: ${(avgTime / 1000).toFixed(2)}s`);
        console.log(`  Min Response Time: ${(minTime / 1000).toFixed(2)}s`);
        console.log(`  Max Response Time: ${(maxTime / 1000).toFixed(2)}s`);
        console.log(`\nOutput Metrics:`);
        console.log(`  Avg Output Length: ${avgOutput.toFixed(0)} chars`);
        console.log(`  Avg Length Ratio: ${avgRatio.toFixed(1)}%`);
        console.log(`  Output Range: ${minOutput} - ${maxOutput} chars`);
        console.log(`  Input Length: ${inputLength} chars`);
        console.log(`  Target: >= ${minOutputLength} chars (85%)`);
    }

    if (failed.length > 0) {
        console.log(`\nFailed Tests:`);
        failed.forEach((r, i) => {
            console.log(`  ${i + 1}. ${r.error} (${(r.elapsed / 1000).toFixed(2)}s)`);
        });
    }

    console.log('\n' + '='.repeat(70));
    console.log('TEST COMPLETE');
    console.log('='.repeat(70));

    // Return for report generation
    return {
        config: { model: OLLAMA_MODEL, num_ctx: NUM_CTX, num_predict: NUM_PREDICT, timeout: TIMEOUT_MS },
        input: { length: inputLength, minOutput: minOutputLength },
        results: results,
        summary: {
            total: TEST_ITERATIONS,
            successful: successful.length,
            failed: failed.length,
            passed: passed.length,
            avgTime: successful.length > 0 ? successful.reduce((a, b) => a + b.elapsed, 0) / successful.length : 0,
            avgOutput: successful.length > 0 ? successful.reduce((a, b) => a + b.outputLength, 0) / successful.length : 0,
            avgRatio: successful.length > 0 ? successful.reduce((a, b) => a + b.ratio, 0) / successful.length : 0
        }
    };
}

runTests().catch(console.error);
