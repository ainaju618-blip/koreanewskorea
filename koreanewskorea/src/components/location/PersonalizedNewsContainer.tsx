'use client';

// Personalized News Container Component
// Main container that orchestrates all location-based news components
// Checks admin settings before rendering

import { useState, useEffect } from 'react';
import { useUserRegion } from '@/hooks/useUserRegion';
import { usePersonalizedNews } from '@/hooks/usePersonalizedNews';
import MyRegionNews from './MyRegionNews';
import NearbyRegionNews from './NearbyRegionNews';
import PersonalizedNewsSkeleton from './PersonalizedNewsSkeleton';

// Setting keys matching admin page
const SETTING_KEYS = {
    enabled: 'location_news_enabled',
    showNearby: 'location_show_nearby',
    nearbyCount: 'location_nearby_count',
};

interface LocationSettings {
    enabled: boolean;
    showNearby: boolean;
    nearbyCount: number;
}

export default function PersonalizedNewsContainer() {
    const { region, isLoading: isRegionLoading } = useUserRegion();
    const { data, isLoading: isNewsLoading, error } = usePersonalizedNews(region);

    // Admin settings state
    const [settings, setSettings] = useState<LocationSettings | null>(null);
    const [settingsLoading, setSettingsLoading] = useState(true);

    // Load admin settings
    useEffect(() => {
        async function loadSettings() {
            try {
                const response = await fetch('/api/site-settings?keys=' + Object.values(SETTING_KEYS).join(','));
                if (response.ok) {
                    const data = await response.json();
                    setSettings({
                        enabled: data[SETTING_KEYS.enabled] ?? true, // Default: enabled
                        showNearby: data[SETTING_KEYS.showNearby] ?? true,
                        nearbyCount: data[SETTING_KEYS.nearbyCount] ?? 4,
                    });
                } else {
                    // API failed - use defaults (enabled)
                    setSettings({ enabled: true, showNearby: true, nearbyCount: 4 });
                }
            } catch (error) {
                console.warn('[PersonalizedNewsContainer] Failed to load settings, using defaults');
                setSettings({ enabled: true, showNearby: true, nearbyCount: 4 });
            } finally {
                setSettingsLoading(false);
            }
        }
        loadSettings();
    }, []);

    // Check if feature is disabled by admin
    if (!settingsLoading && settings && !settings.enabled) {
        return null; // Feature disabled - hide completely
    }

    // Show skeleton while loading
    if (settingsLoading || isRegionLoading || isNewsLoading) {
        return (
            <div className="w-full max-w-[1400px] mx-auto px-4 pt-8">
                <PersonalizedNewsSkeleton />
            </div>
        );
    }

    // Handle error state
    if (error) {
        console.error('[PersonalizedNewsContainer] Error:', error);
        return null; // Fail silently - show regular content
    }

    // No data
    if (!data) {
        return null;
    }

    // Check minimum article count (hide if less than 3)
    const hasEnoughArticles = data.myRegion.articles.length >= 3;

    if (!hasEnoughArticles) {
        return null;
    }

    // Filter nearby articles based on settings
    const showNearby = settings?.showNearby ?? true;
    const nearbyCount = settings?.nearbyCount ?? 4;
    const filteredNearbyRegions = data.nearby.regions.slice(0, nearbyCount);
    const filteredNearbyArticles = data.nearby.articles.filter(
        article => filteredNearbyRegions.includes(article.region)
    );

    return (
        <div className="w-full max-w-[1400px] mx-auto px-4 pt-8">
            {/* My Region News */}
            <MyRegionNews
                regionCode={data.myRegion.code}
                regionName={data.myRegion.name}
                articles={data.myRegion.articles}
                total={data.myRegion.total}
            />

            {/* Nearby Region News - conditionally rendered */}
            {showNearby && filteredNearbyArticles.length > 0 && (
                <NearbyRegionNews
                    regions={filteredNearbyRegions}
                    articles={filteredNearbyArticles}
                />
            )}
        </div>
    );
}
