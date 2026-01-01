/**
 * I Ching Divination Static Data
 * 64 Hexagrams + 384 Yao + Categories (Complete Data)
 */

import yao384Data from '@/data/yao-384.json';

// 384 Yao Data Type (Complete with text_hanja and fortune_score)
export interface YaoData {
  hex: number;
  yao: number;
  name: string;
  text_hanja: string;     // Chinese original text (e.g., "潛龍勿用")
  text_kr: string;        // Korean translation
  interpretation: string;
  fortune_score: number;  // Numeric score (0-100)
  fortune_category: string;
  keywords: string[];
}

// Get specific yao data
export function getYaoData(hexagramNumber: number, yaoPosition: number): YaoData | null {
  const yao = (yao384Data as YaoData[]).find(
    (y) => y.hex === hexagramNumber && y.yao === yaoPosition
  );
  return yao || null;
}

// 9 Major Categories
export const MAJOR_CATEGORIES = [
  { id: 1, name: '재물', nameEn: 'Wealth', emoji: '💰' },
  { id: 2, name: '직업', nameEn: 'Career', emoji: '💼' },
  { id: 3, name: '학업', nameEn: 'Study', emoji: '📚' },
  { id: 4, name: '연애', nameEn: 'Love', emoji: '💕' },
  { id: 5, name: '대인', nameEn: 'Relations', emoji: '👥' },
  { id: 6, name: '건강', nameEn: 'Health', emoji: '🏥' },
  { id: 7, name: '취미', nameEn: 'Hobby', emoji: '🎮' },
  { id: 8, name: '운명', nameEn: 'Destiny', emoji: '✨' },
  { id: 9, name: '기타', nameEn: 'Other', emoji: '🔮' },
];

// Yao names
export const YAO_NAMES = {
  yang: ['초구', '구이', '구삼', '구사', '구오', '상구'],
  yin: ['초육', '육이', '육삼', '육사', '육오', '상육'],
};

export const YAO_DESCRIPTIONS = [
  { position: 1, meaning: '시작, 잠재력', hint: '때를 기다리는 시기', meaningEn: 'Beginning' },
  { position: 2, meaning: '성장, 기반', hint: '기반을 다지는 시기', meaningEn: 'Growth' },
  { position: 3, meaning: '도전, 위험', hint: '조심해야 할 시기', meaningEn: 'Challenge' },
  { position: 4, meaning: '변화, 선택', hint: '결정의 기로', meaningEn: 'Change' },
  { position: 5, meaning: '정점, 성공', hint: '가장 좋은 때', meaningEn: 'Peak' },
  { position: 6, meaning: '완성, 주의', hint: '마무리의 시기', meaningEn: 'Completion' },
];

