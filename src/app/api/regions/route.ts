// GET /api/regions
// Returns list of all 25 regions for the region selector

import { NextResponse } from 'next/server';
import { REGIONS, getRegionsByType, RegionCode } from '@/lib/location';

export const dynamic = 'force-static';
export const revalidate = 86400; // 24 hours

interface RegionItem {
    code: string;
    name: string;
    type: 'government' | 'metro' | 'province';
}

export async function GET() {
    try {
        const grouped = getRegionsByType();

        const regions: RegionItem[] = [];

        // Add government first
        for (const code of grouped.government) {
            regions.push({
                code,
                name: REGIONS[code as RegionCode].name,
                type: 'government',
            });
        }

        // Add metro (광역시)
        for (const code of grouped.metro) {
            regions.push({
                code,
                name: REGIONS[code as RegionCode].name,
                type: 'metro',
            });
        }

        // Add provinces (도) sorted by name
        const provinces = grouped.province
            .map(code => ({
                code,
                name: REGIONS[code as RegionCode].name,
                type: 'province' as const,
            }))
            .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

        regions.push(...provinces);

        return NextResponse.json({
            regions,
            total: regions.length,
        });
    } catch (error) {
        console.error('[API] /api/regions error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch regions' },
            { status: 500 }
        );
    }
}
