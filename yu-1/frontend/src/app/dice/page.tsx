'use client';

import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import { useState } from 'react';

// Three.js는 SSR 비활성화 필요
const Dice3D = dynamic(() => import('@/components/Dice3D'), {
  ssr: false,
  loading: () => (
    <div className="w-64 h-64 flex items-center justify-center">
      <span className="text-4xl animate-spin">🎲</span>
    </div>
  ),
});

export default function DiceDemoPage() {
  const [result, setResult] = useState<{
    trigram: { name: string; symbol: string; hanja: string; meaning: string };
    yaoLines: boolean[];
  } | null>(null);

  const handleComplete = (
    trigram: { name: string; symbol: string; hanja: string; meaning: string },
    yaoLines: boolean[]
  ) => {
    setResult({ trigram, yaoLines });
    console.log('점괘 결과:', trigram, yaoLines);
  };

  return (
    <div className="min-h-screen bg-dark-stars">
      <Header />

      <main className="relative z-10 max-w-lg mx-auto px-4 py-6">
        {/* 페이지 제목 */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            🎲 팔괘 주사위
          </h1>
          <p className="text-gray-400 text-sm">
            Three.js 3D 정팔면체 주사위
          </p>
        </div>

        {/* 주사위 컴포넌트 */}
        <div className="card-fortune rounded-2xl p-6 flex justify-center">
          <Dice3D onComplete={handleComplete} />
        </div>

        {/* 결과 표시 */}
        {result && (
          <div className="mt-6 card-fortune rounded-2xl p-6">
            <h2 className="text-lg font-bold text-amber-400 mb-4 text-center">
              점괘 결과
            </h2>

            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="text-center">
                <span className="text-5xl animate-pulse">
                  {result.trigram.symbol}
                </span>
                <p className="text-xl font-bold text-white mt-2">
                  {result.trigram.name}괘 ({result.trigram.hanja})
                </p>
                <p className="text-purple-300">{result.trigram.meaning}</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-2">육효 구성:</p>
              <div className="flex justify-center gap-2">
                {result.yaoLines.map((isYang, i) => (
                  <div
                    key={i}
                    className={`
                      w-10 h-10 flex items-center justify-center
                      rounded-lg text-xl font-bold
                      ${isYang
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                      }
                    `}
                  >
                    {isYang ? '⚊' : '⚋'}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                (아래에서 위로: 1효 → 6효)
              </p>
            </div>
          </div>
        )}

        {/* 설명 */}
        <div className="mt-6 text-center text-gray-500 text-xs space-y-1">
          <p>☰건 ☱태 ☲이 ☳진 ☴손 ☵감 ☶간 ☷곤</p>
          <p>Three.js + React Three Fiber</p>
          <p>정팔면체(D8) 3D 렌더링</p>
        </div>
      </main>
    </div>
  );
}
