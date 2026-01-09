import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/auth/setup-password
 * 기자 비밀번호 설정 API (관리자용)
 *
 * Request Body:
 * { reporterId?: string, password: string, setupAll?: boolean }
 * - reporterId: 특정 기자 ID (setupAll이 false일 때)
 * - password: 설정할 비밀번호
 * - setupAll: true면 모든 기자에게 동일 비밀번호 설정
 */
export async function POST(req: NextRequest) {
    try {
        const { reporterId, password, setupAll } = await req.json();

        if (!password || password.length < 6) {
            return NextResponse.json(
                { message: '비밀번호는 6자 이상이어야 합니다.' },
                { status: 400 }
            );
        }

        // 설정할 기자 목록 조회
        let query = supabaseAdmin
            .from('reporters')
            .select('id, name, email, user_id, status')
            .eq('status', 'Active');

        if (!setupAll && reporterId) {
            query = query.eq('id', reporterId);
        }

        const { data: reporters, error: fetchError } = await query;

        if (fetchError || !reporters || reporters.length === 0) {
            return NextResponse.json(
                { message: '기자를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        const results: { name: string; email: string; success: boolean; message: string }[] = [];

        for (const reporter of reporters) {
            if (!reporter.email) {
                results.push({
                    name: reporter.name,
                    email: '',
                    success: false,
                    message: '이메일이 없습니다.',
                });
                continue;
            }

            try {
                let userId = reporter.user_id;

                if (!userId) {
                    // Supabase Auth에 새 사용자 생성
                    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                        email: reporter.email,
                        password: password,
                        email_confirm: true, // 이메일 인증 스킵
                    });

                    if (createError) {
                        // 이미 존재하는 사용자인 경우 조회
                        if (createError.message.includes('already been registered')) {
                            const { data: users } = await supabaseAdmin.auth.admin.listUsers();
                            const existingUser = users?.users?.find(u => u.email === reporter.email);
                            if (existingUser) {
                                userId = existingUser.id;
                                // 비밀번호 업데이트
                                await supabaseAdmin.auth.admin.updateUserById(userId, {
                                    password: password,
                                });
                            } else {
                                results.push({
                                    name: reporter.name,
                                    email: reporter.email,
                                    success: false,
                                    message: `Auth 사용자 생성 실패: ${createError.message}`,
                                });
                                continue;
                            }
                        } else {
                            results.push({
                                name: reporter.name,
                                email: reporter.email,
                                success: false,
                                message: `Auth 사용자 생성 실패: ${createError.message}`,
                            });
                            continue;
                        }
                    } else if (authData?.user) {
                        userId = authData.user.id;
                    }

                    // reporters 테이블에 user_id 업데이트
                    if (userId) {
                        const { error: updateError } = await supabaseAdmin
                            .from('reporters')
                            .update({ user_id: userId })
                            .eq('id', reporter.id);

                        if (updateError) {
                            results.push({
                                name: reporter.name,
                                email: reporter.email,
                                success: false,
                                message: `user_id 업데이트 실패: ${updateError.message}`,
                            });
                            continue;
                        }
                    }
                } else {
                    // 기존 사용자 비밀번호 업데이트
                    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                        password: password,
                    });

                    if (updateError) {
                        results.push({
                            name: reporter.name,
                            email: reporter.email,
                            success: false,
                            message: `비밀번호 업데이트 실패: ${updateError.message}`,
                        });
                        continue;
                    }
                }

                results.push({
                    name: reporter.name,
                    email: reporter.email,
                    success: true,
                    message: '비밀번호 설정 완료',
                });

            } catch (err) {
                results.push({
                    name: reporter.name,
                    email: reporter.email,
                    success: false,
                    message: `오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        return NextResponse.json({
            message: `${successCount}명 성공, ${failCount}명 실패`,
            results,
        });

    } catch (error: unknown) {
        console.error('Setup password error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
