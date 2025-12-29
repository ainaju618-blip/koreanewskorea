/**
 * 본문 미리보기 정리 유틸리티
 * - 메타데이터 제거 (담당자, 전화번호, 조회수 등)
 * - HTML 태그 제거
 * - 줄바꿈/공백 정리
 */

// 제거할 메타데이터 패턴들
const METADATA_PATTERNS = [
    // 기본 메타데이터
    /조회수?\s*[:：]?\s*\d+/gi,
    /추천수?\s*[:：]?\s*\d+/gi,
    /작성일\s*[:：]?\s*[\d\-\.]+/gi,
    /등록일\s*[:：]?\s*[\d\-\.]+/gi,
    /작성자\s*[:：]?\s*[^\s\n]+/gi,
    /수정일\s*[:：]?\s*[\d\-\.]+/gi,

    // 기관/담당자 정보
    /기관명\s*[:：]\s*[^\n]+/gi,
    /기관주소\s*[:：]\s*[^\n]+/gi,
    /담당자\s*[:：]\s*[^\n]+/gi,
    /담당부서\s*[:：]\s*[^\n]+/gi,
    /전화번호\s*[:：]?\s*[\d\-]+/gi,
    /연락처\s*[:：]?\s*[\d\-]+/gi,
    /【[^】]*】/g,  // 【담당부서명】 형태
    /\d{2,4}[-\s]?\d{3,4}[-\s]?\d{4}/g,  // 전화번호 패턴

    // 첨부파일 관련
    /첨부파일\s*\(?\d*\)?/gi,
    /첨부\s*[:：]?\s*\d*개?/gi,
    /▲\s*\d+\.\s*\[[^\]]*\][^\n]*/g,
    /\[\s*사진\d*\s*\][^\n]*/g,
    /<사진\d*>[^\n]*/g,

    // 저작권/푸터 관련
    /개인정보처리방침.*/gi,
    /공공누리.*/gi,
    /출처\s*[:：]?\s*[^\n]*표시[^\n]*/gi,
];

/**
 * 본문 미리보기를 정리합니다.
 * @param content 원본 본문 (HTML 포함 가능)
 * @param maxLength 최대 길이 (기본 160)
 * @returns 정리된 텍스트
 */
export function cleanContentPreview(content: string | undefined | null, maxLength: number = 160): string {
    if (!content) return '';

    // 1. HTML 태그 제거
    let text = content.replace(/<[^>]*>?/gm, ' ');

    // 2. HTML 엔티티 변환
    text = text.replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');

    // 3. 메타데이터 패턴 제거
    for (const pattern of METADATA_PATTERNS) {
        text = text.replace(pattern, ' ');
    }

    // 4. 줄바꿈/공백 정리
    text = text.replace(/\n+/g, ' ')  // 줄바꿈 → 공백
        .replace(/\s+/g, ' ')   // 연속 공백 → 단일 공백
        .trim();

    // 5. 길이 제한
    if (text.length > maxLength) {
        text = text.substring(0, maxLength).trim();
        // 단어 중간에서 자르지 않도록
        const lastSpace = text.lastIndexOf(' ');
        if (lastSpace > maxLength * 0.7) {
            text = text.substring(0, lastSpace);
        }
    }

    return text;
}
