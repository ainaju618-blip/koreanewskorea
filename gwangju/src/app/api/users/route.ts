import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: 회원 목록 조회
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const role = searchParams.get('role');
        const status = searchParams.get('status');

        let query = supabaseAdmin
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (role && role !== 'all') {
            query = query.eq('role', role);
        }

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ users: data });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST: 신규 회원 등록
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, name, role, status, phone } = body;

        if (!email) {
            return NextResponse.json(
                { message: '이메일은 필수 항목입니다.' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('users')
            .insert({
                email,
                name: name || null,
                role: role || 'subscriber',
                status: status || 'active',
                phone: phone || null
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, user: data });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
