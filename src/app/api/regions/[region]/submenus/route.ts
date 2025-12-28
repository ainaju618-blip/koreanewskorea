/**
 * API Route: /api/regions/[region]/submenus
 * ==========================================
 * Returns keyword-based sub-menus for a specific region.
 *
 * Usage:
 *   GET /api/regions/mokpo/submenus
 *   GET /api/regions/mokpo/submenus?method=static
 *   GET /api/regions/mokpo/submenus?method=dynamic&days=30
 *
 * Response:
 *   {
 *     region: "mokpo",
 *     regionName: "Mokpo City",
 *     method: "hybrid",
 *     subMenus: [
 *       { name: "Marine Tourism", slug: "marine", keywords: [...], articleCount: 15, isActive: true },
 *       ...
 *     ],
 *     totalArticles: 53,
 *     generatedAt: "2025-12-28T..."
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRegionSubMenus, hasRegionConfig } from '@/lib/keyword-service';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ region: string }> }
) {
    try {
        const { region } = await context.params;

        // Validate region
        if (!region || typeof region !== 'string') {
            return NextResponse.json(
                { error: 'Region parameter is required' },
                { status: 400 }
            );
        }

        const regionCode = region.toLowerCase();

        // Check if region has configuration
        if (!hasRegionConfig(regionCode)) {
            return NextResponse.json(
                { error: `Region "${regionCode}" not found`, availableRegions: getAvailableRegions() },
                { status: 404 }
            );
        }

        // Parse query parameters
        const searchParams = request.nextUrl.searchParams;
        const method = searchParams.get('method') as 'static' | 'dynamic' | 'auto' || 'auto';
        const days = parseInt(searchParams.get('days') || '30', 10);
        const minArticles = parseInt(searchParams.get('minArticles') || '3', 10);

        // Fetch sub-menus using the keyword service
        const result = await getRegionSubMenus(regionCode, {
            method,
            days,
            minArticles,
        });

        return NextResponse.json(result, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });

    } catch (error) {
        console.error('[API] Region sub-menus error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Helper function to list available regions
function getAvailableRegions(): string[] {
    return [
        // Metro/Province
        'gwangju', 'jeonnam',
        // Cities
        'mokpo', 'yeosu', 'suncheon', 'naju', 'gwangyang',
        // Counties
        'damyang', 'gokseong', 'gurye', 'goheung', 'boseong',
        'hwasun', 'jangheung', 'gangjin', 'haenam', 'yeongam',
        'muan', 'hampyeong', 'yeonggwang', 'jangseong', 'wando',
        'jindo', 'shinan',
        // Education
        'gwangju_edu', 'jeonnam_edu',
    ];
}
