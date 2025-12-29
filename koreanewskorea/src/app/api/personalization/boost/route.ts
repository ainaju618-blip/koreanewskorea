import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: 부스트 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const active = searchParams.get('active');
        const upcoming = searchParams.get('upcoming');

        let query = supabaseAdmin
            .from('boost_schedules')
            .select('*')
            .eq('is_active', true)
            .order('start_at', { ascending: true });

        const now = new Date().toISOString();

        if (active === 'true') {
            // 현재 활성중인 부스트만
            query = query.lte('start_at', now).gte('end_at', now);
        } else if (upcoming === 'true') {
            // 예정된 부스트만
            query = query.gt('start_at', now);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ boosts: data, total: data?.length || 0 });
    } catch (error: any) {
        console.error('GET boost error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: 부스트 생성
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { boost_type, target_value, priority, start_at, end_at, memo, repeat_type, repeat_days } = body;

        // 유효성 검증
        if (!boost_type || !target_value || !start_at || !end_at) {
            return NextResponse.json(
                { error: '필수 필드 누락: boost_type, target_value, start_at, end_at' },
                { status: 400 }
            );
        }

        if (!['region', 'article', 'category'].includes(boost_type)) {
            return NextResponse.json(
                { error: 'boost_type은 region, article, category 중 하나' },
                { status: 400 }
            );
        }

        if (new Date(start_at) >= new Date(end_at)) {
            return NextResponse.json(
                { error: '시작 시간은 종료 시간보다 이전이어야 합니다' },
                { status: 400 }
            );
        }

        if (priority && (priority < 1 || priority > 10)) {
            return NextResponse.json(
                { error: '우선순위는 1~10 범위' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('boost_schedules')
            .insert({
                boost_type,
                target_value,
                priority: priority || 5,
                start_at,
                end_at,
                memo,
                repeat_type: repeat_type || 'none',
                repeat_days
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, boost: data });
    } catch (error: any) {
        console.error('POST boost error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
