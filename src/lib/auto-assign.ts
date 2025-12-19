/**
 * Korea NEWS - Auto-assign Reporter System
 * Automatically assigns reporters to articles during approval
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { ROLE_LEVELS } from './permissions';
import { getRegionByCode } from '@/constants/regions';

// Default system email for fallback assignment
const DEFAULT_EMAIL = 'news@koreanewsone.com';

export interface Reporter {
    id: string;
    user_id: string | null;  // References profiles.id (for posts.author_id FK)
    name: string;
    email: string;
    region: string | null;
    position: string;
    access_level: number;
}

export interface AssignResult {
    reporter: Reporter;
    reason: 'region' | 'global' | 'default';
    message: string;
}

/**
 * Auto-assign a reporter to an article based on region
 *
 * Priority:
 * 1. Region-specific reporter (random if multiple)
 * 2. Global reporter (editor+) (random if multiple)
 * 3. Default system account (news@koreanewsone.com)
 */
export async function autoAssignReporter(
    articleRegion: string | null
): Promise<AssignResult> {
    console.log('[autoAssignReporter] Starting with region:', articleRegion);

    // Convert English region code to Korean name for matching with reporters table
    let koreanRegionName: string | null = null;
    if (articleRegion) {
        const regionInfo = getRegionByCode(articleRegion);
        koreanRegionName = regionInfo?.name || null;
        console.log('[autoAssignReporter] Region code conversion:', articleRegion, '->', koreanRegionName);
    }

    // Step 1: Find region-specific reporters (must have user_id for FK to profiles)
    if (koreanRegionName) {
        const { data: regionReporters, error: regionError } = await supabaseAdmin
            .from('reporters')
            .select('id, user_id, name, email, region, position, access_level')
            .eq('region', koreanRegionName)
            .eq('status', 'Active')
            .not('user_id', 'is', null)
            .neq('email', DEFAULT_EMAIL);

        console.log('[autoAssignReporter] Region reporters query:', {
            count: regionReporters?.length || 0,
            error: regionError?.message
        });

        if (!regionError && regionReporters && regionReporters.length > 0) {
            // Single reporter - assign directly
            if (regionReporters.length === 1) {
                console.log('[autoAssignReporter] Assigned region reporter:', regionReporters[0].name);
                return {
                    reporter: regionReporters[0],
                    reason: 'region',
                    message: `${articleRegion} region reporter assigned`,
                };
            }

            // Multiple reporters - random selection
            const randomIndex = Math.floor(Math.random() * regionReporters.length);
            console.log('[autoAssignReporter] Random region reporter:', regionReporters[randomIndex].name);
            return {
                reporter: regionReporters[randomIndex],
                reason: 'region',
                message: `Randomly selected from ${regionReporters.length} ${articleRegion} reporters`,
            };
        }
    }

    // Step 2: Find global reporters (editor and above, access_level >= 60, must have user_id)
    const { data: globalReporters, error: globalError } = await supabaseAdmin
        .from('reporters')
        .select('id, user_id, name, email, region, position, access_level')
        .gte('access_level', ROLE_LEVELS.editor)
        .eq('status', 'Active')
        .not('user_id', 'is', null)
        .neq('email', DEFAULT_EMAIL);

    console.log('[autoAssignReporter] Global reporters query:', {
        count: globalReporters?.length || 0,
        error: globalError?.message,
        requiredLevel: ROLE_LEVELS.editor
    });

    if (!globalError && globalReporters && globalReporters.length > 0) {
        const randomIndex = Math.floor(Math.random() * globalReporters.length);
        console.log('[autoAssignReporter] Random global reporter:', globalReporters[randomIndex].name);
        return {
            reporter: globalReporters[randomIndex],
            reason: 'global',
            message: `Randomly selected from ${globalReporters.length} global reporters (no ${articleRegion || 'region'} reporter)`,
        };
    }

    // Step 3: Fallback to default system account (may have null user_id)
    const { data: defaultReporter, error: defaultError } = await supabaseAdmin
        .from('reporters')
        .select('id, user_id, name, email, region, position, access_level')
        .eq('email', DEFAULT_EMAIL)
        .single();

    console.log('[autoAssignReporter] Default reporter query:', {
        found: !!defaultReporter,
        error: defaultError?.message
    });

    if (!defaultError && defaultReporter) {
        console.log('[autoAssignReporter] Using default reporter:', defaultReporter.name);
        return {
            reporter: defaultReporter,
            reason: 'default',
            message: 'No available reporter - assigned to Korea NEWS system account',
        };
    }

    // Should never reach here if database is properly set up
    console.error('[autoAssignReporter] No reporter available!');
    throw new Error('No reporter available for assignment. Please check database setup.');
}

/**
 * Get reporters by region for manual selection modal
 */
export async function getReportersByRegion(
    region: string | null
): Promise<{ regionReporters: Reporter[]; globalReporters: Reporter[] }> {
    // Convert English region code to Korean name
    let koreanRegionName: string | null = null;
    if (region) {
        const regionInfo = getRegionByCode(region);
        koreanRegionName = regionInfo?.name || region; // Fallback to original if not found
    }

    // Get region-specific reporters
    let regionReporters: Reporter[] = [];
    if (koreanRegionName) {
        const { data } = await supabaseAdmin
            .from('reporters')
            .select('id, user_id, name, email, region, position, access_level')
            .eq('region', koreanRegionName)
            .eq('status', 'Active')
            .neq('email', DEFAULT_EMAIL)
            .order('name');

        regionReporters = data || [];
    }

    // Get global reporters (editor and above)
    const { data: globalData } = await supabaseAdmin
        .from('reporters')
        .select('id, user_id, name, email, region, position, access_level')
        .gte('access_level', ROLE_LEVELS.editor)
        .eq('status', 'Active')
        .neq('email', DEFAULT_EMAIL)
        .order('access_level', { ascending: false });

    return {
        regionReporters,
        globalReporters: globalData || [],
    };
}

/**
 * Get all active reporters for selection
 */
export async function getAllActiveReporters(): Promise<Reporter[]> {
    const { data } = await supabaseAdmin
        .from('reporters')
        .select('id, user_id, name, email, region, position, access_level')
        .eq('status', 'Active')
        .order('access_level', { ascending: false })
        .order('name');

    return data || [];
}

/**
 * Get auto-assign setting from site_settings
 */
export async function getAutoAssignSetting(): Promise<boolean> {
    const { data, error } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', 'auto_assign_reporter')
        .single();

    if (error || !data) {
        // Default to true if setting not found
        return true;
    }

    // Handle both string "true" and boolean true
    return data.value === true || data.value === 'true';
}

/**
 * Update auto-assign setting
 */
export async function setAutoAssignSetting(enabled: boolean): Promise<void> {
    await supabaseAdmin
        .from('site_settings')
        .upsert({
            key: 'auto_assign_reporter',
            value: enabled,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'key',
        });
}

/**
 * Get reason message in Korean for toast display
 */
export function getAssignReasonKorean(reason: AssignResult['reason'], region?: string | null): string {
    switch (reason) {
        case 'region':
            return `${region || ''} region reporter`;
        case 'global':
            return 'Global reporter (no region match)';
        case 'default':
            return 'System default (no available reporter)';
        default:
            return '';
    }
}
