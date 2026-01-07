'use client';

import React from 'react';
import Link from 'next/link';
import ResponsiveContainer from './ResponsiveContainer';

interface WeatherInfo {
  icon: string;
  location: string;
  temperature: string;
  condition: string;
}

interface UtilityBarProps {
  date?: string;
  weather?: WeatherInfo;
  showLogin?: boolean;
  showSignup?: boolean;
  isLoggedIn?: boolean;
  userName?: string;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  onLogoutClick?: () => void;
  onProfileClick?: () => void;
  loginHref?: string;
  signupHref?: string;
  profileHref?: string;
  className?: string;
}

/**
 * UtilityBar - Top utility bar with date, weather, login/signup
 * Visible on desktop (hidden on mobile via parent control)
 */
export default function UtilityBar({
  date,
  weather,
  showLogin = true,
  showSignup = true,
  isLoggedIn = false,
  userName,
  onLoginClick,
  onSignupClick,
  onLogoutClick,
  onProfileClick,
  loginHref = '/login',
  signupHref = '/signup',
  profileHref = '/mypage',
  className = '',
}: UtilityBarProps) {
  // Format current date if not provided
  const displayDate = date || formatKoreanDate(new Date());

  return (
    <div
      className={`bg-white dark:bg-[#1a2230] border-b border-[#f0f2f5] dark:border-gray-800 ${className}`}
    >
      <ResponsiveContainer>
        <div className="h-10 flex items-center justify-between text-xs sm:text-sm text-[#60708a] dark:text-gray-400">
          {/* Left: Date and Weather */}
          <div className="flex items-center gap-4">
            <span>{displayDate}</span>
            {weather && (
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">
                  {weather.icon}
                </span>
                <span>
                  {weather.location} {weather.temperature} {weather.condition}
                </span>
              </div>
            )}
          </div>

          {/* Right: Auth Links */}
          <div className="flex items-center gap-4 font-medium">
            {isLoggedIn ? (
              <>
                {userName && (
                  <span className="text-[#111318] dark:text-white">
                    {userName}
                  </span>
                )}
                {profileHref ? (
                  <Link
                    href={profileHref}
                    className="hover:text-primary transition-colors"
                    onClick={onProfileClick}
                  >
                    마이페이지
                  </Link>
                ) : (
                  <button
                    onClick={onProfileClick}
                    className="hover:text-primary transition-colors"
                  >
                    마이페이지
                  </button>
                )}
                <Divider />
                <button
                  onClick={onLogoutClick}
                  className="hover:text-primary transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                {showLogin && (
                  loginHref ? (
                    <Link
                      href={loginHref}
                      className="hover:text-primary transition-colors"
                      onClick={onLoginClick}
                    >
                      로그인
                    </Link>
                  ) : (
                    <button
                      onClick={onLoginClick}
                      className="hover:text-primary transition-colors"
                    >
                      로그인
                    </button>
                  )
                )}
                {showLogin && showSignup && <Divider />}
                {showSignup && (
                  signupHref ? (
                    <Link
                      href={signupHref}
                      className="hover:text-primary transition-colors"
                      onClick={onSignupClick}
                    >
                      회원가입
                    </Link>
                  ) : (
                    <button
                      onClick={onSignupClick}
                      className="hover:text-primary transition-colors"
                    >
                      회원가입
                    </button>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Divider component for separating auth links
 */
function Divider() {
  return (
    <span className="w-[1px] h-3 bg-gray-300 dark:bg-gray-700" />
  );
}

/**
 * Format date in Korean format (Asia/Seoul timezone)
 */
function formatKoreanDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  };

  const formatter = new Intl.DateTimeFormat('ko-KR', options);
  const parts = formatter.formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  const weekday = parts.find((p) => p.type === 'weekday')?.value;

  return `${year} ${month} ${day} (${weekday})`;
}