// 64 Hexagrams (Simplified - key hexagrams)
export const HEXAGRAMS: Record<number, {
  number: number;
  name_ko: string;
  name_hanja: string;
  name_full: string;
  symbol: string;
  gua_ci: string;
  fortune_base: number;
}> = {
  1: { number: 1, name_ko: '건', name_hanja: '乾', name_full: '건위천', symbol: '☰☰', gua_ci: '크게 형통하니 바르게 함이 이롭다. 하늘의 도가 굳건하니 스스로 강건하여 쉬지 말라.', fortune_base: 85 },
  2: { number: 2, name_ko: '곤', name_hanja: '坤', name_full: '곤위지', symbol: '☷☷', gua_ci: '땅의 도가 유순하니 두터운 덕으로 만물을 싣는다. 순응하면 형통한다.', fortune_base: 75 },
  3: { number: 3, name_ko: '둔', name_hanja: '屯', name_full: '수뢰둔', symbol: '☵☳', gua_ci: '어려움 속에 형통함이 있다. 초창기의 어려움이니 함부로 나아가지 말고 때를 기다려라.', fortune_base: 55 },
  4: { number: 4, name_ko: '몽', name_hanja: '蒙', name_full: '산수몽', symbol: '☶☵', gua_ci: '처음 점치면 알려주나 거듭하면 모독이니 알려주지 않는다. 배움의 때이다.', fortune_base: 60 },
  5: { number: 5, name_ko: '수', name_hanja: '需', name_full: '수천수', symbol: '☵☰', gua_ci: '기다림이 필요하니 조급하지 말라. 성실하면 크게 형통한다.', fortune_base: 70 },
  6: { number: 6, name_ko: '송', name_hanja: '訟', name_full: '천수송', symbol: '☰☵', gua_ci: '두려워하며 중도를 지키면 길하고, 끝까지 가면 흉하다. 다툼을 피하라.', fortune_base: 45 },
  7: { number: 7, name_ko: '사', name_hanja: '師', name_full: '지수사', symbol: '☷☵', gua_ci: '군대를 다스리는 도이니 기율이 바르면 승리한다. 리더십이 필요하다.', fortune_base: 65 },
  8: { number: 8, name_ko: '비', name_hanja: '比', name_full: '수지비', symbol: '☵☷', gua_ci: '길하다. 화합하고 친밀하면 형통한다. 좋은 인연을 만나리라.', fortune_base: 80 },
  9: { number: 9, name_ko: '소축', name_hanja: '小畜', name_full: '풍천소축', symbol: '☴☰', gua_ci: '작은 것이 쌓여 큰 것이 된다. 조금씩 나아가라.', fortune_base: 65 },
  10: { number: 10, name_ko: '리', name_hanja: '履', name_full: '천택리', symbol: '☰☱', gua_ci: '호랑이 꼬리를 밟아도 물리지 않으니 형통하다. 예의를 지키면 안전하다.', fortune_base: 70 },
  11: { number: 11, name_ko: '태', name_hanja: '泰', name_full: '지천태', symbol: '☷☰', gua_ci: '천지가 교감하여 만물이 통하니 태평성대의 때이다. 대길하다.', fortune_base: 95 },
  12: { number: 12, name_ko: '비', name_hanja: '否', name_full: '천지비', symbol: '☰☷', gua_ci: '막힘의 때이니 물러나 때를 기다려라. 소인을 멀리하라.', fortune_base: 35 },
  13: { number: 13, name_ko: '동인', name_hanja: '同人', name_full: '천화동인', symbol: '☰☲', gua_ci: '사람과 동하니 형통하다. 뜻을 같이하는 이를 만나리라.', fortune_base: 80 },
  14: { number: 14, name_ko: '대유', name_hanja: '大有', name_full: '화천대유', symbol: '☲☰', gua_ci: '원대하게 형통하다. 크게 소유하니 재물운이 좋다.', fortune_base: 90 },
  15: { number: 15, name_ko: '겸', name_hanja: '謙', name_full: '지산겸', symbol: '☷☶', gua_ci: '겸손함이 덕의 병기이니 낮추면 높아진다. 겸손하라.', fortune_base: 75 },
  16: { number: 16, name_ko: '예', name_hanja: '豫', name_full: '뇌지예', symbol: '☳☷', gua_ci: '기쁨과 즐거움이 있으니 미리 준비하고 대비하라.', fortune_base: 75 },
  17: { number: 17, name_ko: '수', name_hanja: '隨', name_full: '택뢰수', symbol: '☱☳', gua_ci: '때에 따라 변화하며 따르니 유연함이 필요하다.', fortune_base: 70 },
  18: { number: 18, name_ko: '고', name_hanja: '蠱', name_full: '산풍고', symbol: '☶☴', gua_ci: '부패를 바로잡아야 한다. 새롭게 시작하라.', fortune_base: 55 },
  19: { number: 19, name_ko: '임', name_hanja: '臨', name_full: '지택임', symbol: '☷☱', gua_ci: '다가감의 때이니 적극적으로 나아가라.', fortune_base: 80 },
  20: { number: 20, name_ko: '관', name_hanja: '觀', name_full: '풍지관', symbol: '☴☷', gua_ci: '잘 관찰하고 살펴보라. 신중함이 필요하다.', fortune_base: 65 },
  // ... more hexagrams (21-64) with similar structure
  21: { number: 21, name_ko: '서합', name_hanja: '噬嗑', name_full: '화뢰서합', symbol: '☲☳', gua_ci: '형통하다. 옥사를 다스림이 이롭다. 장애를 돌파하라.', fortune_base: 65 },
  22: { number: 22, name_ko: '비', name_hanja: '賁', name_full: '산화비', symbol: '☶☲', gua_ci: '형통하나 작은 일에 나아감이 이롭다. 꾸밈의 때이다.', fortune_base: 70 },
  23: { number: 23, name_ko: '박', name_hanja: '剝', name_full: '산지박', symbol: '☶☷', gua_ci: '나아감이 이롭지 않다. 무너짐의 때이니 조심하라.', fortune_base: 30 },
  24: { number: 24, name_ko: '복', name_hanja: '復', name_full: '지뢰복', symbol: '☷☳', gua_ci: '형통하다. 돌아옴이니 새로운 시작이다.', fortune_base: 75 },
  25: { number: 25, name_ko: '무망', name_hanja: '无妄', name_full: '천뢰무망', symbol: '☰☳', gua_ci: '크게 형통하고 바르게 함이 이롭다. 뜻밖의 일을 조심하라.', fortune_base: 70 },
  26: { number: 26, name_ko: '대축', name_hanja: '大畜', name_full: '산천대축', symbol: '☶☰', gua_ci: '바르게 함이 이롭고 집에서 먹지 않으면 길하다. 크게 쌓아라.', fortune_base: 80 },
  27: { number: 27, name_ko: '이', name_hanja: '頤', name_full: '산뢰이', symbol: '☶☳', gua_ci: '바르게 함이 이롭다. 기름의 때이니 양생하라.', fortune_base: 65 },
  28: { number: 28, name_ko: '대과', name_hanja: '大過', name_full: '택풍대과', symbol: '☱☴', gua_ci: '대들보가 휘어지니 나아갈 바가 있으면 이롭다. 과함을 경계하라.', fortune_base: 50 },
  29: { number: 29, name_ko: '감', name_hanja: '坎', name_full: '감위수', symbol: '☵☵', gua_ci: '성심이 있으면 형통하다. 험난한 때이니 믿음을 지켜라.', fortune_base: 45 },
  30: { number: 30, name_ko: '리', name_hanja: '離', name_full: '리위화', symbol: '☲☲', gua_ci: '바르게 함이 이로우니 형통하다. 밝음의 때이다.', fortune_base: 75 },
  31: { number: 31, name_ko: '함', name_hanja: '咸', name_full: '택산함', symbol: '☱☶', gua_ci: '형통하고 바르게 함이 이롭다. 감응하는 때이니 좋은 인연이다.', fortune_base: 85 },
  32: { number: 32, name_ko: '항', name_hanja: '恆', name_full: '뇌풍항', symbol: '☳☴', gua_ci: '형통하고 허물이 없다. 항상함의 도이니 변치 말라.', fortune_base: 70 },
  33: { number: 33, name_ko: '돈', name_hanja: '遯', name_full: '천산돈', symbol: '☰☶', gua_ci: '형통하다. 작은 일에 바르게 함이 이롭다. 물러남의 때이다.', fortune_base: 55 },
  34: { number: 34, name_ko: '대장', name_hanja: '大壯', name_full: '뇌천대장', symbol: '☳☰', gua_ci: '바르게 함이 이롭다. 크게 장성함이니 힘이 넘친다.', fortune_base: 80 },
  35: { number: 35, name_ko: '진', name_hanja: '晉', name_full: '화지진', symbol: '☲☷', gua_ci: '강후가 말을 하사받아 하루에 세 번 접견한다. 크게 나아간다.', fortune_base: 85 },
  36: { number: 36, name_ko: '명이', name_hanja: '明夷', name_full: '지화명이', symbol: '☷☲', gua_ci: '어려움 속에 바르게 함이 이롭다. 밝음이 가려진 때이다.', fortune_base: 40 },
  37: { number: 37, name_ko: '가인', name_hanja: '家人', name_full: '풍화가인', symbol: '☴☲', gua_ci: '여자가 바르게 함이 이롭다. 집안을 다스리는 때이다.', fortune_base: 75 },
  38: { number: 38, name_ko: '규', name_hanja: '睽', name_full: '화택규', symbol: '☲☱', gua_ci: '작은 일에 길하다. 어긋남의 때이니 조화를 이뤄라.', fortune_base: 55 },
  39: { number: 39, name_ko: '건', name_hanja: '蹇', name_full: '수산건', symbol: '☵☶', gua_ci: '서남쪽이 이롭고 동북쪽은 이롭지 않다. 험난한 때이다.', fortune_base: 40 },
  40: { number: 40, name_ko: '해', name_hanja: '解', name_full: '뇌수해', symbol: '☳☵', gua_ci: '서남쪽이 이롭다. 풀림의 때이니 어려움이 해결된다.', fortune_base: 75 },
  41: { number: 41, name_ko: '손', name_hanja: '損', name_full: '산택손', symbol: '☶☱', gua_ci: '성심이 있으면 크게 길하다. 덜어냄의 때이다.', fortune_base: 60 },
  42: { number: 42, name_ko: '익', name_hanja: '益', name_full: '풍뢰익', symbol: '☴☳', gua_ci: '나아갈 바가 있으면 이롭다. 더함의 때이니 이익이 있다.', fortune_base: 85 },
  43: { number: 43, name_ko: '쾌', name_hanja: '夬', name_full: '택천쾌', symbol: '☱☰', gua_ci: '왕정에 드러내어 알려야 한다. 결단의 때이다.', fortune_base: 70 },
  44: { number: 44, name_ko: '구', name_hanja: '姤', name_full: '천풍구', symbol: '☰☴', gua_ci: '여자가 건장하니 여자를 취하지 말라. 만남의 때이나 조심하라.', fortune_base: 50 },
  45: { number: 45, name_ko: '췌', name_hanja: '萃', name_full: '택지췌', symbol: '☱☷', gua_ci: '형통하다. 왕이 종묘에 이르니 모임의 때이다.', fortune_base: 75 },
  46: { number: 46, name_ko: '승', name_hanja: '升', name_full: '지풍승', symbol: '☷☴', gua_ci: '크게 형통하니 대인을 만남이 이롭다. 상승의 때이다.', fortune_base: 85 },
  47: { number: 47, name_ko: '곤', name_hanja: '困', name_full: '택수곤', symbol: '☱☵', gua_ci: '형통하고 바르게 하면 대인이 길하다. 곤궁한 때이다.', fortune_base: 40 },
  48: { number: 48, name_ko: '정', name_hanja: '井', name_full: '수풍정', symbol: '☵☴', gua_ci: '마을을 바꿔도 우물은 바꾸지 않는다. 근본을 지켜라.', fortune_base: 65 },
  49: { number: 49, name_ko: '혁', name_hanja: '革', name_full: '택화혁', symbol: '☱☲', gua_ci: '이미 된 날에 믿음이 있다. 변혁의 때이다.', fortune_base: 70 },
  50: { number: 50, name_ko: '정', name_hanja: '鼎', name_full: '화풍정', symbol: '☲☴', gua_ci: '크게 형통하다. 솥의 상이니 새롭게 시작하라.', fortune_base: 80 },
  51: { number: 51, name_ko: '진', name_hanja: '震', name_full: '진위뢰', symbol: '☳☳', gua_ci: '형통하다. 우레가 치니 두려워하면 오히려 길하다.', fortune_base: 65 },
  52: { number: 52, name_ko: '간', name_hanja: '艮', name_full: '간위산', symbol: '☶☶', gua_ci: '그침의 때이니 멈추어 생각하라.', fortune_base: 60 },
  53: { number: 53, name_ko: '점', name_hanja: '漸', name_full: '풍산점', symbol: '☴☶', gua_ci: '여자가 시집감이 길하다. 점진적으로 나아가라.', fortune_base: 70 },
  54: { number: 54, name_ko: '귀매', name_hanja: '歸妹', name_full: '뇌택귀매', symbol: '☳☱', gua_ci: '나아가면 흉하다. 이로울 바가 없다. 조심하라.', fortune_base: 40 },
  55: { number: 55, name_ko: '풍', name_hanja: '豐', name_full: '뇌화풍', symbol: '☳☲', gua_ci: '형통하니 왕이 이에 이른다. 풍성함의 때이다.', fortune_base: 85 },
  56: { number: 56, name_ko: '여', name_hanja: '旅', name_full: '화산여', symbol: '☲☶', gua_ci: '작게 형통하다. 나그네의 바름이 길하다.', fortune_base: 55 },
  57: { number: 57, name_ko: '손', name_hanja: '巽', name_full: '손위풍', symbol: '☴☴', gua_ci: '작게 형통하다. 나아갈 바가 있으면 이롭다.', fortune_base: 65 },
  58: { number: 58, name_ko: '태', name_hanja: '兌', name_full: '태위택', symbol: '☱☱', gua_ci: '형통하고 바르게 함이 이롭다. 기쁨의 때이다.', fortune_base: 80 },
  59: { number: 59, name_ko: '환', name_hanja: '渙', name_full: '풍수환', symbol: '☴☵', gua_ci: '형통하다. 왕이 종묘에 이른다. 흩어짐의 때이다.', fortune_base: 60 },
  60: { number: 60, name_ko: '절', name_hanja: '節', name_full: '수택절', symbol: '☵☱', gua_ci: '형통하나 괴로운 절제는 바르게 할 수 없다.', fortune_base: 65 },
  61: { number: 61, name_ko: '중부', name_hanja: '中孚', name_full: '풍택중부', symbol: '☴☱', gua_ci: '돼지와 물고기에도 길하다. 큰 믿음의 때이다.', fortune_base: 80 },
  62: { number: 62, name_ko: '소과', name_hanja: '小過', name_full: '뇌산소과', symbol: '☳☶', gua_ci: '형통하고 바르게 함이 이롭다. 작은 일에 지나침이다.', fortune_base: 55 },
  63: { number: 63, name_ko: '기제', name_hanja: '旣濟', name_full: '수화기제', symbol: '☵☲', gua_ci: '형통하나 작게 바르게 함이 이롭다. 이미 완성되었다.', fortune_base: 75 },
  64: { number: 64, name_ko: '미제', name_hanja: '未濟', name_full: '화수미제', symbol: '☲☵', gua_ci: '형통하다. 작은 여우가 거의 건너다 꼬리를 적신다. 아직 완성되지 않았다.', fortune_base: 60 },
};

