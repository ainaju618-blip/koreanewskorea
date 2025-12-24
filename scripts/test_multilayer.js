/**
 * Multi-Layer Verification Test
 * Tests the 5-layer verification system with retry logic
 */

const OLLAMA_BASE_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'benedict/linkbricks-hermes3-llama3.1-8b-korean-advanced-q4';
const MAX_RETRIES = 3;  // Reduced for testing
const MIN_LENGTH_RATIO = 0.7;

// Test article
const testArticle = {
    name: "Medium (595 chars) - Gangjin",
    content: `강진군 성전면 지역사회보장협의체(위원장 오명종)는 지난 20일 성전면 청년회와 성전면 명동마을 조병곤 씨로부터 이웃돕기 성금 150만 원을 기탁받았다. 이날 청년회(회장 이영수)가 50만 원, 조병곤 씨가 100만 원을 각각 기탁했다. 기탁된 성금은 사회복지공동모금회와 연계해 복지 소외층 긴급지원 및 저소득층 주거환경 개선 등 지역 내 어려운 이웃들을 돕는 데 사용될 예정이다. 청년회와 조병곤 씨는 매년 꾸준히 성금을 기탁하며 지역사회에서 나눔을 실천하고 있다. 이영수 청년회장은 "앞으로도 지역의 청년들이 함께 나눔에 동참하며 더 살기 좋은 성전면을 만들어 나가겠다"고 말했다. 조병곤 씨는 "추운 겨울 어려운 이웃들에게 조금이나마 도움이 됐으면 좋겠다"고 전했다. 오명종 성전면장은 "기탁해 주신 분들께 진심으로 감사드리며, 소외된 이웃이 없도록 세심하게 살피겠다"고 밝혔다.`
};

async function callOllama(prompt) {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false })
    });
    if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
    return (await response.json()).response || '';
}

// LAYER 1: Extract facts
function extractFacts(text) {
    const numbers = text.match(/\d+(?:,\d{3})*(?:만|억|천|백)?(?:원|명|개)?/g) || [];
    const dates = text.match(/(?:지난\s*)?\d{1,2}일/g) || [];
    const names = text.match(/[가-힣]{2,4}(?:\s+)?(?:씨|대표|회장|면장|위원장)/g) || [];
    const quotes = [];
    let match;
    const quotePattern = /"([^"]+)"/g;
    while ((match = quotePattern.exec(text)) !== null) quotes.push(match[1]);
    return { numbers: [...new Set(numbers)], dates: [...new Set(dates)], names: [...new Set(names)], quotes };
}

// LAYER 2: Compare facts (flexible matching)
function compareFacts(original, converted, convertedText) {
    const missing = { numbers: [], dates: [], names: [] };
    const convertedNoSpace = convertedText.replace(/\s/g, '');

    for (const num of original.numbers) {
        if (!convertedNoSpace.includes(num.replace(/\s/g, ''))) missing.numbers.push(num);
    }

    for (const date of original.dates) {
        const dateNoSpace = date.replace(/\s/g, '');
        // Also check for just the number part (e.g., "20일" from "지난 20일")
        const dateNumMatch = date.match(/\d+일/);
        const dateNum = dateNumMatch ? dateNumMatch[0] : '';

        const found = convertedNoSpace.includes(dateNoSpace) ||
                     (dateNum && convertedText.includes(dateNum));

        if (!found) missing.dates.push(date);
    }

    const passed = missing.numbers.length === 0 && missing.dates.length === 0;
    return { passed, missing, details: passed ? 'OK' : `Missing: ${JSON.stringify(missing)}` };
}

// LAYER 3: Hallucination check
async function verifyHallucination(original, converted) {
    const prompt = `[TASK] Find ANY fabricated content in the converted article that does NOT exist in original.
RESPOND: "Fabricated: YES" or "Fabricated: NO"

[Original]
${original}

[Converted]
${converted}`;
    const response = await callOllama(prompt);
    const passed = !response.toLowerCase().includes('fabricated: yes');
    return { passed, details: response.substring(0, 200) };
}

