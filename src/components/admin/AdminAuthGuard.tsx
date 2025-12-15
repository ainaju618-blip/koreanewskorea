"use client";

/**
 * AdminAuthGuard (React 19 useActionState 버전)
 * =============================================
 * - useActionState: 폼 상태를 React 19 공식 패턴으로 관리
 * - useTransition: 자연스러운 pending 상태
 * - sessionStorage: 탭별 인증 세션 유지
 */

import React, { useState, useEffect, useActionState, useTransition } from "react";
import { Lock, Loader2, Shield, AlertCircle, Eye, EyeOff } from "lucide-react";

interface AdminAuthGuardProps {
    children: React.ReactNode;
}

const ADMIN_PASSWORD_KEY = "korea_news_admin_auth";

interface AuthState {
    error: string | null;
    authenticated: boolean;
}

const initialState: AuthState = {
    error: null,
    authenticated: false,
};

// 클라이언트 사이드 인증 (API 호출)
async function clientAuthenticate(
    prevState: AuthState,
    formData: FormData
): Promise<AuthState> {
    const password = formData.get("password") as string;

    try {
        const res = await fetch("/api/admin/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        });

        if (res.ok) {
            sessionStorage.setItem(ADMIN_PASSWORD_KEY, "authenticated");
            return { error: null, authenticated: true };
        } else {
            const data = await res.json();
            return { error: data.message || "비밀번호가 올바르지 않습니다.", authenticated: false };
        }
    } catch {
        return { error: "서버 연결에 실패했습니다.", authenticated: false };
    }
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
    const [isChecking, setIsChecking] = useState(true);
    const [sessionAuth, setSessionAuth] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isPending, startTransition] = useTransition();

    // React 19 useActionState
    const [state, formAction] = useActionState(clientAuthenticate, initialState);

    // 세션 스토리지에서 인증 상태 확인 (탭별로 독립)
    useEffect(() => {
        const authData = sessionStorage.getItem(ADMIN_PASSWORD_KEY);
        if (authData === "authenticated") {
            setSessionAuth(true);
        }
        setIsChecking(false);
    }, []);

    // state.authenticated가 true가 되면 세션 인증으로 전환
    useEffect(() => {
        if (state.authenticated) {
            setSessionAuth(true);
        }
    }, [state.authenticated]);

    // 로딩 중
    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
        );
    }

    // 인증됨 - 자식 컴포넌트 표시
    if (sessionAuth) {
        return <>{children}</>;
    }

    // 인증되지 않음 - 비밀번호 입력 화면
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="w-full max-w-sm">
                {/* 로고 */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Korea NEWS</h1>
                    <p className="text-slate-400 mt-1">관리자 영역</p>
                </div>

                {/* 비밀번호 입력 폼 - React 19 useActionState */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                    <form action={formAction} className="space-y-4">
                        {/* 에러 메시지 */}
                        {state.error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{state.error}</span>
                            </div>
                        )}

                        {/* 비밀번호 */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                관리자 비밀번호
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="비밀번호를 입력하세요"
                                    className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    autoFocus
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* 확인 버튼 */}
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    확인 중...
                                </>
                            ) : (
                                "확인"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
