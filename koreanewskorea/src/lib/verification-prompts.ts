/**
 * Hallucination Verification Prompts for Korea NEWS
 * - 4-grade system (A/B/C/D)
 * - A grade only = publish
 * - B/C/D = retry up to 5 times
 *
 * Optimized for solar:10.7b Korean model
 */

export interface VerificationResult {
    grade: 'A' | 'B' | 'C' | 'D';
    summary: string;
    improvement: string;
    passed: boolean;
}

/**
 * Grade definitions for hallucination verification
 */
export const GRADE_DEFINITIONS = {
    A: {
        name: 'A (Perfect)',
        description: 'All facts match, no hallucination, length ratio >= 85%',
        action: 'PUBLISH',
        korean: 'A등급 (정확)'
    },
    B: {
        name: 'B (Minor Issues)',
        description: 'Minor omissions, 1-2 sentences simplified',
        action: 'RETRY',
        korean: 'B등급 (경미한 누락)'
    },
    C: {
        name: 'C (Semantic Issues)',
        description: 'Some sentences have different meaning, dates/numbers changed',
        action: 'RETRY',
        korean: 'C등급 (의미 왜곡)'
    },
    D: {
        name: 'D (Critical Errors)',
        description: 'Content not in original inserted, major facts changed',
        action: 'REJECT',
        korean: 'D등급 (심각한 오류)'
    }
};

/**
 * Main verification prompt for hallucination detection
 * Compares original press release with generated article
 */
export function renderVerificationPrompt(originalText: string, generatedArticle: string): string {
    const originalLength = originalText.length;
    const generatedLength = generatedArticle.length;
    const lengthRatio = ((generatedLength / originalLength) * 100).toFixed(1);

    return `# 역할
당신은 편집국의 검증 전문 기자입니다.
아래 [원문 보도자료]와 [생성 기사]를 비교하여 사실 왜곡, 누락, 부정확 표현 여부를 평가합니다.

---

# 검증 기준 (4단계 등급)

**A등급 (정확)**
- 모든 사실(숫자, 날짜, 기관, 인물)이 원문과 일치함
- 새로운 정보, 의견, 해설이 추가되지 않음
- 길이비율 85% 이상 (현재: ${lengthRatio}%)
- 기사 전반이 자연스럽고 원문의 문맥을 그대로 따름

**B등급 (경미한 누락)**
- 일부 숫자나 기관명 누락
- 문장 1~2개 생략 또는 문체 단순화
- 의미는 유지되지만 완전 일치 아님

**C등급 (의미 왜곡)**
- 일부 문장이 원문 의미와 다름
- 날짜나 수치 변경
- 새 정보 추가 또는 요약 경향 존재

**D등급 (심각한 오류)**
- 원문에 없는 내용 삽입 (할루시네이션)
- 주요 사실(인물, 금액, 사건 방향) 변경
- 문체나 톤이 사실보도 수준을 벗어남

---

# 출력 형식 (아래 형식으로만 출력)

[검증결과]
등급: (A/B/C/D)

[문제요약]
- 어떤 문장/사실이 잘못되었는지 2~4줄로 설명
- 구체적인 원인만 언급 (누락, 숫자 변경, 의미왜곡 등)

[개선지시]
- 해당 문제점을 수정하려면 어떤 방향으로 개선해야 하는지 설명
(예: "원문 금액과 동일하게 수정", "누락된 기관명 추가" 등)

---

# 비교 자료

[원문 보도자료]
${originalText}

[생성 기사]
${generatedArticle}

---

# 평가규칙
- 반드시 A/B/C/D 등급 중 하나만 출력
- A등급만 "게시 승인"
- B~D등급은 "재작성" 판정

[검증 시작]`;
}

/**
 * Fix prompt for re-generation based on verification feedback
 */
