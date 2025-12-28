import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/claude-hub/raw-contents - Get all raw contents
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const project_code = searchParams.get('project_code');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabaseAdmin
            .from('raw_contents')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (project_code) {
            query = query.eq('project_code', project_code);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error: any) {
        console.error('GET /api/claude-hub/raw-contents error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST /api/claude-hub/raw-contents - Create a new raw content
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            title,
            content,
            source_url,
            source_type,
            project_code
        } = body;

        if (!title || !content) {
            return NextResponse.json(
                { message: 'Title and content are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('raw_contents')
            .insert({
                title,
                content,
                source_url: source_url || null,
                source_type: source_type || 'manual',
                project_code: project_code || null,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/claude-hub/raw-contents error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
