import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/claude-hub/knowledge/[id] - Get a knowledge entry by ID
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('knowledge_hub')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ message: 'Knowledge entry not found' }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('GET /api/claude-hub/knowledge/[id] error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// PUT /api/claude-hub/knowledge/[id] - Update a knowledge entry
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const { data, error } = await supabaseAdmin
            .from('knowledge_hub')
            .update({
                ...body,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('PUT /api/claude-hub/knowledge/[id] error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// DELETE /api/claude-hub/knowledge/[id] - Delete a knowledge entry
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabaseAdmin
            .from('knowledge_hub')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ message: 'Knowledge entry deleted' });
    } catch (error: any) {
        console.error('DELETE /api/claude-hub/knowledge/[id] error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
