'use client';

import { useState, useEffect } from 'react';

interface SignupPageProps {
  onBack?: () => void;
  onSignup?: (data: SignupData) => void;
  onLogin?: () => void;
  onViewTerms?: (type: 'service' | 'privacy') => void;
}

interface SignupData {
  email: string;
  password: string;
  nickname: string;
  agreements: {
    all: boolean;
    terms: boolean;
    privacy: boolean;
  };
}

export default function SignupPage({
  onBack,
  onSignup,
  onLogin,
  onViewTerms,
}: SignupPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacy: false,
  });

  // Handle "all agree" checkbox
  useEffect(() => {
    if (agreements.terms && agreements.privacy) {
      setAgreements((prev) => ({ ...prev, all: true }));
    } else {
      setAgreements((prev) => ({ ...prev, all: false }));
    }
  }, [agreements.terms, agreements.privacy]);

  const handleAllAgree = (checked: boolean) => {
    setAgreements({
      all: checked,
      terms: checked,
      privacy: checked,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignup?.({
      email,
      password,
      nickname,
      agreements,
    });
  };

  const isFormValid =
    email &&
    password &&
    confirmPassword &&
    password === confirmPassword &&
    nickname &&
    agreements.terms &&
    agreements.privacy;

  return (
    <div className="w-full max-w-[480px] flex flex-col min-h-screen bg-[#f5f7f8] dark:bg-[#101722] mx-auto">
      {/* Header */}
      <header className="flex items-center px-4 py-3 sticky top-0 z-10 bg-[#f5f7f8]/95 dark:bg-[#101722]/95 backdrop-blur-sm">
        <button
          type="button"
          onClick={onBack}
          className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-[#111418] dark:text-white"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em] text-[#111418] dark:text-white pr-10">
          회원가입
        </h1>
      </header>

      {/* Main Form */}
      <main className="flex-1 px-4 py-2 pb-8 flex flex-col gap-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email Input */}
          <div className="flex flex-col gap-2">
            <label className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal ml-1">
              이메일
            </label>
            <div className="relative flex items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#3c83f6]/50 border border-[#dbdfe6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#3c83f6] h-12 placeholder:text-[#9ca3af] dark:placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal transition-all"
                placeholder="example@email.com"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-2">
            <label className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal ml-1">
              비밀번호
            </label>
            <div className="relative flex w-full flex-1 items-stretch rounded-lg">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#3c83f6]/50 border border-[#dbdfe6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#3c83f6] h-12 placeholder:text-[#9ca3af] dark:placeholder:text-gray-500 p-[15px] pr-12 text-base font-normal leading-normal transition-all"
                placeholder="비밀번호를 입력해주세요"
              />
              <div className="absolute right-0 top-0 h-full flex items-center pr-3 text-[#9ca3af] dark:text-gray-400">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer hover:text-[#3c83f6] transition-colors"
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>
            <p className="text-[#60708a] dark:text-gray-400 text-xs font-normal leading-normal px-1">
              8자 이상, 영문 대소문자 및 특수문자 포함
            </p>
          </div>

          {/* Confirm Password Input */}
          <div className="flex flex-col gap-2">
            <label className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal ml-1">
              비밀번호 확인
            </label>
            <div className="relative flex w-full flex-1 items-stretch rounded-lg">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#3c83f6]/50 border border-[#dbdfe6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#3c83f6] h-12 placeholder:text-[#9ca3af] dark:placeholder:text-gray-500 p-[15px] pr-12 text-base font-normal leading-normal transition-all"
                placeholder="비밀번호를 다시 입력해주세요"
              />
              <div className="absolute right-0 top-0 h-full flex items-center pr-3 text-[#9ca3af] dark:text-gray-400">
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="cursor-pointer hover:text-[#3c83f6] transition-colors"
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {showConfirmPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-xs font-normal leading-normal px-1">
                비밀번호가 일치하지 않습니다
              </p>
            )}
          </div>

          {/* Nickname Input */}
          <div className="flex flex-col gap-2">
            <label className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal ml-1">
              닉네임
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#3c83f6]/50 border border-[#dbdfe6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#3c83f6] h-12 placeholder:text-[#9ca3af] dark:placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal transition-all"
                placeholder="앱에서 사용할 닉네임을 입력하세요"
              />
            </div>
          </div>

          {/* Agreements */}
          <div className="flex flex-col gap-3 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            {/* Select All */}
            <div className="flex items-center gap-3 px-1">
              <input
                type="checkbox"
                id="all-agree"
                checked={agreements.all}
                onChange={(e) => handleAllAgree(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-[#3c83f6] focus:ring-[#3c83f6] dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
              />
              <label
                htmlFor="all-agree"
                className="text-[#111418] dark:text-white text-base font-bold cursor-pointer select-none"
              >
                전체 약관 동의
              </label>
            </div>

            {/* Term 1 - Service Terms */}
            <div className="flex items-center gap-3 px-1">
              <input
                type="checkbox"
                id="term1"
                checked={agreements.terms}
                onChange={(e) =>
                  setAgreements((prev) => ({ ...prev, terms: e.target.checked }))
                }
                className="h-5 w-5 rounded border-gray-300 text-[#3c83f6] focus:ring-[#3c83f6] dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
              />
              <div className="flex flex-1 items-center justify-between">
                <label
                  htmlFor="term1"
                  className="text-[#374151] dark:text-gray-300 text-sm cursor-pointer select-none flex-1"
                >
                  <span className="text-[#3c83f6] font-medium">(필수)</span> 이용약관 동의
                </label>
                <button
                  type="button"
                  onClick={() => onViewTerms?.('service')}
                  className="text-[#9ca3af] hover:text-[#111418] dark:hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Term 2 - Privacy Policy */}
            <div className="flex items-center gap-3 px-1">
              <input
                type="checkbox"
                id="term2"
                checked={agreements.privacy}
                onChange={(e) =>
                  setAgreements((prev) => ({ ...prev, privacy: e.target.checked }))
                }
                className="h-5 w-5 rounded border-gray-300 text-[#3c83f6] focus:ring-[#3c83f6] dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
              />
              <div className="flex flex-1 items-center justify-between">
                <label
                  htmlFor="term2"
                  className="text-[#374151] dark:text-gray-300 text-sm cursor-pointer select-none flex-1"
                >
                  <span className="text-[#3c83f6] font-medium">(필수)</span> 개인정보처리방침 동의
                </label>
                <button
                  type="button"
                  onClick={() => onViewTerms?.('privacy')}
                  className="text-[#9ca3af] hover:text-[#111418] dark:hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-[#f5f7f8] dark:bg-[#101722] p-4 pt-2 border-t border-transparent z-10 pb-8">
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={`flex w-full min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 text-base font-bold tracking-[0.015em] transition-all shadow-md ${
            isFormValid
              ? 'bg-[#3c83f6] text-white hover:bg-blue-600 active:scale-[0.98] shadow-[#3c83f6]/20'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          <span className="truncate">회원가입</span>
        </button>
        <div className="mt-4 flex justify-center text-sm">
          <span className="text-[#60708a] dark:text-gray-400 mr-1">
            이미 계정이 있으신가요?
          </span>
          <button
            type="button"
            onClick={onLogin}
            className="text-[#3c83f6] font-bold hover:underline"
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}