// LAYER 4: Cross-validation
async function verifyCrossValidation(original, converted) {
    const prompt = `Score this article 0-100. RESPOND: "SCORE: X/100"
- Accuracy (40pts): Facts match exactly
- Completeness (30pts): No missing info
- No additions (30pts): No invented content

[Original] ${original.substring(0, 500)}
[Converted] ${converted.substring(0, 500)}`;
    const response = await callOllama(prompt);
    const scoreMatch = response.match(/SCORE:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    return { passed: score >= 80, score, details: response.substring(0, 200) };
}

// LAYER 5: Length check
function verifyLength(original, converted) {
    const ratio = converted.length / original.length;
    return { passed: ratio >= MIN_LENGTH_RATIO, ratio, details: `${(ratio*100).toFixed(1)}%` };
}

// Convert with feedback
async function convertToNews(pressRelease, attempt, feedback = '') {
    const inputLength = pressRelease.length;
    const minOutput = Math.floor(inputLength * MIN_LENGTH_RATIO);

    const feedbackSection = feedback ? `\n# PREVIOUS ATTEMPT FAILED!\n${feedback}\nFIX THESE ISSUES!\n` : '';

    const prompt = `# Role: News editor. ONLY restructure, NEVER add new info.
${feedbackSection}
# Rules:
1. Use ONLY facts from press release
2. Keep all numbers, dates, names EXACTLY
3. Minimum ${minOutput} characters (70%+ of original)

[Press Release]
${pressRelease}

[News Article]`;

    const response = await callOllama(prompt);
    return { content: response.trim(), subtitle: '' };
}

// Main test
async function runTest() {
    console.log('======================================================================');
    console.log('MULTI-LAYER VERIFICATION TEST');
    console.log(`Article: ${testArticle.name}`);
    console.log(`Original: ${testArticle.content.length} chars`);
    console.log('======================================================================\n');

    const originalFacts = extractFacts(testArticle.content);
    console.log('Extracted facts from original:');
    console.log(`  Numbers: ${originalFacts.numbers.join(', ')}`);
    console.log(`  Dates: ${originalFacts.dates.join(', ')}`);
    console.log(`  Names: ${originalFacts.names.join(', ')}`);
    console.log(`  Quotes: ${originalFacts.quotes.length} found\n`);

    let lastDetails = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`ATTEMPT ${attempt}/${MAX_RETRIES}`);
        console.log('='.repeat(60));

        // Generate feedback
        let feedback = '';
        if (attempt > 1 && lastDetails) {
            if (!lastDetails.length.passed) feedback += `LENGTH TOO SHORT: ${lastDetails.length.details}\n`;
            if (!lastDetails.facts.passed) feedback += `MISSING FACTS: ${lastDetails.facts.details}\n`;
            if (!lastDetails.hallucination.passed) feedback += `HALLUCINATION DETECTED\n`;
        }

        // Convert
        console.log('\n[STAGE 1: CONVERSION]');
        const startConvert = Date.now();
        const { content } = await convertToNews(testArticle.content, attempt, feedback);
        console.log(`Time: ${((Date.now() - startConvert)/1000).toFixed(1)}s`);
        console.log(`Output: ${content.length} chars`);

        // Layer 1-2: Fact extraction & comparison
        console.log('\n[LAYER 1-2: FACT CHECK]');
        const convertedFacts = extractFacts(content);
        const factCheck = compareFacts(originalFacts, convertedFacts, content);
        console.log(`  Result: ${factCheck.passed ? 'PASS' : 'FAIL'}`);
        if (!factCheck.passed) console.log(`  Details: ${factCheck.details}`);

        // Layer 5: Length (check early)
        console.log('\n[LAYER 5: LENGTH]');
        const lengthCheck = verifyLength(testArticle.content, content);
        console.log(`  Ratio: ${lengthCheck.details}`);
        console.log(`  Result: ${lengthCheck.passed ? 'PASS' : 'FAIL'}`);

        if (!lengthCheck.passed) {
            lastDetails = { facts: factCheck, length: lengthCheck, hallucination: { passed: false }, crossval: { passed: false, score: 0 } };
            console.log('\n  >>> Length fail - skipping LLM checks, retrying...');
            continue;
        }

        // Layer 3-4: Run in parallel
        console.log('\n[LAYER 3-4: LLM VERIFICATION (PARALLEL)]');
        const startLLM = Date.now();
        const [hallucination, crossval] = await Promise.all([
            verifyHallucination(testArticle.content, content),
            verifyCrossValidation(testArticle.content, content)
        ]);
        console.log(`  Parallel time: ${((Date.now() - startLLM)/1000).toFixed(1)}s`);
        console.log(`  Layer 3 (Hallucination): ${hallucination.passed ? 'PASS' : 'FAIL'}`);
        console.log(`  Layer 4 (Cross-Val): ${crossval.passed ? 'PASS' : 'FAIL'} (${crossval.score}/100)`);

        lastDetails = { facts: factCheck, length: lengthCheck, hallucination, crossval };

        // Determine grade
        const allPassed = factCheck.passed && lengthCheck.passed && hallucination.passed && crossval.passed;
        let grade = 'A';
        if (!lengthCheck.passed) grade = lengthCheck.ratio < 0.5 ? 'D' : 'C';
        else if (!hallucination.passed || !factCheck.passed) grade = 'C';
        else if (!crossval.passed) grade = 'B';

        console.log(`\n[RESULT]`);
        console.log(`  Grade: ${grade}`);
        console.log(`  All Passed: ${allPassed}`);

        if (allPassed || grade === 'B') {
            console.log('\n======================================================================');
            console.log(`SUCCESS! Grade ${grade} achieved on attempt ${attempt}`);
            console.log('======================================================================');
            console.log('\n[FINAL OUTPUT]');
            console.log('----------------------------------------------------------------------');
            console.log(content);
            console.log('----------------------------------------------------------------------');
            return;
        }

        console.log('\n  >>> Retrying...');
    }

    console.log('\n======================================================================');
    console.log(`FAILED after ${MAX_RETRIES} attempts`);
    console.log('======================================================================');
}

runTest().catch(console.error);
