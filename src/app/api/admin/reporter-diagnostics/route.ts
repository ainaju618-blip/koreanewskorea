/**
 * Reporter Assignment Diagnostics API
 *
 * GET /api/admin/reporter-diagnostics
 * Returns detailed information about the reporter assignment system status
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ROLE_LEVELS } from '@/lib/permissions';

export async function GET() {
    try {
        // 1. Total reporters count
        const { count: totalReporters } = await supabaseAdmin
            .from('reporters')
            .select('*', { count: 'exact', head: true });

        // 2. Active reporters count
        const { count: activeReporters } = await supabaseAdmin
            .from('reporters')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Active');

        // 3. Reporters with user_id (can be assigned as author)
        const { data: reportersWithUserId, count: withUserIdCount } = await supabaseAdmin
            .from('reporters')
            .select('id, name, email, region, position, access_level, user_id, status', { count: 'exact' })
            .not('user_id', 'is', null)
            .eq('status', 'Active');

        // 4. Global reporters (access_level >= 60)
        const { data: globalReporters, count: globalCount } = await supabaseAdmin
            .from('reporters')
            .select('id, name, email, region, position, access_level, user_id', { count: 'exact' })
            .gte('access_level', ROLE_LEVELS.editor)
            .eq('status', 'Active')
            .not('user_id', 'is', null);

        // 5. Default fallback account
        const { data: defaultAccount } = await supabaseAdmin
            .from('reporters')
            .select('id, name, email, region, position, access_level, user_id, status')
            .eq('email', 'news@koreanewsone.com')
            .maybeSingle();

        // 6. Check reporter_regions table
        let reporterRegionsCount = 0;
        let reporterRegionsData: any[] = [];
        try {
            const { count, data } = await supabaseAdmin
                .from('reporter_regions')
                .select('*', { count: 'exact' })
                .limit(20);
            reporterRegionsCount = count || 0;
            reporterRegionsData = data || [];
        } catch (e) {
            // Table might not exist
        }

        // 7. Reporters by region
        const { data: byRegion } = await supabaseAdmin
            .from('reporters')
            .select('region')
            .eq('status', 'Active')
            .not('user_id', 'is', null);

        const regionCounts: Record<string, number> = {};
        byRegion?.forEach(r => {
            const region = r.region || 'null';
            regionCounts[region] = (regionCounts[region] || 0) + 1;
        });

        // 8. Check profiles table for FK validation
        const userIds = reportersWithUserId?.map(r => r.user_id).filter(Boolean) || [];
        let profilesCount = 0;
        if (userIds.length > 0) {
            const { count } = await supabaseAdmin
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .in('id', userIds);
            profilesCount = count || 0;
        }

        // Diagnosis
        const issues: string[] = [];
        const recommendations: string[] = [];

        if (!totalReporters || totalReporters === 0) {
            issues.push('❌ reporters 테이블이 비어있습니다');
            recommendations.push('기자를 추가하세요: POST /api/users/reporters');
        }

        if (!activeReporters || activeReporters === 0) {
            issues.push('❌ Active 상태의 기자가 없습니다');
        }

        if (!withUserIdCount || withUserIdCount === 0) {
            issues.push('❌ user_id가 설정된 기자가 없습니다 (author_id FK 연결 불가)');
            recommendations.push('기자에게 Supabase Auth 계정을 연결하세요');
        }

        if (!globalCount || globalCount === 0) {
            issues.push('❌ Global fallback 가능 기자 없음 (access_level >= 60 필요)');
            recommendations.push('최소 1명의 기자에게 access_level 60 이상 부여 필요');
        }

        if (!defaultAccount) {
            issues.push('⚠️ 기본 fallback 계정(news@koreanewsone.com)이 없습니다');
        } else if (!defaultAccount.user_id) {
            issues.push('⚠️ 기본 fallback 계정에 user_id가 없습니다');
        }

        if (reporterRegionsCount === 0) {
            issues.push('⚠️ reporter_regions 테이블이 비어있거나 없습니다 (multi-region 지원 불가)');
        }

        if (profilesCount < userIds.length) {
            issues.push(`⚠️ profiles 테이블에 ${userIds.length - profilesCount}명의 기자 프로필이 없습니다`);
        }

        if (issues.length === 0) {
            issues.push('✅ 기자 배정 시스템이 정상 설정되어 있습니다');
        }

        return NextResponse.json({
            summary: {
                totalReporters: totalReporters || 0,
                activeReporters: activeReporters || 0,
                withUserId: withUserIdCount || 0,
                globalReporters: globalCount || 0,
                reporterRegions: reporterRegionsCount,
                profilesMatched: profilesCount,
            },
            defaultAccount: defaultAccount || null,
            globalReporters: globalReporters || [],
            reportersByRegion: regionCounts,
            reporterRegionsSample: reporterRegionsData.slice(0, 5),
            allActiveReportersWithUserId: reportersWithUserId || [],
            diagnosis: {
                issues,
                recommendations,
            },
            requiredAccessLevel: ROLE_LEVELS.editor,
        });
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            hint: 'reporters 또는 reporter_regions 테이블이 존재하지 않을 수 있습니다'
        }, { status: 500 });
    }
}
