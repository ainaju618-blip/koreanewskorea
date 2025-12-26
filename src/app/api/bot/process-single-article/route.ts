import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getJobLogger } from '@/lib/job-logger';
import {
    renderVerificationPrompt,
    renderFixPrompt,
    parseVerificationResult,
    GRADE_DEFINITIONS,
    type VerificationResult as VerificationParseResult
} from '@/lib/verification-prompts';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get job logger instance for real-time monitoring
const jobLogger = getJobLogger(supabaseAdmin);

// ============================================================================
// Solar 10.7B Production Configuration (Expert Optimized - 2025-12-26)
// ============================================================================
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const PRIMARY_MODEL = 'solar:10.7b';      // Upstage Korean Enterprise Model
const FALLBACK_MODEL = 'qwen2.5:14b';     // Fallback for expansion

// Expert-optimized settings for Solar 10.7B (prevent KV cache explosion)
const SOLAR_OPTIONS = {
    num_ctx: 4096,          // Korean KV cache optimization
    num_predict: 2048,      // Prevent output over-expansion (262% issue)
    temperature: 0.30,      // Expert: 0.30 for stable output (was 0.35)
    repeat_penalty: 1.00,   // Expert: 1.00 for length preservation (was 1.02)
    top_p: 0.9,
    num_gpu: 35,            // GPU layers for RTX 4070 12GB
    gpu_layers: 35          // Prevent VRAM overflow
};

// Retry configuration
const MAX_RETRIES = 5;          // Maximum verification attempts
const MIN_LENGTH_RATIO = 0.85;  // 85% minimum length ratio
const API_TIMEOUT_MS = 300000;  // 5 minutes (increased for stable processing)

// ============================================================================
// LAYER 0: Ollama API Call (with Solar 10.7B optimized settings)
// Expert: temperature 0.30, repeat_penalty 1.00 for length preservation
// ============================================================================
async function callOllama(
    prompt: string,
    minTokens: number = SOLAR_OPTIONS.num_predict,
    model: string = PRIMARY_MODEL
): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        console.log(`[Ollama] Calling ${model} (tokens: ${minTokens})...`);
        const startTime = Date.now();

        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    ...SOLAR_OPTIONS,
                    num_predict: minTokens   // Override with specific token count
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[Ollama] Response in ${elapsed}s, output: ${(data.response || '').length} chars`);
        return data.response || '';
    } catch (error: unknown) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Ollama API timeout after ${API_TIMEOUT_MS / 1000}s`);
        }
        throw error;
    }
}

// ============================================================================
// LAYER 1: Fact Extraction (Automated - No LLM)
// ============================================================================
interface ExtractedFacts {
    numbers: string[];      // All numbers (amounts, quantities, percentages)
    dates: string[];        // All dates
    names: string[];        // Names of people
    organizations: string[]; // Organization names
    quotes: string[];       // Quoted text
}

function extractFacts(text: string): ExtractedFacts {
    // Extract numbers (Korean currency, percentages, quantities)
    const numberPatterns = [
        /\d+(?:,\d{3})*(?:\.\d+)?(?:만|억|천|백)?(?:\s*)?(?:원|명|개|건|kg|톤|포대|회|차|일|월|년|%|퍼센트)?/g,
        /\d+(?:,\d{3})*(?:\.\d+)?/g
    ];
    const numbers: string[] = [];
    for (const pattern of numberPatterns) {
        const matches = text.match(pattern) || [];
        numbers.push(...matches);
    }

    // Extract dates
    const datePatterns = [
        /\d{4}년\s*\d{1,2}월\s*\d{1,2}일/g,
        /\d{1,2}월\s*\d{1,2}일/g,
        /지난\s*\d{1,2}일/g,
        /오는\s*\d{1,2}일/g,
        /\d{1,2}일/g
    ];
    const dates: string[] = [];
    for (const pattern of datePatterns) {
        const matches = text.match(pattern) || [];
        dates.push(...matches);
    }

    // Extract Korean names (2-4 syllables followed by common suffixes)
    const namePatterns = [
        /[가-힣]{2,4}(?:\s+)?(?:씨|대표|회장|군수|시장|도지사|장관|의원|교수|박사|선생|위원장|면장|과장|팀장|국장|실장|청장)/g,
        /[가-힣]{2,4}(?:\s+)?(?:씨)/g
    ];
    const names: string[] = [];
    for (const pattern of namePatterns) {
        const matches = text.match(pattern) || [];
        names.push(...matches);
    }

    // Extract organization names
    const orgPatterns = [
        /[가-힣]+(?:시|군|구|도|읍|면|동)(?:\s+)?(?:청|교육청|의회|지원청)?/g,
        /[가-힣]+(?:협의체|협동조합|조합|재단|공사|센터|회|단체)/g
    ];
    const organizations: string[] = [];
    for (const pattern of orgPatterns) {
        const matches = text.match(pattern) || [];
        organizations.push(...matches);
    }

    // Extract quotes (text in quotation marks)
    const quotePattern = /"([^"]+)"/g;
    const quotes: string[] = [];
    let match;
    while ((match = quotePattern.exec(text)) !== null) {
        quotes.push(match[1]);
    }

    return {
        numbers: [...new Set(numbers)],
        dates: [...new Set(dates)],
        names: [...new Set(names)],
        organizations: [...new Set(organizations)],
        quotes: [...new Set(quotes)]
    };
}

