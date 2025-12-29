// IP detection utility
// Uses ipinfo.io as primary, ip-api.com as fallback

import { RegionCode } from './regions';
import { matchRegion } from './region-matcher';
import { DEFAULT_REGION } from './region-zones';

export interface IpDetectionResult {
    success: boolean;
    region: RegionCode;
    raw?: {
        city: string;
        regionName: string;
        country: string;
    };
    source?: 'ipinfo' | 'ip-api' | 'default';
}

const TIMEOUT_MS = 3000;

// Fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// ipinfo.io API
async function detectWithIpinfo(token?: string): Promise<IpDetectionResult> {
    const url = token
        ? `https://ipinfo.io/json?token=${token}`
        : 'https://ipinfo.io/json';

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
        throw new Error(`ipinfo.io returned ${response.status}`);
    }

    const data = await response.json();

    // ipinfo.io response: { city, region, country, ... }
    const city = data.city || '';
    const regionName = data.region || '';
    const country = data.country || '';

    const region = matchRegion(city, regionName);

    return {
        success: true,
        region,
        raw: { city, regionName, country },
        source: 'ipinfo',
    };
}

// ip-api.com API (fallback)
async function detectWithIpApi(): Promise<IpDetectionResult> {
    // Note: ip-api.com only supports HTTP for free tier
    const response = await fetchWithTimeout('http://ip-api.com/json/?fields=city,regionName,country');

    if (!response.ok) {
        throw new Error(`ip-api.com returned ${response.status}`);
    }

    const data = await response.json();

    const city = data.city || '';
    const regionName = data.regionName || '';
    const country = data.country || '';

    const region = matchRegion(city, regionName);

    return {
        success: true,
        region,
        raw: { city, regionName, country },
        source: 'ip-api',
    };
}

/**
 * Detect user region by IP address
 * Uses ipinfo.io as primary, ip-api.com as fallback
 * Returns default region (gwangju) on failure
 */
export async function detectRegionByIp(ipinfoToken?: string): Promise<IpDetectionResult> {
    // Try ipinfo.io first
    try {
        return await detectWithIpinfo(ipinfoToken);
    } catch (error) {
        console.warn('[IP Detection] ipinfo.io failed, trying fallback:', error);
    }

    // Try ip-api.com as fallback
    try {
        return await detectWithIpApi();
    } catch (error) {
        console.warn('[IP Detection] ip-api.com failed:', error);
    }

    // Return default on all failures
    return {
        success: false,
        region: DEFAULT_REGION,
        source: 'default',
    };
}

/**
 * Client-side IP detection
 * Calls our API endpoint which handles the detection server-side
 */
export async function detectRegionClient(): Promise<IpDetectionResult> {
    try {
        const response = await fetchWithTimeout('/api/detect-region');

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.warn('[IP Detection] Client detection failed:', error);
        return {
            success: false,
            region: DEFAULT_REGION,
            source: 'default',
        };
    }
}
