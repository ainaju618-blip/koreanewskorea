/**
 * Ollama Model Stress Test
 * - Tests both current (8b) and recommended (qwen2.5:14b) models
 * - 100+ iterations with 1000+ character Korean samples
 * - Measures: response time, output length, success rate, timeouts
 */

const OLLAMA_BASE_URL = 'http://localhost:11434';

// Test configurations
const MODELS_TO_TEST = [
    'benedict/linkbricks-hermes3-llama3.1-8b-korean-advanced-q4:latest',  // Current (8B quantized)
    'benedict/linkbricks-llama3.1-korean:8b',  // Korean specialized (8B full)
    'qwen2.5:14b'  // Recommended (14B)
];

const TEST_ITERATIONS = 35;  // Per model (total 105)
const TIMEOUT_MS = 300000;   // 5 minutes (increased for 14B)
const NUM_CTX_OPTIONS = [2048, 4096, 8192];  // Test different context sizes

// Sample Korean press releases (1000+ characters each)
const SAMPLE_PRESS_RELEASES = [
    `전라남도는 2024년 농촌 활력 증진을 위한 종합 지원 사업을 본격 추진한다고 밝혔다. 이번 사업은 총 500억원의 예산을 투입하여 도내 22개 시군의 농촌 지역 활성화를 도모한다.

주요 사업 내용으로는 첫째, 귀농귀촌 정착 지원금 확대로 가구당 최대 3천만원까지 지원된다. 둘째, 농산물 직거래 플랫폼 구축에 50억원을 투자하여 농가 소득 증대를 꾀한다. 셋째, 청년 농업인 육성을 위해 연간 100명에게 월 100만원의 영농정착금을 지급한다.

김영록 전남도지사는 "농촌 인구 감소와 고령화 문제를 해결하기 위해 다각적인 지원 정책을 펼치겠다"며 "특히 젊은 층의 농촌 유입을 위한 주거, 교육, 의료 인프라 확충에 집중할 것"이라고 말했다.

한편, 도는 이번 사업의 효과적인 추진을 위해 각 시군에 전담 부서를 설치하고, 분기별 성과 점검 회의를 개최할 예정이다. 사업 신청은 오는 3월 1일부터 각 읍면동 주민센터에서 접수받는다.

문의: 전라남도 농업정책과 061-286-5000`,

    `광주광역시는 인공지능(AI) 산업 육성을 위한 'AI 광주 2030' 비전을 발표했다. 시는 2030년까지 총 2조원을 투자하여 AI 전문기업 500개 육성과 일자리 3만개 창출을 목표로 한다.

핵심 추진 전략으로는 ▲AI 집적단지 조성 ▲AI 인재 양성 ▲AI 스타트업 지원 ▲AI 공공서비스 확대 등 4대 분야를 선정했다. 특히 광산구 첨단지구에 10만평 규모의 AI 특화 산업단지를 조성하고, 입주 기업에 5년간 임대료 50% 감면 혜택을 제공한다.

강기정 광주시장은 "광주가 대한민국 AI 산업의 중심 도시로 도약할 수 있도록 과감한 투자와 규제 혁신을 추진하겠다"고 강조했다. 그는 "전남대, 조선대 등 지역 대학과 협력하여 연간 1,000명의 AI 전문인력을 양성하고, 유망 스타트업 100개를 선발해 최대 5억원의 사업화 자금을 지원할 계획"이라고 덧붙였다.

시는 또한 AI 기반 스마트시티 구축을 위해 교통, 환경, 안전 분야에 AI 기술을 단계적으로 적용할 예정이다. 올해 하반기부터 AI 교통신호 최적화 시스템을 시범 운영하고, 2025년까지 전 도로로 확대한다.

담당부서: 광주광역시 AI산업과 062-613-4500`,

    `순천시는 정원박람회 개최 10주년을 맞아 '순천만국제정원박람회 2024'를 성대하게 개최한다. 행사는 4월 20일부터 10월 31일까지 195일간 순천만국가정원 일원에서 열린다.

이번 박람회는 '정원, 미래를 품다'를 주제로 기후변화 대응과 지속가능한 정원 문화를 선보인다. 주요 프로그램으로는 ▲세계 30개국 참여 국제정원 전시 ▲야간 미디어아트 쇼 ▲정원 치유 프로그램 ▲어린이 생태학습 체험 등이 마련된다.

박람회 기간 중 순천시는 500만 관람객 유치를 목표로 하고 있으며, 이를 통해 약 8,000억원의 경제적 파급효과를 기대하고 있다. 노관규 순천시장은 "순천만국가정원이 세계적인 생태관광 명소로 자리매김할 수 있도록 최선을 다하겠다"며 "시민 여러분의 많은 관심과 참여를 부탁드린다"고 말했다.

입장권은 성인 기준 15,000원이며, 순천시민과 전남도민은 30% 할인 혜택을 받을 수 있다. 사전 예약은 순천만국가정원 홈페이지에서 가능하다.

문의: 순천시 정원박람회추진단 061-749-3114`
];

