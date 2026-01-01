'use client';

import { useEffect, useRef } from 'react';

export default function IconPreviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <h1 className="text-2xl font-bold text-white text-center mb-8">
        파비콘 회전 애니메이션 비교
      </h1>

      <div className="max-w-4xl mx-auto space-y-12">

        {/* 1. CSS 2D 회전 */}
        <div className="bg-white/10 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-amber-400 mb-2">1. CSS 2D 회전</h2>
          <p className="text-gray-400 text-sm mb-6">단순 평면 회전 - 가볍고 빠름</p>

          <div className="flex justify-center gap-12">
            {/* 시계방향 */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 animate-spin-slow">
                <img src="/icon-transparent.svg" alt="icon" className="w-full h-full" />
              </div>
              <span className="text-sm text-gray-300">시계방향 (느림)</span>
            </div>

            {/* 반시계방향 빠름 */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 animate-spin-reverse">
                <img src="/icon-transparent.svg" alt="icon" className="w-full h-full" />
              </div>
              <span className="text-sm text-gray-300">반시계방향</span>
            </div>

            {/* 펄스 + 회전 */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 animate-spin-pulse">
                <img src="/icon-transparent.svg" alt="icon" className="w-full h-full" />
              </div>
              <span className="text-sm text-gray-300">펄스 + 회전</span>
            </div>

            {/* 시계2 + 반시계2 패턴 */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 animate-spin-pattern">
                <img src="/icon-transparent.svg" alt="icon" className="w-full h-full" />
              </div>
              <span className="text-sm text-gray-300">시계2+반시계2</span>
            </div>
          </div>
        </div>

        {/* 추천 패턴 - 대형 */}
        <div className="bg-gradient-to-r from-purple-500/20 to-amber-500/20 rounded-2xl p-8 border border-purple-500/30">
          <h2 className="text-xl font-bold text-amber-400 mb-2">추천: 시계 2바퀴 → 반시계 2바퀴</h2>
          <p className="text-gray-400 text-sm mb-6">점괘를 뽑을 때 사용하면 신비로운 느낌!</p>

          <div className="flex justify-center">
            <div className="w-40 h-40 animate-spin-pattern">
              <img src="/icon-purple.svg" alt="icon" className="w-full h-full drop-shadow-glow-strong" />
            </div>
          </div>
        </div>

        {/* 2. CSS 3D 회전 */}
        <div className="bg-white/10 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-amber-400 mb-2">2. CSS 3D 회전</h2>
          <p className="text-gray-400 text-sm mb-6">원근감 있는 3D 효과 - 입체적</p>

          <div className="flex justify-center gap-12">
            {/* Y축 회전 (좌우 뒤집기) */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 perspective-500">
                <div className="w-full h-full animate-flip-y preserve-3d">
                  <img src="/icon-transparent.svg" alt="icon" className="w-full h-full" />
                </div>
              </div>
              <span className="text-sm text-gray-300">Y축 (좌우)</span>
            </div>

            {/* X축 회전 (위아래 뒤집기) */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 perspective-500">
                <div className="w-full h-full animate-flip-x preserve-3d">
                  <img src="/icon-transparent.svg" alt="icon" className="w-full h-full" />
                </div>
              </div>
              <span className="text-sm text-gray-300">X축 (위아래)</span>
            </div>

            {/* 복합 3D 회전 */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 perspective-500">
                <div className="w-full h-full animate-rotate-3d preserve-3d">
                  <img src="/icon-transparent.svg" alt="icon" className="w-full h-full" />
                </div>
              </div>
              <span className="text-sm text-gray-300">복합 3D</span>
            </div>
          </div>
        </div>

        {/* 3. 부유 + 회전 (신비로운 느낌) */}
        <div className="bg-white/10 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-amber-400 mb-2">3. 부유 + 회전 (신비로운)</h2>
          <p className="text-gray-400 text-sm mb-6">떠다니는 느낌 + 빛나는 효과</p>

          <div className="flex justify-center gap-12">
            {/* 부유 */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 animate-float">
                <img src="/icon-purple.svg" alt="icon" className="w-full h-full drop-shadow-glow" />
              </div>
              <span className="text-sm text-gray-300">부유</span>
            </div>

            {/* 부유 + 느린 회전 */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 animate-float-spin">
                <img src="/icon-purple.svg" alt="icon" className="w-full h-full drop-shadow-glow" />
              </div>
              <span className="text-sm text-gray-300">부유 + 회전</span>
            </div>

            {/* 부유 + 3D + 빛 */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 perspective-500">
                <div className="w-full h-full animate-mystical preserve-3d">
                  <img src="/icon-purple.svg" alt="icon" className="w-full h-full drop-shadow-glow-strong" />
                </div>
              </div>
              <span className="text-sm text-gray-300">신비로운</span>
            </div>
          </div>
        </div>

        {/* 대형 미리보기 */}
        <div className="bg-white/10 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-amber-400 mb-6">대형 미리보기 (추천: 신비로운)</h2>

          <div className="flex justify-center">
            <div className="w-48 h-48 perspective-800">
              <div className="w-full h-full animate-mystical preserve-3d">
                <img
                  src="/icon-purple.svg"
                  alt="icon"
                  className="w-full h-full drop-shadow-glow-strong"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 홈으로 버튼 */}
        <div className="text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300 hover:bg-amber-500/30 transition"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>

      {/* CSS 애니메이션 스타일 */}
      <style jsx>{`
        /* 원근감 */
        .perspective-500 {
          perspective: 500px;
        }
        .perspective-800 {
          perspective: 800px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }

        /* 2D 회전 */
        .animate-spin-slow {
          animation: spin 1s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 0.8s linear infinite;
        }
        .animate-spin-pulse {
          animation: spin-pulse 0.6s ease-in-out infinite;
        }
        .animate-spin-pattern {
          animation: spin-pattern 2s ease-in-out infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes spin-pulse {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
        }
        /* 시계 2바퀴 → 반시계 2바퀴 */
        @keyframes spin-pattern {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(720deg); }
          50% { transform: rotate(720deg); }
          75% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }

        /* 3D 회전 */
        .animate-flip-y {
          animation: flip-y 1s ease-in-out infinite;
        }
        .animate-flip-x {
          animation: flip-x 1s ease-in-out infinite;
        }
        .animate-rotate-3d {
          animation: rotate-3d 1.5s ease-in-out infinite;
        }

        @keyframes flip-y {
          0%, 100% { transform: rotateY(0deg); }
          50% { transform: rotateY(180deg); }
        }
        @keyframes flip-x {
          0%, 100% { transform: rotateX(0deg); }
          50% { transform: rotateX(180deg); }
        }
        @keyframes rotate-3d {
          0% { transform: rotateX(0deg) rotateY(0deg); }
          25% { transform: rotateX(30deg) rotateY(90deg); }
          50% { transform: rotateX(0deg) rotateY(180deg); }
          75% { transform: rotateX(-30deg) rotateY(270deg); }
          100% { transform: rotateX(0deg) rotateY(360deg); }
        }

        /* 부유 효과 */
        .animate-float {
          animation: float 1s ease-in-out infinite;
        }
        .animate-float-spin {
          animation: float-spin 1.5s ease-in-out infinite;
        }
        .animate-mystical {
          animation: mystical 2s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-spin {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(180deg); }
        }
        @keyframes mystical {
          0%, 100% {
            transform: translateY(0px) rotateY(0deg) rotateX(5deg);
          }
          25% {
            transform: translateY(-10px) rotateY(90deg) rotateX(-5deg);
          }
          50% {
            transform: translateY(-20px) rotateY(180deg) rotateX(5deg);
          }
          75% {
            transform: translateY(-10px) rotateY(270deg) rotateX(-5deg);
          }
        }

        /* 빛나는 효과 */
        .drop-shadow-glow {
          filter: drop-shadow(0 0 10px rgba(124, 58, 237, 0.5));
        }
        .drop-shadow-glow-strong {
          filter: drop-shadow(0 0 15px rgba(124, 58, 237, 0.6))
                  drop-shadow(0 0 30px rgba(251, 191, 36, 0.4));
        }
      `}</style>
    </div>
  );
}
