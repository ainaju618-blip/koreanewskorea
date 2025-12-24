import { NextRequest, NextResponse } from 'next/server';
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

// Stage 1: Convert press release to news article (Korean prompt for Korean model)
async function convertToNews(pressRelease: string): Promise<{ content: string; subtitle: string }> {
    const prompt = `너는 한국어 뉴스 기사 전문 편집자다. 다음 보도자료를 깔끔한 뉴스 기사로 다시 작성해줘.

규칙:
1. 오타와 띄어쓰기 오류를 수정한다
2. 불필요한 정보(담당자, 전화번호, HTML 태그, 저작권 문구 등)는 제거한다
3. 핵심 내용만 정리하여 간결하게 작성한다
4. 원본의 사실(숫자, 날짜, 이름)은 반드시 그대로 유지한다
5. 원본에 없는 내용은 절대 추가하지 않는다
6. 반드시 첫 줄에 [부제목: 한 문장 요약]을 작성한다

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

// Stage 2: Verify facts (hallucination check) - Korean prompt
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

// POST: Process a single article with local Ollama
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

        console.log(`[process-single] Processing: ${articleId} - ${article.title?.substring(0, 30)}...`);
        const startTime = Date.now();

        // Stage 1: Convert to news article
        const { content: convertedContent, subtitle } = await convertToNews(article.content);

        if (!convertedContent || convertedContent.length < 100) {
            throw new Error('Conversion resulted in empty or too short content');
        }

        // Stage 2: Verify facts
        const { grade, hasHallucination, verification } = await verifyFacts(article.content, convertedContent);

        const elapsed = Date.now() - startTime;
        console.log(`[process-single] ${articleId}: Grade ${grade}, Time: ${elapsed}ms, Subtitle: ${subtitle?.substring(0, 30)}...`);

        // Determine status based on grade
        const shouldPublish = grade === 'A' || grade === 'B';
        const now = new Date().toISOString();

        // Update database
        const updateData: Record<string, unknown> = {
            ai_processed: true,
            ai_processed_at: now,
            ai_validation_grade: grade,
            ai_validation_warnings: hasHallucination ? [verification] : null,
        };

        if (shouldPublish) {
            // Grade A/B: Update content, subtitle and publish
            updateData.content = convertedContent;
            updateData.subtitle = subtitle || '';
            updateData.status = 'published';
            updateData.published_at = now;
            updateData.site_published_at = now;
        } else {
            // Grade C/D: Keep original, hold as draft
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
            grade,
            hasHallucination,
            subtitle: subtitle || '',
            processingTime: elapsed,
            model: OLLAMA_MODEL
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[process-single] Error:', errorMessage);

        // Try to mark article as failed if we have the ID
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