// ============================================================================
// LAYER 2: Automated Fact Comparison (No LLM - Direct Comparison)
// ============================================================================
interface ComparisonResult {
    passed: boolean;
    missingNumbers: string[];
    missingDates: string[];
    missingNames: string[];
    missingOrgs: string[];
    addedContent: string[];
    details: string;
}

function compareFacts(original: ExtractedFacts, converted: ExtractedFacts, convertedText: string): ComparisonResult {
    const missingNumbers: string[] = [];
    const missingDates: string[] = [];
    const missingNames: string[] = [];
    const missingOrgs: string[] = [];
    const addedContent: string[] = [];

    // Check for missing numbers (important ones)
    for (const num of original.numbers) {
        // Skip very short numbers (likely noise)
        if (num.length < 2) continue;
        // Check if the number exists in converted text
        if (!convertedText.includes(num.replace(/\s/g, ''))) {
            // Try without spaces
            const numNoSpace = num.replace(/\s/g, '');
            const convertedNoSpace = convertedText.replace(/\s/g, '');
            if (!convertedNoSpace.includes(numNoSpace)) {
                missingNumbers.push(num);
            }
        }
    }

    // Check for missing dates (flexible matching)
    for (const date of original.dates) {
        const dateNoSpace = date.replace(/\s/g, '');
        const convertedNoSpace = convertedText.replace(/\s/g, '');
        // Also extract just the number+일 part (e.g., "20일" from "지난 20일")
        const dateNumMatch = date.match(/\d+일/);
        const dateNum = dateNumMatch ? dateNumMatch[0] : '';

        const found = convertedNoSpace.includes(dateNoSpace) ||
                     (dateNum && convertedText.includes(dateNum));

        if (!found) {
            missingDates.push(date);
        }
    }

    // Check for missing names (only check significant ones)
    for (const name of original.names) {
        if (name.length >= 3 && !convertedText.includes(name.split(/\s+/)[0])) {
            missingNames.push(name);
        }
    }

    // Check for missing organizations
    for (const org of original.organizations) {
        if (org.length >= 3 && !convertedText.includes(org)) {
            missingOrgs.push(org);
        }
    }

    // Check for added quotes (hallucination risk)
    for (const quote of converted.quotes) {
        const found = original.quotes.some(oq =>
            oq.includes(quote.substring(0, 20)) || quote.includes(oq.substring(0, 20))
        );
        if (!found && quote.length > 10) {
            addedContent.push(`Added quote: "${quote.substring(0, 50)}..."`);
        }
    }

    const details = [
        missingNumbers.length > 0 ? `Missing numbers: ${missingNumbers.join(', ')}` : '',
        missingDates.length > 0 ? `Missing dates: ${missingDates.join(', ')}` : '',
        missingNames.length > 0 ? `Missing names: ${missingNames.join(', ')}` : '',
        missingOrgs.length > 0 ? `Missing orgs: ${missingOrgs.join(', ')}` : '',
        addedContent.length > 0 ? addedContent.join('; ') : ''
    ].filter(Boolean).join('\n');

    const passed = missingNumbers.length === 0 &&
                   missingDates.length === 0 &&
                   addedContent.length === 0;

    return {
        passed,
        missingNumbers,
        missingDates,
        missingNames,
        missingOrgs,
        addedContent,
        details: details || 'All facts verified'
    };
}

// ============================================================================
// LAYER 3: LLM Verification #1 - Hallucination Detection
// Uses PRIMARY_MODEL (korean:8b) for fast verification
// ============================================================================
async function verifyHallucination(original: string, converted: string): Promise<{
    passed: boolean;
    details: string;
}> {
    const prompt = `[팩트체크] 당신은 뉴스 기관의 엄격한 팩트체커입니다.
변환된 기사를 원본 보도자료와 비교하세요.

당신의 임무: 원본에 없는 날조/추가된 정보 찾기

확인 항목:
1. 일치하지 않는 숫자 (금액, 날짜, 수량)
2. 원본에 없는 이름
3. 날조된 인용문
4. 원본에 없는 주장이나 진술
5. 추측 표현 ("예상된다", "전망이다", "아마")

응답 형식:
[할루시네이션 검사]
- 날조된 내용: 있음 또는 없음
- 있으면 목록:
  * [유형]: [구체적 내용]
- 최종 판정: 통과 또는 실패

[원본]
${original}

[변환된 기사]
${converted}`;

    const response = await callOllama(prompt, 2048, PRIMARY_MODEL);

    const hasFabrication = response.includes('날조된 내용: 있음') ||
                          response.includes('최종 판정: 실패') ||
                          response.toLowerCase().includes('fabricated content found: yes') ||
                          response.toLowerCase().includes('final verdict: fail');

    return {
        passed: !hasFabrication,
        details: response
    };
}

