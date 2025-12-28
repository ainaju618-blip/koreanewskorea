import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/claude-hub/stats - Get Claude Hub statistics
export async function GET(req: NextRequest) {
    try {
        // Get project count
        const { count: projectCount } = await supabaseAdmin
            .from('project_registry')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        // Get knowledge count
        const { count: knowledgeCount } = await supabaseAdmin
            .from('knowledge_hub')
            .select('*', { count: 'exact', head: true });

        // Get session logs count
        const { count: sessionCount } = await supabaseAdmin
            .from('session_logs')
            .select('*', { count: 'exact', head: true });

        // Get recent knowledge entries
        const { data: recentKnowledge } = await supabaseAdmin
            .from('knowledge_hub')
            .select('id, title, topic, scope, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        // Get knowledge by topic
        const { data: topicStats } = await supabaseAdmin
            .from('knowledge_hub')
            .select('topic');

        const topicCounts: Record<string, number> = {};
        topicStats?.forEach((item: { topic: string }) => {
            topicCounts[item.topic] = (topicCounts[item.topic] || 0) + 1;
        });

        return NextResponse.json({
            projects: projectCount || 0,
            knowledge: knowledgeCount || 0,
            sessions: sessionCount || 0,
            recentKnowledge: recentKnowledge || [],
            topicCounts
        });
    } catch (error: any) {
        console.error('GET /api/claude-hub/stats error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
