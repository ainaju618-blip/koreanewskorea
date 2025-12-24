/**
 * Region Entity
 * Core domain type - no external dependencies
 */

export interface RegionConfig {
    code: string;
    nameKo: string;
    nameEn: string;
    tier: 1 | 2 | 3;
    nearby: string[];
    scraperPath?: string;
}

/**
 * Tier-based content ratios
 * - Tier 1: 70% local / 20% nearby / 10% national (content sufficient)
 * - Tier 2: 50% local / 30% nearby / 20% national (medium)
 * - Tier 3: 30% local / 40% nearby / 30% national (smart fill heavy)
 */
export const TIER_RATIOS = {
    1: { local: 0.7, nearby: 0.2, national: 0.1 },
    2: { local: 0.5, nearby: 0.3, national: 0.2 },
    3: { local: 0.3, nearby: 0.4, national: 0.3 },
} as const;

export type TierRatio = typeof TIER_RATIOS[1 | 2 | 3];
