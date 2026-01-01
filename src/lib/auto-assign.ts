/**
 * Korea NEWS - Auto-assign Reporter System (v2)
 *
 * Improvements:
 * - Multi-region support via reporter_regions junction table
 * - Fair distribution using round-robin (least articles first)
 * - Better logging and error handling
 *
 * @version 2.0.0
 * @updated 2026-01-01
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { ROLE_LEVELS } from './permissions';
import { getRegionByCode, REGION_ALIASES } from '@/constants/regions';

// Default system email for fallback assignment
const DEFAULT_EMAIL = 'news@koreanewsone.com';

export interface Reporter {
    id: string;
    user_id: string | null;  // References profiles.id (for posts.author_id FK)
    name: string;
    email: string;
    region: string | null;   // Primary region from reporters table
    regions?: string[];      // All regions from reporter_regions table
    position: string;
    access_level: number;
    article_count?: number;  // For fair distribution
}

export interface AssignResult {
    reporter: Reporter;
    reason: 'region' | 'region_multi' | 'global' | 'default';
    message: string;
}

/**
 * Get article count for each reporter (for fair distribution)
 * Counts articles assigned in the last 30 days
 */
async function getReporterArticleCounts(reporterIds: string[]): Promise<Map<string, number>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabaseAdmin
        .from('posts')
        .select('author_id')
        .in('author_id', reporterIds)
        .gte('published_at', thirtyDaysAgo.toISOString())
        .eq('status', 'published');

    const counts = new Map<string, number>();

    // Initialize all reporters with 0
    reporterIds.forEach(id => counts.set(id, 0));

    if (!error && data) {
        data.forEach(post => {
            if (post.author_id) {
                counts.set(post.author_id, (counts.get(post.author_id) || 0) + 1);
            }
        });
    }

    return counts;
}

/**
 * Select reporter with least articles (fair round-robin distribution)
 * If tied, select randomly among those with least articles
 */
function selectFairReporter(reporters: Reporter[], articleCounts: Map<string, number>): Reporter {
    if (reporters.length === 1) {
        return reporters[0];
    }

    // Add article counts to reporters
    const reportersWithCounts = reporters.map(r => ({
        ...r,
        article_count: articleCounts.get(r.user_id || '') || 0
    }));

    // Find minimum article count
    const minCount = Math.min(...reportersWithCounts.map(r => r.article_count));

    // Filter reporters with minimum count
    const candidates = reportersWithCounts.filter(r => r.article_count === minCount);

    // Random selection among candidates with least articles
    const selectedIndex = Math.floor(Math.random() * candidates.length);
    return candidates[selectedIndex];
}

/**
 * Get all possible region names including aliases
 */
function getRegionNamesWithAliases(koreanRegionName: string): string[] {
    const names = [koreanRegionName];

    // Add aliases if this region has any
    const aliases = REGION_ALIASES[koreanRegionName];
    if (aliases) {
        names.push(...aliases);
    }

    // Also check if this name is an alias of another region
    for (const [canonical, aliasList] of Object.entries(REGION_ALIASES)) {
        if (aliasList.includes(koreanRegionName)) {
            names.push(canonical);
            // Add other aliases of the same canonical name
            names.push(...aliasList.filter(a => a !== koreanRegionName));
        }
    }

    return [...new Set(names)]; // Remove duplicates
}

/**
 * Find reporters by region using reporter_regions junction table (multi-region support)
 */