// Category-specific interpretations
export const CATEGORY_INTERPRETATIONS: Record<number, Record<string, string>> = {
  1: { // Wealth
    positive: '재물운이 좋습니다. 투자나 사업에서 좋은 결과를 기대할 수 있습니다.',
    neutral: '재정 상황이 안정적입니다. 무리한 투자는 피하세요.',
    negative: '재물 손실을 조심하세요. 지출을 줄이고 저축하는 것이 좋습니다.',
  },
  2: { // Career
    positive: '직업운이 상승합니다. 승진이나 이직에 좋은 기회가 있습니다.',
    neutral: '현재 위치에서 역량을 쌓는 것이 좋습니다.',
    negative: '직장에서의 갈등을 조심하세요. 인내가 필요한 시기입니다.',
  },
  3: { // Study
    positive: '학업에 좋은 성과가 있을 것입니다. 집중력이 높아집니다.',
    neutral: '꾸준히 노력하면 성과가 있을 것입니다.',
    negative: '학업에 방해 요소가 있습니다. 집중력을 높이는 것이 필요합니다.',
  },
  4: { // Love
    positive: '연애운이 좋습니다. 새로운 만남이나 관계 발전이 기대됩니다.',
    neutral: '현재 관계를 유지하는 것이 좋습니다. 급하게 진행하지 마세요.',
    negative: '연애에 어려움이 있을 수 있습니다. 소통에 신경 쓰세요.',
  },
  5: { // Relations
    positive: '대인관계가 원만해집니다. 좋은 인연을 만날 수 있습니다.',
    neutral: '관계를 유지하는 것에 집중하세요.',
    negative: '인간관계에서 갈등이 생길 수 있습니다. 양보와 이해가 필요합니다.',
  },
  6: { // Health
    positive: '건강 상태가 좋습니다. 활력이 넘칩니다.',
    neutral: '건강을 유지하기 위해 규칙적인 생활이 필요합니다.',
    negative: '건강에 주의가 필요합니다. 무리하지 마세요.',
  },
  7: { // Hobby
    positive: '취미 활동에서 즐거움을 찾을 수 있습니다.',
    neutral: '새로운 취미를 시도해 보는 것이 좋습니다.',
    negative: '취미에 너무 많은 시간을 쓰지 않도록 하세요.',
  },
  8: { // Destiny
    positive: '운명적인 전환점이 될 수 있습니다. 좋은 변화가 있습니다.',
    neutral: '현재의 흐름을 따르는 것이 좋습니다.',
    negative: '큰 변화는 피하는 것이 좋습니다. 때를 기다리세요.',
  },
  9: { // Other
    positive: '전반적으로 운이 좋습니다.',
    neutral: '평온한 시기입니다.',
    negative: '조심스럽게 행동하세요.',
  },
};

