export const CATEGORY_MAP: Record<string, { name: string; subMenus: string[]; dbCategory?: string }> = {
    'politics': {
        name: '정치',
        subMenus: ['정치일반', '대통령실', '광역·기초단체장', '국회', '도의회', '시군의회', '의정소식'],
        dbCategory: '정치'
    },
    'economy': {
        name: '경제',
        subMenus: ['경제일반', '금융', '부동산', '산업', '농수산', '유통'],
        dbCategory: '경제'
    },
    'society': {
        name: '사회',
        subMenus: ['사회일반', '사건사고', '법원·검찰', '환경', '노동', '복지'],
        dbCategory: '사회'
    },
    'culture': {
        name: '문화',
        subMenus: ['문화일반', '공연', '전시', '영화', '음악', '축제'],
        dbCategory: '문화'
    },
    'sports': {
        name: '스포츠',
        subMenus: ['스포츠일반', '야구', '축구', '골프', 'e스포츠'],
        dbCategory: '스포츠'
    },
    'people': {
        name: '인물',
        subMenus: ['인물', '동정', '부고', '결혼'],
        dbCategory: '인물'
    },
    'opinion': {
        name: '오피니언',
        subMenus: ['사설', '칼럼', '기고', '독자투고', '만평'],
        dbCategory: '오피니언'
    },

    // 지역 섹션 (전남 시군)
    'jeonnam': {
        name: '전라남도',
        subMenus: ['전남일반'],
        dbCategory: '전남'
    },
    'jeonnam-region': {
        name: '전남지역',
        subMenus: ['전체', '나주', '목포', '순천', '여수', '광양', '담양', '곡성', '구례', '고흥', '보성', '화순', '장흥', '강진', '해남', '영암', '무안', '함평', '영광', '장성', '완도', '진도', '신안'],
        dbCategory: '전남지역'
    },
    'region': {
        name: '지역',
        subMenus: ['순천', '목포', '여수', '광양', '나주', '담양', '곡성', '구례', '고흥', '보성', '화순', '장흥', '강진', '해남', '영암', '무안', '함평', '영광', '완도', '진도', '신안'],
        dbCategory: '지역'
    },
    'gwangju': {
        name: '광주',
        subMenus: ['광주일반', '동구', '서구', '남구', '북구', '광산구'],
        dbCategory: '광주'
    },
    'naju': {
        name: '나주',
        subMenus: ['나주일반', '혁신도시', '농업', '문화관광', '교육'],
        dbCategory: '나주'
    },

    // 교육 기관 추가
    'kedu': {
        name: '광주교육청',
        subMenus: ['전체'],
        dbCategory: '광주교육청'
    },
    '광주광역시교육청': {
        name: '광주광역시교육청',
        subMenus: ['전체'],
        dbCategory: '광주교육청'
    },
    'jedu': {
        name: '전남교육청',
        subMenus: ['전체'],
        dbCategory: '전남교육청'
    },
    '전라남도교육청': {
        name: '전라남도교육청',
        subMenus: ['전체'],
        dbCategory: '전남교육청'
    },

    // 전문 섹션
    'ai': {
        name: 'AI',
        subMenus: ['AI일반', '기술동향', '산업적용', '스타트업', '정책'],
        dbCategory: 'AI'
    },
    'edu': {
        name: '교육',
        subMenus: ['교육일반', '초중고', '대학', '입시', '교육정책', '평생교육'],
        dbCategory: '교육'
    },
};

export const JEONNAM_REGION_MAP: Record<string, string> = {
    '순천': 'suncheon',
    '목포': 'mokpo',
    '여수': 'yeosu',
    '광양': 'gwangyang',
    '나주': 'naju',
    '담양': 'damyang',
    '곡성': 'gokseong',
    '구례': 'gurye',
    '고흥': 'goheung',
    '보성': 'boseong',
    '화순': 'hwasun',
    '장흥': 'jangheung',
    '강진': 'gangjin',
    '해남': 'haenam',
    '영암': 'yeongam',
    '무안': 'muan',
    '함평': 'hampyeong',
    '영광': 'yeonggwang',
    '장성': 'jangseong',  // 누락되었던 매핑 추가
    '완도': 'wando',
    '진도': 'jindo',
    '신안': 'sinan',
};

