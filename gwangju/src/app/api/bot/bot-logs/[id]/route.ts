import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const logId = parseInt(id, 10);

        if (isNaN(logId)) {
            return NextResponse.json(
                { message: 'Invalid log ID' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('bot_logs')
            .select('*')
            .eq('id', logId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { message: 'Log not found' },
                    { status: 404 }
                );
            }
            throw error;
        }

        return NextResponse.json({ log: data });

    } catch (error: any) {
        console.error('[API] Log detail error:', error);
        return NextResponse.json(
            { message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