// ============================================================================
// LAYER 4: LLM Verification #2 - Cross-Validation (Independent Check)
// Uses PRIMARY_MODEL (korean:8b) for fast verification
// ============================================================================
async function verifyCrossValidation(original: string, converted: string): Promise<{
    passed: boolean;
    score: number;
    details: string;
}> {
    const prompt = `[독립 검증] 당신은 두 번째 팩트체커로 독립적인 검증을 제공합니다.

변환된 기사를 0-100점으로 채점하세요:
- 사실 정확성 (40점): 모든 사실이 원본과 정확히 일치
- 완전성 (30점): 중요한 정보 누락 없음
- 추가 없음 (30점): 날조된 내용 없음

응답 형식:
[점수]
정확성: X/40
완전성: X/30
추가없음: X/30
총점: X/100

[발견된 문제]
- 문제 목록 또는 "없음"

[판정]
통과 (80점 이상) 또는 실패 (80점 미만)

[원본]
${original}

[변환된 기사]
${converted}`;

    const response = await callOllama(prompt, 2048, PRIMARY_MODEL);

    // Extract score - support both Korean and English formats
    let scoreMatch = response.match(/총점:\s*(\d+)/);
    if (!scoreMatch) {
        scoreMatch = response.match(/TOTAL:\s*(\d+)/i);
    }
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    const passed = score >= 80 &&
                   !response.includes('판정]\n실패') &&
                   !response.toLowerCase().includes('verdict]\nfail');

    return {
        passed,
        score,
        details: response
    };
}

// ============================================================================
// LAYER 5: Length Verification
// ============================================================================
function verifyLength(original: string, converted: string): {
    passed: boolean;
    ratio: number;
    details: string;
} {
    const ratio = converted.length / original.length;
    const passed = ratio >= MIN_LENGTH_RATIO;

    return {
        passed,
        ratio,
        details: `Length ratio: ${(ratio * 100).toFixed(1)}% (minimum ${MIN_LENGTH_RATIO * 100}%)`
    };
}

