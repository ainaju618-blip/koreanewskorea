import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/claude-hub/projects - Get all projects
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        let query = supabaseAdmin
            .from('project_registry')
            .select('*')
            .order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            projects: data || [],
            count: data?.length || 0
        });
    } catch (error: any) {
        console.error('GET /api/claude-hub/projects error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST /api/claude-hub/projects - Create a project
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { data, error } = await supabaseAdmin
            .from('project_registry')
            .insert({
                code: body.code,
                name: body.name,
                description: body.description,
                path: body.path,
                git_email: body.git_email,
                git_name: body.git_name,
                git_repo: body.git_repo,
                git_branch: body.git_branch || 'master',
                vercel_project: body.vercel_project,
                vercel_team: body.vercel_team,
                vercel_domain: body.vercel_domain,
                tech_stack: body.tech_stack || [],
                status: body.status || 'active'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/claude-hub/projects error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
