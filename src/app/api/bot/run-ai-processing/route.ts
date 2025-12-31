import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import os from 'os';

const isWindows = os.platform() === 'win32';

// Global state for processing control (toggle)
let isProcessingActive = false;
let shouldStopProcessing = false;
let processingStats = {
    total: 0,
    processed: 0,
    published: 0,
    held: 0,
    failed: 0,
    startedAt: null as string | null
};

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Local Ollama configuration - Linkbricks Korean 8B (Grade A verified, 105s)
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const PRIMARY_MODEL = 'benedict/linkbricks-llama3.1-korean:8b';  // Grade A verified, Korean-focused
const FALLBACK_MODEL = 'solar:10.7b';     // Fallback (bilingual but reliable)

// Ollama API settings - Korean model optimized parameters
const NUM_CTX = 4096;             // Reduced from 8192 (Korean KV cache optimization)
const NUM_PREDICT = 2048;         // Reduced from 4096
const API_TIMEOUT_MS = 180000;    // 3 minutes (Korean models faster with optimized settings)

// Start Ollama directly (no API endpoint dependency - fixes port mismatch issue)
async function ensureOllamaRunning(maxRetries: number = 3): Promise<{ success: boolean; message: string }> {
    console.log('[Ollama] Ensuring Ollama is running...');

    // First check if already running
    try {
        const healthCheck = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            signal: AbortSignal.timeout(3000)
        });
        if (healthCheck.ok) {
            console.log('[Ollama] Already running and healthy');
            return { success: true, message: 'Ollama already running' };
        }
    } catch {
        console.log('[Ollama] Not running, attempting to start directly...');
    }

    // Try to start Ollama directly (not via API - fixes port mismatch when dev server uses different port)
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Ollama] Direct start attempt ${attempt}/${maxRetries}...`);

            // Spawn Ollama serve directly
            if (isWindows) {
                const ollamaProcess = spawn('powershell', [
                    '-WindowStyle', 'Hidden',
                    '-Command', 'Start-Process -FilePath ollama -ArgumentList serve -WindowStyle Hidden'
                ], {
                    detached: true,
                    stdio: 'ignore',
                    windowsHide: true
                });
                ollamaProcess.unref();
            } else {
                const ollamaProcess = spawn('ollama', ['serve'], {
                    shell: true,
                    detached: true,
                    stdio: 'ignore'
                });
                ollamaProcess.unref();
            }

            // Wait for Ollama to be ready (poll health endpoint)
            const maxWaitTime = 15000; // 15 seconds
            const startTime = Date.now();
            let lastError = '';

            while (Date.now() - startTime < maxWaitTime) {
                try {
                    const healthCheck = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
                        signal: AbortSignal.timeout(2000)
                    });
                    if (healthCheck.ok) {
                        console.log('[Ollama] Started successfully (direct spawn)');
                        return { success: true, message: 'Ollama started' };
                    }
                    lastError = `HTTP ${healthCheck.status}`;
                } catch (e) {
                    lastError = e instanceof Error ? e.message : 'Connection refused';
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`[Ollama] Start attempt ${attempt} timeout after ${maxWaitTime/1000}s: ${lastError}`);

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.log(`[Ollama] Start attempt ${attempt} error: ${message}`);
        }

        // Wait before retry (increasing delay)
        if (attempt < maxRetries) {
            const delay = attempt * 2000; // 2s, 4s
            console.log(`[Ollama] Waiting ${delay / 1000}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    return { success: false, message: `Failed to start Ollama after ${maxRetries} attempts` };
}

// Call local Ollama API with timeout and expert-recommended parameters
async function callOllama(prompt: string, model: string = PRIMARY_MODEL): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        console.log(`[Ollama] Calling ${model}...`);
        const startTime = Date.now();

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
                    temperature: 0.35,      // Expert: balanced output
                    top_p: 0.9,
                    repeat_penalty: 1.02,   // Expert: lowered to preserve length
                    num_gpu: 32,            // GPU layers limit for Korean models
                    gpu_layers: 32          // Prevent VRAM overflow on RTX 4070 12GB
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