// Fortune score mapping
const FORTUNE_SCORE_MAP: Record<string, number> = {
  '대길': 95,
  '길': 75,
  '평': 55,
  '소흉': 35,
  '흉': 25,
  '대흉': 15,
};

// Generate divination result with REAL 384 yao data
export function generateDivination(categoryId: number, yaoPosition: number, isYang: boolean) {
  // Random hexagram (1-64)
  const hexagramNumber = Math.floor(Math.random() * 64) + 1;
  const hexagram = HEXAGRAMS[hexagramNumber];

  // Get REAL yao data from 384 yao database
  const realYaoData = getYaoData(hexagramNumber, yaoPosition);

  // Use real yao data if available, fallback to old method
  let fortuneScore: number;
  let fortuneCategory: string;
  let yaoText: string;
  let yaoInterpretation: string;
  let keywords: string[];

  let textHanja: string;

  if (realYaoData) {
    // Use REAL 384 yao data with complete fields
    fortuneCategory = realYaoData.fortune_category;
    fortuneScore = realYaoData.fortune_score;  // Use actual numeric score

    // Add some variance
    const randomModifier = Math.floor(Math.random() * 10) - 5;
    fortuneScore = Math.max(20, Math.min(100, fortuneScore + randomModifier));

    textHanja = realYaoData.text_hanja;  // Real Chinese text
    yaoText = realYaoData.text_kr;
    yaoInterpretation = realYaoData.interpretation;
    keywords = realYaoData.keywords;
  } else {
    // Fallback to old method
    const baseScore = hexagram.fortune_base;
    const yaoModifier = (yaoPosition === 5 ? 10 : yaoPosition === 3 ? -5 : 0);
    const yangModifier = isYang ? 5 : -2;
    const randomModifier = Math.floor(Math.random() * 20) - 10;

    fortuneScore = baseScore + yaoModifier + yangModifier + randomModifier;
    fortuneScore = Math.max(20, Math.min(100, fortuneScore));

    if (fortuneScore >= 90) fortuneCategory = '대길';
    else if (fortuneScore >= 70) fortuneCategory = '길';
    else if (fortuneScore >= 50) fortuneCategory = '평';
    else if (fortuneScore >= 30) fortuneCategory = '소흉';
    else fortuneCategory = '흉';

    textHanja = '';  // No Chinese text in fallback
    yaoText = hexagram.gua_ci;
    yaoInterpretation = hexagram.gua_ci;
    keywords = getKeywords(fortuneScore, categoryId);
  }

  // Get category-specific interpretation
  const category = CATEGORY_INTERPRETATIONS[categoryId] || CATEGORY_INTERPRETATIONS[9];
  let categoryInterpretation = '';
  if (fortuneScore >= 70) {
    categoryInterpretation = category.positive;
  } else if (fortuneScore >= 45) {
    categoryInterpretation = category.neutral;
  } else {
    categoryInterpretation = category.negative;
  }

  // Yao name
  const yaoName = realYaoData?.name || (isYang ? YAO_NAMES.yang[yaoPosition - 1] : YAO_NAMES.yin[yaoPosition - 1]);

  return {
    hexagram: {
      number: hexagram.number,
      name_ko: hexagram.name_ko,
      name_hanja: hexagram.name_hanja,
      name_full: hexagram.name_full,
      symbol: hexagram.symbol,
    },
    yao: {
      position: yaoPosition,
      name: yaoName,
      text_hanja: textHanja,  // Real Chinese text (e.g., "潛龍勿用")
      text_kr: yaoText,
    },
    interpretation: `${yaoInterpretation} ${categoryInterpretation}`,
    fortune_score: fortuneScore,
    fortune_category: fortuneCategory,
    keywords,
    matched_category: `${MAJOR_CATEGORIES.find(c => c.id === categoryId)?.emoji} ${MAJOR_CATEGORIES.find(c => c.id === categoryId)?.name}`,
    caution: fortuneScore < 50 ? '신중하게 행동하시고 큰 결정은 미루세요.' : undefined,
  };
}

