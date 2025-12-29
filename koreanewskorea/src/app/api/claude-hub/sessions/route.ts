import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/claude-hub/sessions - Get all session logs
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const project_code = searchParams.get('project_code');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabaseAdmin
            .from('session_logs')
            .select('*')
            .order('session_date', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);

        if (project_code) {
            query = query.eq('project_code', project_code);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error: any) {
        console.error('GET /api/claude-hub/sessions error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST /api/claude-hub/sessions - Create a new session log
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            project_code,
            summary,
            tasks_completed,
            decisions_made,
            issues_found,
            knowledge_ids
        } = body;

        if (!summary) {
            return NextResponse.json(
                { message: 'Summary is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('session_logs')
            .insert({
                project_code: project_code || null,
                summary,
                tasks_completed: tasks_completed || [],
                decisions_made: decisions_made || [],
                issues_found: issues_found || [],
                knowledge_ids: knowledge_ids || [],
                session_date: new Date().toISOString().split('T')[0]
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/claude-hub/sessions error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
