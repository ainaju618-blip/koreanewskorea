/**
 * Reporter Utility Functions
 *
 * Provides helper functions for reporter display, specialty titles,
 * and byline formatting for SEO/E-E-A-T optimization.
 */

// ============================================================================
// 지역 코드 매핑 (한글 지역명 → 영문 코드)
// 모든 API에서 공통으로 사용
// ============================================================================
export const REGION_CODE_MAP: Record<string, string> = {
    // 시 단위
    '나주시': 'naju',
    '목포시': 'mokpo',
    '순천시': 'suncheon',
    '여수시': 'yeosu',
    '광양시': 'gwangyang',
    // 광역시
    '광주광역시': 'gwangju',
    // 군 단위
    '담양군': 'damyang',
    '곡성군': 'gokseong',
    '구례군': 'gurye',
    '고흥군': 'goheung',
    '보성군': 'boseong',
    '화순군': 'hwasun',
    '장흥군': 'jangheung',
    '강진군': 'gangjin',
    '해남군': 'haenam',
    '영암군': 'yeongam',
    '무안군': 'muan',
    '함평군': 'hampyeong',
    '영광군': 'yeonggwang',
    '장성군': 'jangseong',
    '완도군': 'wando',
    '진도군': 'jindo',
    '신안군': 'sinan',
    // 광역 단위
    '전체': 'national',
    '전라남도': 'jeonnam',
    '전라남도교육청': 'jeonnam_edu',
    '광주시교육청': 'gwangju_edu',
    // Legacy (시/군 없이 저장된 경우 대비)
    '나주': 'naju',
    '광주': 'gwangju',
    '목포': 'mokpo',
    '여수': 'yeosu',
    '순천': 'suncheon',
    '광양': 'gwangyang',
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
    '장성': 'jangseong',
    '완도': 'wando',
    '진도': 'jindo',
    '신안': 'sinan',
    '전남': 'jeonnam',
};

/**
 * 한글 지역명 → 영문 지역 코드 변환
 * @param region 한글 지역명 (예: "나주시", "광주광역시")
 * @returns 영문 지역 코드 (예: "naju", "gwangju") 또는 null
 */
export function getRegionCode(region: string | null | undefined): string | null {
    if (!region) return null;
    return REGION_CODE_MAP[region] || region.toLowerCase();
}

/**
 * 두 지역이 같은지 확인 (source, region 코드 모두 비교)
 * @param reporterRegion 기자 지역 (한글, 예: "나주시")
 * @param articleSource 기사 source 필드 (한글, 예: "나주시")
 * @param articleRegion 기사 region 필드 (영문 코드, 예: "naju")
 * @returns 같은 지역이면 true
 */
export function isSameRegion(
    reporterRegion: string | null | undefined,
    articleSource: string | null | undefined,
    articleRegion: string | null | undefined
): boolean {
    if (!reporterRegion) return false;

    // 1. source가 reporter.region과 일치 (한글 비교)
    if (articleSource && articleSource === reporterRegion) return true;

    // 2. region 코드가 reporter.region의 코드와 일치 (영문 코드 비교)
    const reporterRegionCode = getRegionCode(reporterRegion);
    if (reporterRegionCode && articleRegion === reporterRegionCode) return true;

    return false;
}

// ============================================================================
// Position labels (Korean)
// IMPORTANT: Keep in sync with POSITIONS in admin/users/reporters/page.tsx
export const POSITION_LABELS: Record<string, string> = {
    national_chief_director: '전국총괄본부장',
    chief_director: '총괄본부장',
    editor_in_chief: '주필',
    branch_manager: '지사장',
    gwangju_branch_director: '광주지역본부장',
    editor_chief: '편집국장',
    news_chief: '취재부장',
    senior_reporter: '수석기자',
    reporter: '기자',
    intern_reporter: '수습기자',
    citizen_reporter: '시민기자',
    opinion_writer: '오피니언',
    advisor: '고문',
    consultant: '자문위원',
    ambassador: '홍보대사',
    seoul_correspondent: '서울특파원',
    foreign_correspondent: '해외특파원',
};


// Specialty title mappings
export const SPECIALTY_TITLES: Record<string, string> = {
    city: '시정전문기자',
    education: '교육전문기자',
    economy: '경제전문기자',
    culture: '문화전문기자',
    environment: '환경전문기자',
    politics: '정치전문기자',
    society: '사회전문기자',
    sports: '체육전문기자',
    health: '보건전문기자',
    agriculture: '농업전문기자',
    maritime: '해양전문기자',
};


interface ReporterInfo {
    name: string;
    position: string;
    region?: string;
    specialty?: string | null;
    department?: string | null;
}

/**
 * Get the display title for a reporter based on position
 *
 * Priority:
 * 1. Position label (직위) - ALWAYS use position first
 * 2. Explicit specialty field (only if position not in POSITION_LABELS)
 * 3. Default "기자"
 *
 * @param reporter Reporter information
 * @returns Display title (e.g., "총괄본부장", "주필", "지사장", "기자")
 */
export function getSpecialtyTitle(reporter: ReporterInfo): string {
    // 1. ALWAYS use position label first (if valid position exists)
    // Handle comma-separated positions (take first one for display)
    if (reporter.position) {
        const firstPosition = reporter.position.split(',')[0].trim();
        if (POSITION_LABELS[firstPosition]) {
            return POSITION_LABELS[firstPosition];
        }
    }

    // 2. Check explicit specialty field (fallback for reporters without standard position)
    if (reporter.specialty && SPECIALTY_TITLES[reporter.specialty]) {
        return SPECIALTY_TITLES[reporter.specialty];
    }

    // 3. Default: "기자"
    return '기자';
}

