import { NextRequest, NextResponse } from 'next/server';
import { detectRegionByIP, getClientIP } from '@/lib/geolocation';

export async function GET(request: NextRequest) {
    try {
        const ip = getClientIP(request);
        const region = await detectRegionByIP(ip);

        if (!region) {
            return NextResponse.json({
                detected: false,
                region_code: null,
                region_name: null,
                ip: ip
            });
        }

        return NextResponse.json({
            detected: true,
            region_code: region.code,
            region_name: region.name,
            ip: ip
        });
    } catch (error: any) {
        console.error('Location detect error:', error);
        return NextResponse.json({
            detected: false,
            region_code: null,
            region_name: null,
            error: error.message
        });
    }
}