// Validate output: check for English ratio and length
function validateOutput(original: string, output: string): { valid: boolean; reason?: string } {
    // Check for English ratio (more than 10% English = invalid)
    const englishChars = (output.match(/[a-zA-Z]/g) || []).length;
    const koreanChars = (output.match(/[\uAC00-\uD7AF]/g) || []).length;
    const englishRatio = englishChars / (koreanChars + englishChars + 1);

    if (englishRatio > 0.1) {
        return { valid: false, reason: `English ratio too high: ${(englishRatio * 100).toFixed(1)}%` };
    }

    // Check length (should be within 10% of original, not too short)
    const lengthRatio = output.length / original.length;
    if (lengthRatio < 0.5) {
        return { valid: false, reason: `Output too short: ${(lengthRatio * 100).toFixed(1)}% of original` };
    }

    return { valid: true };
}

// Stage 1: Convert press release to news article (Korean prompt)
// retryCount: 0 = first attempt, 1+ = retry with stricter rules
async function convertToNews(pressRelease: string, retryCount: number = 0): Promise<{ content: string; subtitle: string }> {
    const inputLength = pressRelease.length;
    const minLength = Math.floor(inputLength * 0.9);
    const maxLength = Math.floor(inputLength * 1.1);

    // Ultra-strict Korean-only prompt (reinforced version)
    const prompt = `[시스템 역할]
너는 대한민국 지역 뉴스 전문 편집자다.
보도자료를 뉴스 기사로 편집하는 것이 임무다.

##################################################
##  🚨🚨🚨 절대 위반 금지 규칙 (P0) 🚨🚨🚨  ##
##################################################

1. 언어: 오직 한국어만 사용
   - 영어 단어 1개라도 사용 금지
   - "the", "a", "is", "are" 등 영어 절대 불가
   - 영어 약어도 한글로: CEO→대표, AI→인공지능, IT→정보기술
   - 위반시: 출력 폐기 후 재생성

2. 길이: 원문 길이 유지 (${minLength}자 ~ ${maxLength}자)
   - 요약 금지, 축소 금지, 생략 금지
   - 원문의 모든 문단, 모든 정보 포함 필수
   - 위반시: 출력 폐기 후 재생성

3. 팩트: 원본 사실 100% 보존
   - 숫자(금액, 날짜, 수량) 그대로 유지
   - 이름(사람, 기관, 지역) 그대로 유지
   - 새로운 정보 추가 절대 금지

##################################################
##  편집 규칙 (P1)  ##
##################################################

1. 첫 줄에 반드시 부제목 작성:
   [부제목: 기사 핵심을 15자 이내로 요약]

2. 오타, 띄어쓰기 오류 수정

3. 삭제 대상 (불필요 정보):
   - 담당자 이름, 전화번호, 이메일
   - HTML 태그, 저작권 문구
   - "문의:", "담당:" 등 연락처 정보

4. 보존 대상 (필수 정보):
   - 행사명, 일시, 장소, 참석자
   - 예산, 지원금, 통계 수치
   - 인용문, 발언 내용

##################################################
${retryCount > 0 ? `
##  ⚠️ 재시도 ${retryCount}회차 - 이전 출력 실패 이유:  ##
##################################################
- 영어 포함 또는 길이 부족으로 검증 실패
- 이번에는 반드시:
  * 한국어만 사용 (영어 0개)
  * 원문 길이(${inputLength}자) 유지
  * 원문 문장을 최대한 그대로 사용
##################################################
` : ''}
##  출력 형식  ##
##################################################

[부제목: (15자 이내 핵심 요약)]

(본문 - 원문 길이와 동일하게 작성)

##################################################
##  입력 보도자료  ##
##################################################
${pressRelease}

##################################################
##  출력 뉴스 기사 (한국어만, ${minLength}~${maxLength}자)  ##
##################################################`;

    const response = await callOllama(prompt);

    // Parse subtitle from response
    const subtitleMatch = response.match(/\[부제목:\s*(.+?)\]/);
    const subtitle = subtitleMatch ? subtitleMatch[1].trim() : '';

    // Remove subtitle line from content
    let content = response.replace(/\[부제목:\s*.+?\]\n*/g, '').trim();

    // Validate output
    const validation = validateOutput(pressRelease, content);
    if (!validation.valid) {
        console.log(`[Ollama] Output validation failed: ${validation.reason}`);
        throw new Error(`Output validation failed: ${validation.reason}`);
    }

    return { content, subtitle };
}

