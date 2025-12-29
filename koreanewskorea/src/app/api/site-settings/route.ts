import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: site_settings by key or keys
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');
        const keys = searchParams.get('keys'); // Support multiple keys: ?keys=key1,key2,key3

        // Multiple keys query - returns key-value object
        if (keys) {
            const keyList = keys.split(',').map(k => k.trim()).filter(Boolean);
            const { data, error } = await supabaseAdmin
                .from('site_settings')
                .select('key, value')
                .in('key', keyList);

            if (error) throw error;

            // Return as key-value object with parsed values
            const result: Record<string, unknown> = {};
            data?.forEach(item => {
                let parsedValue: unknown = item.value;
                if (item.value === 'true') parsedValue = true;
                else if (item.value === 'false') parsedValue = false;
                else if (!isNaN(Number(item.value)) && item.value !== '') parsedValue = Number(item.value);
                result[item.key] = parsedValue;
            });
            return NextResponse.json(result);
        }

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

// POST: Create or Update setting(s)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Support batch update: { settings: [{ key, value }, ...] }
        if (body.settings && Array.isArray(body.settings)) {
            const updates = body.settings.map((item: { key: string; value: unknown }) => ({
                key: item.key,
                value: String(item.value),
                updated_at: new Date().toISOString(),
            }));

            const { error } = await supabaseAdmin
                .from('site_settings')
                .upsert(updates, { onConflict: 'key' });

            if (error) throw error;

            return NextResponse.json({ success: true, updated: updates.length });
        }

        // Single update: { key, value, description? }
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
                    value: String(value),
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
