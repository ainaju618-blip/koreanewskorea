import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        // 인증 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
        }

        const body = await req.json();
        const { reporterId } = body;

        if (!reporterId) {
            return NextResponse.json({ message: '기자 ID가 필요합니다.' }, { status: 400 });
        }

        // 본인 구독 불가 (기자가 자신을 구독하는 경우 방지 - 선택사항)
        // if (user.id === reporterId) { ... } (reporter테이블과 user테이블 ID가 달라서 바로 비교 불가)

        // 구독 추가
        const { error } = await supabase
            .from('reporter_subscriptions')
            .insert({
                subscriber_id: user.id,
                reporter_id: reporterId,
            });

        if (error) {
            // 이미 구독 중인 경우 (Unique Constraint)
            if (error.code === '23505') {
                return NextResponse.json({ message: '이미 구독 중입니다.' }, { status: 409 });
            }
            throw error;
        }

        return NextResponse.json({ message: '구독되었습니다.', isSubscribed: true });
    } catch (error: any) {
        console.error('Subscription error:', error);
        return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient();

        // 인증 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
        }

        const body = await req.json();
        const { reporterId } = body;

        if (!reporterId) {
            return NextResponse.json({ message: '기자 ID가 필요합니다.' }, { status: 400 });
        }

        // 구독 취소
        const { error } = await supabase
            .from('reporter_subscriptions')
            .delete()
            .match({
                subscriber_id: user.id,
                reporter_id: reporterId,
            });

        if (error) throw error;

        return NextResponse.json({ message: '구독이 취소되었습니다.', isSubscribed: false });
    } catch (error: any) {
        console.error('Unsubscribe error:', error);
        return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
