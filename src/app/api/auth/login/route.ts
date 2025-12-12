import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/auth/login
 * 기자 로그인 API
 *
 * Request Body:
 * { identifier: string, password: string }
 * - identifier: 이름 또는 이메일 (이름으로 먼저 시도, 동명이인이면 이메일 필요)
 *
 * Response:
 * { user, reporter, session } 또는 { duplicates: [...] } (동명이인)
 */
export async function POST(req: NextRequest) {
    try {
        const { identifier, password } = await req.json();

        if (!identifier || !password) {
            return NextResponse.json(
                { message: '이름(또는 이메일)과 비밀번호를 입력해주세요.' },
                { status: 400 }
            );
        }

        let loginEmail: string;

        // 이메일 형식인지 확인
        const isEmail = identifier.includes('@');

        if (isEmail) {
            // 이메일로 직접 로그인
            loginEmail = identifier;
        } else {
            // 이름으로 기자 검색 (먼저 모든 기자 검색)
            const { data: allReporters, error: searchError } = await supabaseAdmin
                .from('reporters')
                .select('id, name, email, position, region, user_id, status')
                .eq('name', identifier);

            if (searchError || !allReporters || allReporters.length === 0) {
                return NextResponse.json(
                    { message: '등록된 기자를 찾을 수 없습니다.' },
                    { status: 404 }
                );
            }

            // 활성화된 기자만 필터링
            const activeReporters = allReporters.filter(r => r.status === 'Active');
            if (activeReporters.length === 0) {
                return NextResponse.json(
                    { message: '비활성화된 계정입니다. 관리자에게 문의하세요.' },
                    { status: 403 }
                );
            }

            // 로그인 가능한 계정 (user_id가 있는) 필터링
            const reporters = activeReporters.filter(r => r.user_id !== null);
            if (reporters.length === 0) {
                return NextResponse.json(
                    { message: '로그인 계정이 설정되지 않았습니다. 관리자에게 비밀번호 설정을 요청하세요.' },
                    { status: 403 }
                );
            }

            // 동명이인 체크
            if (reporters.length > 1) {
                // 동명이인이 있으면 이메일로 선택하도록 목록 반환
                return NextResponse.json({
                    duplicates: reporters.map(r => ({
                        id: r.id,
                        name: r.name,
                        email: r.email,
                        position: r.position,
                        region: r.region,
                    })),
                    message: '동명이인이 있습니다. 이메일을 선택해주세요.'
                }, { status: 300 });
            }

            // 단일 결과 - 이메일로 로그인
            loginEmail = reporters[0].email;
        }

        if (!loginEmail) {
            return NextResponse.json(
                { message: '로그인할 이메일이 없습니다.' },
                { status: 400 }
            );
        }

        // Supabase Auth 로그인
        const supabase = await createClient();
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password,
        });

        if (authError) {
            return NextResponse.json(
                { message: '이름(또는 이메일) 또는 비밀번호가 올바르지 않습니다.' },
                { status: 401 }
            );
        }

        // reporters 테이블에서 해당 user_id로 기자 정보 조회
        const { data: reporter, error: reporterError } = await supabaseAdmin
            .from('reporters')
            .select('*')
            .eq('user_id', authData.user.id)
            .single();

        if (reporterError || !reporter) {
            // 로그인은 성공했지만 기자 등록이 안 된 경우
            await supabase.auth.signOut();
            return NextResponse.json(
                { message: '기자로 등록되지 않은 계정입니다. 관리자에게 문의하세요.' },
                { status: 403 }
            );
        }

        // 기자 상태 확인
        if (reporter.status !== 'Active') {
            await supabase.auth.signOut();
            return NextResponse.json(
                { message: '비활성화된 계정입니다. 관리자에게 문의하세요.' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            user: authData.user,
            reporter: reporter,
            session: authData.session,
        });

    } catch (error: unknown) {
        console.error('Login error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