export const JEONNAM_REGION_CODES = [
    'mokpo', 'yeosu', 'suncheon', 'gwangyang', 'naju',
    'damyang', 'gokseong', 'gurye', 'goheung', 'boseong',
    'hwasun', 'jangheung', 'gangjin', 'haenam', 'yeongam',
    'muan', 'hampyeong', 'yeonggwang', 'jangseong', 'wando', 'jindo', 'sinan'
];

export const JEONNAM_ZONES = [
    {
        name: '동부권',
        regions: ['순천', '여수', '광양', '구례', '곡성', '담양', '고흥', '보성']
    },
    {
        name: '서부권',
        regions: ['목포', '무안', '신안', '영암', '해남', '진도', '완도']
    },
    {
        name: '중부권',
        regions: ['나주', '화순', '장성', '함평', '영광', '장흥', '강진']
    }
];

// Category styling for No Image cards
export const CATEGORY_STYLES: Record<string, { gradient: string; iconName: string }> = {
    // Main categories
    'politics': { gradient: 'from-slate-600 to-slate-800', iconName: 'Building2' },
    'economy': { gradient: 'from-blue-500 to-blue-700', iconName: 'TrendingUp' },
    'society': { gradient: 'from-orange-500 to-orange-700', iconName: 'Users' },
    'culture': { gradient: 'from-purple-500 to-purple-700', iconName: 'Palette' },
    'sports': { gradient: 'from-green-500 to-green-700', iconName: 'Trophy' },
    'people': { gradient: 'from-pink-500 to-pink-700', iconName: 'User' },
    'opinion': { gradient: 'from-amber-500 to-amber-700', iconName: 'MessageSquare' },
    'ai': { gradient: 'from-cyan-500 to-cyan-700', iconName: 'Cpu' },
    'edu': { gradient: 'from-indigo-500 to-indigo-700', iconName: 'GraduationCap' },
    // Korean category names
    '정치': { gradient: 'from-slate-600 to-slate-800', iconName: 'Building2' },
    '경제': { gradient: 'from-blue-500 to-blue-700', iconName: 'TrendingUp' },
    '사회': { gradient: 'from-orange-500 to-orange-700', iconName: 'Users' },
    '문화': { gradient: 'from-purple-500 to-purple-700', iconName: 'Palette' },
    '스포츠': { gradient: 'from-green-500 to-green-700', iconName: 'Trophy' },
    '인물': { gradient: 'from-pink-500 to-pink-700', iconName: 'User' },
    '오피니언': { gradient: 'from-amber-500 to-amber-700', iconName: 'MessageSquare' },
    '교육': { gradient: 'from-indigo-500 to-indigo-700', iconName: 'GraduationCap' },
    // Regional categories
    '전남': { gradient: 'from-emerald-500 to-emerald-700', iconName: 'MapPin' },
    '전라남도': { gradient: 'from-emerald-500 to-emerald-700', iconName: 'MapPin' },
    '광주': { gradient: 'from-teal-500 to-teal-700', iconName: 'Building' },
    '광주광역시': { gradient: 'from-teal-500 to-teal-700', iconName: 'Building' },
    '나주': { gradient: 'from-lime-500 to-lime-700', iconName: 'Sprout' },
    // Education offices
    '광주교육청': { gradient: 'from-sky-500 to-sky-700', iconName: 'School' },
    '전남교육청': { gradient: 'from-emerald-500 to-teal-700', iconName: 'School' },
    // Default
    'default': { gradient: 'from-gray-500 to-gray-700', iconName: 'Newspaper' }
};

export function getCategoryStyle(category: string | null | undefined): { gradient: string; iconName: string } {
    if (!category) return CATEGORY_STYLES['default'];
    return CATEGORY_STYLES[category] || CATEGORY_STYLES['default'];
}
