"use client";

/**
 * AdminAuthGuard (JWT 기반 인증)
 * ==============================
 * - httpOnly 쿠키 기반 JWT 토큰 인증
 * - 서버 API를 통한 세션 검증
 * - 자동 세션 갱신 및 만료 처리
 */

import React, { useState, useEffect, useCallback } from "react";
import { Lock, Loader2, Shield, AlertCircle, Eye, EyeOff, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

interface AuthState {
  status: 'checking' | 'authenticated' | 'unauthenticated';
  error: string | null;
  role?: string;
}

// 세션 체크 간격 (5분)
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000;

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    status: 'checking',
    error: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 세션 확인
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'GET',
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setAuthState({
          status: 'authenticated',
          error: null,
          role: data.role,
        });
        return true;
      } else {
        setAuthState({
          status: 'unauthenticated',
          error: null,
        });
        return false;
      }
    } catch {
      setAuthState({
        status: 'unauthenticated',
        error: '서버 연결에 실패했습니다.',
      });
      return false;
    }
  }, []);

  // 초기 세션 확인 및 주기적 체크
  useEffect(() => {
    checkSession();

    // 주기적 세션 확인
    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL);

    // 다른 탭에서 로그아웃 시 동기화
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'admin_logout') {
        setAuthState({ status: 'unauthenticated', error: null });
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [checkSession]);

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthState((prev) => ({ ...prev, error: null }));

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        setAuthState({
          status: 'authenticated',
          error: null,
          role: data.role,
        });
        setPassword('');
      } else {
        setAuthState({
          status: 'unauthenticated',
          error: data.error || '인증에 실패했습니다.',
        });
      }
    } catch {
      setAuthState({
        status: 'unauthenticated',
        error: '서버 연결에 실패했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'DELETE',
        credentials: 'include',
      });
    } finally {
      // 다른 탭에 로그아웃 알림
      localStorage.setItem('admin_logout', Date.now().toString());
      localStorage.removeItem('admin_logout');

      setAuthState({ status: 'unauthenticated', error: null });
      router.push('/');
    }
  };

  // 로딩 중
  if (authState.status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 w-12 h-12 rounded-full bg-blue-500/10 blur-xl animate-pulse" />
          </div>
          <p className="text-blue-400/80 text-sm font-medium">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증됨 - 자식 컴포넌트 표시
  if (authState.status === 'authenticated') {
    return (
      <AdminAuthContext.Provider value={{ role: authState.role, logout: handleLogout }}>
        {children}
      </AdminAuthContext.Provider>
    );
  }

  // 인증되지 않음 - 로그인 화면
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Korea NEWS</h1>
          <p className="text-slate-400 mt-1">관리자 영역</p>
        </div>

        {/* 비밀번호 입력 폼 */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* 에러 메시지 */}
            {authState.error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authState.error}</span>
              </div>
            )}

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                관리자 비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  autoFocus
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
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
              disabled={isSubmitting || !password}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-blue-600/50 disabled:to-blue-500/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  확인 중...
                </>
              ) : (
                "로그인"
              )}
            </button>
          </form>
        </div>

        {/* 푸터 */}
        <p className="text-center text-xs text-slate-500 mt-6">
          © {new Date().getFullYear()} Korea NEWS. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// 인증 컨텍스트 (하위 컴포넌트에서 사용)
interface AdminAuthContextValue {
  role?: string;
  logout: () => Promise<void>;
}

const AdminAuthContext = React.createContext<AdminAuthContextValue | null>(null);

export function useAdminAuth() {
  const context = React.useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthGuard');
  }
  return context;
}

// 로그아웃 버튼 컴포넌트
export function AdminLogoutButton({ className = '' }: { className?: string }) {
  const { logout } = useAdminAuth();

  return (
    <button
      onClick={logout}
      className={`flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors ${className}`}
      aria-label="로그아웃"
    >
      <LogOut className="w-4 h-4" />
      <span className="text-sm">로그아웃</span>
    </button>
  );
}
