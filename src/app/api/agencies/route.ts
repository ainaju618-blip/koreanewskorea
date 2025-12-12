import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: 전체 기관 목록 조회
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const category = searchParams.get('category');
        const is_active = searchParams.get('is_active');

        let query = supabaseAdmin.from('agencies').select('*').order('name', { ascending: true });

        if (category) {
            query = query.eq('category', category);
        }
        if (is_active !== null) {
            query = query.eq('is_active', is_active === 'true');
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('GET /api/agencies error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST: 신규 기관 추가
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { region_code, name, category, base_url, press_release_url, contact_department, contact_person, contact_phone, contact_email, notes } = body;

        if (!region_code || !name) {
            return NextResponse.json(
                { success: false, error: 'region_code와 name은 필수입니다' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin.from('agencies').insert({
            region_code,
            name,
            category: category || '전남',
            base_url,
            press_release_url,
            contact_department,
            contact_person,
            contact_phone,
            contact_email,
            notes,
            is_active: true
        }).select().single();

        if (error) throw error;

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// PUT: 기관 정보 수정
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updateFields } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'id는 필수입니다' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('agencies')
            .update(updateFields)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE: 기관 삭제
export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'id는 필수입니다' },
                { status: 400 }
            );
        }

        const { error } = await supabaseAdmin.from('agencies').delete().eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: '삭제 완료' });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
