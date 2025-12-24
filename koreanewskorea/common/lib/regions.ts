/**
 * Korea NEWS Regional Homepage System
 * Region Configuration & Utilities
 * 
 * This file now acts as a FACADE/WRAPPER for the clean architecture layers.
 * Maintains backward compatibility with existing code.
 * 
 * Reference: plan/regions/*.md, plan/regional-homepage-spec.md
 */

// Re-export types for backward compatibility
export type { RegionConfig } from '../domain/entities';

// Import from infrastructure layer
import { RegionRepository } from '../infrastructure/repositories';

/**
 * Get all valid region codes
 */
export function getAllRegionCodes(): string[] {
    return RegionRepository.getAllCodes();
}

/**
 * Check if region code is valid
 */
export function isValidRegion(code: string): boolean {
    return RegionRepository.isValid(code);
}

/**
 * Get region configuration by code
 */
export function getRegionConfig(code: string) {
    return RegionRepository.getByCode(code);
}

/**
 * Get nearby region codes
 */
export function getNearbyRegions(code: string): string[] {
    return RegionRepository.getNearby(code);
}

/**
 * Get region tier (1, 2, or 3)
 */
export function getRegionTier(code: string): 1 | 2 | 3 {
    return RegionRepository.getTier(code);
}

/**
 * Get all regions as array
 */
export function getAllRegions() {
    return RegionRepository.getAll();
}

/**
 * Get regions by tier
 */
export function getRegionsByTier(tier: 1 | 2 | 3) {
    return RegionRepository.getByTier(tier);
}

/**
 * Get default region (gwangju)
 */
export function getDefaultRegion() {
    return RegionRepository.getDefault();
}