// Stage 2: Verify facts (hallucination check) - Korean prompt for Korean model
async function verifyFacts(original: string, converted: string): Promise<{ verification: string; hasHallucination: boolean; grade: string }> {
    const prompt = `너는 팩트체크 전문가다. 원본과 변환된 기사를 비교하여 사실관계를 검증해줘.

검증 항목:
1. 숫자(금액, 비율, 수량)가 원본과 일치하는지
2. 날짜가 원본과 일치하는지
3. 이름(사람, 기관)이 원본과 일치하는지
4. 원본에 없는 내용이 추가되었는지

반드시 다음 형식으로 답변해줘:
[검증결과]
- 숫자 일치: O 또는 X (불일치시 상세 내용)
- 날짜 일치: O 또는 X (불일치시 상세 내용)
- 이름 일치: O 또는 X (불일치시 상세 내용)
- 추가된 내용: 없음 또는 있음 (있으면 상세 내용)
- 최종판정: 통과 또는 수정필요

[원본]
${original}

[변환된 기사]
${converted}`;

    const verification = await callOllama(prompt);

    // Determine grade based on Korean verification result
    const hasHallucination = verification.includes('수정필요') ||
                            verification.includes('추가된 내용: 있음') ||
                            verification.includes('X (') ||
                            verification.includes(': X');

    let grade = 'A';
    if (hasHallucination) {
        if (verification.includes('숫자 일치: X') || verification.includes('날짜 일치: X')) {
            grade = 'C'; // Critical fact error
        } else {
            grade = 'B'; // Minor issue
        }
    }

    return { verification, hasHallucination, grade };
}

// Process single article with local Ollama - with retry logic for C/D grades
const MAX_RETRIES = 3;

