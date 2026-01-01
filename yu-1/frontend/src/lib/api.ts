const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================================
// Types
// ============================================================================

export interface DivinationRequest {
  divination_type: string;
  period: string;
  main_category: number;
  sub_category?: number;
  question: string;
  session_id?: string;
}

export interface HexagramInfo {
  number: number;
  name_kr: string;
  name_hanja: string;
  name_full: string;
}

export interface YaoInfo {
  position: number;
  name: string;
  text_hanja: string;
  text_kr: string;
}

export interface DivinationResponse {
  hexagram: HexagramInfo;
  yao: YaoInfo;
  interpretation: string;
  fortune_score: number;
  fortune_category: string;
  action_guide: string | null;
  caution: string | null;
  keywords: string[];
  matched_category: string;
  changing_lines: number[];
  transformed_hexagram: number | null;
}

export interface Category {
  id: number;
  name: string;
  emoji: string;
}

export interface SubCategory {
  id: number;
  major_id: number;
  sub_name: string;
  keywords: string[];
}

export interface SimpleYaoResponse {
  hexagram_number: number;
  hexagram_name: string;
  yao_position: number;
  yao_name: string;
  text_hanja: string;
  text_kr: string;
  interpretation: string;
  fortune_score: number;
  fortune_category: string;
  keywords: string[];
  category_interpretation: string | null;
  matched_category: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * 점괘 요청 (POST /api/divination/cast)
 */
export async function castDivination(request: DivinationRequest): Promise<DivinationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/divination/cast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '점술 요청 실패' }));
    throw new Error(error.detail || '점술 요청 실패');
  }

  return response.json();
}

/**
 * 간단한 효 조회 (GET /api/divination)
 */
export async function getDivination(
  category: string,
  yao: string,
  hexagram: number = 1
): Promise<SimpleYaoResponse> {
  const params = new URLSearchParams({
    category,
    yao,
    hexagram: hexagram.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/api/divination?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '조회 실패' }));
    throw new Error(error.detail || '조회 실패');
  }

  return response.json();
}

/**
 * 대분류 카테고리 목록 (GET /api/divination/categories)
 */
export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/api/divination/categories`);

  if (!response.ok) {
    throw new Error('카테고리 조회 실패');
  }

  return response.json();
}

/**
 * 소분류 카테고리 목록 (GET /api/divination/categories/{main_id}/sub)
 */
export async function getSubCategories(mainId: number): Promise<SubCategory[]> {
  const response = await fetch(`${API_BASE_URL}/api/divination/categories/${mainId}/sub`);

  if (!response.ok) {
    throw new Error('소분류 조회 실패');
  }

  return response.json();
}

/**
 * 서버 상태 확인 (GET /api/divination/health)
 */
export async function healthCheck(): Promise<{ status: string; ollama: string; timestamp?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/divination/health`);

    if (!response.ok) {
      return { status: 'unhealthy', ollama: 'disconnected' };
    }

    return response.json();
  } catch {
    return { status: 'unhealthy', ollama: 'disconnected' };
  }
}

/**
 * AI 카테고리 추천 (질문 분석)
 */
export async function getAIRecommendation(question: string): Promise<{
  major_id: number;
  sub_id: number | null;
  confidence: number;
  category_name: string;
}> {
  // 임시 클라이언트 사이드 키워드 매칭
  const keywords: Record<string, { major: number; sub: number | null; name: string }> = {
    '돈': { major: 1, sub: null, name: '재물' },
    '주식': { major: 1, sub: 1, name: '재물-주식/증권' },
    '코인': { major: 1, sub: 2, name: '재물-코인/가상자산' },
    '비트코인': { major: 1, sub: 2, name: '재물-코인/가상자산' },
    '부동산': { major: 1, sub: 3, name: '재물-부동산' },
    '이직': { major: 2, sub: 21, name: '직업-이직' },
    '취업': { major: 2, sub: 22, name: '직업-취업/면접' },
    '면접': { major: 2, sub: 22, name: '직업-취업/면접' },
    '승진': { major: 2, sub: 23, name: '직업-승진' },
    '시험': { major: 3, sub: 38, name: '학업-자격시험' },
    '수능': { major: 3, sub: 36, name: '학업-수능/입시' },
    '연애': { major: 4, sub: null, name: '연애' },
    '썸': { major: 4, sub: 46, name: '연애-호감/썸' },
    '고백': { major: 4, sub: 47, name: '연애-고백' },
    '결혼': { major: 4, sub: 49, name: '연애-결혼' },
    '건강': { major: 6, sub: null, name: '건강' },
    '다이어트': { major: 6, sub: 70, name: '건강-다이어트' },
    '여행': { major: 7, sub: 79, name: '취미-여행' },
    '이사': { major: 8, sub: 89, name: '운명-이사' },
  };

  for (const [keyword, rec] of Object.entries(keywords)) {
    if (question.includes(keyword)) {
      return {
        major_id: rec.major,
        sub_id: rec.sub,
        confidence: 0.95,
        category_name: rec.name,
      };
    }
  }

  return {
    major_id: 9,
    sub_id: 97,
    confidence: 0.5,
    category_name: '기타-일반운세',
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 효 이름 → 위치 변환
 */
export function parseYaoName(yaoName: string): number | null {
  const yaoMap: Record<string, number> = {
    '초구': 1, '구이': 2, '구삼': 3, '구사': 4, '구오': 5, '상구': 6,
    '초육': 1, '육이': 2, '육삼': 3, '육사': 4, '육오': 5, '상육': 6,
  };
  return yaoMap[yaoName.trim()] || null;
}

/**
 * 카테고리 이름 → ID 변환
 */
export function parseCategoryName(categoryName: string): number | null {
  const categoryMap: Record<string, number> = {
    '재물': 1, '직업': 2, '학업': 3, '연애': 4, '대인': 5,
    '건강': 6, '취미': 7, '운명': 8, '기타': 9,
  };
  return categoryMap[categoryName.trim()] || null;
}

/**
 * 점수 → 길흉 카테고리 변환
 */
export function getFortuneCategory(score: number): string {
  if (score >= 90) return '대길';
  if (score >= 70) return '길';
  if (score >= 50) return '평';
  if (score >= 30) return '소흉';
  return '흉';
}

/**
 * 점수 → 별점 변환
 */
export function getFortuneStars(score: number): string {
  const stars = Math.round(score / 20);
  return '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
}
