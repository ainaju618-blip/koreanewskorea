import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: 전체 설정 조회
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('personalization_settings')
            .select('*');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 배열을 객체로 변환 { boost: {...}, geolocation: {...}, ... }
        const settings = (data || []).reduce((acc, item) => {
            acc[item.setting_key] = item.setting_value;
            return acc;
        }, {} as Record<string, any>);

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error('GET personalization settings error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: 설정 업데이트
export async function PUT(request: NextRequest) {
    try {
        // TODO: 관리자 권한 체크 추가
        const body = await request.json();
        const { settingKey, value } = body;

        if (!settingKey || !value) {
            return NextResponse.json(
                { error: 'settingKey와 value 필요' },
                { status: 400 }
            );
        }

        const { error } = await supabaseAdmin
            .from('personalization_settings')
            .update({
                setting_value: value,
                updated_at: new Date().toISOString()
            })
            .eq('setting_key', settingKey);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('PUT personalization settings error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
