import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// DELETE: Remove a performance log
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'Missing id parameter' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from('performance_logs')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Performance log delete error:', error);
            return NextResponse.json(
                { error: 'Failed to delete performance log' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Performance API DELETE error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