async function findReportersByRegionMulti(koreanRegionName: string): Promise<Reporter[]> {
    // Get all possible region names (including aliases for education offices etc.)
    const regionNames = getRegionNamesWithAliases(koreanRegionName);

    console.log('[findReportersByRegionMulti] Searching for regions:', regionNames);

    // Query reporter_regions junction table with all possible names
    const { data: regionData, error: regionError } = await supabaseAdmin
        .from('reporter_regions')
        .select(`
            reporter_id,
            region,
            is_primary,
            reporters!inner (
                id,
                user_id,
                name,
                email,
                region,
                position,
                access_level,
                status
            )
        `)
        .in('region', regionNames);

    if (regionError) {
        console.log('[findReportersByRegionMulti] Junction table query error:', regionError.message);
        return [];
    }

    if (!regionData || regionData.length === 0) {
        return [];
    }

    // Filter active reporters with user_id and not default email
    const reporters: Reporter[] = [];
    for (const row of regionData) {
        const r = row.reporters as unknown as Reporter & { status: string };
        if (r && r.status === 'Active' && r.user_id && r.email !== DEFAULT_EMAIL) {
            reporters.push({
                id: r.id,
                user_id: r.user_id,
                name: r.name,
                email: r.email,
                region: r.region,
                position: r.position,
                access_level: r.access_level
            });
        }
    }

    return reporters;
}

/**
 * Find reporters by primary region (fallback for non-junction table)
 */
async function findReportersByPrimaryRegion(koreanRegionName: string): Promise<Reporter[]> {
    // Get all possible region names (including aliases)
    const regionNames = getRegionNamesWithAliases(koreanRegionName);

    console.log('[findReportersByPrimaryRegion] Searching for regions:', regionNames);

    const { data, error } = await supabaseAdmin
        .from('reporters')
        .select('id, user_id, name, email, region, position, access_level')
        .in('region', regionNames)
        .eq('status', 'Active')
        .not('user_id', 'is', null)
        .neq('email', DEFAULT_EMAIL);

    if (error) {
        console.log('[findReportersByPrimaryRegion] Query error:', error.message);
        return [];
    }

    return data || [];
}

/**
 * Auto-assign a reporter to an article based on region
 *
 * Priority:
 * 1. Region-specific reporter via reporter_regions (multi-region support)
 * 2. Region-specific reporter via reporters.region (fallback)
 * 3. Global reporter (editor+, access_level >= 60)
 * 4. Default system account (news@koreanewsone.com)
 *
 * Selection: Fair distribution (reporter with least articles in last 30 days)
 */
export async function autoAssignReporter(
    articleRegion: string | null
): Promise<AssignResult> {
    console.log('[autoAssignReporter] Starting with region:', articleRegion);

    // Convert English region code to Korean name for matching
    let koreanRegionName: string | null = null;
    if (articleRegion) {
        const regionInfo = getRegionByCode(articleRegion);
        koreanRegionName = regionInfo?.name || null;
        console.log('[autoAssignReporter] Region code conversion:', articleRegion, '->', koreanRegionName);
    }

    // Step 1: Find region-specific reporters via reporter_regions (multi-region)
    if (koreanRegionName) {
        const multiRegionReporters = await findReportersByRegionMulti(koreanRegionName);

        console.log('[autoAssignReporter] Multi-region reporters found:', multiRegionReporters.length);

        if (multiRegionReporters.length > 0) {
            // Get article counts for fair distribution
            const userIds = multiRegionReporters
                .map(r => r.user_id)
                .filter((id): id is string => id !== null);

            const articleCounts = await getReporterArticleCounts(userIds);
            const selected = selectFairReporter(multiRegionReporters, articleCounts);

            console.log('[autoAssignReporter] Fair selection from multi-region:', {
                selected: selected.name,
                articleCount: articleCounts.get(selected.user_id || '') || 0,
                totalCandidates: multiRegionReporters.length
            });

            return {
                reporter: selected,
                reason: 'region_multi',
                message: `Fair selected from ${multiRegionReporters.length} ${articleRegion} region reporters (multi-region)`,
            };
        }

        // Step 1b: Fallback to primary region in reporters table
        const primaryRegionReporters = await findReportersByPrimaryRegion(koreanRegionName);

        console.log('[autoAssignReporter] Primary region reporters found:', primaryRegionReporters.length);

        if (primaryRegionReporters.length > 0) {
            const userIds = primaryRegionReporters
                .map(r => r.user_id)
                .filter((id): id is string => id !== null);

            const articleCounts = await getReporterArticleCounts(userIds);
            const selected = selectFairReporter(primaryRegionReporters, articleCounts);

            console.log('[autoAssignReporter] Fair selection from primary region:', {
                selected: selected.name,
                articleCount: articleCounts.get(selected.user_id || '') || 0,
                totalCandidates: primaryRegionReporters.length
            });

            return {
                reporter: selected,
                reason: 'region',
                message: `Fair selected from ${primaryRegionReporters.length} ${articleRegion} region reporters`,
            };
        }
    }

    // Step 2: Find global reporters (editor and above, access_level >= 60)
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
        const userIds = globalReporters
            .map(r => r.user_id)
            .filter((id): id is string => id !== null);

        const articleCounts = await getReporterArticleCounts(userIds);
        const selected = selectFairReporter(globalReporters, articleCounts);

        console.log('[autoAssignReporter] Fair selection from global:', {
            selected: selected.name,
            articleCount: articleCounts.get(selected.user_id || '') || 0,
            totalCandidates: globalReporters.length
        });

        return {
            reporter: selected,
            reason: 'global',
            message: `Fair selected from ${globalReporters.length} global reporters (no ${articleRegion || 'region'} reporter)`,
        };
    }

    // Step 3: Fallback to default system account
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
 * Now supports multi-region via reporter_regions table
 */
