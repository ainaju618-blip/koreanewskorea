import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: 단일 기자 조회
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('reporters')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) {
            return NextResponse.json({ message: '기자를 찾을 수 없습니다.' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}

// PUT: 기자 정보 수정
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await req.json();

        // 유효성 검사 - 이름은 필수
        if (!body.name) {
            return NextResponse.json({ message: '이름은 필수입니다.' }, { status: 400 });
        }

        // position 값 확인 (직위: editor_in_chief, branch_manager, reporter 등)
        const position = body.position || body.type || 'reporter';

        // 비밀번호 변경 요청 시 길이 검증
        if (body.password && body.password.length < 6) {
            return NextResponse.json({ message: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 });
        }

        const DEFAULT_PASSWORD = 'a1234567!';  // 기본 비밀번호

        // 기존 기자 정보 조회 (user_id, email 확인용)
        const { data: existingReporter } = await supabaseAdmin
            .from('reporters')
            .select('user_id, email')
            .eq('id', id)
            .single();

        let newUserId: string | null = null;

        // 이메일이 있고 user_id가 없으면 Auth 계정 생성
        if (body.email && !existingReporter?.user_id) {
            const password = body.password || DEFAULT_PASSWORD;

            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: body.email,
                password: password,
                email_confirm: true,
                user_metadata: {
                    name: body.name,
                    role: 'reporter'
                }
            });

            if (authError) {
                if (authError.message.includes('already been registered')) {
                    return NextResponse.json({ message: '이미 등록된 이메일입니다.' }, { status: 400 });
                }
                console.error('Auth create error:', authError);
                return NextResponse.json({ message: 'Auth 계정 생성에 실패했습니다.' }, { status: 500 });
            }

            newUserId = authData.user?.id || null;
        }
        // 기존 user_id가 있고, 비밀번호가 입력된 경우 비밀번호 변경
        else if (body.password && existingReporter?.user_id) {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                existingReporter.user_id,
                { password: body.password }
            );

            if (authError) {
                console.error('Password update error:', authError);
                return NextResponse.json({ message: '비밀번호 변경에 실패했습니다.' }, { status: 500 });
            }
        }

        // user_id 처리: 새로 생성된 경우만
        const userIdUpdate = newUserId ? { user_id: newUserId } : {};

        // type: 'Human' (DB CHECK 제약 만족) / position: 실제 직위값
        const { data, error } = await supabaseAdmin
            .from('reporters')
            .update({
                name: body.name,
                type: 'Human',      // DB CHECK 제약: 'AI Bot' 또는 'Human'만 가능
                position: position, // 실제 직위값 (editor_in_chief, reporter 등)
                region: body.region || '전체',
                phone: body.phone || null,
                email: body.email || null,
                bio: body.bio || null,
                profile_image: body.profile_image || null,  // 프로필 사진 URL
                status: body.status || 'Active',
                avatar_icon: '👤',
                gemini_api_key: body.gemini_api_key || null,
                ...userIdUpdate,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Reporter update error:', JSON.stringify(error, null, 2));
            throw error;
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error('Reporter update catch error:', error);
        const message = error instanceof Error ? error.message : (typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : '서버 오류가 발생했습니다.');
        return NextResponse.json({ message }, { status: 500 });
    }
}

// DELETE: 기자 삭제
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const { error } = await supabaseAdmin
            .from('reporters')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ message: '기자가 삭제되었습니다.' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
