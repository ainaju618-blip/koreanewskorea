/**
 * AI Output Parser - AI 응답을 파싱하여 DB 필드에 매핑
 * 
 * AI 응답 JSON을 파싱하고, 검증하여 DB 저장 가능한 형태로 변환
 */

export interface ParsedArticle {
    title: string;
    slug: string;
    content: string;
    summary: string;
    keywords: string[];
    tags: string[];
}

export interface ParseResult {
    success: boolean;
    data?: ParsedArticle;
    error?: string;
}

/**
 * AI 응답에서 JSON 추출
 * AI가 마크다운 코드블록으로 감싸서 출력할 수도 있으므로 처리
 */
function extractJSON(text: string): string {
    // 코드블록 제거 (```json ... ``` 또는 ``` ... ```)
    let cleaned = text.trim();

    // ```json 블록 제거
    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
        cleaned = jsonBlockMatch[1].trim();
    }

    // 시작/끝 중괄호 찾기
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleaned = cleaned.substring(startIdx, endIdx + 1);
    }

    return cleaned;
}

/**
 * AI 응답 파싱
 */
export function parseAIOutput(aiResponse: string): ParseResult {
    try {
        const jsonStr = extractJSON(aiResponse);
        const parsed = JSON.parse(jsonStr);

        // 필수 필드 검증
        const validation = validateParsedArticle(parsed);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error
            };
        }

        // 정규화
        const normalized: ParsedArticle = {
            title: String(parsed.title || '').trim(),
            slug: generateSlug(parsed.slug || parsed.title || ''),
            content: normalizeContent(parsed.content || ''),
            summary: String(parsed.summary || '').trim().substring(0, 200),
            keywords: normalizeArray(parsed.keywords),
            tags: normalizeArray(parsed.tags)
        };

        return {
            success: true,
            data: normalized
        };

    } catch (error) {
        console.error('[ai-output-parser] JSON parse error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'JSON 파싱 실패'
        };
    }
}

/**
 * 필수 필드 검증
 */
function validateParsedArticle(parsed: any): { valid: boolean; error?: string } {
    if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'AI 응답이 객체가 아님' };
    }

    if (!parsed.title || String(parsed.title).trim() === '') {
        return { valid: false, error: '제목(title) 필드 누락' };
    }

    if (!parsed.content || String(parsed.content).trim() === '') {
        return { valid: false, error: '본문(content) 필드 누락' };
    }

    if (!parsed.summary || String(parsed.summary).trim() === '') {
        return { valid: false, error: '요약(summary) 필드 누락' };
    }

    return { valid: true };
}

/**
 * 슬러그 생성/정규화
 */
function generateSlug(input: string): string {
    if (!input) return '';

    return input
        .toLowerCase()
        .replace(/[^\w\s가-힣-]/g, '') // 특수문자 제거 (한글, 영문, 숫자, 하이픈만)
        .replace(/\s+/g, '-') // 공백을 하이픈으로
        .replace(/-+/g, '-') // 연속 하이픈 제거
        .substring(0, 100); // 최대 100자
}

/**
 * 배열 정규화 (문자열 배열로 변환)
 */
function normalizeArray(arr: any): string[] {
    if (!arr) return [];
    if (typeof arr === 'string') {
        // "#태그1 #태그2" 형태 처리
        return arr.split(/[\s,]+/).filter(Boolean).map(s => s.replace(/^#/, ''));
    }
    if (Array.isArray(arr)) {
        return arr
            .map(item => String(item).trim().replace(/^#/, ''))
            .filter(Boolean);
    }
    return [];
}

/**
 * 본문 HTML 정규화
 */
function normalizeContent(content: string): string {
    let normalized = String(content).trim();

    // 마크다운을 HTML로 변환 (간단한 처리)
    // #### 소제목 -> <h4>
    normalized = normalized.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    normalized = normalized.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    normalized = normalized.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');

    // - 리스트 -> <li>
    normalized = normalized.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');

    // 연속된 <li>를 <ul>로 감싸기
    normalized = normalized.replace(/(<li>[\s\S]*?<\/li>)+/g, '<ul>$&</ul>');

    // 빈 줄로 구분된 단락을 <p>로 감싸기
    const paragraphs = normalized.split(/\n\n+/);
    normalized = paragraphs
        .map(p => {
            p = p.trim();
            // 이미 HTML 태그로 시작하면 그대로
            if (p.startsWith('<')) return p;
            // 빈 줄이면 무시
            if (!p) return '';
            // 그 외는 <p>로 감싸기
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        })
        .filter(Boolean)
        .join('\n');

    return normalized;
}

/**
 * DB 업데이트용 객체 생성
 * summary를 본문 맨 위에 요약 박스로 추가
 */
export function toDBUpdate(parsed: ParsedArticle): Record<string, any> {
    // 요약을 본문 맨 위에 추가 (스타일링된 요약 박스)
    const summaryBox = parsed.summary
        ? `<div class="article-summary" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #0284c7; padding: 16px 20px; margin-bottom: 24px; border-radius: 0 8px 8px 0; font-size: 1.05em; line-height: 1.6; color: #0c4a6e;"><strong>요약</strong> | ${parsed.summary}</div>\n\n`
        : '';

    const contentWithSummary = summaryBox + parsed.content;

    return {
        title: parsed.title,
        slug: parsed.slug,
        content: contentWithSummary,
        ai_summary: parsed.summary,
        keywords: parsed.keywords,
        tags: parsed.tags,
        ai_processed: true,
        ai_processed_at: new Date().toISOString()
    };
}
