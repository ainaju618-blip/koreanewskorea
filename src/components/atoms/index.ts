/**
 * Atoms - 가장 작은 단위의 UI 컴포넌트
 *
 * Atomic Design에서 atoms는:
 * - HTML 태그와 1:1 매핑되는 기본 요소
 * - 단독으로는 의미가 없지만 조합하면 의미있는 UI 구성
 * - 버튼, 인풋, 뱃지, 아이콘 등
 */

export { default as Button } from './Button';
export type { ButtonProps } from './Button';

export { default as Badge } from './Badge';
export type { BadgeProps } from './Badge';

// Skeleton UI 컴포넌트 (WCAG 2.1 AA 준수)
export { default as Skeleton } from './Skeleton';
export { SkeletonText, NewsCardSkeleton, HeroSkeleton, SidebarSkeleton } from './Skeleton';
export type { SkeletonProps } from './Skeleton';

// 추가 예정 atoms:
// export { default as Input } from './Input';
// export { default as Text } from './Text';
// export { default as Icon } from './Icon';
// export { default as Image } from './Image';
// export { default as Link } from './Link';
// export { default as Spinner } from './Spinner';
