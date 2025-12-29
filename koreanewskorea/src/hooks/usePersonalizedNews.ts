'use client';

// Custom hook for fetching personalized news
// Uses SWR for caching and revalidation

import useSWR from 'swr';
import { RegionCode } from '@/lib/location';

interface Article {
    id: string;
    title: string;
    content: string;
    thumbnail_url: string | null;
    source: string;
    region: string;
    category: string;
    published_at: string;
    created_at: string;
    ai_summary?: string;
}

interface PersonalizedNewsData {
    myRegion: {
        code: string;
        name: string;
        articles: Article[];
        total: number;
    };
    nearby: {
        regions: string[];
        articles: Article[];
    };
    featured: Article[];
}

interface UsePersonalizedNewsReturn {
    data: PersonalizedNewsData | undefined;
    isLoading: boolean;
    error: Error | undefined;
    refetch: () => void;
}

const fetcher = async (url: string): Promise<PersonalizedNewsData> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch personalized news');
    }
    return response.json();
};

export function usePersonalizedNews(region: RegionCode | null): UsePersonalizedNewsReturn {
    const { data, error, isLoading, mutate } = useSWR<PersonalizedNewsData>(
        region ? `/api/news/personalized?region=${region}` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 300000, // 5 minutes
            refreshInterval: 0, // No auto refresh
        }
    );

    return {
        data,
        isLoading,
        error,
        refetch: () => mutate(),
    };
}
