import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/claude-hub/raw-contents/[id] - Get a raw content by ID
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('raw_contents')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ message: 'Raw content not found' }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('GET /api/claude-hub/raw-contents/[id] error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// PATCH /api/claude-hub/raw-contents/[id] - Update a raw content (mainly for status)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        // If status is being changed to 'processed', set processed_at
        const updateData = { ...body };
        if (body.status === 'processed' && !body.processed_at) {
            updateData.processed_at = new Date().toISOString();
        }

        const { data, error } = await supabaseAdmin
            .from('raw_contents')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('PATCH /api/claude-hub/raw-contents/[id] error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// DELETE /api/claude-hub/raw-contents/[id] - Delete a raw content
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabaseAdmin
            .from('raw_contents')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ message: 'Raw content deleted' });
    } catch (error: any) {
        console.error('DELETE /api/claude-hub/raw-contents/[id] error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
