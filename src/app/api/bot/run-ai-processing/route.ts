import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import os from 'os';
import { autoAssignReporter, getAutoAssignSetting, type AssignResult } from '@/lib/auto-assign';

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
    startedAt: null as string | null,
    lastArticle: null as { title: string; grade: string; status: 'published' | 'held' | 'failed' } | null
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
// 원문에서 핵심 키워드 추출 (숫자, 고유명사, 주요 명사)
function extractKeywords(text: string): string[] {
    const keywords: string[] = [];

    // 1. 숫자 포함 표현 (연도, 금액, 퍼센트 등)
    const numbers = text.match(/\d+(?:,\d{3})*(?:\.\d+)?(?:원|억|만|%|년|월|일|개|명|건)?/g) || [];
    keywords.push(...numbers);

    // 2. 큰따옴표 안의 문구 (인용문, 고유명사)
    const quoted = text.match(/["'「」『』]([^"'「」『』]+)["'「」『』]/g) || [];
    quoted.forEach(q => {
        const clean = q.replace(/["'「」『』]/g, '').trim();
        if (clean.length >= 2) keywords.push(clean);
    });

    // 3. 기관/단체명 패턴 (OO부, OO청, OO원, OO시, OO도 등)
    const orgs = text.match(/[가-힣]{2,10}(?:부|청|원|처|위원회|공사|공단|협회|연구원|진흥원|재단|센터)/g) || [];
    keywords.push(...orgs);

    // 4. 지역명
    const regions = text.match(/(?:서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)(?:시|도|특별시|광역시)?/g) || [];
    keywords.push(...regions);

    // 5. 주요 명사 (2-6글자 한글 단어)
    const nouns = text.match(/[가-힣]{2,6}(?=이|가|을|를|은|는|에|의|로|으로|과|와|도|만|부터|까지|에서)/g) || [];
    keywords.push(...nouns.filter(n => n.length >= 3));

    // 중복 제거 및 너무 일반적인 단어 필터링
    const commonWords = new Set(['하는', '있는', '위한', '대한', '관련', '통해', '따라', '위해', '있다', '했다', '된다', '한다']);
    const uniqueKeywords = [...new Set(keywords)].filter(k => !commonWords.has(k) && k.length >= 2);

    return uniqueKeywords;
}

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

    // ★ 핵심어 일치 검증 (환각 방지)
    const originalKeywords = extractKeywords(original);
    if (originalKeywords.length >= 3) {
        const matchedKeywords = originalKeywords.filter(kw => output.includes(kw));
        const matchRatio = matchedKeywords.length / originalKeywords.length;

        // 최소 30% 이상의 핵심어가 출력에 포함되어야 함
        if (matchRatio < 0.3) {
            console.log(`[validateOutput] 키워드 불일치: ${matchedKeywords.length}/${originalKeywords.length} (${(matchRatio * 100).toFixed(1)}%)`);
            console.log(`[validateOutput] 원문 키워드 샘플: ${originalKeywords.slice(0, 10).join(', ')}`);
            console.log(`[validateOutput] 매칭된 키워드: ${matchedKeywords.slice(0, 10).join(', ')}`);
            return {
                valid: false,
                reason: `키워드 불일치: ${matchedKeywords.length}/${originalKeywords.length} (${(matchRatio * 100).toFixed(1)}%) - 최소 30% 필요`
            };
        }

        console.log(`[validateOutput] 키워드 검증 통과: ${matchedKeywords.length}/${originalKeywords.length} (${(matchRatio * 100).toFixed(1)}%)`);
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

// useFallbackMode: if true, skip ai_* columns in DB updates (for DBs without these columns)
async function processArticle(article: { id: string; title: string; content: string; region?: string | null }, useFallbackMode: boolean = false): Promise<{
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
                // Last attempt failed - update DB (skip ai_* fields in fallback mode)
                const errorUpdateData: Record<string, unknown> = useFallbackMode ? {} : {
                    ai_processed: true,
                    ai_processed_at: new Date().toISOString(),
                    ai_validation_grade: 'D',
                    ai_validation_warnings: [`Processing error after ${MAX_RETRIES} attempts: ${errorMessage}`]
                };

                if (Object.keys(errorUpdateData).length > 0) {
                    await supabaseAdmin
                        .from('posts')
                        .update(errorUpdateData)
                        .eq('id', article.id);
                }

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

    // Build update data - skip ai_* fields in fallback mode
    const updateData: Record<string, unknown> = {};

    if (!useFallbackMode) {
        updateData.ai_processed = true;
        updateData.ai_processed_at = now;
        updateData.ai_validation_grade = lastGrade;
        updateData.ai_validation_warnings = shouldPublish ? null : [lastVerification];
    }

    if (shouldPublish) {
        // Grade A/B: Update content, subtitle and publish
        updateData.content = lastContent;
        updateData.subtitle = lastSubtitle || '';
        updateData.status = 'published';
        updateData.published_at = now;
        // site_published_at only in normal mode (column may not exist in some DBs)
        if (!useFallbackMode) {
            updateData.site_published_at = now;
        }

        // Auto-assign reporter when publishing
        try {
            const autoAssignEnabled = await getAutoAssignSetting();
            if (autoAssignEnabled) {
                const assignResult: AssignResult = await autoAssignReporter(article.region || null);
                updateData.author_name = assignResult.reporter.name;

                // Verify user_id exists in profiles before setting author_id (FK constraint)
                if (assignResult.reporter.user_id) {
                    const { data: profile, error: profileError } = await supabaseAdmin
                        .from('profiles')
                        .select('id')
                        .eq('id', assignResult.reporter.user_id)
                        .single();

                    if (!profileError && profile) {
                        updateData.author_id = assignResult.reporter.user_id;
                    }
                }

                console.log(`[Ollama] Auto-assigned reporter: ${assignResult.reporter.name} (${assignResult.reason})`);
            }
        } catch (assignError) {
            console.error(`[Ollama] Auto-assign failed for ${article.id}:`, assignError);
            // Continue without auto-assign - don't block the approval
        }

        console.log(`[Ollama] Article ${article.id}: PUBLISHED with grade ${lastGrade}${useFallbackMode ? ' (fallback mode)' : ''}`);
    } else {
        // Grade C/D after all retries: Keep original, hold as draft
        updateData.status = 'draft';
        console.log(`[Ollama] Article ${article.id}: HELD with grade ${lastGrade} after ${MAX_RETRIES} attempts${useFallbackMode ? ' (fallback mode)' : ''}`);
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
// Now supports auto-continue: after finishing, checks for more pending articles
// useFallbackMode: if true, skip ai_* columns in queries/updates (for DBs without these columns)
async function runBackgroundProcessing(articles: { id: string; title: string; content: string }[], batchLimit: number = 50, useFallbackMode: boolean = false) {
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

            const result = await processArticle(article, useFallbackMode);

            processingStats.processed++;

            // Update lastArticle info for status polling
            const articleTitle = article.title || '(제목 없음)';
            const truncatedTitle = articleTitle.length > 30 ? articleTitle.substring(0, 30) + '...' : articleTitle;

            if (result.success) {
                if (result.published) {
                    published++;
                    processingStats.published++;
                    processingStats.lastArticle = { title: truncatedTitle, grade: result.grade, status: 'published' };
                } else {
                    held++;
                    processingStats.held++;
                    processingStats.lastArticle = { title: truncatedTitle, grade: result.grade, status: 'held' };
                }
            } else {
                failed++;
                processingStats.failed++;
                processingStats.lastArticle = { title: truncatedTitle, grade: result.grade || 'D', status: 'failed' };
            }

            // Small delay between articles to prevent overload
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`[run-ai-processing] ${shouldStopProcessing ? 'Stopped' : 'Complete'}: published=${published}, held=${held}, failed=${failed}`);

        // Auto-continue: Check for more pending articles (only if not stopped)
        if (!shouldStopProcessing) {
            let moreArticles: { id: string; title: string; content: string; region?: string }[] | null = null;

            if (useFallbackMode) {
                // Fallback mode: simple draft query
                const { data, error } = await supabaseAdmin
                    .from('posts')
                    .select('id, title, content, region')
                    .eq('status', 'draft')
                    .order('created_at', { ascending: true })
                    .limit(batchLimit);

                if (!error) moreArticles = data;
            } else {
                // Normal mode: with ai_processed column
                const { data, error } = await supabaseAdmin
                    .from('posts')
                    .select('id, title, content, region')
                    .eq('status', 'draft')
                    .or('ai_processed.is.null,ai_processed.eq.false')
                    .order('created_at', { ascending: true })
                    .limit(batchLimit);

                if (!error) moreArticles = data;
            }

            if (moreArticles && moreArticles.length > 0) {
                console.log(`[run-ai-processing] Auto-continue: Found ${moreArticles.length} more pending articles`);

                // Update stats for new batch (accumulate totals)
                processingStats.total += moreArticles.length;

                // Recursively process the next batch
                await runBackgroundProcessing(moreArticles, batchLimit, useFallbackMode);
                return; // Don't reset isProcessingActive here, let the final batch do it
            } else {
                console.log('[run-ai-processing] Auto-continue: No more pending articles');
            }
        }
    } catch (error) {
        console.error('[run-ai-processing] Background processing error:', error);
    } finally {
        isProcessingActive = false;
        shouldStopProcessing = false;
    }
}

// POST: Trigger AI processing on pending articles using local Ollama
// Returns immediately, processing runs in background
// ⚠️ AI 처리 임시 비활성화 (환각 문제로 인해 2026-01-06 비활성화)
// 원인: AI가 입력을 무시하고 학습 데이터 기반 허위 콘텐츠 생성
// 해결책: 키워드 검증 로직 추가 후 재활성화 필요
const AI_PROCESSING_DISABLED = true;

export async function POST(req: NextRequest) {
    console.log('[run-ai-processing] POST request received');

    // AI 처리 비활성화 체크
    if (AI_PROCESSING_DISABLED) {
        console.log('[run-ai-processing] ⚠️ AI processing is temporarily disabled due to hallucination issues');
        return NextResponse.json({
            success: false,
            error: 'AI 처리 기능이 임시로 비활성화되었습니다. (환각 문제 해결 중)',
            reason: 'AI_DISABLED'
        }, { status: 503 });
    }

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
        // Try complex query first (with ai_processed column), fallback to simple query
        let articles: { id: string; title: string; content: string; region?: string }[] = [];
        let useFallbackMode = false;

        try {
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

            if (err1) {
                // ai_processed column doesn't exist, use fallback mode
                console.log('[run-ai-processing] Fallback mode: ai_processed column not found');
                useFallbackMode = true;
                throw err1;
            }

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

                if (!err2) {
                    failedArticles = failed || [];
                }
            }

            // Combine and dedupe, then apply final limit
            const allArticles = [...(unprocessed || []), ...failedArticles];
            articles = allArticles
                .filter((article, index, self) =>
                    index === self.findIndex(a => a.id === article.id)
                )
                .slice(0, limit); // Final safety limit

            console.log(`[run-ai-processing] Found ${unprocessed?.length || 0} unprocessed + ${failedArticles?.length || 0} C/D grade articles (limit: ${limit})`);

        } catch {
            // Fallback: Simple query without ai_processed column
            console.log('[run-ai-processing] Using simple draft query (fallback mode)');
            useFallbackMode = true;

            const { data: draftArticles, error: fallbackErr } = await supabaseAdmin
                .from('posts')
                .select('id, title, content, region')
                .eq('status', 'draft')
                .order('created_at', { ascending: true })
                .limit(limit);

            if (fallbackErr) throw fallbackErr;
            articles = draftArticles || [];

            console.log(`[run-ai-processing] Fallback: Found ${articles.length} draft articles (limit: ${limit})`);
        }

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
            startedAt: new Date().toISOString(),
            lastArticle: null
        };

        // Start background processing (don't await - returns immediately)
        // Pass limit for auto-continue batches and fallback mode flag
        runBackgroundProcessing(articles, limit, useFallbackMode);

        // Return immediately with "started" response
        return NextResponse.json({
            success: true,
            message: `Processing started for ${articles.length} articles${useFallbackMode ? ' (fallback mode)' : ''}`,
            total: articles.length,
            fallbackMode: useFallbackMode,
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
