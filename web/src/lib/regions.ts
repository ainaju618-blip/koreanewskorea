/**
 * 지역 권한 체계 정의
 *
 * 권한 구조:
 * - 주필 (editor_in_chief): 전체
 * - 광주지사장: 광주권역 (광주광역시, 광주교육청, 5개구)
 * - 전남지사장: 전남권역 (전라남도, 전남교육청, 22개 시군)
 * - 시군지사장: 해당 시군만
 * - 그 외: 본인 담당 지역만
 */

// 광주권역 지역 목록
export const GWANGJU_REGIONS = [
    '광주광역시',
    '광주교육청',
    '동구',
    '서구',
    '남구',
    '북구',
    '광산구',
] as const;

// 전남권역 지역 목록 (전라남도 + 전남교육청 + 22개 시군)
export const JEONNAM_REGIONS = [
    '전라남도',
    '전남교육청',
    // 5개 시
    '목포시',
    '여수시',
    '순천시',
    '나주시',
    '광양시',
    // 17개 군
    '담양군',
    '곡성군',
    '구례군',
    '고흥군',
    '보성군',
    '화순군',
    '장흥군',
    '강진군',
    '해남군',
    '영암군',
    '무안군',
    '함평군',
    '영광군',
    '장성군',
    '완도군',
    '진도군',
    '신안군',
] as const;

// 모든 지역 목록
export const ALL_REGIONS = [
    ...GWANGJU_REGIONS,
    ...JEONNAM_REGIONS,
] as const;

// 지역 그룹 타입
export type RegionGroup = 'all' | 'gwangju' | 'jeonnam' | 'single';

/**
 * 기자의 권한에 따른 접근 가능 지역 목록 반환
 *
 * @param position 직위 (editor_in_chief, branch_manager, reporter 등)
 * @param region 담당 지역
 * @returns 접근 가능한 지역 배열, null이면 전체 접근
 */
export function getAccessibleRegions(position: string, region: string): string[] | null {
    // 주필: 전체 접근
    if (position === 'editor_in_chief') {
        return null; // null = 전체 접근
    }

    // 지사장인 경우
    if (position === 'branch_manager') {
        // 광주지사장
        if (region === '광주광역시' || region === '광주') {
            return [...GWANGJU_REGIONS];
        }
        // 전남지사장
        if (region === '전라남도' || region === '전남') {
            return [...JEONNAM_REGIONS];
        }
        // 시군 지사장 (해당 지역만)
        return [region];
    }

    // 그 외 직위: 본인 담당 지역만
    return [region];
}

/**
 * 기자가 특정 지역의 기사를 볼 수 있는지 확인
 *
 * @param position 직위
 * @param reporterRegion 기자의 담당 지역
 * @param articleSource 기사의 출처 지역
 * @returns 접근 가능 여부
 */
export function canAccessRegion(position: string, reporterRegion: string, articleSource: string): boolean {
    const accessibleRegions = getAccessibleRegions(position, reporterRegion);

    // null이면 전체 접근 가능
    if (accessibleRegions === null) {
        return true;
    }

    return accessibleRegions.includes(articleSource);
}

/**
 * 기자가 특정 기사를 편집할 수 있는지 확인
 *
 * @param reporter 기자 정보
 * @param article 기사 정보
 * @returns 편집 가능 여부
 */
export function canEditArticle(
    reporter: { id: string; position: string; region: string },
    article: { source: string; author_id: string | null }
): boolean {
    // 내가 작성한 기사는 항상 편집 가능
    if (article.author_id === reporter.id) {
        return true;
    }

    // 접근 가능한 지역의 기사인지 확인
    return canAccessRegion(reporter.position, reporter.region, article.source);
}

/**
 * 지역 그룹 라벨 반환 (UI 표시용)
 */
export function getRegionGroupLabel(position: string, region: string): string {
    if (position === 'editor_in_chief') {
        return '전체';
    }

    if (position === 'branch_manager') {
        if (region === '광주광역시' || region === '광주') {
            return '광주권역';
        }
        if (region === '전라남도' || region === '전남') {
            return '전남권역';
        }
    }

    return region;
}
