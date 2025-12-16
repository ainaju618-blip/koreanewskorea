import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export interface PerformanceLog {
    id: string;
    measured_at: string;
    performance: number;
    accessibility: number;
    best_practices: number;
    seo: number;
    lcp_ms: number | null;
    fcp_ms: number | null;
    tbt_ms: number | null;
    cls: number | null;
    si_ms: number | null;
    notes: string | null;
    created_by: string;
    created_at: string;
}

// GET: Fetch all performance logs
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error, count } = await supabase
            .from('performance_logs')
            .select('*', { count: 'exact' })
            .order('measured_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Performance logs fetch error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch performance logs' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            data: data || [],
            count: count || 0
        });
    } catch (error) {
        console.error('Performance API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: Add new performance log
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        const { performance, accessibility, best_practices, seo } = body;
        if (
            performance === undefined ||
            accessibility === undefined ||
            best_practices === undefined ||
            seo === undefined
        ) {
            return NextResponse.json(
                { error: 'Missing required fields: performance, accessibility, best_practices, seo' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const insertData = {
            measured_at: body.measured_at || new Date().toISOString(),
            performance: Math.min(100, Math.max(0, parseInt(performance))),
            accessibility: Math.min(100, Math.max(0, parseInt(accessibility))),
            best_practices: Math.min(100, Math.max(0, parseInt(best_practices))),
            seo: Math.min(100, Math.max(0, parseInt(seo))),
            lcp_ms: body.lcp_ms ? parseInt(body.lcp_ms) : null,
            fcp_ms: body.fcp_ms ? parseInt(body.fcp_ms) : null,
            tbt_ms: body.tbt_ms ? parseInt(body.tbt_ms) : null,
            cls: body.cls ? parseFloat(body.cls) : null,
            si_ms: body.si_ms ? parseInt(body.si_ms) : null,
            notes: body.notes || null,
            created_by: body.created_by || 'manual'
        };

        const { data, error } = await supabase
            .from('performance_logs')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error('Performance log insert error:', error);
            return NextResponse.json(
                { error: 'Failed to create performance log' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Performance API POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
