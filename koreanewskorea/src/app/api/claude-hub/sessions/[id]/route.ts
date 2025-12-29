import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/claude-hub/sessions/[id] - Get a session log by ID
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('session_logs')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ message: 'Session not found' }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('GET /api/claude-hub/sessions/[id] error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// PUT /api/claude-hub/sessions/[id] - Update a session log
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const { data, error } = await supabaseAdmin
            .from('session_logs')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('PUT /api/claude-hub/sessions/[id] error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// DELETE /api/claude-hub/sessions/[id] - Delete a session log
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabaseAdmin
            .from('session_logs')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ message: 'Session deleted' });
    } catch (error: any) {
        console.error('DELETE /api/claude-hub/sessions/[id] error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
