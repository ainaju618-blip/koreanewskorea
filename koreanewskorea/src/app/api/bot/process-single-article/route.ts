import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getJobLogger } from '@/lib/job-logger';
import { shareToSocialMedia } from '@/lib/social';
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
// Llama Korean 8B Production Configuration (Expert Optimized - 2025-12-27)
// Changed from Solar 10.7B due to mixed language output issues
// ============================================================================
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const PRIMARY_MODEL = 'benedict/linkbricks-llama3.1-korean:8b';  // Korean-native model
const FALLBACK_MODEL = 'exaone3.5:7.8b';  // EXAONE as fallback (also Korean-native)

// Expert-optimized settings for Llama Korean 8B (2025-12-27 V2 Consultation)
const MODEL_OPTIONS = {
    num_ctx: 4096,          // Context window
    num_predict: 1024,      // Will be dynamically calculated per article
    temperature: 0.25,      // EXPERT V2: Slightly higher for natural flow
    repeat_penalty: 1.12,   // EXPERT V2: Prevent repetition
    top_p: 0.85,            // Focused output
    num_gpu: 30,            // GPU layers for RTX 4070 12GB
    gpu_layers: 30          // Prevent VRAM overflow (8.5GB model)
    // No mirostat - expert says disable for Korean models
};

// Stop sequences for Hanja/English prevention
const STOP_SEQUENCES = [
    "\u5149", "\u63D0", "\u8FB2", "\u80B2", "\u589E", "\u65B0",  // Common Hanja
    "Sunset", "Sunrise", "Consulting"  // English words
];

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
    minTokens: number = MODEL_OPTIONS.num_predict,
    model: string = PRIMARY_MODEL,
    useStopSequences: boolean = true  // EXPERT: Use stop sequences by default
): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        console.log(`[Ollama] Calling ${model} (tokens: ${minTokens}, stop: ${useStopSequences})...`);
        const startTime = Date.now();

        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    ...MODEL_OPTIONS,
                    num_predict: minTokens   // Override with specific token count
                },
                // EXPERT: Stop sequences to prevent Hanja/English at generation level
                ...(useStopSequences && { stop: STOP_SEQUENCES })
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

    // EXPERT: Verification calls should NOT use stop sequences (need full analysis)
    const response = await callOllama(prompt, 2048, PRIMARY_MODEL, false);

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

    // EXPERT: Verification calls should NOT use stop sequences (need full analysis)
    const response = await callOllama(prompt, 2048, PRIMARY_MODEL, false);

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
        Math.max(MODEL_OPTIONS.num_predict, Math.ceil(targetLength / 2) + 1000),
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
// LIGHTWEIGHT MODE: Generate Title/Subtitle/Summary Only (Keep Original Content)
// Purpose: Minimize hallucination risk by preserving original press release content
// Only AI-generated: title, subtitle, summary
// ============================================================================
interface MetadataResult {
    title: string;
    subtitle: string;
    summary: string;
    tags: string[];  // Auto-generated tags from content
    validated: boolean;
    validationDetails?: string;
}

// ============================================================================
// METADATA VALIDATOR: Verify numbers/names in title exist in original content
// Critical for preventing hallucinated statistics or names in headlines
// ============================================================================
interface ValidationResult {
    isValid: boolean;
    invalidNumbers: string[];
    invalidNames: string[];
    details: string;
}

