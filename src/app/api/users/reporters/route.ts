import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const position = searchParams.get('position');
        const region = searchParams.get('region');
        const type = searchParams.get('type');
        const simple = searchParams.get('simple'); // 간단 목록용 (드롭다운)

        // 간단 목록: id, name만 조회 (기자 지정 드롭다운용)
        if (simple === 'true') {
            const { data, error } = await supabaseAdmin
                .from('reporters')
                .select('id, name, position, region')
                .eq('status', 'Active')
                .order('name', { ascending: true });

            if (error) throw error;
            return NextResponse.json(data);
        }

        let query = supabaseAdmin
            .from('reporters')
            .select('*')
            .order('created_at', { ascending: false });

        // 필터 적용
        if (position) query = query.eq('position', position);
        if (region) query = query.eq('region', region);
        if (type) query = query.eq('type', type);

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 유효성 검사 - position(직위)은 필수
        if (!body.name) {
            return NextResponse.json({ message: '이름은 필수입니다.' }, { status: 400 });
        }

        // position 값 확인 (직위: editor_in_chief, branch_manager, reporter 등)
        const position = body.position || body.type || 'reporter';

        let userId: string | null = null;
        const DEFAULT_PASSWORD = process.env.DEFAULT_REPORTER_PASSWORD || 'temp123!';

        // 이메일이 있으면 Supabase Auth 계정 생성 (로그인 가능)
        if (body.email) {
            // 비밀번호가 없으면 기본 비밀번호 사용
            const password = body.password || DEFAULT_PASSWORD;

            // 비밀번호 길이 검증 (사용자가 직접 입력한 경우만)
            if (body.password && body.password.length < 6) {
                return NextResponse.json({ message: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 });
            }

            // Supabase Auth 사용자 생성
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: body.email,
                password: password,
                email_confirm: true, // 이메일 인증 자동 완료
                user_metadata: {
                    name: body.name,
                    role: 'reporter'
                }
            });

            if (authError) {
                // 이메일 중복 등 에러 처리
                if (authError.message.includes('already been registered')) {
                    return NextResponse.json({ message: '이미 등록된 이메일입니다.' }, { status: 400 });
                }
                throw authError;
            }

            userId = authData.user?.id || null;
        }

        // reporters 테이블에 기자 정보 저장
        // type: 'Human' (DB CHECK 제약 만족) / position: 실제 직위값
        const { data, error } = await supabaseAdmin
            .from('reporters')
            .insert([{
                name: body.name,
                type: 'Human',      // DB CHECK 제약: 'AI Bot' 또는 'Human'만 가능
                position: position, // 실제 직위값 (editor_in_chief, reporter 등)
                region: body.region || '전체',
                phone: body.phone || null,
                email: body.email || null,
                bio: body.bio || null,
                avatar_icon: '👤',
                status: 'Active',
                user_id: userId,
                access_level: 1, // 기본 권한 레벨
                gemini_api_key: body.gemini_api_key || null,
            }])
            .select()
            .single();

        if (error) {
            // 기자 생성 실패 시 생성된 Auth 사용자 삭제
            if (userId) {
                await supabaseAdmin.auth.admin.deleteUser(userId);
            }
            throw error;
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
