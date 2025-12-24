import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Local Ollama configuration - Korean news-specialized model
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'benedict/linkbricks-hermes3-llama3.1-8b-korean-advanced-q4';

// Retry configuration
const MAX_RETRIES = 10;
const MIN_LENGTH_RATIO = 0.7;  // 70% minimum

// ============================================================================
// LAYER 0: Ollama API Call
// ============================================================================
async function callOllama(prompt: string): Promise<string> {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            prompt: prompt,
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || '';
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
// ============================================================================
async function verifyHallucination(original: string, converted: string): Promise<{
    passed: boolean;
    details: string;
}> {
    const prompt = `[CRITICAL TASK] You are a strict fact-checker for a news agency.
Compare the converted article against the original press release.

YOUR ONLY JOB: Find ANY fabricated/added information that does NOT exist in the original.

CHECK FOR:
1. Numbers that don't match (amounts, dates, quantities)
2. Names that don't exist in original
3. Quotes that were invented
4. Claims or statements not in original
5. Speculative language ("expected to", "likely", "probably")

RESPOND IN THIS EXACT FORMAT:
[HALLUCINATION CHECK]
- Fabricated content found: YES or NO
- If YES, list each item:
  * [type]: [specific content]
- Final verdict: PASS or FAIL

[Original]
${original}

[Converted]
${converted}`;

    const response = await callOllama(prompt);

    const hasFabrication = response.toLowerCase().includes('fabricated content found: yes') ||
                          response.toLowerCase().includes('final verdict: fail');

    return {
        passed: !hasFabrication,
        details: response
    };
}

// ============================================================================
// LAYER 4: LLM Verification #2 - Cross-Validation (Independent Check)
// ============================================================================
async function verifyCrossValidation(original: string, converted: string): Promise<{
    passed: boolean;
    score: number;
    details: string;
}> {
    const prompt = `[INDEPENDENT VERIFICATION] You are a second fact-checker providing independent verification.

Score the converted article on a scale of 0-100 based on:
- Factual accuracy (40 points): All facts match original exactly
- Completeness (30 points): No important information missing
- No additions (30 points): No invented content

RESPOND IN THIS EXACT FORMAT:
[SCORE]
Accuracy: X/40
Completeness: X/30
No additions: X/30
TOTAL: X/100

[ISSUES FOUND]
- List any issues here, or "None"

[VERDICT]
PASS (80+) or FAIL (<80)

[Original]
${original}

[Converted]
${converted}`;

    const response = await callOllama(prompt);

    // Extract score
    const scoreMatch = response.match(/TOTAL:\s*(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    const passed = score >= 80 && !response.toLowerCase().includes('verdict]\nfail');

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
// MASTER: Convert with Enhanced Prompt (includes feedback from previous attempts)
// ============================================================================
async function convertToNews(
    pressRelease: string,
    attempt: number = 1,
    previousFeedback: string = ''
): Promise<{ content: string; subtitle: string }> {
    const inputLength = pressRelease.length;
    const minOutputLength = Math.floor(inputLength * MIN_LENGTH_RATIO);

    let lengthGuidance = '';
    if (inputLength < 500) {
        lengthGuidance = '[Short] Lead paragraph + details';
    } else if (inputLength < 1500) {
        lengthGuidance = '[Medium] Lead + structured info + quotes (if any)';
    } else {
        lengthGuidance = '[Long] Lead + subtopics + quotes';
    }

    // Add feedback from previous failed attempts
    const feedbackSection = previousFeedback ? `
---
# CRITICAL: Previous Attempt Failed!
${previousFeedback}
You MUST fix these issues in this attempt.
---
` : '';

    const prompt = `# Role
You are an expert editor who ONLY reformats government press releases.
You have 20 years of experience at a regional newspaper in Gwangju/Jeonnam.
Your ONLY job is to restructure - NEVER add any new information.
${feedbackSection}
---

# ABSOLUTE RULES (Violation = Immediate Rejection)

## 1. Source Truth ONLY
- Use ONLY facts explicitly stated in the press release
- NEVER add numbers, statistics, analysis, or predictions
- NEVER use speculative language ("expected to", "likely", "will probably")

## 2. If Unknown, Leave Out
- If information is not in the press release, DO NOT write about it
- NEVER guess or fill in gaps with common knowledge
- If you cannot write without adding info, mark as "[OMITTED - hallucination risk]"

## 3. Preserve Numbers & Names EXACTLY
- Copy all numbers, dates, amounts, names EXACTLY as written
- Do not create new abbreviations
- Keep the 5W1H structure identical to original

## 4. Quote Rules
- Use ONLY quotes that exist in the press release
- NEVER invent quotes
- If no quotes exist, write without quotes

## 5. Forbidden Areas
- NO background information not in the press release
- NO policy interpretations
- NO external statistics or current events

## 6. LENGTH REQUIREMENT (CRITICAL!)
- Original: ${inputLength} characters
- Minimum output: ${minOutputLength} characters (${MIN_LENGTH_RATIO * 100}%+ of original)
- Structure: ${lengthGuidance}
- Include ALL important information. RESTRUCTURE, do not summarize.

---

# Output Format

## Subtitle (MUST be first line)
[Subtitle: One sentence summary of key point]

## Body Structure
- Lead: 2-3 sentences with core facts
- Body: Details with structured formatting
- Quotes: Only if they exist in original

---

[Press Release]
${pressRelease}

[News Article]`;

    const response = await callOllama(prompt);

    const subtitleMatch = response.match(/\[(?:부제목|Subtitle):\s*(.+?)\]/i);
    const subtitle = subtitleMatch ? subtitleMatch[1].trim() : '';
    const content = response.replace(/\[(?:부제목|Subtitle):\s*.+?\]\n*/gi, '').trim();

    return { content, subtitle };
}

// ============================================================================
// MASTER: Multi-Layer Verification with Retry
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
    articleId: string
): Promise<VerificationResult> {
    let lastContent = '';
    let lastSubtitle = '';
    let lastDetails: VerificationResult['details'] | null = null;
    let allWarnings: string[] = [];

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
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

        // LAYER 5: Length Check (No LLM - instant)
        const layer5_length = verifyLength(originalContent, content);

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
        const [layer3_hallucination, layer4_crossValidation] = await Promise.all([
            verifyHallucination(originalContent, content),
            verifyCrossValidation(originalContent, content)
        ]);

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
        allWarnings.push(`Attempt ${attempt}: Grade ${grade} - ${!layer5_length.passed ? 'Length fail' : !layer3_hallucination.passed ? 'Hallucination' : 'Missing facts'}`);
    }

    // All retries exhausted
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
            .select('id, title, content, region')
            .eq('id', articleId)
            .single();

        if (fetchError || !article) {
            return NextResponse.json(
                { success: false, error: 'Article not found' },
                { status: 404 }
            );
        }

        console.log(`[process-single] Starting: ${articleId} - ${article.title?.substring(0, 30)}...`);
        const startTime = Date.now();

        // Run multi-layer verification with retry
        const result = await processWithMultiLayerVerification(article.content, articleId);

        const elapsed = Date.now() - startTime;
        console.log(`[process-single] ${articleId}: Final Grade ${result.grade}, Attempts: ${result.attempt}, Time: ${elapsed}ms`);

        // Determine if we should publish (STRICT MODE: Grade A ONLY)
        const shouldPublish = result.passed && result.grade === 'A';
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
            model: OLLAMA_MODEL,
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
