/**
 * Organisms - Molecules를 조합한 복잡한 UI 섹션
 *
 * Atomic Design에서 organisms는:
 * - 여러 molecules와 atoms가 조합되어 독립적인 UI 섹션 형성
 * - 페이지의 주요 구성 요소
 * - 헤더, 푸터, 뉴스 목록, 지역 그리드 등
 */

export { default as RegionGrid } from './RegionGrid';
export type { RegionGridProps } from './RegionGrid';

export { default as NewsList } from './NewsList';
export type { NewsListProps } from './NewsList';

export { default as KoreaMap } from './KoreaMap';
export type { KoreaMapProps } from './KoreaMap';

// 추가 예정 organisms:
// export { default as Header } from './Header';
// export { default as Footer } from './Footer';
// export { default as Sidebar } from './Sidebar';
// export { default as HeroSection } from './HeroSection';
// export { default as CategorySection } from './CategorySection';
// export { default as PopularNews } from './PopularNews';
// export { default as RegionMap } from './RegionMap';