/**
 * Get position label in Korean
 *
 * @param position Position code
 * @returns Korean position label
 */
export function getPositionLabel(position: string): string {
    return POSITION_LABELS[position] || position;
}

/**
 * Format byline in Korea NEWS standard format
 *
 * Format: (지역=코리아뉴스) 이름 직함
 * Example: (광주=코리아뉴스) 홍길동 시정전문기자
 *
 * @param reporter Reporter information
 * @returns Formatted byline string
 */
export function formatByline(reporter: ReporterInfo): string {
    const title = getSpecialtyTitle(reporter);
    const region = reporter.region && reporter.region !== '전체' ? reporter.region : null;

    if (region) {
        return `(${region}=코리아뉴스) ${reporter.name} ${title}`;
    }

    return `코리아뉴스 ${reporter.name} ${title}`;
}

/**
 * Format byline for structured data (JSON-LD)
 *
 * @param reporter Reporter information
 * @returns Object with name and jobTitle
 */
export function formatBylineForSchema(reporter: ReporterInfo): { name: string; jobTitle: string } {
    return {
        name: reporter.name,
        jobTitle: getSpecialtyTitle(reporter),
    };
}

/**
 * Coverage area mappings for regions
 * Maps region names to typical beats/offices covered
 */
const COVERAGE_AREA_MAP: Record<string, string[]> = {
    // Metro/Province
    '광주광역시': ['광주시청', '광주시의회', '광주지방경찰청'],
    '전라남도': ['전남도청', '전남도의회', '전남지방경찰청'],
    // Cities
    '목포시': ['목포시청', '목포시의회', '목포해양경찰서'],
    '여수시': ['여수시청', '여수시의회', '여수산단'],
    '순천시': ['순천시청', '순천시의회', '순천만습지'],
    '나주시': ['나주시청', '나주시의회', '빛가람혁신도시', '나주교육지원청'],
    '광양시': ['광양시청', '광양시의회', '광양제철소'],
    // Education offices
    '광주교육청': ['광주시교육청', '광주교육연구정보원', '광주학생교육문화회관'],
    '전남교육청': ['전남도교육청', '전남교육연수원'],
    // Counties
    '담양군': ['담양군청', '담양군의회'],
    '곡성군': ['곡성군청', '곡성군의회'],
    '구례군': ['구례군청', '구례군의회'],
    '고흥군': ['고흥군청', '고흥군의회'],
    '보성군': ['보성군청', '보성군의회'],
    '화순군': ['화순군청', '화순군의회'],
    '장흥군': ['장흥군청', '장흥군의회'],
    '강진군': ['강진군청', '강진군의회'],
    '해남군': ['해남군청', '해남군의회'],
    '영암군': ['영암군청', '영암군의회'],
    '무안군': ['무안군청', '무안군의회', '무안국제공항'],
    '함평군': ['함평군청', '함평군의회'],
    '영광군': ['영광군청', '영광군의회', '한빛원자력발전소'],
    '장성군': ['장성군청', '장성군의회'],
    '완도군': ['완도군청', '완도군의회'],
    '진도군': ['진도군청', '진도군의회'],
    '신안군': ['신안군청', '신안군의회'],
};

interface ReporterWithCoverage extends ReporterInfo {
    beat_areas?: string[] | null;
}

/**
 * Get coverage areas (beats) for a reporter
 *
 * Priority:
 * 1. Explicit beat_areas field if available
 * 2. Derive from region using COVERAGE_AREA_MAP
 * 3. Return empty array if no coverage info
 *
 * @param reporter Reporter information
 * @returns Array of coverage area names
 */
export function getCoverageAreas(reporter: ReporterWithCoverage): string[] {
    // 1. Use explicit beat_areas if available
    if (reporter.beat_areas && reporter.beat_areas.length > 0) {
        return reporter.beat_areas;
    }

    // 2. Derive from region
    if (reporter.region && COVERAGE_AREA_MAP[reporter.region]) {
        return COVERAGE_AREA_MAP[reporter.region];
    }

    // 3. Return empty array
    return [];
}

/**
 * Generate SEO keyword tags based on reporter's specialty and region
 *
 * @param reporter Reporter information with specialties
 * @returns Array of keyword hashtags
 */
export function generateKeywordTags(reporter: ReporterInfo & { specialties?: string[] | null }): string[] {
    const tags: string[] = [];

    // Add region-based tags
    if (reporter.region && reporter.region !== '전체') {
        tags.push(reporter.region);
    }

    // Add specialty-based tags
    if (reporter.specialty) {
        const specialtyTags: Record<string, string[]> = {
            city: ['지방행정', '시정', '지역발전'],
            education: ['교육정책', '학교', '교육혁신'],
            economy: ['지역경제', '일자리', '투자유치'],
            culture: ['지역문화', '축제', '문화예술'],
            environment: ['환경보호', '기후변화', '녹색성장'],
            politics: ['지방정치', '선거', '의정활동'],
            society: ['사회복지', '복지정책', '시민사회'],
            health: ['보건의료', '의료정책', '건강'],
            agriculture: ['농촌', '농업정책', '귀농귀촌'],
            maritime: ['수산업', '해양정책', '어업'],
        };
        if (specialtyTags[reporter.specialty]) {
            tags.push(...specialtyTags[reporter.specialty]);
        }
    }

    // Add explicit specialties
    if (reporter.specialties && reporter.specialties.length > 0) {
        tags.push(...reporter.specialties);
    }

    // Remove duplicates and limit to 7
    return [...new Set(tags)].slice(0, 7);
}
