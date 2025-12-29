import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/claude-hub/knowledge/[id]/usage - Get usage logs for a knowledge entry
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('knowledge_usage_logs')
            .select('*')
            .eq('knowledge_id', id)
            .order('used_at', { ascending: false });

        if (error) {
            // If table doesn't exist, return empty array
            if (error.code === '42P01') {
                return NextResponse.json([]);
            }
            throw error;
        }

        return NextResponse.json(data || []);
    } catch (error: any) {
        console.error('GET /api/claude-hub/knowledge/[id]/usage error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST /api/claude-hub/knowledge/[id]/usage - Create a new usage log
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const { context, outcome, project_code } = body;

        if (!context) {
            return NextResponse.json(
                { message: 'Context is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('knowledge_usage_logs')
            .insert({
                knowledge_id: id,
                context,
                outcome: outcome || null,
                project_code: project_code || null,
                used_at: new Date().toISOString(),
                created_by: 'user'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/claude-hub/knowledge/[id]/usage error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
