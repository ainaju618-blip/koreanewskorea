import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';

// GET: 프로필 조회
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from('user_personalization_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || {
            user_id: user.id,
            preferred_region: null,
            region_views: {},
            category_views: {}
        });
    } catch (error: any) {
        console.error('GET profile error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: 프로필 수정
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
        }

        const body = await request.json();
        const { preferred_region } = body;

        const { error } = await supabaseAdmin
            .from('user_personalization_profiles')
            .upsert({
                user_id: user.id,
                preferred_region,
                updated_at: new Date().toISOString()
            });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('PUT profile error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
