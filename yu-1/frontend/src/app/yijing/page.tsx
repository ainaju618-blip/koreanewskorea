'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function YijingPage() {
  const router = useRouter();
  const [viewCount, setViewCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    // 랜덤 조회수 (실제로는 API에서 가져옴)
    setViewCount(Math.floor(Math.random() * 5000) + 8000);
  }, []);

  const handleQuickFortune = () => {
    const randomCategory = Math.floor(Math.random() * 9) + 1;
    router.push(`/divination?category=${randomCategory}&quick=true`);
  };

  return (
    <div className="min-h-screen bg-dark-stars relative overflow-hidden">
      {/* 우주 배경 효과 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.1),transparent),radial-gradient(circle_at_80%_80%,rgba(245,158,11,0.05),transparent)]" />

      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center relative z-10">
        {/* 대형 타이포 */}
        <h1 className={`text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-2xl transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-7xl md:text-9xl">☯️</span> 주역점
        </h1>

        <p className={`text-2xl md:text-3xl text-white/80 font-bold mb-10 tracking-[0.2em] transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          2025년 네 미래를 봐
        </p>

        {/* 버튼 스타일 */}
        <div className={`space-y-4 w-full max-w-md mx-auto transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button
            onClick={handleQuickFortune}
            className="w-full py-8 px-8 bg-white/5 backdrop-blur-xl text-2xl font-black text-white rounded-3xl border-2 border-amber-500/30 hover:border-amber-400/50 hover:bg-white/10 shadow-2xl shadow-amber-500/10 hover:scale-105 transition-all duration-300 active:scale-95"
          >
            <span className="block text-3xl mb-1">✨</span>
            지금 괘 뽑기 (무료)
          </button>

          <div className="flex gap-3 text-lg text-white/90">
            <button
              onClick={() => router.push('/divination?category=2')}
              className="flex-1 p-5 bg-white/5 backdrop-blur rounded-2xl border border-white/10 hover:bg-white/10 hover:border-amber-500/30 hover:scale-105 transition-all duration-300 active:scale-95"
            >
              <span className="block text-2xl mb-1">💫</span>
              연애운
            </button>
            <button
              onClick={() => router.push('/divination?category=1')}
              className="flex-1 p-5 bg-white/5 backdrop-blur rounded-2xl border border-white/10 hover:bg-white/10 hover:border-amber-500/30 hover:scale-105 transition-all duration-300 active:scale-95"
            >
              <span className="block text-2xl mb-1">💰</span>
              재물운
            </button>
          </div>

          <div className="flex gap-3 text-lg text-white/90">
            <button
              onClick={() => router.push('/divination?category=3')}
              className="flex-1 p-5 bg-white/5 backdrop-blur rounded-2xl border border-white/10 hover:bg-white/10 hover:border-amber-500/30 hover:scale-105 transition-all duration-300 active:scale-95"
            >
              <span className="block text-2xl mb-1">💼</span>
              직장운
            </button>
            <button
              onClick={() => router.push('/divination?category=4')}
              className="flex-1 p-5 bg-white/5 backdrop-blur rounded-2xl border border-white/10 hover:bg-white/10 hover:border-amber-500/30 hover:scale-105 transition-all duration-300 active:scale-95"
            >
              <span className="block text-2xl mb-1">📚</span>
              학업운
            </button>
          </div>
        </div>

        {/* 소셜 증명 */}
        <p className={`mt-12 text-lg text-white/50 font-mono tracking-wider transition-all duration-1000 delay-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          {viewCount.toLocaleString()}명이 오늘 점쳐봤어요 🔥
        </p>

        {/* 하단 링크 */}
        <button
          onClick={() => router.push('/')}
          className={`mt-6 text-sm text-white/40 hover:text-white/70 underline transition-all duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          클래식 버전으로 보기
        </button>
      </div>
    </div>
  );
}