function getKeywords(score: number, categoryId: number): string[] {
  const categoryKeywords: Record<number, string[][]> = {
    1: [['횡재', '풍요', '번영'], ['안정', '절약', '관리'], ['손실', '주의', '절제']],
    2: [['승진', '성공', '기회'], ['유지', '준비', '인내'], ['갈등', '조심', '기다림']],
    3: [['합격', '성취', '집중'], ['노력', '꾸준함', '기초'], ['어려움', '분산', '휴식']],
    4: [['인연', '사랑', '행복'], ['소통', '이해', '신뢰'], ['이별', '갈등', '거리']],
    5: [['화합', '우정', '협력'], ['유지', '배려', '존중'], ['갈등', '오해', '거리']],
    6: [['활력', '건강', '회복'], ['관리', '규칙', '균형'], ['주의', '휴식', '검진']],
    7: [['즐거움', '성취', '발견'], ['탐색', '시도', '여유'], ['과몰입', '조절', '균형']],
    8: [['전환', '행운', '기회'], ['흐름', '자연', '수용'], ['정체', '기다림', '인내']],
    9: [['행운', '순조', '평화'], ['일상', '안정', '지속'], ['주의', '신중', '준비']],
  };

  const keywords = categoryKeywords[categoryId] || categoryKeywords[9];
  if (score >= 70) return keywords[0];
  if (score >= 45) return keywords[1];
  return keywords[2];
}

