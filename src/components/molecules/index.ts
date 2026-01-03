/**
 * Molecules - Atoms를 조합한 복합 컴포넌트
 *
 * Atomic Design에서 molecules는:
 * - 여러 atoms가 조합되어 하나의 기능 단위를 형성
 * - 단독으로도 의미있는 UI 구성
 * - 카드, 검색창, 네비게이션 아이템 등
 */

export { default as RegionCard } from './RegionCard';
export type { RegionCardProps } from './RegionCard';

export { default as Breadcrumb } from './Breadcrumb';
export type { BreadcrumbProps } from './Breadcrumb';

export { default as NewsCard } from './NewsCard';
export type { NewsCardProps } from './NewsCard';

export { default as RegionSelector } from './RegionSelector';
export type { RegionSelectorProps } from './RegionSelector';

// 추가 예정 molecules:
// export { default as SearchInput } from './SearchInput';
// export { default as CategoryTab } from './CategoryTab';
// export { default as ShareButtons } from './ShareButtons';
// export { default as AuthorInfo } from './AuthorInfo';