// Prompt template (same as production code)
function createPrompt(pressRelease) {
    return `너는 한국어 뉴스 기사 전문 편집자다. 다음 보도자료를 깔끔한 뉴스 기사로 다시 작성해줘.

규칙:
1. 오타와 띄어쓰기 오류를 수정한다
2. 불필요한 정보(담당자, 전화번호, HTML 태그, 저작권 문구 등)는 제거한다
3. 핵심 내용만 정리하여 간결하게 작성한다
4. 원본의 사실(숫자, 날짜, 이름)은 반드시 그대로 유지한다
5. 원본에 없는 내용은 절대 추가하지 않는다
6. 반드시 첫 줄에 [부제목: 한 문장 요약]을 작성한다

[보도자료]
${pressRelease}

[뉴스 기사]`;
}

// Call Ollama API with timeout and options
async function callOllama(model, prompt, numCtx = 4096) {
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
                    num_ctx: numCtx,
                    num_predict: 2048,
                    temperature: 0.3,
                    top_p: 0.9,
                    repeat_penalty: 1.1
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const elapsed = Date.now() - startTime;

        return {
            success: true,
            response: data.response || '',
            outputLength: (data.response || '').length,
            elapsed: elapsed,
            evalCount: data.eval_count || 0,
            promptEvalCount: data.prompt_eval_count || 0
        };
    } catch (error) {
        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;

        return {
            success: false,
            error: error.name === 'AbortError' ? 'TIMEOUT' : error.message,
            elapsed: elapsed,
            outputLength: 0
        };
    }
}

// Run tests
async function runTests() {
    console.log('='.repeat(70));
    console.log('OLLAMA MODEL STRESS TEST');
    console.log('='.repeat(70));
    console.log(`Test iterations per model: ${TEST_ITERATIONS}`);
    console.log(`Timeout: ${TIMEOUT_MS / 1000}s`);
    console.log(`Sample count: ${SAMPLE_PRESS_RELEASES.length}`);
    console.log(`Sample lengths: ${SAMPLE_PRESS_RELEASES.map(s => s.length).join(', ')} chars`);
    console.log('='.repeat(70));

    const results = {};

    for (const model of MODELS_TO_TEST) {
        console.log(`\n${'#'.repeat(70)}`);
        console.log(`# Testing: ${model}`);
        console.log(`${'#'.repeat(70)}`);

        results[model] = {
            successes: 0,
            failures: 0,
            timeouts: 0,
            totalTime: 0,
            outputLengths: [],
            errors: [],
            times: []
        };

        // Test with num_ctx = 4096 (recommended)
        const numCtx = 4096;

        for (let i = 0; i < TEST_ITERATIONS; i++) {
            const sampleIdx = i % SAMPLE_PRESS_RELEASES.length;
            const sample = SAMPLE_PRESS_RELEASES[sampleIdx];
            const prompt = createPrompt(sample);

            process.stdout.write(`\r[${i + 1}/${TEST_ITERATIONS}] Testing...`);

            const result = await callOllama(model, prompt, numCtx);

            if (result.success) {
                results[model].successes++;
                results[model].outputLengths.push(result.outputLength);
                results[model].times.push(result.elapsed);
                results[model].totalTime += result.elapsed;

                // Check if output is too short (less than 50% of input)
                const ratio = result.outputLength / sample.length;
                if (ratio < 0.5) {
                    console.log(`\n  [WARN] iter ${i + 1}: Output too short (${result.outputLength} chars, ${(ratio * 100).toFixed(1)}%)`);
                }
            } else {
                if (result.error === 'TIMEOUT') {
                    results[model].timeouts++;
                    console.log(`\n  [TIMEOUT] iter ${i + 1}: ${result.elapsed}ms`);
                } else {
                    results[model].failures++;
                    results[model].errors.push(result.error);
                    console.log(`\n  [FAIL] iter ${i + 1}: ${result.error}`);
                }
            }

            // Small delay between requests
            await new Promise(r => setTimeout(r, 500));
        }

        console.log('\n');
    }

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));

    for (const [model, data] of Object.entries(results)) {
        const avgTime = data.times.length > 0 ? data.times.reduce((a, b) => a + b, 0) / data.times.length : 0;
        const avgOutputLen = data.outputLengths.length > 0 ? data.outputLengths.reduce((a, b) => a + b, 0) / data.outputLengths.length : 0;
        const minOutputLen = data.outputLengths.length > 0 ? Math.min(...data.outputLengths) : 0;
        const maxOutputLen = data.outputLengths.length > 0 ? Math.max(...data.outputLengths) : 0;
        const successRate = ((data.successes / TEST_ITERATIONS) * 100).toFixed(1);

        console.log(`\n[${model}]`);
        console.log(`  Success Rate: ${successRate}% (${data.successes}/${TEST_ITERATIONS})`);
        console.log(`  Timeouts: ${data.timeouts}`);
        console.log(`  Failures: ${data.failures}`);
        console.log(`  Avg Response Time: ${(avgTime / 1000).toFixed(2)}s`);
        console.log(`  Avg Output Length: ${avgOutputLen.toFixed(0)} chars`);
        console.log(`  Output Range: ${minOutputLen} - ${maxOutputLen} chars`);

        // Check for short outputs
        const shortOutputs = data.outputLengths.filter(len => len < 500).length;
        if (shortOutputs > 0) {
            console.log(`  [WARN] Short outputs (<500 chars): ${shortOutputs}`);
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('TEST COMPLETE');
    console.log('='.repeat(70));
}

// Run
runTests().catch(console.error);
