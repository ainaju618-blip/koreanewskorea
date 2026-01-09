'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Loader2, FileText, PenTool, LogOut, Newspaper } from 'lucide-react';

export default function WriteLayout({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const pathname = usePathname();

    // 세션 확인
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/admin/auth');
            if (res.ok) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
        } catch {
            setIsAuthenticated(false);
        }
    };

    // 로그인
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                setIsAuthenticated(true);
                setPassword('');
            } else {
                const data = await res.json();
                setError(data.message || '비밀번호가 올바르지 않습니다.');
            }
        } catch {
            setError('서버 연결에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 로그아웃
    const handleLogout = async () => {
        await fetch('/api/admin/auth', { method: 'DELETE' });
        setIsAuthenticated(false);
    };

    // 로딩 중
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-500">확인 중...</p>
                </div>
            </div>
        );
    }

    // 로그인 화면
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 mb-4">
                            <Newspaper className="w-10 h-10 text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">기자 기사등록</h1>
                        <p className="text-blue-200/70">코리아NEWS 기사 등록 시스템</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-blue-100 mb-2">
                                    비밀번호
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="비밀번호를 입력하세요"
                                        className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                                        autoFocus
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/50 hover:text-blue-200 transition"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !password}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        확인 중...
                                    </>
                                ) : (
                                    '로그인'
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-blue-200/40 text-sm mt-6">
                        © 2024 코리아NEWS. All rights reserved.
                    </p>
                </div>
            </div>
        );
    }

    // 인증됨 - 메인 레이아웃
    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/write" className="flex items-center gap-3">
                            <Newspaper className="w-8 h-8 text-blue-600" />
                            <span className="text-xl font-bold text-gray-900">기자 기사등록</span>
                        </Link>

                        <nav className="flex items-center gap-2">
                            <Link
                                href="/write"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    pathname === '/write'
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <FileText className="w-4 h-4" />
                                기사 목록
                            </Link>
                            <Link
                                href="/write/new"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    pathname === '/write/new'
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <PenTool className="w-4 h-4" />
                                새 기사
                            </Link>
                            <div className="w-px h-6 bg-gray-200 mx-2" />
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
                            >
                                <LogOut className="w-4 h-4" />
                                로그아웃
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* 메인 콘텐츠 */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {children}
            </main>

            {/* 푸터 */}
            <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-sm text-gray-500">
                    © 2024 코리아NEWS. 기자 기사등록 시스템
                </div>
            </footer>
        </div>
    );
}