async function processArticle(article: { id: string; title: string; content: string }): Promise<{
    success: boolean;
    published: boolean;
    grade: string;
    retryCount: number;
    error?: string;
}> {
    let lastGrade = 'D';
    let lastContent = '';
    let lastSubtitle = '';
    let lastVerification = '';

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            console.log(`[Ollama] Processing article: ${article.id} - ${article.title?.substring(0, 30)}... (attempt ${attempt + 1}/${MAX_RETRIES})`);

            // Stage 1: Convert to news article (with retry count for stricter prompts)
            const { content: convertedContent, subtitle } = await convertToNews(article.content, attempt);

            if (!convertedContent || convertedContent.length < 100) {
                console.log(`[Ollama] Attempt ${attempt + 1}: Content too short, retrying...`);
                continue;
            }

            // Stage 2: Verify facts
            const { grade, hasHallucination, verification } = await verifyFacts(article.content, convertedContent);

            console.log(`[Ollama] Article ${article.id} attempt ${attempt + 1}: Grade ${grade}, Hallucination: ${hasHallucination}`);

            lastGrade = grade;
            lastContent = convertedContent;
            lastSubtitle = subtitle;
            lastVerification = verification;

            // If passed (A or B), break and publish
            if (grade === 'A' || grade === 'B') {
                console.log(`[Ollama] Article ${article.id}: PASSED on attempt ${attempt + 1}`);
                break;
            }

            // If C/D grade and more retries available, continue
            if (attempt < MAX_RETRIES - 1) {
                console.log(`[Ollama] Article ${article.id}: Grade ${grade}, retrying with stricter prompt...`);
                await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between retries
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error(`[Ollama] Error on attempt ${attempt + 1} for ${article.id}:`, errorMessage);

            if (attempt === MAX_RETRIES - 1) {
                // Last attempt failed
                await supabaseAdmin
                    .from('posts')
                    .update({
                        ai_processed: true,
                        ai_processed_at: new Date().toISOString(),
                        ai_validation_grade: 'D',
                        ai_validation_warnings: [`Processing error after ${MAX_RETRIES} attempts: ${errorMessage}`]
                    })
                    .eq('id', article.id);

                return {
                    success: false,
                    published: false,
                    grade: 'D',
                    retryCount: attempt + 1,
                    error: errorMessage
                };
            }
        }
    }

    // After all attempts, save the best result
    const shouldPublish = lastGrade === 'A' || lastGrade === 'B';
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = {
        ai_processed: true,
        ai_processed_at: now,
        ai_validation_grade: lastGrade,
        ai_validation_warnings: shouldPublish ? null : [lastVerification],
    };

    if (shouldPublish) {
        // Grade A/B: Update content, subtitle and publish
        updateData.content = lastContent;
        updateData.subtitle = lastSubtitle || '';
        updateData.status = 'published';
        updateData.published_at = now;
        updateData.site_published_at = now;
        console.log(`[Ollama] Article ${article.id}: PUBLISHED with grade ${lastGrade}`);
    } else {
        // Grade C/D after all retries: Keep original, hold as draft
        updateData.status = 'draft';
        console.log(`[Ollama] Article ${article.id}: HELD with grade ${lastGrade} after ${MAX_RETRIES} attempts`);
    }

    const { error: updateError } = await supabaseAdmin
        .from('posts')
        .update(updateData)
        .eq('id', article.id);

    if (updateError) {
        console.error(`[Ollama] DB update failed for ${article.id}:`, updateError.message);
        return {
            success: false,
            published: false,
            grade: lastGrade,
            retryCount: MAX_RETRIES,
            error: updateError.message
        };
    }

    return {
        success: true,
        published: shouldPublish,
        grade: lastGrade,
        retryCount: MAX_RETRIES
    };
}

// Background processing function (runs async, doesn't block response)
async function runBackgroundProcessing(articles: { id: string; title: string; content: string }[]) {
    let published = 0;
    let held = 0;
    let failed = 0;

    try {
        for (const article of articles) {
            // Check if stop requested
            if (shouldStopProcessing) {
                console.log('[run-ai-processing] Stop requested, halting processing...');
                break;
            }

            const result = await processArticle(article);

            processingStats.processed++;
            if (result.success) {
                if (result.published) {
                    published++;
                    processingStats.published++;
                } else {
                    held++;
                    processingStats.held++;
                }
            } else {
                failed++;
                processingStats.failed++;
            }

            // Small delay between articles to prevent overload
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`[run-ai-processing] ${shouldStopProcessing ? 'Stopped' : 'Complete'}: published=${published}, held=${held}, failed=${failed}`);
    } catch (error) {
        console.error('[run-ai-processing] Background processing error:', error);
    } finally {
        isProcessingActive = false;
        shouldStopProcessing = false;
    }
}

