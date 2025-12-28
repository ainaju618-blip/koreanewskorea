// GET /api/detect-region
// Detects user region by IP address

import { NextRequest, NextResponse } from 'next/server';
import { detectRegionByIp } from '@/lib/location';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const ipinfoToken = process.env.IPINFO_TOKEN;
        const result = await detectRegionByIp(ipinfoToken);

        return NextResponse.json(result);
    } catch (error) {
        console.error('[API] /api/detect-region error:', error);
        return NextResponse.json(
            {
                success: false,
                region: 'gwangju',
                source: 'default',
                error: 'Failed to detect region'
            },
            { status: 200 } // Return 200 with default region
        );
    }
}
