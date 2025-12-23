// Location module exports
// Barrel file for convenient imports

export { REGIONS, getRegionCodes, getRegionName, getRegionsByType, isValidRegionCode } from './regions';
export type { RegionCode, RegionInfo } from './regions';

export { NEARBY_REGIONS, getNearbyRegions } from './nearby-regions';

export { ZONE_CITIES, REGION_ZONES, getZoneMajorCity, getRegionZone, DEFAULT_REGION } from './region-zones';
export type { ZoneCode } from './region-zones';

export { matchRegion, normalizeRegionCode } from './region-matcher';

export { detectRegionByIp, detectRegionClient } from './ip-detection';
export type { IpDetectionResult } from './ip-detection';