// ========================================
// Today's Fortune (Date-seeded generation)
// ========================================

// Simple seeded random number generator
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// Hash string to number (for date string)
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Lunar date approximation (simplified - for display only)
export function getLunarDate(date: Date): string {
  // Simplified lunar date calculation
  // In production, use a proper lunar calendar library
  const lunarData: Record<string, string> = {
    '2026-1-1': '11월 12일',
    '2026-1-2': '11월 13일',
    '2026-1-3': '11월 14일',
    '2026-1-4': '11월 15일',
    '2026-1-5': '11월 16일',
  };

  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

  if (lunarData[key]) {
    return lunarData[key];
  }

  // Fallback: approximate lunar date (roughly 29 days behind solar)
  const lunarMonth = ((date.getMonth() + 11) % 12) + 1;
  const lunarDay = ((date.getDate() + 18) % 30) + 1;
  return `${lunarMonth}월 ${lunarDay}일`;
}

// Today's fortune headlines
const DAILY_HEADLINES = [
  '오늘은 새로운 시작의 기운이 있습니다',
  '조용히 내면을 살피는 것이 좋은 날입니다',
  '적극적으로 움직이면 좋은 결과가 있습니다',
  '인연과 만남에 좋은 기운이 흐릅니다',
  '재물운이 상승하는 길일입니다',
  '건강에 유의하며 무리하지 마세요',
  '창의적인 아이디어가 떠오르는 날입니다',
  '협력과 조화가 중요한 하루입니다',
  '변화를 받아들이면 발전이 있습니다',
  '차분하게 계획을 세우기 좋은 날입니다',
];

