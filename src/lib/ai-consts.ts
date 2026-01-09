/**
 * AI Constants - 하드코딩 값 중앙 집중화
 * 
 * AI 관련 설정 상수들을 한 곳에서 관리
 * Last updated: 2025-12-22
 */

// Cache Settings
export const AI_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Default Limits
export const AI_DEFAULT_DAILY_LIMIT = 100;
export const AI_DEFAULT_MONTHLY_TOKEN_LIMIT = 1_000_000;
export const AI_DEFAULT_MAX_INPUT_LENGTH = 5000;

// UI Constants
export const AI_SUMMARY_MAX_LENGTH = 200;
export const AI_SLUG_MAX_LENGTH = 100;
export const AI_TITLE_MAX_LENGTH = 60;
export const AI_META_DESCRIPTION_MAX_LENGTH = 150;

// Production URL
export const PRODUCTION_DOMAIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://koreanewskorea.com';

// Provider Models (for reference)
export const AI_MODELS = {
    gemini: 'gemini-2.5-flash',
    claude: 'claude-sonnet-4-5-20250929',
    grok: 'grok-4-latest'
} as const;

// Test Article Defaults
export const TEST_ARTICLE_DEFAULTS = {
    title: '[AI TEST] Temporary Article',
    category: 'general',
    source: 'manual_test'
} as const;
