/**
 * Stitch v2 Design System Components
 * Mobile-first + Desktop responsive components for National Edition (koreanewskorea.com)
 */

// =============================================================================
// LAYOUT COMPONENTS (Mobile)
// =============================================================================
export { default as BottomNav } from './layout/BottomNav';
export { default as Header } from './layout/Header';
export { default as CategoryChips } from './layout/CategoryChips';
export { default as StickyHeader } from './layout/StickyHeader';

// =============================================================================
// LAYOUT COMPONENTS (Desktop)
// =============================================================================
export { default as DesktopLayout } from './layout/DesktopLayout';
export { default as ResponsiveContainer } from './layout/ResponsiveContainer';
export { default as UtilityBar } from './layout/UtilityBar';
export { default as DesktopHeader } from './layout/DesktopHeader';
export { default as DesktopFooter } from './layout/DesktopFooter';
export { default as BreakingNewsTicker } from './layout/BreakingNewsTicker';

// =============================================================================
// PAGE COMPONENTS
// =============================================================================
export { default as NationalHome } from './pages/NationalHome';
export { default as MapPolicy } from './pages/MapPolicy';
export { default as CityHome } from './pages/CityHome';
export { default as ArticleDetail } from './pages/ArticleDetail';
export { default as MetroHome } from './pages/MetroHome';
export { default as CategoryPage } from './pages/CategoryPage';
export { default as SearchResults } from './pages/SearchResults';

// =============================================================================
// AUTH COMPONENTS
// =============================================================================
export { default as LoginPage } from './auth/LoginPage';
export { default as SignupPage } from './auth/SignupPage';
export { default as MyPage } from './auth/MyPage';

// =============================================================================
// UI COMPONENTS
// =============================================================================
export { default as NewsCard } from './ui/NewsCard';
export { default as SearchBar } from './ui/SearchBar';
export { default as BreakingNewsBanner } from './ui/BreakingNewsBanner';
export { default as NotFoundPage } from './ui/NotFoundPage';
export * from './ui/ModalComponents';

// =============================================================================
// SIDEBAR WIDGETS (Desktop)
// =============================================================================
export { default as WeatherWidget } from './widgets/WeatherWidget';
export { default as PopularNewsSidebar } from './widgets/PopularNewsSidebar';
export { default as NewsletterForm } from './widgets/NewsletterForm';
export { default as AdBanner } from './widgets/AdBanner';
export { default as RegionMapWidget } from './widgets/RegionMapWidget';

// =============================================================================
// MODAL COMPONENTS (Desktop)
// =============================================================================
export { default as ModalBackdrop } from './modals/ModalBackdrop';
export { default as ConfirmModal } from './modals/ConfirmModal';
export { default as ShareModal } from './modals/ShareModal';
export { default as InfoModal } from './modals/InfoModal';
export { default as FormModal } from './modals/FormModal';
export { default as ImageLightbox } from './modals/ImageLightbox';
