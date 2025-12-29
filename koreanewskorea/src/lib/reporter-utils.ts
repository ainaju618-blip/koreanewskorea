/**
 * Reporter Utility Functions
 *
 * Provides helper functions for reporter display, specialty titles,
 * and byline formatting for SEO/E-E-A-T optimization.
 */

// Position labels (Korean)
export const POSITION_LABELS: Record<string, string> = {
    editor_in_chief: '주필',
    branch_manager: '지사장',
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

// Regions that indicate education specialty
const EDUCATION_REGIONS = ['광주교육청', '전남교육청', '광주시교육청', '전라남도교육청'];

// Regions that indicate city administration specialty
const CITY_REGIONS = ['광주광역시', '목포시', '여수시', '순천시', '나주시', '광양시'];

interface ReporterInfo {
    name: string;
    position: string;
    region?: string;
    specialty?: string | null;
    department?: string | null;
}

/**
 * Get the display title for a reporter based on specialty and position
 *
 * Priority:
 * 1. Explicit specialty field
 * 2. Auto-detect from region/department
 * 3. Default position label
 *
 * @param reporter Reporter information
 * @returns Display title (e.g., "교육전문기자", "시정전문기자", "기자")
 */
export function getSpecialtyTitle(reporter: ReporterInfo): string {
    // 1. Check explicit specialty field
    if (reporter.specialty && SPECIALTY_TITLES[reporter.specialty]) {
        return SPECIALTY_TITLES[reporter.specialty];
    }

    // 2. Auto-detect from region
    if (reporter.region) {
        // Education specialty
        if (EDUCATION_REGIONS.some(r => reporter.region?.includes(r))) {
            return SPECIALTY_TITLES.education;
        }

        // City administration specialty
        if (CITY_REGIONS.some(r => reporter.region?.includes(r))) {
            return SPECIALTY_TITLES.city;
        }
    }

    // 3. Auto-detect from department
    if (reporter.department) {
        const dept = reporter.department.toLowerCase();
        if (dept.includes('교육') || dept.includes('education')) {
            return SPECIALTY_TITLES.education;
        }
        if (dept.includes('경제') || dept.includes('economy')) {
            return SPECIALTY_TITLES.economy;
        }
        if (dept.includes('문화') || dept.includes('culture')) {
            return SPECIALTY_TITLES.culture;
        }
        if (dept.includes('환경') || dept.includes('environment')) {
            return SPECIALTY_TITLES.environment;
        }
        if (dept.includes('정치') || dept.includes('politics')) {
            return SPECIALTY_TITLES.politics;
        }
        if (dept.includes('체육') || dept.includes('sports')) {
            return SPECIALTY_TITLES.sports;
        }
    }

    // 4. Default: use position label or "기자"
    return POSITION_LABELS[reporter.position] || '기자';
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
