'use client';

// Custom hook for managing user region
// Handles localStorage persistence and IP-based detection

import { useState, useEffect, useCallback } from 'react';
import { RegionCode, isValidRegionCode, getRegionName, DEFAULT_REGION, detectRegionClient } from '@/lib/location';

const STORAGE_KEY = 'user_region';

interface UseUserRegionReturn {
    region: RegionCode;
    regionName: string;
    isLoading: boolean;
    isDetected: boolean;
    setRegion: (code: RegionCode) => void;
}

export function useUserRegion(): UseUserRegionReturn {
    const [region, setRegionState] = useState<RegionCode>(DEFAULT_REGION);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetected, setIsDetected] = useState(false);

    // Initialize region from localStorage or IP detection
    useEffect(() => {
        async function initializeRegion() {
            try {
                // 1. Check localStorage first
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored && isValidRegionCode(stored)) {
                    setRegionState(stored);
                    setIsDetected(true);
                    setIsLoading(false);
                    return;
                }

                // 2. No stored value - detect by IP
                const result = await detectRegionClient();

                if (result.success && result.region) {
                    setRegionState(result.region);
                    // Save to localStorage for next visit
                    localStorage.setItem(STORAGE_KEY, result.region);
                    setIsDetected(true);
                } else {
                    // Use default
                    setRegionState(DEFAULT_REGION);
                }
            } catch (error) {
                console.warn('[useUserRegion] Error initializing region:', error);
                setRegionState(DEFAULT_REGION);
            } finally {
                setIsLoading(false);
            }
        }

        initializeRegion();
    }, []);

    // Set region and persist to localStorage
    const setRegion = useCallback((code: RegionCode) => {
        if (!isValidRegionCode(code)) {
            console.warn('[useUserRegion] Invalid region code:', code);
            return;
        }

        setRegionState(code);
        setIsDetected(true);

        try {
            localStorage.setItem(STORAGE_KEY, code);
        } catch (error) {
            console.warn('[useUserRegion] Failed to save to localStorage:', error);
        }
    }, []);

    return {
        region,
        regionName: getRegionName(region),
        isLoading,
        isDetected,
        setRegion,
    };
}
