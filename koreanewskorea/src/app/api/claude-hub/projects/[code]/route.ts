import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/claude-hub/projects/[code] - Get a project by code
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        const { data, error } = await supabaseAdmin
            .from('project_registry')
            .select('*')
            .eq('code', code)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ message: 'Project not found' }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('GET /api/claude-hub/projects/[code] error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// PUT /api/claude-hub/projects/[code] - Update a project
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;
        const body = await req.json();

        const { data, error } = await supabaseAdmin
            .from('project_registry')
            .update({
                ...body,
                updated_at: new Date().toISOString()
            })
            .eq('code', code)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('PUT /api/claude-hub/projects/[code] error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// DELETE /api/claude-hub/projects/[code] - Archive a project
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        const { error } = await supabaseAdmin
            .from('project_registry')
            .update({ status: 'archived', updated_at: new Date().toISOString() })
            .eq('code', code);

        if (error) throw error;

        return NextResponse.json({ message: `Project ${code} archived` });
    } catch (error: any) {
        console.error('DELETE /api/claude-hub/projects/[code] error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