function validateMetadataFacts(
    metadata: { title: string; subtitle: string; summary: string },
    originalContent: string
): ValidationResult {
    const invalidNumbers: string[] = [];
    const invalidNames: string[] = [];

    // Extract numbers from title and subtitle (most critical)
    // Patterns: 1000, 1,000, 100만, 50억, 30%, 12월, 25일
    const numberPattern = /\d+(?:,\d{3})*(?:\.\d+)?(?:만|억|천|백)?(?:%|퍼센트|원|명|개|건|회|차|일|월|년|kg|톤)?/g;

    const titleNumbers = metadata.title.match(numberPattern) || [];
    const subtitleNumbers = metadata.subtitle.match(numberPattern) || [];
    const allMetadataNumbers = [...titleNumbers, ...subtitleNumbers];

    // Verify each number exists in original content
    for (const num of allMetadataNumbers) {
        // Extract just the numeric part for flexible matching
        const numericPart = num.replace(/[^0-9,.]/g, '');
        if (numericPart.length < 2) continue;  // Skip single digits

        // Check if this number appears in original content
        const foundInOriginal = originalContent.includes(numericPart) ||
                               originalContent.includes(num) ||
                               originalContent.replace(/,/g, '').includes(numericPart.replace(/,/g, ''));

        if (!foundInOriginal) {
            invalidNumbers.push(num);
            console.log(`[VALIDATE] Number NOT in original: "${num}"`);
        }
    }

    // Extract Korean names from title and subtitle
    // Pattern: 2-4 Korean syllables followed by position/title
    const namePattern = /[가-힣]{2,4}(?:\s+)?(?:씨|대표|회장|군수|시장|도지사|장관|의원|교수|박사|선생|위원장|면장|과장|팀장|국장|실장|청장)/g;

    const titleNames = metadata.title.match(namePattern) || [];
    const subtitleNames = metadata.subtitle.match(namePattern) || [];
    const allMetadataNames = [...titleNames, ...subtitleNames];

    // Verify each name exists in original content
    for (const name of allMetadataNames) {
        // Extract just the name part (first 2-4 chars)
        const namePart = name.match(/^[가-힣]{2,4}/)?.[0] || '';
        if (namePart.length < 2) continue;

        const foundInOriginal = originalContent.includes(namePart) ||
                               originalContent.includes(name);

        if (!foundInOriginal) {
            invalidNames.push(name);
            console.log(`[VALIDATE] Name NOT in original: "${name}"`);
        }
    }

    const isValid = invalidNumbers.length === 0 && invalidNames.length === 0;
    const details = isValid
        ? 'All facts verified'
        : `Invalid: ${invalidNumbers.length} numbers, ${invalidNames.length} names`;

    return { isValid, invalidNumbers, invalidNames, details };
}

// ============================================================================
// SANITIZE METADATA: Remove unverified numbers/names from title
// Fallback when regeneration fails - better to have clean title than wrong data
// ============================================================================
function sanitizeMetadata(
    metadata: { title: string; subtitle: string; summary: string },
    validation: ValidationResult
): { title: string; subtitle: string; summary: string } {
    let { title, subtitle, summary } = metadata;

    // Remove invalid numbers from title and subtitle
    for (const num of validation.invalidNumbers) {
        title = title.replace(num, '').replace(/\s{2,}/g, ' ').trim();
        subtitle = subtitle.replace(num, '').replace(/\s{2,}/g, ' ').trim();
    }

    // Remove invalid names from title and subtitle
    for (const name of validation.invalidNames) {
        title = title.replace(name, '').replace(/\s{2,}/g, ' ').trim();
        subtitle = subtitle.replace(name, '').replace(/\s{2,}/g, ' ').trim();
    }

    // Clean up any leftover punctuation artifacts
    title = title.replace(/^[,\s]+|[,\s]+$/g, '').replace(/,\s*,/g, ',').trim();
    subtitle = subtitle.replace(/^[,\s]+|[,\s]+$/g, '').replace(/,\s*,/g, ',').trim();

    return { title, subtitle, summary };
}

const MAX_METADATA_RETRIES = 2;  // Max retries for metadata generation

// Generate tags from extracted facts (no AI needed - rule-based)
function generateTagsFromContent(
    organizations: string[],
    names: string[],
    content: string
): string[] {
    const tags: string[] = [];

    // Add organization names as tags (max 3)
    const uniqueOrgs = [...new Set(organizations)].slice(0, 3);
    tags.push(...uniqueOrgs);

    // Add important person names (max 2)
    const uniqueNames = [...new Set(names)].slice(0, 2);
    tags.push(...uniqueNames);

    // Extract keyword patterns from content
    const keywordPatterns = [
        /축제/g, /행사/g, /사업/g, /지원/g, /협약/g,
        /투자/g, /개발/g, /건설/g, /준공/g, /착공/g,
        /교육/g, /문화/g, /관광/g, /환경/g, /복지/g,
        /농업/g, /수산/g, /산업/g, /경제/g, /일자리/g,
        /안전/g, /재난/g, /방역/g, /의료/g, /보건/g
    ];

    for (const pattern of keywordPatterns) {
        if (pattern.test(content) && tags.length < 6) {
            const keyword = pattern.source;
            if (!tags.includes(keyword)) {
                tags.push(keyword);
            }
        }
    }

    // Remove duplicates and limit to 6 tags
    return [...new Set(tags)].slice(0, 6);
}

