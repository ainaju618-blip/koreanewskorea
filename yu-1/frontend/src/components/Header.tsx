'use client';

import Link from 'next/link';
import { useState } from 'react';

interface HeaderProps {
  showHistory?: boolean;
}

export default function Header({ showHistory = true }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">☯️</span>
            <span className="font-bold text-lg text-white">
              주역점
            </span>
          </Link>

          {/* 우측 버튼들 */}
          <div className="flex items-center gap-2">
            {showHistory && (
              <Link
                href="/history"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 text-sm hover:bg-white/10 border border-white/10 transition"
              >
                <span>📜</span>
                <span>히스토리</span>
              </Link>
            )}

            {/* 메뉴 버튼 */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition"
            >
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* 드롭다운 메뉴 - 다크 테마 */}
        {menuOpen && (
          <div className="absolute right-4 top-14 bg-slate-800/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/10 py-2 w-48 animate-in fade-in slide-in-from-top-2">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-gray-200 hover:bg-white/10 transition"
              onClick={() => setMenuOpen(false)}
            >
              <span>🏠</span>
              <span>홈</span>
            </Link>
            <Link
              href="/divination"
              className="flex items-center gap-2 px-4 py-2 text-gray-200 hover:bg-white/10 transition"
              onClick={() => setMenuOpen(false)}
            >
              <span>🔮</span>
              <span>점괘 보기</span>
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-2 px-4 py-2 text-gray-200 hover:bg-white/10 transition"
              onClick={() => setMenuOpen(false)}
            >
              <span>📜</span>
              <span>히스토리</span>
            </Link>
            <hr className="my-2 border-white/10" />
            <div className="px-4 py-2 text-xs text-gray-500">
              v1.0.0 | 384효 × 250카테고리
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