// POST: Trigger AI processing on pending articles using local Ollama
// Returns immediately, processing runs in background
export async function POST(req: NextRequest) {
    console.log('[run-ai-processing] POST request received');

    // Parse request body to get limit parameter
    let limit = 10; // Default limit
    try {
        const body = await req.json();
        if (body.limit && typeof body.limit === 'number' && body.limit > 0) {
            limit = Math.min(body.limit, 100); // Cap at 100 max
        }
        console.log(`[run-ai-processing] Limit: ${limit} articles`);
    } catch {
        // No body or invalid JSON, use default limit
        console.log('[run-ai-processing] No limit specified, using default: 10');
    }

    // If already processing, return current status
    if (isProcessingActive) {
        return NextResponse.json({
            success: false,
            error: 'Processing already in progress',
            stats: processingStats
        }, { status: 409 });
    }

    console.log(`[run-ai-processing] Using Ollama at ${OLLAMA_BASE_URL} with primary model ${PRIMARY_MODEL}`);

    try {
        // Ensure Ollama is running (with retry logic)
        console.log('[run-ai-processing] Ensuring Ollama is running...');
        const ollamaResult = await ensureOllamaRunning(3);

        if (!ollamaResult.success) {
            return NextResponse.json({
                success: false,
                error: `Ollama 시작 실패: ${ollamaResult.message}`,
                hint: 'Ollama가 설치되어 있는지 확인하세요. (ollama.com)'
            }, { status: 503 });
        }

        console.log('[run-ai-processing] Ollama is ready, fetching pending articles...');

        // Step 1: Get pending articles with limit applied
        // Split limit between unprocessed and failed articles (prioritize unprocessed)
        const unprocessedLimit = Math.ceil(limit * 0.7); // 70% for unprocessed
        const failedLimit = Math.floor(limit * 0.3);      // 30% for retry

        const { data: unprocessed, error: err1 } = await supabaseAdmin
            .from('posts')
            .select('id, title, content, region')
            .eq('status', 'draft')
            .or('ai_processed.is.null,ai_processed.eq.false')
            .order('created_at', { ascending: true })
            .limit(unprocessedLimit);

        if (err1) throw err1;

        // Get C/D grade articles for retry (only if we have room)
        let failedArticles: typeof unprocessed = [];
        if (failedLimit > 0) {
            const { data: failed, error: err2 } = await supabaseAdmin
                .from('posts')
                .select('id, title, content, region')
                .eq('status', 'draft')
                .eq('ai_processed', true)
                .in('ai_validation_grade', ['C', 'D'])
                .order('created_at', { ascending: true })
                .limit(failedLimit);

            if (err2) throw err2;
            failedArticles = failed || [];
        }

        // Combine and dedupe, then apply final limit
        const allArticles = [...(unprocessed || []), ...failedArticles];
        const articles = allArticles
            .filter((article, index, self) =>
                index === self.findIndex(a => a.id === article.id)
            )
            .slice(0, limit); // Final safety limit

        console.log(`[run-ai-processing] Found ${unprocessed?.length || 0} unprocessed + ${failedArticles?.length || 0} C/D grade articles (limit: ${limit})`);

        if (!articles || articles.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No pending articles to process',
                total: 0
            });
        }

        console.log(`[run-ai-processing] Starting background processing for ${articles.length} articles`);

        // Initialize global stats
        isProcessingActive = true;
        shouldStopProcessing = false;
        processingStats = {
            total: articles.length,
            processed: 0,
            published: 0,
            held: 0,
            failed: 0,
            startedAt: new Date().toISOString()
        };

        // Start background processing (don't await - returns immediately)
        runBackgroundProcessing(articles);

        // Return immediately with "started" response
        return NextResponse.json({
            success: true,
            message: `Processing started for ${articles.length} articles`,
            total: articles.length,
            stats: processingStats
        });

    } catch (error: unknown) {
        isProcessingActive = false;
        shouldStopProcessing = false;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[run-ai-processing] Error:', errorMessage);
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

// GET: Check processing status
export async function GET() {
    return NextResponse.json({
        isActive: isProcessingActive,
        stats: processingStats
    });
}

// DELETE: Stop processing
export async function DELETE() {
    if (!isProcessingActive) {
        return NextResponse.json({
            success: false,
            message: 'No active processing to stop'
        });
    }

    shouldStopProcessing = true;
    console.log('[run-ai-processing] Stop signal sent');

    return NextResponse.json({
        success: true,
        message: 'Stop signal sent. Processing will halt after current article.'
    });
}
