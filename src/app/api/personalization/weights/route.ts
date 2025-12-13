import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: 모든 지역 가중치 조회
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('region_weights')
            .select('*')
            .order('region_code');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ weights: data || [] });
    } catch (error: any) {
        console.error('GET weights error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: 가중치 수정
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { region_code, weight } = body;

        if (!region_code || weight === undefined) {
            return NextResponse.json(
                { error: 'region_code와 weight 필요' },
                { status: 400 }
            );
        }

        if (weight < 0.5 || weight > 3.0) {
            return NextResponse.json(
                { error: 'weight는 0.5~3.0 범위' },
                { status: 400 }
            );
        }

        const { error } = await supabaseAdmin
            .from('region_weights')
            .update({
                weight,
                updated_at: new Date().toISOString()
            })
            .eq('region_code', region_code);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('PUT weights error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