export async function getReportersByRegion(
    region: string | null
): Promise<{ regionReporters: Reporter[]; globalReporters: Reporter[] }> {
    // Convert English region code to Korean name
    let koreanRegionName: string | null = null;
    if (region) {
        const regionInfo = getRegionByCode(region);
        koreanRegionName = regionInfo?.name || region;
    }

    // Get region-specific reporters (try multi-region first, then fallback)
    let regionReporters: Reporter[] = [];
    if (koreanRegionName) {
        // Try multi-region first
        regionReporters = await findReportersByRegionMulti(koreanRegionName);

        // Fallback to primary region if no multi-region results
        if (regionReporters.length === 0) {
            regionReporters = await findReportersByPrimaryRegion(koreanRegionName);
        }
    }

    // Get global reporters (editor and above)
    const { data: globalData } = await supabaseAdmin
        .from('reporters')
        .select('id, user_id, name, email, region, position, access_level')
        .gte('access_level', ROLE_LEVELS.editor)
        .eq('status', 'Active')
        .neq('email', DEFAULT_EMAIL)
        .order('access_level', { ascending: false });

    // Remove duplicates (reporter might be in both region and global)
    const regionIds = new Set(regionReporters.map(r => r.id));
    const uniqueGlobalReporters = (globalData || []).filter(r => !regionIds.has(r.id));

    return {
        regionReporters,
        globalReporters: uniqueGlobalReporters,
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
        case 'region_multi':
            return `${region || ''} 지역 기자 배정`;
        case 'global':
            return '글로벌 기자 배정 (지역 기자 없음)';
        case 'default':
            return '시스템 기본 계정 (가용 기자 없음)';
        default:
            return '';
    }
}

/**
 * Get reporter assignment statistics for admin dashboard
 */
export async function getAssignmentStats(): Promise<{
    totalReporters: number;
    activeReporters: number;
    reportersWithMultiRegion: number;
    articlesWithoutAuthor: number;
}> {
    // Total reporters
    const { count: totalReporters } = await supabaseAdmin
        .from('reporters')
        .select('id', { count: 'exact', head: true });

    // Active reporters
    const { count: activeReporters } = await supabaseAdmin
        .from('reporters')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'Active');

    // Reporters with multi-region entries
    const { data: multiRegionData } = await supabaseAdmin
        .from('reporter_regions')
        .select('reporter_id')
        .limit(1000);

    const uniqueReportersWithRegions = new Set(multiRegionData?.map(r => r.reporter_id) || []);

    // Articles without author
    const { count: articlesWithoutAuthor } = await supabaseAdmin
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .is('author_id', null);

    return {
        totalReporters: totalReporters || 0,
        activeReporters: activeReporters || 0,
        reportersWithMultiRegion: uniqueReportersWithRegions.size,
        articlesWithoutAuthor: articlesWithoutAuthor || 0,
    };
}
