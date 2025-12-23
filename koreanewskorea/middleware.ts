/**
 * Subdomain Routing Middleware
 * Detects subdomain and sets region context
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllRegionCodes } from '@/common/lib/regions';

export function middleware(request: NextRequest) {
    const host = request.headers.get('host') || '';
    const validRegions = getAllRegionCodes();

    // Extract subdomain
    // Format: [subdomain].koreanewskorea.com or [subdomain].localhost:3001
    let subdomain: string | null = null;

    // Production: *.koreanewskorea.com
    if (host.includes('.koreanewskorea.com')) {
        subdomain = host.split('.koreanewskorea.com')[0];
    }
    // Development: Check for specific patterns or use query param
    else if (host.includes('localhost')) {
        // In development, use ?region=xxx query param for testing
        const regionParam = request.nextUrl.searchParams.get('region');
        if (regionParam && validRegions.includes(regionParam)) {
            subdomain = regionParam;
        } else {
            // Default to gwangju in development
            subdomain = 'gwangju';
        }
    }

    // Validate subdomain
    if (!subdomain || !validRegions.includes(subdomain)) {
        // Invalid subdomain - redirect to gwangju
        if (host.includes('.koreanewskorea.com')) {
            return NextResponse.redirect(new URL('https://gwangju.koreanewskorea.com'));
        }
        // In development, just use gwangju
        subdomain = 'gwangju';
    }

    // Set region in response headers for page rendering
    const response = NextResponse.next();
    response.headers.set('x-region', subdomain);

    return response;
}

export const config = {
    matcher: [
        // Match all paths except static files and API routes
        '/((?!_next/static|_next/image|favicon.ico|api).*)',
    ],
};
