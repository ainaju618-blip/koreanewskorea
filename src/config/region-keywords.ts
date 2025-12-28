/**
 * Region Keyword Configuration
 * ============================
 * Static keyword mapping for dynamic sub-menu generation
 *
 * Usage:
 *   - Match article titles against keywords
 *   - Generate sub-menu items based on keyword frequency
 *   - Fallback when dynamic aggregation is unavailable
 *
 * Structure:
 *   region_code: {
 *     keywords: ['keyword1', 'keyword2', ...],
 *     subMenus: [
 *       { name: 'Display Name', keywords: ['match1', 'match2'] }
 *     ]
 *   }
 */

export interface SubMenuItem {
    name: string;           // Display name (Korean)
    slug: string;           // URL slug
    keywords: string[];     // Keywords to match in titles
    icon?: string;          // Optional icon name
}

export interface RegionKeywordConfig {
    name: string;           // Region display name
    keywords: string[];     // General region keywords
    subMenus: SubMenuItem[];
}

// Static keyword mapping per region
export const REGION_KEYWORDS: Record<string, RegionKeywordConfig> = {
    // ===== Metro Cities =====
    gwangju: {
        name: '광주광역시',
        keywords: ['광주', '빛고을', '민주', '문화'],
        subMenus: [
            { name: '문화예술', slug: 'culture', keywords: ['문화', '예술', '전시', '공연', '비엔날레', 'ACC'] },
            { name: '민주인권', slug: 'democracy', keywords: ['민주', '인권', '5.18', '오월', '기념'] },
            { name: '도시개발', slug: 'urban', keywords: ['개발', '도시', '건설', '교통', '지하철', 'AI'] },
            { name: '교육복지', slug: 'welfare', keywords: ['교육', '복지', '청년', '일자리', '지원'] },
        ]
    },

    // ===== Jeonnam Province =====
    jeonnam: {
        name: '전라남도',
        keywords: ['전남', '도청', '남도'],
        subMenus: [
            { name: '도정소식', slug: 'admin', keywords: ['도정', '정책', '계획', '예산', '의회'] },
            { name: '농수산업', slug: 'agri', keywords: ['농업', '수산', '어업', '축산', '쌀', '배'] },
            { name: '관광문화', slug: 'tourism', keywords: ['관광', '축제', '문화', '여행', '체험'] },
            { name: '지역발전', slug: 'develop', keywords: ['발전', '투자', '기업', '산업', '일자리'] },
        ]
    },

    // ===== Cities =====
    mokpo: {
        name: '목포시',
        keywords: ['목포', '항구', '유달산'],
        subMenus: [
            { name: '해양관광', slug: 'marine', keywords: ['해양', '항구', '케이블카', '갯벌', '바다', '섬'] },
            { name: '근대문화', slug: 'modern', keywords: ['근대', '역사', '문화', '원도심', '예술'] },
            { name: '도시개발', slug: 'urban', keywords: ['개발', '도시', '신도심', '교통', '건설'] },
            { name: '시민생활', slug: 'life', keywords: ['복지', '교육', '안전', '환경', '시민'] },
        ]
    },

    yeosu: {
        name: '여수시',
        keywords: ['여수', '밤바다', '엑스포'],
        subMenus: [
            { name: '관광명소', slug: 'tourism', keywords: ['관광', '밤바다', '엑스포', '오동도', '케이블카'] },
            { name: '해양수산', slug: 'marine', keywords: ['수산', '해양', '항만', '조선', '어업'] },
            { name: '산업경제', slug: 'industry', keywords: ['산단', '화학', '산업', '경제', '투자'] },
            { name: '시민복지', slug: 'welfare', keywords: ['복지', '교육', '청년', '안전', '환경'] },
        ]
    },

    suncheon: {
        name: '순천시',
        keywords: ['순천', '정원', '순천만'],
        subMenus: [
            { name: '생태관광', slug: 'eco', keywords: ['순천만', '정원', '습지', '생태', '자연'] },
            { name: '문화유산', slug: 'heritage', keywords: ['낙안읍성', '선암사', '문화', '역사', '사찰'] },
            { name: '도시발전', slug: 'urban', keywords: ['개발', '교통', '철도', '도시', '건설'] },
            { name: '시민생활', slug: 'life', keywords: ['복지', '교육', '청년', '일자리', '안전'] },
        ]
    },

    naju: {
        name: '나주시',
        keywords: ['나주', '빛가람', '배', '쌀'],
        subMenus: [
            { name: '에너지산업', slug: 'energy', keywords: ['에너지', '전력', '한전', '빛가람', '혁신도시'] },
            { name: '농업특산', slug: 'agri', keywords: ['배', '쌀', '농업', '특산', '농산물'] },
            { name: '역사문화', slug: 'heritage', keywords: ['역사', '문화', '목사고을', '전통', '유적'] },
            { name: '도시행정', slug: 'admin', keywords: ['행정', '도시', '복지', '교육', '시정'] },
        ]
    },

    gwangyang: {
        name: '광양시',
        keywords: ['광양', '매화', '제철'],
        subMenus: [
            { name: '철강산업', slug: 'steel', keywords: ['제철', '포스코', '산업', '항만', '물류'] },
            { name: '매화축제', slug: 'plum', keywords: ['매화', '축제', '꽃', '봄', '관광'] },
            { name: '도시발전', slug: 'urban', keywords: ['개발', '도시', '교통', '건설', '투자'] },
            { name: '시민생활', slug: 'life', keywords: ['복지', '교육', '안전', '환경', '문화'] },
        ]
    },

    // ===== Counties =====
    damyang: {
        name: '담양군',
        keywords: ['담양', '대나무', '죽녹원'],
        subMenus: [
            { name: '대나무생태', slug: 'bamboo', keywords: ['대나무', '죽녹원', '메타세쿼이아', '생태', '숲'] },
            { name: '문화예술', slug: 'culture', keywords: ['문화', '가사문학', '소쇄원', '예술', '전통'] },
            { name: '농업특산', slug: 'agri', keywords: ['농업', '쌀', '딸기', '특산', '친환경'] },
            { name: '군정소식', slug: 'admin', keywords: ['군정', '행정', '복지', '교육', '안전'] },
        ]
    },

    gokseong: {
        name: '곡성군',
        keywords: ['곡성', '기차마을', '섬진강'],
        subMenus: [
            { name: '섬진강관광', slug: 'river', keywords: ['섬진강', '기차마을', '관광', '장미', '축제'] },
            { name: '농업특산', slug: 'agri', keywords: ['농업', '멜론', '토란', '특산', '친환경'] },
            { name: '문화유산', slug: 'heritage', keywords: ['도림사', '태안사', '문화', '역사', '사찰'] },
            { name: '군정소식', slug: 'admin', keywords: ['군정', '행정', '복지', '교육', '지원'] },
        ]
    },

    gurye: {
        name: '구례군',
        keywords: ['구례', '지리산', '산수유'],
        subMenus: [
            { name: '지리산관광', slug: 'mountain', keywords: ['지리산', '화엄사', '피아골', '등산', '자연'] },
            { name: '산수유축제', slug: 'festival', keywords: ['산수유', '축제', '꽃', '봄', '마을'] },
            { name: '농업특산', slug: 'agri', keywords: ['농업', '오미자', '특산', '친환경', '농산물'] },
            { name: '군정소식', slug: 'admin', keywords: ['군정', '행정', '복지', '재해', '안전'] },
        ]
    },

    goheung: {
        name: '고흥군',
        keywords: ['고흥', '우주', '나로도'],
        subMenus: [
            { name: '우주항공', slug: 'space', keywords: ['우주', '나로', '발사', '로켓', '항공'] },
            { name: '해양관광', slug: 'marine', keywords: ['해양', '섬', '바다', '소록도', '관광'] },
            { name: '농수산업', slug: 'agri', keywords: ['유자', '수산', '농업', '특산', '어업'] },
            { name: '군정소식', slug: 'admin', keywords: ['군정', '행정', '복지', '교육', '지원'] },
        ]
    },

    boseong: {
        name: '보성군',
        keywords: ['보성', '녹차', '벌교'],
        subMenus: [
            { name: '녹차관광', slug: 'greentea', keywords: ['녹차', '다원', '차밭', '관광', '체험'] },
            { name: '벌교문화', slug: 'beolgyo', keywords: ['벌교', '갯벌', '꼬막', '문학', '태백산맥'] },
            { name: '농업특산', slug: 'agri', keywords: ['농업', '쌀', '특산', '친환경', '농산물'] },
            { name: '군정소식', slug: 'admin', keywords: ['군정', '행정', '복지', '축제', '지원'] },
        ]
    },

    hwasun: {
        name: '화순군',
        keywords: ['화순', '고인돌', '온천'],
        subMenus: [
            { name: '고인돌유적', slug: 'dolmen', keywords: ['고인돌', '유네스코', '유적', '역사', '세계유산'] },
            { name: '온천관광', slug: 'spa', keywords: ['온천', '힐링', '관광', '휴양', '치유'] },
            { name: '농업특산', slug: 'agri', keywords: ['농업', '쌀', '복숭아', '특산', '친환경'] },
            { name: '군정소식', slug: 'admin', keywords: ['군정', '행정', '복지', '안전', '지원'] },
        ]
    },

    jangheung: {
        name: '장흥군',
        keywords: ['장흥', '정남진', '천관산'],
        subMenus: [
            { name: '정남진관광', slug: 'jungnamjin', keywords: ['정남진', '천관산', '관광', '해변', '자연'] },
            { name: '문학마을', slug: 'literature', keywords: ['문학', '이청준', '한승원', '소설', '작가'] },
            { name: '농수산업', slug: 'agri', keywords: ['한우', '표고', '키조개', '수산', '농업'] },
            { name: '군정소식', slug: 'admin', keywords: ['군정', '행정', '복지', '축제', '지원'] },
        ]
    },

    gangjin: {
        name: '강진군',
        keywords: ['강진', '다산', '청자'],
        subMenus: [
            { name: '다산문화', slug: 'dasan', keywords: ['다산', '정약용', '초당', '유배', '실학'] },
            { name: '청자예술', slug: 'celadon', keywords: ['청자', '도자기', '도요지', '예술', '전통'] },
            { name: '농업특산', slug: 'agri', keywords: ['딸기', '배', '농업', '특산', '친환경'] },
            { name: '군정소식', slug: 'admin', keywords: ['군정', '행정', '복지', '관광', '지원'] },
        ]
    },

    haenam: {
        name: '해남군',
        keywords: ['해남', '땅끝', '대흥사'],
        subMenus: [
            { name: '땅끝관광', slug: 'land-end', keywords: ['땅끝', '땅끝마을', '관광', '일출', '전망대'] },
            { name: '사찰문화', slug: 'temple', keywords: ['대흥사', '미황사', '사찰', '문화재', '불교'] },
            { name: '농업특산', slug: 'agri', keywords: ['고구마', '배추', '김치', '농업', '특산'] },
            { name: '군정소식', slug: 'admin', keywords: ['군정', '행정', '복지', '안전', '지원'] },
        ]
    },

    yeongam: {
        name: '영암군',
        keywords: ['영암', '월출산', 'F1'],
        subMenus: [
            { name: '월출산관광', slug: 'mountain', keywords: ['월출산', '국립공원', '등산', '자연', '관광'] },
            { name: '왕인문화', slug: 'wangin', keywords: ['왕인', '박사', '도갑사', '역사', '일본'] },
            { name: '모터스포츠', slug: 'motorsport', keywords: ['F1', '서킷', '자동차', '레이싱', '모터'] },
            { name: '군정소식', slug: 'admin', keywords: ['군정', '행정', '복지', '농업', '지원'] },
        ]
    },

    muan: {
        name: '무안군',
        keywords: ['무안', '연꽃', '황토'],
        subMenus: [
            { name: '연꽃축제', slug: 'lotus', keywords: ['연꽃', '백련', '축제', '연못', '생태'] },
            { name: '황토관광', slug: 'mud', keywords: ['황토', '갯벌', '머드', '체험', '힐링'] },
            { name: '공항물류', slug: 'airport', keywords: ['공항', '무안공항', '항공', '물류', '교통'] },
            { name: '군정소식', slug: 'admin', keywords: ['군정', '행정', '복지', '농업', '지원'] },
        ]
    },

    hampyeong: {
        name: '함평군',
        keywords: ['함평', '나비', '국화'],
        subMenus: [
            { name: '나비축제', slug: 'butterfly', keywords: ['나비', '축제', '생태', '자연', '체험'] },
            { name: '국화축제', slug: 'chrysan', keywords: ['국화', '축제', '꽃', '가을', '전시'] },
            { name: '농업특산', slug: 'agri', keywords: ['한우', '쌀', '농업', '특산', '친환경'] },
            { name: '군정소식', slug: 'admin', keywords: ['군정', '행정', '복지', '교육', '지원'] },
        ]
    },

    yeonggwang: {
        name: '영광군',
        keywords: ['영광', '굴비', '법성포'],
        subMenus: [
            { name: '굴비특산', slug: 'gulbi', keywords: ['굴비', '법성포', '수산', '젓갈', '특산'] },
            { name: '불교문화', slug: 'buddhism', keywords: ['불갑사', '원불교', '사찰', '성지', '종교'] },
            { name: '해안관광', slug: 'coast', keywords: ['백수', '해안', '낙조', '바다', '관광'] },
            { name: '군정소식', slug: 'admin', keywords: ['군정', '행정', '복지', '원전', '지원'] },
        ]
    },

    jangseong: {
        name: '장성군',
        keywords: ['장성', '백양사', '편백'],
        subMenus: [
            { name: '백양사관광', slug: 'temple', keywords: ['백양사', '단풍', '사찰', '관광', '자연'] },
            { name: '편백숲힐링', slug: 'forest', keywords: ['편백', '축령산', '숲', '힐링', '치유'] },
            { name: '황룡강생태', slug: 'river', keywords: ['황룡강', '꽃', '생태', '자전거', '공원'] },
            { name: '군정소식', slug: 'admin', keywords: ['군정', '행정', '복지', '교육', '지원'] },
        ]
    },

    wando: {
        name: '완도군',
        keywords: ['완도', '청해진', '전복'],
        subMenus: [
            { name: '청해진역사', slug: 'history', keywords: ['청해진', '장보고', '역사', '해양', '문화'] },
            { name: '섬관광', slug: 'island', keywords: ['보길도', '청산도', '섬', '관광', '슬로시티'] },
            { name: '수산특산', slug: 'seafood', keywords: ['전복', '김', '미역', '수산', '양식'] },
            { name: '군정소식', slug: 'admin', keywords: ['군정', '행정', '복지', '해양', '지원'] },
        ]
    },

    jindo: {
        name: '진도군',
        keywords: ['진도', '바닷길', '진도개'],
        subMenus: [
            { name: '바닷길축제', slug: 'sea-road', keywords: ['바닷길', '신비', '축제', '모세', '관광'] },
            { name: '진도개문화', slug: 'dog', keywords: ['진도개', '천연기념물', '개', '명견', '문화'] },
            { name: '예술문화', slug: 'art', keywords: ['운림산방', '남종화', '예술', '문화', '아리랑'] },
            { name: '군정소식', slug: 'admin', keywords: ['군정', '행정', '복지', '수산', '지원'] },
        ]
    },

    shinan: {
        name: '신안군',
        keywords: ['신안', '퍼플섬', '천사대교'],
        subMenus: [
            { name: '섬관광', slug: 'island', keywords: ['퍼플섬', '천사', '섬', '비금도', '증도'] },
            { name: '갯벌생태', slug: 'mudflat', keywords: ['갯벌', '염전', '소금', '생태', '유네스코'] },
            { name: '수산특산', slug: 'seafood', keywords: ['새우젓', '수산', '낙지', '특산', '어업'] },
            { name: '군정소식', slug: 'admin', keywords: ['군정', '행정', '복지', '교통', '지원'] },
        ]
    },

    // ===== Education Offices =====
    gwangju_edu: {
        name: '광주교육청',
        keywords: ['광주교육', '학교', '교육청'],
        subMenus: [
            { name: '교육정책', slug: 'policy', keywords: ['정책', '계획', '교육과정', '혁신', '미래'] },
            { name: '학교소식', slug: 'school', keywords: ['학교', '학생', '수업', '행사', '졸업'] },
            { name: '진로진학', slug: 'career', keywords: ['진로', '진학', '입시', '대학', '취업'] },
            { name: '교육복지', slug: 'welfare', keywords: ['급식', '돌봄', '복지', '지원', '안전'] },
        ]
    },

    jeonnam_edu: {
        name: '전남교육청',
        keywords: ['전남교육', '학교', '교육청'],
        subMenus: [
            { name: '교육정책', slug: 'policy', keywords: ['정책', '계획', '교육과정', '혁신', '농촌'] },
            { name: '학교소식', slug: 'school', keywords: ['학교', '학생', '수업', '행사', '졸업'] },
            { name: '작은학교', slug: 'small-school', keywords: ['작은학교', '농촌', '통폐합', '살리기', '마을'] },
            { name: '교육복지', slug: 'welfare', keywords: ['급식', '돌봄', '복지', '지원', '안전'] },
        ]
    },
};

/**
 * Get keywords for a specific region
 */
export function getRegionKeywords(regionCode: string): RegionKeywordConfig | null {
    return REGION_KEYWORDS[regionCode] || null;
}

/**
 * Match article title against region keywords
 * Returns matching sub-menu slugs
 */
export function matchTitleToSubMenus(
    regionCode: string,
    title: string
): { slug: string; name: string; score: number }[] {
    const config = REGION_KEYWORDS[regionCode];
    if (!config) return [];

    const titleLower = title.toLowerCase();
    const results: { slug: string; name: string; score: number }[] = [];

    for (const subMenu of config.subMenus) {
        let score = 0;
        for (const keyword of subMenu.keywords) {
            if (titleLower.includes(keyword.toLowerCase())) {
                score++;
            }
        }
        if (score > 0) {
            results.push({
                slug: subMenu.slug,
                name: subMenu.name,
                score
            });
        }
    }

    return results.sort((a, b) => b.score - a.score);
}

/**
 * Get all region codes
 */
export function getAllRegionCodes(): string[] {
    return Object.keys(REGION_KEYWORDS);
}
