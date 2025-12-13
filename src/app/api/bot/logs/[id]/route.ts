import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const logId = parseInt(id);

    if (isNaN(logId)) {
        return NextResponse.json({ message: 'Invalid log ID' }, { status: 400 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('bot_logs')
            .select('*')
            .eq('id', logId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ message: 'Log not found' }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json({ log: data });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