export function renderFixPrompt(
    originalText: string,
    previousArticle: string,
    improvement: string
): string {
    return `# 역할
당신은 검수 결과를 기반으로 잘못된 부분을 수정하는 보도자료 편집 AI입니다.
아래의 [개선지시]를 참고하여, 원문과 동일한 사실을 유지하면서 문제점을 수정하세요.

---

# 작업 지침
1. 새로운 내용 추가 금지 (할루시네이션 방지)
2. [개선지시]에 따라 필요한 부분만 수정
3. 숫자, 인물, 기관명 오류 교정
4. 전체 길이는 기존 기사 대비 ±10% 이내 유지
5. 한국어로만 출력

---

[원문 보도자료]
${originalText}

[이전 생성 기사]
${previousArticle}

[개선지시]
${improvement}

---

# 출력형식
[제목]
[부제목]
[리드]
[본문]

[수정된 기사]`;
}

/**
 * Parse verification result from Ollama output
 */
export function parseVerificationResult(output: string): VerificationResult {
    // Default values
    let grade: 'A' | 'B' | 'C' | 'D' = 'D';
    let summary = '';
    let improvement = '';

    // Extract grade
    const gradeMatch = output.match(/등급:\s*([ABCD])/i);
    if (gradeMatch) {
        grade = gradeMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
    }

    // Extract summary (between [문제요약] and [개선지시])
    const summaryMatch = output.match(/\[문제요약\]\s*([\s\S]*?)(?=\[개선지시\]|$)/i);
    if (summaryMatch) {
        summary = summaryMatch[1].trim();
    }

    // Extract improvement instructions
    const improvementMatch = output.match(/\[개선지시\]\s*([\s\S]*?)$/i);
    if (improvementMatch) {
        improvement = improvementMatch[1].trim();
    }

    // Fallback: try to extract any feedback
    if (!summary && !improvement) {
        // Look for any text after grade
        const afterGrade = output.split(/등급:\s*[ABCD]/i)[1];
        if (afterGrade) {
            summary = afterGrade.trim().slice(0, 500);
        }
    }

    return {
        grade,
        summary: summary || 'No specific issues identified',
        improvement: improvement || 'Review and correct any factual inconsistencies',
        passed: grade === 'A'
    };
}

/**
 * Quick fact extraction for comparison
 */
export function extractFactsPrompt(text: string): string {
    return `# 역할
아래 텍스트에서 핵심 사실을 추출하세요.

# 추출 항목
1. 숫자 (금액, 수량, 비율)
2. 날짜 (년월일, 기간)
3. 인물 (이름, 직책)
4. 기관 (기관명, 부서명)
5. 장소 (지역명, 시설명)

# 출력 형식
[숫자]
- 항목1
- 항목2

[날짜]
- 항목1

[인물]
- 항목1

[기관]
- 항목1

[장소]
- 항목1

---

[텍스트]
${text}

[사실 추출]`;
}

/**
 * Cross-validation prompt for comparing two fact lists
 */
export function crossValidatePrompt(originalFacts: string, generatedFacts: string): string {
    return `# 역할
두 개의 사실 목록을 비교하여 일치 여부를 판단하세요.

# 비교 기준
- 숫자가 정확히 일치하는가?
- 날짜가 정확히 일치하는가?
- 인물/기관명이 정확히 일치하는가?
- 누락된 항목이 있는가?
- 추가된 항목이 있는가?

# 출력 형식
[일치율]
(0-100 사이 숫자)%

[불일치 항목]
- 항목1: 원문값 vs 생성값
- 항목2: 누락됨

[판정]
(일치/불일치)

---

[원문 사실]
${originalFacts}

[생성 기사 사실]
${generatedFacts}

[비교 결과]`;
}

/**
 * Generate improvement feedback based on grade
 */
export function generateFeedbackForGrade(
    grade: 'A' | 'B' | 'C' | 'D',
    details: { summary: string; improvement: string }
): string {
    const feedbackPrefix = {
        A: '',
        B: '경미한 수정 필요: ',
        C: '중요 수정 필요: ',
        D: '전면 재작성 필요: '
    };

    return `${feedbackPrefix[grade]}${details.summary}\n\n수정 방향: ${details.improvement}`;
}
