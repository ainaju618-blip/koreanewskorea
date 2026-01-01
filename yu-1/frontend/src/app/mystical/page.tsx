'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function MysticalPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
    setViewCount(Math.floor(Math.random() * 5000) + 8000);
  }, []);

  const handleQuickFortune = () => {
    const randomCategory = Math.floor(Math.random() * 9) + 1;
    router.push(`/divination?category=${randomCategory}&quick=true`);
  };

  return (
    <div className="min-h-screen bg-dark-stars relative overflow-hidden">
      {/* 64괘가 떠다니는 효과 - 왼쪽 */}
      <div className="absolute top-[15%] left-[8%] flex flex-col gap-1 animate-float opacity-30">
        <div className="w-10 h-2 bg-gradient-to-r from-amber-400 to-amber-600 rounded-sm shadow-lg shadow-amber-500/20" />
        <div className="w-10 h-2 bg-gradient-to-r from-amber-400 to-amber-600 rounded-sm shadow-lg shadow-amber-500/20" />
        <div className="flex gap-1">
          <div className="w-4 h-2 bg-gradient-to-r from-amber-400 to-amber-600 rounded-sm" />
          <div className="w-4 h-2 bg-gradient-to-r from-amber-400 to-amber-600 rounded-sm" />
        </div>
      </div>

      {/* 64괘가 떠다니는 효과 - 오른쪽 */}
      <div className="absolute top-[25%] right-[10%] flex flex-col gap-1 animate-float-delayed opacity-20">
        <div className="flex gap-1">
          <div className="w-4 h-2 bg-gradient-to-r from-amber-300 to-amber-500 rounded-sm" />
          <div className="w-4 h-2 bg-gradient-to-r from-amber-300 to-amber-500 rounded-sm" />
        </div>
        <div className="w-10 h-2 bg-gradient-to-r from-amber-300 to-amber-500 rounded-sm shadow-lg shadow-amber-400/20" />
        <div className="w-10 h-2 bg-gradient-to-r from-amber-300 to-amber-500 rounded-sm shadow-lg shadow-amber-400/20" />
      </div>

      {/* 64괘가 떠다니는 효과 - 하단 왼쪽 */}
      <div className="absolute bottom-[20%] left-[15%] flex flex-col gap-1 animate-float-slow opacity-15">
        <div className="w-10 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-sm" />
        <div className="flex gap-1">
          <div className="w-4 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-sm" />
          <div className="w-4 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-sm" />
        </div>
        <div className="w-10 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-sm" />
      </div>

      {/* 64괘가 떠다니는 효과 - 하단 오른쪽 */}
      <div className="absolute bottom-[30%] right-[12%] flex flex-col gap-1 animate-float opacity-10">
        <div className="flex gap-1">
          <div className="w-4 h-2 bg-gradient-to-r from-orange-400 to-amber-500 rounded-sm" />
          <div className="w-4 h-2 bg-gradient-to-r from-orange-400 to-amber-500 rounded-sm" />
        </div>
        <div className="flex gap-1">
          <div className="w-4 h-2 bg-gradient-to-r from-orange-400 to-amber-500 rounded-sm" />
          <div className="w-4 h-2 bg-gradient-to-r from-orange-400 to-amber-500 rounded-sm" />
        </div>
        <div className="w-10 h-2 bg-gradient-to-r from-orange-400 to-amber-500 rounded-sm" />
      </div>

      {/* 중앙 콘텐츠 */}
      <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center relative z-10">
        {/* 한자 타이틀 */}
        <h1 className={`text-5xl md:text-7xl lg:text-8xl font-black mb-4 bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-2xl transition-all duration-1000 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          易經占卜
        </h1>

        {/* 한글 부제 */}
        <p className={`text-xl md:text-2xl text-white/60 mb-8 font-light tracking-[0.3em] drop-shadow-lg transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          하늘의 뜻을 묻다
        </p>

        {/* 태극 심볼 */}
        <div className={`text-6xl md:text-7xl mb-10 animate-spin-slow transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          ☯
        </div>

        {/* 메인 버튼 */}
        <button
          onClick={handleQuickFortune}
          className={`px-12 md:px-16 py-6 md:py-8 bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-xl md:text-2xl font-bold text-amber-300 rounded-2xl shadow-2xl shadow-amber-500/10 hover:shadow-amber-500/20 hover:scale-105 transition-all duration-500 border-2 border-amber-500/30 hover:border-amber-400/50 backdrop-blur-sm ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <span className="mr-2">🎴</span> 괘 뽑기
        </button>

        {/* 카테고리 버튼들 */}
        <div className={`flex flex-wrap justify-center gap-3 mt-8 max-w-md transition-all duration-1000 delay-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => router.push('/divination?category=2')}
            className="px-6 py-3 bg-white/5 backdrop-blur-md text-white/70 rounded-xl border border-white/10 hover:bg-white/10 hover:border-amber-400/30 hover:text-white transition-all duration-300"
          >
            💫 연애
          </button>
          <button
            onClick={() => router.push('/divination?category=1')}
            className="px-6 py-3 bg-white/5 backdrop-blur-md text-white/70 rounded-xl border border-white/10 hover:bg-white/10 hover:border-amber-400/30 hover:text-white transition-all duration-300"
          >
            💰 재물
          </button>
          <button
            onClick={() => router.push('/divination?category=3')}
            className="px-6 py-3 bg-white/5 backdrop-blur-md text-white/70 rounded-xl border border-white/10 hover:bg-white/10 hover:border-amber-400/30 hover:text-white transition-all duration-300"
          >
            💼 직장
          </button>
          <button
            onClick={() => router.push('/divination?category=4')}
            className="px-6 py-3 bg-white/5 backdrop-blur-md text-white/70 rounded-xl border border-white/10 hover:bg-white/10 hover:border-amber-400/30 hover:text-white transition-all duration-300"
          >
            📚 학업
          </button>
        </div>

        {/* 소셜 증명 */}
        <p className={`mt-12 text-sm text-white/30 tracking-wider transition-all duration-1000 delay-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          오늘 {viewCount.toLocaleString()}명이 천명을 물었습니다
        </p>

        {/* 하단 링크 */}
        <button
          onClick={() => router.push('/')}
          className={`mt-4 text-xs text-white/20 hover:text-white/50 underline transition-all duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          메인으로 돌아가기
        </button>
      </div>

      {/* 스타일 */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 7s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-float-slow {
          animation: float 8s ease-in-out infinite;
          animation-delay: 2s;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
