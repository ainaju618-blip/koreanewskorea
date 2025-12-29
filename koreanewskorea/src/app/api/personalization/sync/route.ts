import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';

// POST: LocalStorage → DB 동기화
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
        }

        const body = await request.json();
        const { regionViews, categoryViews } = body;

        // 기존 프로필 조회
        const { data: existing } = await supabaseAdmin
            .from('user_personalization_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        // 병합 (더 큰 값 유지)
        const mergedRegionViews: Record<string, number> = { ...(existing?.region_views || {}) };
        for (const [key, value] of Object.entries(regionViews || {})) {
            mergedRegionViews[key] = Math.max(mergedRegionViews[key] || 0, value as number);
        }

        const mergedCategoryViews: Record<string, number> = { ...(existing?.category_views || {}) };
        for (const [key, value] of Object.entries(categoryViews || {})) {
            mergedCategoryViews[key] = Math.max(mergedCategoryViews[key] || 0, value as number);
        }

        // 저장
        const { error } = await supabaseAdmin
            .from('user_personalization_profiles')
            .upsert({
                user_id: user.id,
                region_views: mergedRegionViews,
                category_views: mergedCategoryViews,
                last_synced_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            merged: {
                regionViews: mergedRegionViews,
                categoryViews: mergedCategoryViews
            }
        });
    } catch (error: any) {
        console.error('POST sync error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
