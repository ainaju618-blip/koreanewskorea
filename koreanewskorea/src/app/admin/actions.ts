// src/app/admin/actions.ts
// Admin 인증 Server Action

'use server'

export interface AuthState {
    error: string | null;
    authenticated: boolean;
}

export async function authenticateAdmin(
    prevState: AuthState,
    formData: FormData
): Promise<AuthState> {
    const password = formData.get('password') as string;

    // 환경변수에서 관리자 비밀번호 확인
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
        return { error: '서버 설정 오류', authenticated: false };
    }

    if (password === adminPassword) {
        return { error: null, authenticated: true };
    }

    return { error: '비밀번호가 올바르지 않습니다.', authenticated: false };
}
