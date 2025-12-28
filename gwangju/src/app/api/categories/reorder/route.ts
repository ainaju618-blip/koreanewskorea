import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { items } = body;

        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ message: '잘못된 데이터 형식입니다.' }, { status: 400 });
        }

        // 트랜잭션 처럼 동작하도록 Promise.all 사용
        // Supabase REST API는 일괄 업데이트를 직접 지원하지 않으므로 개별 업데이트
        // 성능 이슈가 발생하면 RPC 함수로 변경 고려
        const updates = items.map(item =>
            supabaseAdmin
                .from('categories')
                .update({ order_index: item.order_index })
                .eq('id', item.id)
        );

        await Promise.all(updates);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Reorder error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
