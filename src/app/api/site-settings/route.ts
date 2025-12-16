import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: site_settings by key
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');

        if (!key) {
            // Return all settings
            const { data, error } = await supabaseAdmin
                .from('site_settings')
                .select('*')
                .order('key');

            if (error) throw error;
            return NextResponse.json({ settings: data });
        }

        // Return specific setting
        const { data, error } = await supabaseAdmin
            .from('site_settings')
            .select('*')
            .eq('key', key)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ message: 'Setting not found' }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json({ setting: data });
    } catch (error: any) {
        console.error('GET /api/site-settings error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST: Create or Update setting
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { key, value, description } = body;

        if (!key || value === undefined) {
            return NextResponse.json(
                { message: 'key and value are required' },
                { status: 400 }
            );
        }

        // Upsert: insert or update on conflict
        const { data, error } = await supabaseAdmin
            .from('site_settings')
            .upsert(
                {
                    key,
                    value,
                    description: description || null,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'key' }
            )
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, setting: data });
    } catch (error: any) {
        console.error('POST /api/site-settings error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
