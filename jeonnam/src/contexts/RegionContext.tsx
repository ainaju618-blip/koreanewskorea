'use client';

import { createContext, useContext, ReactNode } from 'react';
import { SiteConfig, getSiteConfig, RegionId } from '@/config/site-regions';

interface RegionContextType {
    region: RegionId;
    siteConfig: SiteConfig;
}

const RegionContext = createContext<RegionContextType | null>(null);

interface RegionProviderProps {
    region: string;
    children: ReactNode;
}

export function RegionProvider({ region, children }: RegionProviderProps) {
    const siteConfig = getSiteConfig(region);

    return (
        <RegionContext.Provider value={{ region: siteConfig.id as RegionId, siteConfig }}>
            {children}
        </RegionContext.Provider>
    );
}

export function useRegion() {
    const context = useContext(RegionContext);
    if (!context) {
        throw new Error('useRegion must be used within a RegionProvider');
    }
    return context;
}

export function useRegionSafe() {
    return useContext(RegionContext);
}
