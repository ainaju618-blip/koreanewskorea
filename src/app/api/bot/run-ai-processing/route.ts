import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Local Ollama configuration - Korean news-specialized model
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
// Use Korean news-specialized model (trained on 10M Korean news corpus)
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'benedict/linkbricks-hermes3-llama3.1-8b-korean-advanced-q4';

// Call local Ollama API
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

// Stage 1: Convert press release to news article (Korean prompt)
// retryCount: 0 = first attempt, 1+ = retry with stricter rules
async function convertToNews(pressRelease: string, retryCount: number = 0): Promise<{ content: string; subtitle: string }> {
    // Different prompts for retries - progressively stricter
    const baseRules = `1. 오타와 띄어쓰기 오류를 수정한다
2. 불필요한 정보(담당자, 전화번호, HTML 태그, 저작권 문구 등)는 제거한다
3. 핵심 내용만 정리하여 간결하게 작성한다
4. 원본의 사실(숫자, 날짜, 이름)은 반드시 그대로 유지한다
5. 원본에 없는 내용은 절대 추가하지 않는다
6. 반드시 첫 줄에 [부제목: 한 문장 요약]을 작성한다`;

    const retryRules = retryCount > 0 ? `
[중요 - 이전 시도에서 팩트체크 실패]
- 숫자, 날짜, 이름을 원본과 100% 동일하게 작성하라
- 원본에 없는 내용을 절대 추가하지 마라
- 불확실한 내용은 생략하라
- 원본 문장을 최대한 그대로 사용하라` : '';

    const prompt = `너는 한국어 뉴스 기사 전문 편집자다. 다음 보도자료를 깔끔한 뉴스 기사로 다시 작성해줘.

규칙:
${baseRules}${retryRules}

출력 형식:
[부제목: 기사 핵심을 요약한 한 문장]

본문 내용...

[보도자료]
${pressRelease}

[뉴스 기사]`;

    const response = await callOllama(prompt);

    // Parse subtitle from response
    const subtitleMatch = response.match(/\[부제목:\s*(.+?)\]/);
    const subtitle = subtitleMatch ? subtitleMatch[1].trim() : '';

    // Remove subtitle line from content
    const content = response.replace(/\[부제목:\s*.+?\]\n*/g, '').trim();

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

// POST: Trigger AI processing on pending articles using local Ollama
export async function POST() {
    console.log('[run-ai-processing] POST request received');
    console.log(`[run-ai-processing] Using Ollama at ${OLLAMA_BASE_URL} with model ${OLLAMA_MODEL}`);

    try {
        // Check if Ollama is running
        try {
            const healthCheck = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
            if (!healthCheck.ok) {
                throw new Error('Ollama not responding');
            }
        } catch {
            return NextResponse.json({
                success: false,
                error: 'Ollama is not running. Please start Ollama first.',
                hint: 'Run "ollama serve" in terminal'
            }, { status: 503 });
        }

        // Step 1: Get pending articles (unprocessed + C/D grade for retry)
        const { data: unprocessed, error: err1 } = await supabaseAdmin
            .from('posts')
            .select('id, title, content, region')
            .eq('status', 'draft')
            .or('ai_processed.is.null,ai_processed.eq.false')
            .order('created_at', { ascending: true })
            .limit(50);

        if (err1) throw err1;

        // Get C/D grade articles for retry
        const { data: failedArticles, error: err2 } = await supabaseAdmin
            .from('posts')
            .select('id, title, content, region')
            .eq('status', 'draft')
            .eq('ai_processed', true)
            .in('ai_validation_grade', ['C', 'D'])
            .order('created_at', { ascending: true })
            .limit(50);

        if (err2) throw err2;

        // Combine and dedupe
        const allArticles = [...(unprocessed || []), ...(failedArticles || [])];
        const articles = allArticles.filter((article, index, self) =>
            index === self.findIndex(a => a.id === article.id)
        );

        console.log(`[run-ai-processing] Found ${unprocessed?.length || 0} unprocessed + ${failedArticles?.length || 0} C/D grade articles`);

        if (!articles || articles.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No pending articles to process',
                published: 0,
                held: 0,
                failed: 0
            });
        }

        console.log(`[run-ai-processing] Found ${articles.length} pending articles`);

        // Step 2: Process articles with local Ollama
        let published = 0;
        let held = 0;
        let failed = 0;

        for (const article of articles) {
            const result = await processArticle(article);

            if (result.success) {
                if (result.published) {
                    published++;
                } else {
                    held++;
                }
            } else {
                failed++;
            }

            // Small delay between articles to prevent overload
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`[run-ai-processing] Complete: published=${published}, held=${held}, failed=${failed}`);

        return NextResponse.json({
            success: true,
            message: `Processed ${articles.length} articles with local Ollama (${OLLAMA_MODEL})`,
            published,
            held,
            failed,
            model: OLLAMA_MODEL
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[run-ai-processing] Error:', errorMessage);
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
