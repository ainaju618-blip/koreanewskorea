'use client';

import { useState } from 'react';
import Link from 'next/link';

interface LoginPageProps {
  onBack?: () => void;
  onLogin?: (email: string, password: string, keepLogin: boolean) => void;
  onSocialLogin?: (provider: 'kakao' | 'naver' | 'google') => void;
  onForgotPassword?: () => void;
  onSignup?: () => void;
}

export default function LoginPage({
  onBack,
  onLogin,
  onSocialLogin,
  onForgotPassword,
  onSignup,
}: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLogin, setKeepLogin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin?.(email, password, keepLogin);
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden bg-[#f5f7f8] dark:bg-[#101722] max-w-[480px] mx-auto shadow-sm">
      {/* Header / Navigation */}
      <div className="flex items-center p-4 justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-[#111418] dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
      </div>

      {/* Logo Section */}
      <div className="px-6 pt-4 pb-8 text-center">
        <h1 className="font-['Public_Sans'] text-[#3c83f6] tracking-tight text-[32px] font-bold leading-tight">
          KOREA NEWS
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">
          뉴스룸에 오신 것을 환영합니다
        </p>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 pb-4">
        {/* Email Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[#111418] dark:text-gray-200 text-sm font-medium">
            이메일
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-4 text-gray-400 z-10 text-[20px]">
              mail
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex w-full rounded-xl border border-[#dbdfe6] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#3c83f6]/50 focus:border-[#3c83f6] h-12 pl-11 pr-4 text-base font-normal leading-normal placeholder:text-gray-400 transition-all"
              placeholder="example@email.com"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[#111418] dark:text-gray-200 text-sm font-medium">
            비밀번호
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-4 text-gray-400 z-10 text-[20px]">
              lock
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex w-full rounded-xl border border-[#dbdfe6] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#3c83f6]/50 focus:border-[#3c83f6] h-12 pl-11 pr-12 text-base font-normal leading-normal placeholder:text-gray-400 transition-all"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>
        </div>

        {/* Checkbox */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              id="keep-login"
              checked={keepLogin}
              onChange={(e) => setKeepLogin(e.target.checked)}
              className="h-5 w-5 rounded border-[#dbdfe6] border-2 bg-transparent text-[#3c83f6] checked:bg-[#3c83f6] checked:border-[#3c83f6] focus:ring-0 focus:ring-offset-0 focus:border-[#dbdfe6] focus:outline-none transition-all cursor-pointer"
            />
          </div>
          <label
            htmlFor="keep-login"
            className="text-[#111418] dark:text-gray-300 text-sm font-normal leading-normal flex-1 cursor-pointer select-none"
          >
            로그인 상태 유지
          </label>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-xl bg-[#3c83f6] py-3.5 px-4 text-white font-bold text-base hover:bg-blue-600 active:scale-[0.98] transition-all shadow-sm"
        >
          로그인
        </button>
      </form>

      {/* Links */}
      <div className="flex items-center justify-center gap-6 pb-6 text-sm text-gray-500 dark:text-gray-400">
        <button
          type="button"
          onClick={onForgotPassword}
          className="hover:text-[#3c83f6] transition-colors"
        >
          비밀번호 찾기
        </button>
        <div className="h-3 w-px bg-gray-300 dark:bg-gray-700" />
        <button
          type="button"
          onClick={onSignup}
          className="hover:text-[#3c83f6] transition-colors font-medium text-[#3c83f6]"
        >
          회원가입
        </button>
      </div>

      {/* Divider */}
      <div className="px-6 flex items-center gap-3 pb-6">
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        <p className="text-xs text-gray-400 font-medium">또는</p>
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Social Login Buttons */}
      <div className="flex flex-col gap-3 px-6 pb-8">
        {/* Kakao */}
        <button
          type="button"
          onClick={() => onSocialLogin?.('kakao')}
          className="relative flex w-full items-center justify-center rounded-xl bg-[#FEE500] py-3.5 px-4 text-[#191919] font-medium text-base hover:bg-[#fadd00] transition-colors shadow-sm"
        >
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 3C7.58 3 4 5.79 4 9.24C4 11.28 5.34 13.1 7.42 14.24C7.26 14.8 6.64 16.92 6.53 17.31C6.46 17.6 6.75 17.78 6.96 17.64C7.78 17.14 10.98 15.02 11.36 14.76C11.57 14.78 11.78 14.8 12 14.8C16.42 14.8 20 12.01 20 8.56C20 5.11 16.42 3 12 3Z" />
            </svg>
          </div>
          카카오로 시작하기
        </button>

        {/* Naver */}
        <button
          type="button"
          onClick={() => onSocialLogin?.('naver')}
          className="relative flex w-full items-center justify-center rounded-xl bg-[#03C75A] py-3.5 px-4 text-white font-medium text-base hover:bg-[#02b351] transition-colors shadow-sm"
        >
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M16.035 20.312V9.312L7.965 20.312H4V3.688H7.965V14.688L16.035 3.688H20V20.312H16.035Z" />
            </svg>
          </div>
          네이버로 시작하기
        </button>

        {/* Google */}
        <button
          type="button"
          onClick={() => onSocialLogin?.('google')}
          className="relative flex w-full items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-[#dbdfe6] dark:border-gray-700 py-3.5 px-4 text-[#111418] dark:text-white font-medium text-base hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </div>
          Google로 시작하기
        </button>
      </div>

      {/* Bottom Spacer */}
      <div className="h-5" />
    </div>
  );
}