async function generateMetadataOnly(
    pressRelease: string,
    originalTitle: string = '',  // Fallback title from scraper
    attempt: number = 1
): Promise<MetadataResult> {
    // Extract key facts for title/subtitle generation context
    const extractedFacts = extractFacts(pressRelease);
    const keyNames = [...new Set(extractedFacts.names)].slice(0, 5);
    const keyOrgs = [...new Set(extractedFacts.organizations)].slice(0, 5);
    const keyNumbers = [...new Set(extractedFacts.numbers.filter(n => n.length >= 2))].slice(0, 10);

    // Generate tags from extracted facts (rule-based, no AI)
    const generatedTags = generateTagsFromContent(
        extractedFacts.organizations,
        extractedFacts.names,
        pressRelease
    );
    console.log(`[METADATA] Generated tags: ${generatedTags.join(', ')}`);

    // Get first 500 chars for context (usually contains key info)
    const contextSnippet = pressRelease.substring(0, 500);

    // Enhanced prompt with explicit fact constraints
    const prompt = `# 역할
보도자료의 제목, 부제목, 요약만 작성하는 편집자

# ⛔ 절대 금지
- 본문 출력 금지! (제목/부제목/요약만 출력)
- 한자 금지
- 영어 금지
- 원문에 없는 숫자/수치 사용 금지!
- 원문에 없는 인물명 사용 금지!

# 원문에 있는 정보만 사용하세요
- 기관: ${keyOrgs.join(', ') || '없음'}
- 인물: ${keyNames.join(', ') || '없음'}
- 숫자: ${keyNumbers.slice(0, 5).join(', ') || '없음'}

# 원문 요약
${contextSnippet}...

# 출력 (이것만 출력하세요!)
[제목]
10-25자 (원문에 있는 정보만!)

[부제목]
20-40자 (원문에 있는 정보만!)

[요약]
50-100자

본문은 절대 출력하지 마세요!`;

    // Very small token count - only title/subtitle/summary (no body!)
    const response = await callOllama(prompt, 256, PRIMARY_MODEL, true);

    // Parse title
    let title = '';
    const titleMatch = response.match(/\[제목\]\s*\n?(.+?)(?:\n|$)/i);
    if (titleMatch) {
        title = titleMatch[1].trim();
    }

    // Parse subtitle
    let subtitle = '';
    const subtitleMatch = response.match(/\[부제목\]\s*\n?(.+?)(?:\n|$)/i);
    if (subtitleMatch) {
        subtitle = subtitleMatch[1].trim();
    }

    // Parse summary
    let summary = '';
    const summaryMatch = response.match(/\[요약\]\s*\n?([\s\S]+?)(?:\[|$)/i);
    if (summaryMatch) {
        summary = summaryMatch[1].trim();
    }

    // Clean up - remove any Hanja/English
    const cleanText = (text: string) => text
        .replace(/[\u4E00-\u9FFF\u3400-\u4DBF]/g, '')  // Remove Hanja
        .replace(/[a-zA-Z]{3,}/g, '')  // Remove English words
        .replace(/\s{2,}/g, ' ')
        .trim();

    let cleanedTitle = cleanText(title);
    let cleanedSubtitle = cleanText(subtitle);
    const cleanedSummary = cleanText(summary);

    // ========================================================================
    // CRITICAL: Validate that numbers/names in title exist in original content
    // ========================================================================
    const validation = validateMetadataFacts(
        { title: cleanedTitle, subtitle: cleanedSubtitle, summary: cleanedSummary },
        pressRelease
    );

    if (!validation.isValid) {
        console.log(`[METADATA] Attempt ${attempt}: Validation FAILED - ${validation.details}`);

        // Strategy 1: Retry generation (up to MAX_METADATA_RETRIES)
        if (attempt < MAX_METADATA_RETRIES) {
            console.log(`[METADATA] Retrying generation (attempt ${attempt + 1})...`);
            return generateMetadataOnly(pressRelease, originalTitle, attempt + 1);
        }

        // Strategy 2: Sanitize (remove invalid data from title)
        console.log(`[METADATA] Max retries reached. Sanitizing title...`);
        const sanitized = sanitizeMetadata(
            { title: cleanedTitle, subtitle: cleanedSubtitle, summary: cleanedSummary },
            validation
        );
        cleanedTitle = sanitized.title;
        cleanedSubtitle = sanitized.subtitle;

        // Strategy 3: Fallback to original title if sanitized title is too short
        if (cleanedTitle.length < 5 && originalTitle) {
            console.log(`[METADATA] Sanitized title too short. Using original: "${originalTitle}"`);
            cleanedTitle = originalTitle.replace(/^새글\s*/, '').trim();
        }

        return {
            title: cleanedTitle,
            subtitle: cleanedSubtitle,
            summary: cleanedSummary,
            tags: generatedTags,
            validated: false,
            validationDetails: validation.details
        };
    }

    console.log(`[METADATA] Validation PASSED - all facts verified`);
    return {
        title: cleanedTitle,
        subtitle: cleanedSubtitle,
        summary: cleanedSummary,
        tags: generatedTags,
        validated: true
    };
}

// ============================================================================
// PARAGRAPH FORMATTER: Add line breaks after Korean sentence endings
// Converts plain text to HTML paragraphs for proper rendering
// ============================================================================
function formatParagraphs(content: string): string {
    // Step 0: Strip existing embedded summary HTML (legacy cleanup)
    // Summary is now displayed from ai_summary field via frontend template
    let formatted = content
        .replace(/<div class="article-summary"[^>]*>[\s\S]*?<\/div>\s*/g, '')
        .replace(/<strong>요약<\/strong>\s*\|\s*/g, '');

    // Step 0.5: Remove subtitle pattern at the beginning: "- 제목 -" or "- 제목 형식 -"
    // Pattern: - text - at the start (with optional whitespace/newlines)
    formatted = formatted.replace(/^\s*-\s+[^-\n]+\s+-\s*/m, '').trim();

    // Step 0.6: Strip existing HTML tags to start fresh (preserve text only)
    // This ensures consistent paragraph formatting
    const hasExistingHtml = /<[^>]+>/.test(formatted);
    if (hasExistingHtml) {
        formatted = formatted
            .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')  // </p><p> -> line break
            .replace(/<br\s*\/?>/gi, '\n')           // <br> -> line break
            .replace(/<[^>]+>/g, '')                  // Remove all other tags
            .replace(/&nbsp;/g, ' ')                  // &nbsp; -> space
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"');
    }

    // Step 1: Normalize line breaks and periods
    formatted = formatted
        .replace(/\r\n/g, '\n')     // Windows -> Unix line breaks
        .replace(/\r/g, '\n')       // Old Mac -> Unix line breaks
        .replace(/。/g, '.')        // Full-width period -> half-width
        .replace(/！/g, '!')        // Full-width exclamation
        .replace(/？/g, '?');       // Full-width question

    // Step 2: Add line breaks after Korean sentence endings
    // Pattern: Korean char + period + space(s) + Korean char (next sentence)
    // Examples: "펼쳤다. 이날" -> "펼쳤다.\n\n이날"
    formatted = formatted.replace(/([가-힣])[.]\s+(?=[가-힣"'])/g, '$1.\n\n');

    // Step 3: Handle exclamation and question marks
    formatted = formatted.replace(/([!?])\s+(?=[가-힣"'])/g, '$1\n\n');

    // Step 4: Clean up excessive line breaks (max 2 newlines)
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    formatted = formatted.trim();

    // Step 5: Convert to HTML paragraphs (CRITICAL for browser rendering!)
    // Split by double newlines and wrap each in <p> tags
    const paragraphs = formatted.split(/\n\n+/);
    const htmlParagraphs = paragraphs
        .map((p) => {
            p = p.trim();
            if (!p) return '';
            // If already starts with HTML tag (shouldn't happen after cleanup), keep as is
            if (p.startsWith('<')) return p;
            // Wrap in <p> tag, convert single newlines to <br>
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        })
        .filter(Boolean)
        .join('\n');

    return htmlParagraphs;
}

// ============================================================================
// LEGACY: Full Convert with Solar 10.7B Optimized Prompt
// NOTE: This is kept for backwards compatibility but LIGHTWEIGHT mode is preferred
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
WARNING: Previous attempt failed! Fix these issues:
${previousFeedback}
═══════════════════════════════════════════════════════════════
` : '';

    // Solar 10.7B Optimized Prompt v3 (Korean-only + Fact-focused, 2025-12-27)
    // Key changes: Korean-only output, no Hanja/Chinese, strict fact preservation
    const prompt = `# Role
Editor rewriting Korean local government press releases into news articles
${feedbackSection}

# FORBIDDEN (Violation = Immediate Fail)
- No Hanja: No Chinese/Japanese characters
- No English: No English words
- No "새글" prefix in title
- Only Korean + Arabic numerals allowed

# Required Facts (Must Include 100%)
Numbers: ${keyNumbers.join(', ') || 'none'}
Dates: ${keyDates.join(', ') || 'none'}
Names: ${keyNames.join(', ') || 'none'}

# Output Rules
1. Length: ${minOutputLength}~${maxOutputLength} chars (85~115%)
2. Include 100% of facts above
3. No content not in original
4. Korean only (no Hanja!)

# Output Format
[Title]
(Korean 10-20 chars)

[Subtitle]
(Korean 20-40 chars)

[Body]
(Korean article body)

# Original (${inputLength} chars)
${pressRelease}

[News Article]`;

    // EXPERT: Dynamic num_predict calculation (120% of original, capped at 2048)
    // Korean averages ~2 chars per token, so divide by 2 and add buffer
    const dynamicNumPredict = Math.min(
        Math.floor((inputLength * 1.2) / 2) + 200,  // 120% of original + buffer
        2048  // Hard cap to prevent over-expansion
    );
    console.log(`[Convert] Dynamic num_predict: ${dynamicNumPredict} (input: ${inputLength} chars)`);
    const response = await callOllama(prompt, dynamicNumPredict, PRIMARY_MODEL);

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

    // POST-PROCESSING: Remove forbidden characters
    // 1. Remove "새글" prefix
    content = content.replace(/^새글\s*/gm, '');
    // 2. Remove Chinese/Japanese characters (Hanja: CJK Unified Ideographs)
    content = content.replace(/[\u4E00-\u9FFF\u3400-\u4DBF]/g, '');
    // 3. Clean up any resulting double spaces or empty lines
    content = content.replace(/\s{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

    // Also clean subtitle
    if (subtitle) {
        subtitle = subtitle
            .replace(/^새글\s*/g, '')
            .replace(/[\u4E00-\u9FFF\u3400-\u4DBF]/g, '')
            .trim();
    }

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
// LIGHTWEIGHT MODE PROCESSOR
// Purpose: Generate title/subtitle/summary ONLY, NEVER touch body content
// Key Rule: Body content stays 100% original from Supabase DB
// Benefits: Zero hallucination risk, fast processing, SEO-friendly metadata
// ============================================================================
interface LightweightResult {
    success: boolean;
    title: string;
    subtitle: string;
    summary: string;
    tags: string[];
    processingTime: number;
    validated: boolean;
    validationDetails?: string;
    // NOTE: No content field - body is NEVER modified
}

async function processLightweight(
    originalContent: string,
    articleId: string,
    originalTitle: string = '',  // Fallback title from scraper
    _region: string = 'unknown'  // Reserved for future logging
): Promise<LightweightResult> {
    const startTime = Date.now();

    console.log(`[LIGHTWEIGHT] ${articleId}: Generating title/subtitle/summary only...`);
    console.log(`[LIGHTWEIGHT] Body content will remain UNCHANGED (DB original)`);

    // Generate title, subtitle, summary using AI
    // AI sees the content but ONLY outputs metadata, NOT body
    // Pass original title as fallback for validation failures
    const metadata = await generateMetadataOnly(originalContent, originalTitle);

    const elapsed = Date.now() - startTime;

    console.log(`[LIGHTWEIGHT] ${articleId}: Complete in ${elapsed}ms`);
    console.log(`  Title: ${metadata.title}`);
    console.log(`  Subtitle: ${metadata.subtitle}`);
    console.log(`  Summary: ${metadata.summary.substring(0, 50)}...`);
    console.log(`  Tags: ${metadata.tags.join(', ')}`);
    console.log(`  Validated: ${metadata.validated ? 'YES' : 'NO'}`);
    if (!metadata.validated) {
        console.log(`  Validation: ${metadata.validationDetails}`);
    }
    console.log(`  Body: UNCHANGED (original preserved)`);

    return {
        success: true,
        title: metadata.title,
        subtitle: metadata.subtitle,
        summary: metadata.summary,
        tags: metadata.tags,
        processingTime: elapsed,
        validated: metadata.validated,
        validationDetails: metadata.validationDetails
        // No content returned - original DB content is preserved
    };
}

// ============================================================================
// POST Handler
// Supports two modes:
//   - lightweight (default): Keep original content, only generate metadata
//   - full: Full rewrite with multi-layer verification
// ============================================================================
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { articleId, mode = 'lightweight' } = body;  // Default to lightweight mode

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

        console.log(`[process-single] Starting (${mode}): ${articleId} - ${articleTitle.substring(0, 30)}...`);
        const startTime = Date.now();

        // ========================================================================
        // LIGHTWEIGHT MODE: Generate metadata only, NEVER touch body content
        // Body stays 100% original from Supabase DB
        // Title/Subtitle validation: numbers/names must exist in original content
        // ========================================================================
        if (mode === 'lightweight') {
            const result = await processLightweight(
                article.content,
                articleId,
                articleTitle,  // Pass original title for fallback
                articleRegion
            );

            const now = new Date().toISOString();

            // Update metadata + format paragraphs (content unchanged, only line breaks added)
            const formattedContent = formatParagraphs(article.content);
            const updateData: Record<string, unknown> = {
                title: result.title || articleTitle,  // Use generated or keep original
                subtitle: result.subtitle || '',
                ai_summary: result.summary || '',  // Use ai_summary column (not summary)
                tags: result.tags || [],  // AI-generated tags from content analysis
                content: formattedContent,  // Original content with paragraph formatting only
                ai_processed: true,
                ai_processed_at: now,
                ai_validation_grade: result.validated ? 'A' : 'B',  // B if validation failed
                ai_validation_warnings: result.validated ? null : [result.validationDetails],
                ai_retry_count: 1,
                status: 'published',
                published_at: now,
                site_published_at: now
            };

            const { error: updateError } = await supabaseAdmin
                .from('posts')
                .update(updateData)
                .eq('id', articleId);

            if (updateError) {
                throw new Error(`DB update failed: ${updateError.message}`);
            }

            // Auto-share to social media (non-blocking)
            const socialResult = await shareToSocialMedia(
                articleId,
                result.title || articleTitle,
                result.summary,
                articleRegion
            );

            return NextResponse.json({
                success: true,
                mode: 'lightweight',
                published: true,
                grade: result.validated ? 'A' : 'B',
                title: result.title,
                subtitle: result.subtitle,
                summary: result.summary,
                processingTime: result.processingTime,
                validated: result.validated,
                validationDetails: result.validationDetails,
                model: PRIMARY_MODEL,
                message: result.validated
                    ? 'Body UNCHANGED, title/subtitle/summary verified'
                    : 'Body UNCHANGED, title sanitized (unverified data removed)',
                social: socialResult
            });
        }

        // ========================================================================
        // FULL MODE: Multi-layer verification with content rewrite
        // ========================================================================
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

        // Auto-share to social media if published (non-blocking)
        let socialResult = null;
        if (shouldPublish) {
            socialResult = await shareToSocialMedia(
                articleId,
                articleTitle,
                undefined,  // No summary in full mode
                articleRegion
            );
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
            } : undefined,
            social: socialResult
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
