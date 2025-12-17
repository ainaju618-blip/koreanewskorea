import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/claude-hub/knowledge - Get knowledge entries
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const scope = searchParams.get('scope');
        const project = searchParams.get('project');
        const topic = searchParams.get('topic');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = supabaseAdmin
            .from('knowledge_hub')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (scope) {
            query = query.eq('scope', scope);
        }
        if (project) {
            query = query.eq('project_code', project);
        }
        if (topic) {
            query = query.eq('topic', topic);
        }
        if (search) {
            query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            entries: data || [],
            count: count || 0,
            limit,
            offset
        });
    } catch (error: any) {
        console.error('GET /api/claude-hub/knowledge error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST /api/claude-hub/knowledge - Create knowledge entry
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { data, error } = await supabaseAdmin
            .from('knowledge_hub')
            .insert({
                scope: body.scope,
                project_code: body.project_code,
                stack: body.stack,
                topic: body.topic,
                tags: body.tags || [],
                title: body.title,
                summary: body.summary,
                content: body.content,
                raw_source: body.raw_source,
                source_type: body.source_type,
                source_url: body.source_url,
                source_title: body.source_title,
                created_by: body.created_by || 'manual'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/claude-hub/knowledge error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