// ============================================================================
// HELPER: Expand Short Content (2nd Pass with FALLBACK_MODEL)
// Expert: Use qwen2.5:14b for high-quality expansion
// ============================================================================
async function expandContent(
    shortArticle: string,
    originalPressRelease: string,
    targetLength: number
): Promise<string> {
    const currentLength = shortArticle.length;
    const additionalNeeded = targetLength - currentLength;
    const currentRatio = ((currentLength / originalPressRelease.length) * 100).toFixed(1);

    console.log(`[2nd Pass] Expanding with ${FALLBACK_MODEL}: ${currentLength} -> ${targetLength}+ chars`);

    // Expert-recommended 2nd pass prompt: focus on adding missing facts only
    const expandPrompt = `# 2차 확장 작업 (누락 사실 추가)

## 현재 기사 (길이 부족: ${currentRatio}%, 목표 90%+)
${shortArticle}

---

## 원본 보도자료 (사실의 원천)
${originalPressRelease}

---

# 규칙
1. 기존 기사 문장은 최대한 유지합니다.
2. 누락된 사실을 추가하는 문장만 덧붙이세요.
3. 전체 길이가 ${targetLength}자 이상이 되도록 문단을 보강합니다.
4. 원본에 없는 내용은 절대 추가하지 마세요.
5. 숫자, 날짜, 이름은 원본과 완전히 동일하게.

# 필요 추가량
- 현재: ${currentLength}자
- 목표: ${targetLength}자+
- 추가 필요: ${additionalNeeded}자+

# 출력
완전한 확장된 기사를 작성하세요 (추가분만 아님).

[확장된 기사]`;

    // Use FALLBACK_MODEL (qwen2.5:14b) for high-quality expansion
    const response = await callOllama(
        expandPrompt,
        Math.max(SOLAR_OPTIONS.num_predict, Math.ceil(targetLength / 2) + 1000),
        FALLBACK_MODEL
    );

    // Remove all subtitle/structure markers from expanded content
    const content = response
        .replace(/\[(?:부제목|Subtitle|제목|확장된 기사):\s*.+?\]\n*/gi, '')
        .replace(/^##\s*(?:부제목|Subtitle)[:\s]+.+?\n*/gim, '')
        .replace(/\*\*(?:부제목|Subtitle)[:\s]*\*\*\s*.+?\n*/gi, '')
        .replace(/^###\s*Lead\s*/gim, '')
        .replace(/^###\s*Body\s*/gim, '')
        .replace(/^\[확장된 기사\]\s*/gim, '')
        .trim();

    // If expansion is longer, use it; otherwise return original
    if (content.length > shortArticle.length) {
        console.log(`[2nd Pass] Expanded: ${shortArticle.length} -> ${content.length} chars (+${content.length - shortArticle.length})`);
        return content;
    }
    console.log(`[2nd Pass] Expansion failed, keeping original`);
    return shortArticle;
}

// ============================================================================
// HELPER: Split text into sentences (Korean)
// ============================================================================
function splitSentences(text: string): string[] {
    // Korean sentence splitting: ends with . ? ! followed by space or newline
    return text
        .split(/(?<=[.?!])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 5);  // Filter very short fragments
}

// ============================================================================
// MASTER: Convert with Solar 10.7B Optimized Prompt
// Expert: Fact preservation + Length control (prevent over-expansion)
// Key improvement: Show extracted facts directly in prompt
// ============================================================================
async function convertToNews(
    pressRelease: string,
    attempt: number = 1,
    previousFeedback: string = ''
): Promise<{ content: string; subtitle: string }> {
    const inputLength = pressRelease.length;
    const minOutputLength = Math.floor(inputLength * MIN_LENGTH_RATIO);
    const maxOutputLength = Math.floor(inputLength * 1.15);  // Cap at 115% to prevent over-expansion
    const sentences = splitSentences(pressRelease);
    const sentenceCount = sentences.length;

    // PRE-EXTRACT FACTS: Show AI exactly what must be preserved
    const extractedFacts = extractFacts(pressRelease);
    const keyNumbers = [...new Set(extractedFacts.numbers.filter(n => n.length >= 2))].slice(0, 20);
    const keyDates = [...new Set(extractedFacts.dates)].slice(0, 10);
    const keyNames = [...new Set(extractedFacts.names)].slice(0, 10);

    // Add feedback from previous failed attempts
    const feedbackSection = previousFeedback ? `
═══════════════════════════════════════════════════════════════
⚠️ 경고: 이전 시도 실패! 아래 문제를 반드시 수정하세요:
${previousFeedback}
═══════════════════════════════════════════════════════════════
` : '';

    // Solar 10.7B Optimized Prompt v2 (Fact-focused, 2025-12-27)
    // Key changes: Show extracted facts, strict length cap, stronger enforcement
    const prompt = `# 역할
한국 지방정부 보도자료를 기사로 재구성하는 편집기자
${feedbackSection}

# ⚠️ 필수 보존 사실 (아래 항목 100% 포함 필수 - 누락시 실패)
📊 숫자 (${keyNumbers.length}개): ${keyNumbers.join(', ') || '없음'}
📅 날짜 (${keyDates.length}개): ${keyDates.join(', ') || '없음'}
👤 인물 (${keyNames.length}개): ${keyNames.join(', ') || '없음'}

# 출력 규칙 (엄격히 준수)
1. 길이: ${minOutputLength}~${maxOutputLength}자 (85~115%)
2. 위 숫자/날짜/인물 100% 그대로 포함
3. 원문에 없는 내용 절대 추가 금지
4. 문장 ${sentenceCount}개 유지 (±2)

# 출력 형식
[제목]
(10-20자 제목)

[부제목]
(20-40자 부제목)

[본문]
(기사 본문 - 위 필수 사실 모두 포함)

# 원문 (${inputLength}자)
${pressRelease}

[뉴스 기사]`;

    // Calculate required tokens based on input length (Korean ~2 chars per token)
    const estimatedTokens = Math.max(SOLAR_OPTIONS.num_predict, Math.ceil(inputLength / 2) + 500);
    const response = await callOllama(prompt, estimatedTokens, PRIMARY_MODEL);

    // Extract subtitle - support multiple formats:
    // 1. [Subtitle: text] or [부제목: text]
    // 2. ## Subtitle: text or ## 부제목: text
    // 3. **Subtitle:** text or **부제목:** text
    let subtitle = '';
    let subtitleMatch = response.match(/\[(?:부제목|Subtitle):\s*(.+?)\]/i);
    if (!subtitleMatch) {
        subtitleMatch = response.match(/^##\s*(?:부제목|Subtitle)[:\s]+(.+?)(?:\n|###|$)/im);
    }
    if (!subtitleMatch) {
        subtitleMatch = response.match(/\*\*(?:부제목|Subtitle)[:\s]*\*\*\s*(.+?)(?:\n|$)/i);
    }
    if (subtitleMatch) {
        subtitle = subtitleMatch[1].trim();
    }

    // Remove subtitle markers from content
    let content = response
        .replace(/\[(?:부제목|Subtitle):\s*.+?\]\n*/gi, '')
        .replace(/^##\s*(?:부제목|Subtitle)[:\s]+.+?\n*/gim, '')
        .replace(/\*\*(?:부제목|Subtitle)[:\s]*\*\*\s*.+?\n*/gi, '')
        .replace(/^###\s*Lead\s*/gim, '')
        .replace(/^###\s*Body\s*/gim, '')
        .trim();

    // Auto-expand if content is too short (less than 90% to ensure buffer above 85% minimum)
    const lengthRatio = content.length / inputLength;
    if (lengthRatio < 0.90 && content.length > 100) {
        console.log(`[EXPAND] Content too short (${(lengthRatio * 100).toFixed(1)}%), attempting expansion...`);
        const expandedContent = await expandContent(content, pressRelease, minOutputLength);
        if (expandedContent.length > content.length) {
            console.log(`[EXPAND] Expanded from ${content.length} to ${expandedContent.length} chars`);
            content = expandedContent;
        }
    }

    return { content, subtitle };
}

// ============================================================================
// Verification Log: Save each verification attempt to verification_logs table
// ============================================================================
async function logVerificationAttempt(
    articleId: string,
    round: number,
    grade: 'A' | 'B' | 'C' | 'D',
    summary: string,
    improvement: string,
    lengthRatio: number,
    processingTimeMs: number
): Promise<void> {
    try {
        const { error } = await supabaseAdmin
            .from('verification_logs')
            .insert({
                article_id: articleId,
                round: round,
                grade: grade,
                summary: summary.slice(0, 1000),  // Limit to 1000 chars
                improvement: improvement.slice(0, 1000),
                model_used: PRIMARY_MODEL,
                length_ratio: lengthRatio,
                processing_time_ms: processingTimeMs
            });

        if (error) {
            console.warn(`[verification_logs] Failed to log: ${error.message}`);
        } else {
            console.log(`[verification_logs] Round ${round}: Grade ${grade} logged`);
        }
    } catch (err) {
        console.warn(`[verification_logs] Error: ${err}`);
    }
}

// ============================================================================
// Update posts verification status
// ============================================================================
async function updatePostVerificationStatus(
    articleId: string,
    status: 'pending' | 'approved' | 'rejected' | 'reverify',
    round: number
): Promise<void> {
    try {
        const { error } = await supabaseAdmin
            .from('posts')
            .update({
                verification_status: status,
                verification_round: round
            })
            .eq('id', articleId);

        if (error) {
            console.warn(`[posts] Failed to update verification status: ${error.message}`);
        }
    } catch (err) {
        console.warn(`[posts] Error updating verification status: ${err}`);
    }
}

// ============================================================================
// MASTER: Multi-Layer Verification with Retry (5-round with logging)
// ============================================================================
interface VerificationResult {
    passed: boolean;
    grade: 'A' | 'B' | 'C' | 'D';
    attempt: number;
    content: string;
    subtitle: string;
    details: {
        layer1_extraction: ComparisonResult;
        layer3_hallucination: { passed: boolean; details: string };
        layer4_crossValidation: { passed: boolean; score: number; details: string };
        layer5_length: { passed: boolean; ratio: number; details: string };
    };
    allWarnings: string[];
}

async function processWithMultiLayerVerification(
    originalContent: string,
    articleId: string,
    region: string = 'unknown',
    title: string = ''
): Promise<VerificationResult> {
    let lastContent = '';
    let lastSubtitle = '';
    let lastDetails: VerificationResult['details'] | null = null;
    let allWarnings: string[] = [];

    // Try to find running session for logging
    await jobLogger.findRunningSession();

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const attemptStartTime = Date.now();
        console.log(`[process-single] ${articleId}: Attempt ${attempt}/${MAX_RETRIES}`);

        // Generate feedback from previous attempt
        let feedback = '';
        if (attempt > 1 && lastDetails) {
            const issues: string[] = [];
            if (!lastDetails.layer5_length.passed) {
                issues.push(`LENGTH TOO SHORT: ${(lastDetails.layer5_length.ratio * 100).toFixed(1)}% - need ${MIN_LENGTH_RATIO * 100}%+`);
            }
            if (!lastDetails.layer1_extraction.passed) {
                issues.push(`MISSING FACTS: ${lastDetails.layer1_extraction.details}`);
            }
            if (!lastDetails.layer3_hallucination.passed) {
                issues.push(`HALLUCINATION DETECTED - remove all added content`);
            }
            feedback = issues.join('\n');
        }

        // STAGE 1: Convert
        const { content, subtitle } = await convertToNews(originalContent, attempt, feedback);
        lastContent = content;
        lastSubtitle = subtitle;

        if (!content || content.length < 100) {
            allWarnings.push(`Attempt ${attempt}: Empty or too short output`);
            continue;
        }

        // LAYER 1 & 2: Extract and Compare Facts (No LLM - instant)
        const originalFacts = extractFacts(originalContent);
        const convertedFacts = extractFacts(content);
        const layer1_extraction = compareFacts(originalFacts, convertedFacts, content);

        // Log Layer 1&2 results
        const allMissing = [
            ...layer1_extraction.missingNumbers,
            ...layer1_extraction.missingDates,
            ...layer1_extraction.missingNames,
            ...layer1_extraction.missingOrgs
        ];
        await jobLogger.logLayer1_2(
            region,
            articleId,
            originalFacts as unknown as Record<string, unknown>,
            convertedFacts as unknown as Record<string, unknown>,
            allMissing,
            layer1_extraction.addedContent,
            layer1_extraction.passed
        );

        // LAYER 5: Length Check (No LLM - instant)
        const layer5_length = verifyLength(originalContent, content);

        // Log Layer 5 results
        await jobLogger.logLayer5(
            region,
            articleId,
            originalContent.length,
            content.length,
            layer5_length.ratio,
            layer5_length.passed
        );

        // Early exit if length fails (no need for expensive LLM calls)
        if (!layer5_length.passed) {
            lastDetails = {
                layer1_extraction,
                layer3_hallucination: { passed: false, details: 'Skipped - length check failed' },
                layer4_crossValidation: { passed: false, score: 0, details: 'Skipped - length check failed' },
                layer5_length
            };
            allWarnings.push(`Attempt ${attempt}: Length fail (${(layer5_length.ratio * 100).toFixed(1)}%)`);
            continue;
        }

        // LAYER 3 & 4: Run LLM verifications IN PARALLEL
        console.log(`[process-single] ${articleId}: Running Layer 3 & 4 in parallel...`);

        // Log Layer 3 & 4 start
        await Promise.all([
            jobLogger.logLayer3Start(region, articleId),
            jobLogger.logLayer4Start(region, articleId)
        ]);

        const [layer3_hallucination, layer4_crossValidation] = await Promise.all([
            verifyHallucination(originalContent, content),
            verifyCrossValidation(originalContent, content)
        ]);

        // Log Layer 3 results
        await jobLogger.logLayer3(
            region,
            articleId,
            layer3_hallucination.passed ? [] : [layer3_hallucination.details],
            layer3_hallucination.details,
            layer3_hallucination.passed
        );

        // Log Layer 4 results (parse score from details if available)
        const scoreMatch = layer4_crossValidation.details?.match(/(\d+)\/100/);
        const parsedScore = scoreMatch ? parseInt(scoreMatch[1]) : layer4_crossValidation.score;
        await jobLogger.logLayer4(
            region,
            articleId,
            Math.round(parsedScore * 0.4),  // Approximate accuracy component
            Math.round(parsedScore * 0.3),  // Approximate completeness component
            Math.round(parsedScore * 0.3),  // Approximate no_additions component
            parsedScore,
            layer4_crossValidation.passed ? [] : [layer4_crossValidation.details],
            layer4_crossValidation.passed
        );

        lastDetails = {
            layer1_extraction,
            layer3_hallucination,
            layer4_crossValidation,
            layer5_length
        };

        // Determine grade
        let grade: 'A' | 'B' | 'C' | 'D' = 'A';
        const allPassed = layer1_extraction.passed &&
                         layer3_hallucination.passed &&
                         layer4_crossValidation.passed &&
                         layer5_length.passed;

        if (!layer5_length.passed) {
            grade = layer5_length.ratio < 0.5 ? 'D' : 'C';
        } else if (!layer3_hallucination.passed || !layer1_extraction.passed) {
            grade = 'C';  // Hallucination or missing facts
        } else if (!layer4_crossValidation.passed) {
            grade = 'B';  // Minor issues in cross-validation
        }

        // Generate summary and improvement text for logging
        const summaryParts: string[] = [];
        const improvementParts: string[] = [];

        if (!layer5_length.passed) {
            summaryParts.push(`Length: ${(layer5_length.ratio * 100).toFixed(1)}% (need 85%+)`);
            improvementParts.push('Increase content length to match original');
        }
        if (!layer1_extraction.passed) {
            summaryParts.push(`Missing: ${layer1_extraction.missingNumbers.length} nums, ${layer1_extraction.missingDates.length} dates`);
            improvementParts.push('Preserve all numbers, dates, names from original');
        }
        if (!layer3_hallucination.passed) {
            summaryParts.push('Hallucination detected');
            improvementParts.push('Remove all fabricated content not in original');
        }
        if (!layer4_crossValidation.passed) {
            summaryParts.push(`Cross-validation: ${layer4_crossValidation.score}/100`);
            improvementParts.push('Improve accuracy and completeness');
        }
        if (allPassed) {
            summaryParts.push('All checks passed');
        }

        const attemptEndTime = Date.now();
        const attemptDuration = attemptEndTime - attemptStartTime;

        // Log this verification attempt to verification_logs table
        await logVerificationAttempt(
            articleId,
            attempt,
            grade,
            summaryParts.join('; ') || 'Verification complete',
            improvementParts.join('; ') || 'No improvement needed',
            layer5_length.ratio,
            attemptDuration
        );

        // ====================================================================
        // 다층 검증 체크리스트 (Ollama 기반)
        // ====================================================================
        console.log("");
        console.log("╔══════════════════════════════════════════════════════════════════════╗");
        console.log(`║ [시도 ${attempt}/${MAX_RETRIES}] 다층 검증 체크리스트                              ║`);
        console.log("╠══════════════════════════════════════════════════════════════════════╣");

        // Layer 1 & 2: 팩트 추출 & 비교
        console.log("║ [Layer 1 & 2] 팩트 추출 & 비교 (자동)                                 ║");
        console.log(`║     ${layer1_extraction.missingNumbers.length === 0 ? '[v]' : '[x]'} 숫자 보존: ${layer1_extraction.missingNumbers.length === 0 ? '전체 일치' : `${layer1_extraction.missingNumbers.length}개 누락`}                              ║`);
        console.log(`║     ${layer1_extraction.missingDates.length === 0 ? '[v]' : '[x]'} 날짜 보존: ${layer1_extraction.missingDates.length === 0 ? '전체 일치' : `${layer1_extraction.missingDates.length}개 누락`}                              ║`);
        console.log(`║     ${layer1_extraction.missingNames.length === 0 ? '[v]' : '[x]'} 이름 보존: ${layer1_extraction.missingNames.length === 0 ? '전체 일치' : `${layer1_extraction.missingNames.length}개 누락`}                              ║`);
        console.log(`║     ${layer1_extraction.missingOrgs.length === 0 ? '[v]' : '[x]'} 기관명 보존: ${layer1_extraction.missingOrgs.length === 0 ? '전체 일치' : `${layer1_extraction.missingOrgs.length}개 누락`}                            ║`);
        console.log(`║     ${layer1_extraction.addedContent.length === 0 ? '[v]' : '[x]'} 추가 내용 없음: ${layer1_extraction.addedContent.length === 0 ? '정상' : `${layer1_extraction.addedContent.length}개 추가됨`}                          ║`);
        console.log(`║     >>> 결과: ${layer1_extraction.passed ? '통과' : '실패'}                                                    ║`);
        console.log("╠══════════════════════════════════════════════════════════════════════╣");

        // Layer 3: 할루시네이션 검출 (Ollama LLM)
        console.log("║ [Layer 3] 할루시네이션 검출 (Ollama LLM)                              ║");
        console.log(`║     ${layer3_hallucination.passed ? '[v]' : '[x]'} 날조된 내용 없음: ${layer3_hallucination.passed ? '검증됨' : '할루시네이션 감지됨'}                        ║`);
        console.log(`║     >>> 결과: ${layer3_hallucination.passed ? '통과' : '실패'}                                                    ║`);
        console.log("╠══════════════════════════════════════════════════════════════════════╣");

        // Layer 4: 교차 검증 (Ollama LLM)
        console.log("║ [Layer 4] 교차 검증 (Ollama LLM - 독립 검증)                          ║");
        console.log(`║     점수: ${layer4_crossValidation.score}/100                                                 ║`);
        console.log(`║     ${layer4_crossValidation.score >= 40 ? '[v]' : '[x]'} 정확도 (40점): ${layer4_crossValidation.score >= 40 ? '통과' : '실패'}                                    ║`);
        console.log(`║     ${layer4_crossValidation.score >= 70 ? '[v]' : '[x]'} 완전성 (30점): ${layer4_crossValidation.score >= 70 ? '통과' : '확인필요'}                               ║`);
        console.log(`║     ${layer4_crossValidation.passed ? '[v]' : '[x]'} 추가 없음 (30점): ${layer4_crossValidation.passed ? '통과' : '확인필요'}                              ║`);
        console.log(`║     >>> 결과: ${layer4_crossValidation.passed ? '통과' : '실패'} (기준: 80점 이상)                               ║`);
        console.log("╠══════════════════════════════════════════════════════════════════════╣");

        // Layer 5: 길이 검증
        console.log("║ [Layer 5] 길이 검증 (자동)                                           ║");
        console.log(`║     ${layer5_length.passed ? '[v]' : '[x]'} 길이 비율: ${(layer5_length.ratio * 100).toFixed(1)}% (최소: ${MIN_LENGTH_RATIO * 100}%)                        ║`);
        console.log(`║     >>> 결과: ${layer5_length.passed ? '통과' : '실패'}                                                    ║`);
        console.log("╠══════════════════════════════════════════════════════════════════════╣");

        // 최종 등급
        console.log("║ [최종 등급 판정]                                                      ║");
        console.log(`║     등급: ${grade}                                                               ║`);
        console.log(`║     전체 통과: ${allPassed ? '예' : '아니오'}                                              ║`);
        console.log(`║     조치: ${grade === 'A' ? '발행' : '재시도 또는 수동검토'}                                              ║`);
        console.log("╠══════════════════════════════════════════════════════════════════════╣");
        console.log("║     등급 A: 전체 통과      -> 발행 (자동)                             ║");
        console.log("║     등급 B: 교차검증 낮음  -> 수동검토 (draft)                        ║");
        console.log("║     등급 C: 할루시네이션   -> 수동검토 (draft)                        ║");
        console.log("║     등급 D: 길이/중대결함  -> 수동검토 (draft)                        ║");
        console.log("╚══════════════════════════════════════════════════════════════════════╝");
        console.log("");

        // If all passed, we're done! (STRICT MODE: Only Grade A is acceptable)
        if (allPassed) {
            // Update post verification status to approved
            await updatePostVerificationStatus(articleId, 'approved', attempt);

            return {
                passed: true,
                grade: 'A',
                attempt,
                content,
                subtitle,
                details: lastDetails,
                allWarnings
            };
        }

        // Grade B/C/D: Continue retrying (STRICT MODE - only A is acceptable)
        // Previously Grade B was acceptable, now it requires manual review

        // Otherwise, add warning and retry
        const retryReason = !layer5_length.passed ? 'Length fail' : !layer3_hallucination.passed ? 'Hallucination' : 'Missing facts';
        allWarnings.push(`Attempt ${attempt}: Grade ${grade} - ${retryReason}`);

        // Log retry
        if (attempt < MAX_RETRIES) {
            await jobLogger.logRetry(region, articleId, attempt, MAX_RETRIES, retryReason);
        }
    }

    // All retries exhausted - update verification status to rejected
    await updatePostVerificationStatus(articleId, 'rejected', MAX_RETRIES);

    return {
        passed: false,
        grade: 'D',
        attempt: MAX_RETRIES,
        content: lastContent,
        subtitle: lastSubtitle,
        details: lastDetails!,
        allWarnings
    };
}

// ============================================================================
// POST Handler
// ============================================================================
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { articleId } = body;

        if (!articleId) {
            return NextResponse.json(
                { success: false, error: 'articleId is required' },
                { status: 400 }
            );
        }

        // Get article content
        const { data: article, error: fetchError } = await supabaseAdmin
            .from('posts')
            .select('id, title, content, region, source')
            .eq('id', articleId)
            .single();

        if (fetchError || !article) {
            return NextResponse.json(
                { success: false, error: 'Article not found' },
                { status: 404 }
            );
        }

        // Get region from source or region field
        const articleRegion = article.source || article.region || 'unknown';
        const articleTitle = article.title || '';

        console.log(`[process-single] Starting: ${articleId} - ${articleTitle.substring(0, 30)}...`);
        const startTime = Date.now();

        // Run multi-layer verification with retry
        const result = await processWithMultiLayerVerification(
            article.content,
            articleId,
            articleRegion,
            articleTitle
        );

        const elapsed = Date.now() - startTime;
        console.log(`[process-single] ${articleId}: Final Grade ${result.grade}, Attempts: ${result.attempt}, Time: ${elapsed}ms`);

        // Determine if we should publish (STRICT MODE: Grade A ONLY)
        const shouldPublish = result.passed && result.grade === 'A';

        // Log final result to job_logs
        await jobLogger.logResult(
            articleRegion,
            articleId,
            articleTitle,
            result.grade,
            shouldPublish,
            result.attempt,
            elapsed,
            shouldPublish ? undefined : (result.allWarnings[result.allWarnings.length - 1] || 'Manual review required')
        );
        const now = new Date().toISOString();

        // Build warnings array
        const warnings: string[] = [...result.allWarnings];
        if (result.details) {
            if (!result.details.layer5_length.passed) {
                warnings.push(result.details.layer5_length.details);
            }
            if (!result.details.layer1_extraction.passed) {
                warnings.push(result.details.layer1_extraction.details);
            }
        }

        // Update database
        const updateData: Record<string, unknown> = {
            ai_processed: true,
            ai_processed_at: now,
            ai_validation_grade: result.grade,
            ai_validation_warnings: warnings.length > 0 ? warnings : null,
            ai_retry_count: result.attempt
        };

        if (shouldPublish) {
            updateData.content = result.content;
            updateData.subtitle = result.subtitle || '';
            updateData.status = 'published';
            updateData.published_at = now;
            updateData.site_published_at = now;
        } else {
            updateData.status = 'draft';
        }

        const { error: updateError } = await supabaseAdmin
            .from('posts')
            .update(updateData)
            .eq('id', articleId);

        if (updateError) {
            throw new Error(`DB update failed: ${updateError.message}`);
        }

        return NextResponse.json({
            success: true,
            published: shouldPublish,
            grade: result.grade,
            attempts: result.attempt,
            maxRetries: MAX_RETRIES,
            lengthRatio: result.details ? Math.round(result.details.layer5_length.ratio * 100) : 0,
            crossValidationScore: result.details?.layer4_crossValidation.score || 0,
            subtitle: result.subtitle || '',
            processingTime: elapsed,
            model: PRIMARY_MODEL,
            warnings: warnings.length > 0 ? warnings : undefined,
            // Validation details for GUI display
            validation: result.details ? {
                layer1: {
                    passed: result.details.layer1_extraction.passed,
                    missingNumbers: result.details.layer1_extraction.missingNumbers?.length || 0,
                    missingDates: result.details.layer1_extraction.missingDates?.length || 0,
                    missingNames: result.details.layer1_extraction.missingNames?.length || 0,
                    missingOrgs: result.details.layer1_extraction.missingOrgs?.length || 0,
                    addedContent: result.details.layer1_extraction.addedContent?.length || 0
                },
                layer3: {
                    passed: result.details.layer3_hallucination.passed,
                    details: result.details.layer3_hallucination.details
                },
                layer4: {
                    passed: result.details.layer4_crossValidation.passed,
                    score: result.details.layer4_crossValidation.score
                },
                layer5: {
                    passed: result.details.layer5_length.passed,
                    ratio: Math.round(result.details.layer5_length.ratio * 100)
                }
            } : undefined
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[process-single] Error:', errorMessage);

        try {
            const body = await request.clone().json();
            if (body.articleId) {
                await supabaseAdmin
                    .from('posts')
                    .update({
                        ai_processed: true,
                        ai_processed_at: new Date().toISOString(),
                        ai_validation_grade: 'D',
                        ai_validation_warnings: [`Processing error: ${errorMessage}`]
                    })
                    .eq('id', body.articleId);
            }
        } catch {
            // Ignore secondary error
        }

        return NextResponse.json(
            { success: false, published: false, grade: 'D', error: errorMessage },
            { status: 500 }
        );
    }
}