// Generate today's fortune with REAL 384 yao data (consistent for the entire day)
export function generateTodayFortune(date: Date = new Date()) {
  const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const seed = hashString(dateStr);
  const random = seededRandom(seed);

  // Generate hexagram (1-64) based on date seed
  const hexagramNumber = Math.floor(random() * 64) + 1;
  const hexagram = HEXAGRAMS[hexagramNumber];

  // Generate yao position (1-6)
  const yaoPosition = Math.floor(random() * 6) + 1;
  const isYang = random() > 0.5;

  // Get REAL yao data from 384 yao database
  const realYaoData = getYaoData(hexagramNumber, yaoPosition);

  let fortuneScore: number;
  let fortuneCategory: string;
  let yaoText: string;
  let textHanja: string;
  let yaoInterpretation: string;
  let keywords: string[];
  let yaoName: string;

  if (realYaoData) {
    // Use REAL 384 yao data with complete fields
    fortuneCategory = realYaoData.fortune_category;
    fortuneScore = realYaoData.fortune_score;  // Use actual numeric score
    textHanja = realYaoData.text_hanja;        // Real Chinese text
    yaoText = realYaoData.text_kr;
    yaoInterpretation = realYaoData.interpretation;
    keywords = realYaoData.keywords;
    yaoName = realYaoData.name;
  } else {
    // Fallback to old method
    const baseScore = hexagram.fortune_base;
    const yaoModifier = (yaoPosition === 5 ? 10 : yaoPosition === 3 ? -5 : 0);
    const yangModifier = isYang ? 5 : -2;
    const randomModifier = Math.floor(random() * 20) - 10;

    fortuneScore = baseScore + yaoModifier + yangModifier + randomModifier;
    fortuneScore = Math.max(20, Math.min(100, fortuneScore));

    if (fortuneScore >= 90) fortuneCategory = '대길';
    else if (fortuneScore >= 70) fortuneCategory = '길';
    else if (fortuneScore >= 50) fortuneCategory = '평';
    else if (fortuneScore >= 30) fortuneCategory = '소흉';
    else fortuneCategory = '흉';

    textHanja = '';  // No Chinese text in fallback
    yaoText = hexagram.gua_ci;
    yaoInterpretation = hexagram.gua_ci;
    yaoName = isYang ? YAO_NAMES.yang[yaoPosition - 1] : YAO_NAMES.yin[yaoPosition - 1];

    const allKeywords = ['희망', '성장', '조화', '인내', '지혜', '용기', '평화', '행운', '소통', '발전'];
    keywords = [];
    const keywordCount = 3 + Math.floor(random() * 2);
    for (let i = 0; i < keywordCount; i++) {
      const idx = Math.floor(random() * allKeywords.length);
      if (!keywords.includes(allKeywords[idx])) {
        keywords.push(allKeywords[idx]);
      }
    }
  }

  // Daily headline
  const headlineIndex = Math.floor(random() * DAILY_HEADLINES.length);
  const dailyHeadline = DAILY_HEADLINES[headlineIndex];

  return {
    hexagram_number: hexagram.number,
    hexagram_name: hexagram.name_ko,
    hexagram_hanja: hexagram.name_hanja,
    hexagram_full: hexagram.name_full,
    hexagram_symbol: hexagram.symbol,
    yao_position: yaoPosition,
    yao_name: yaoName,
    text_hanja: textHanja,  // Real Chinese text (e.g., "潛龍勿用")
    text_kr: yaoText,
    interpretation: yaoInterpretation,
    fortune_score: fortuneScore,
    fortune_category: fortuneCategory,
    keywords,
    daily_headline: dailyHeadline,
    daily_body: `${hexagram.name_full}(${hexagram.name_hanja}) 괘의 ${yaoName}. ${yaoInterpretation}`,
    lunar_date: getLunarDate(date),
    date: dateStr,
  };
}

// Export type for today's fortune
export interface TodayFortuneData {
  hexagram_number: number;
  hexagram_name: string;
  hexagram_hanja: string;
  hexagram_full: string;
  hexagram_symbol: string;
  yao_position: number;
  yao_name: string;
  text_hanja: string;
  text_kr: string;
  interpretation: string;
  fortune_score: number;
  fortune_category: string;
  keywords: string[];
  daily_headline: string;
  daily_body: string;
  lunar_date: string;
  date: string;
}
