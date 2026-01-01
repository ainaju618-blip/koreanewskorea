'use client';

import { useState, useEffect, useCallback } from 'react';

// 8괘 (팔괘) 유니코드 심볼
const TRIGRAMS = [
  { name: '건', symbol: '☰', hanja: '乾', meaning: '천(天)' },
  { name: '태', symbol: '☱', hanja: '兌', meaning: '택(澤)' },
  { name: '이', symbol: '☲', hanja: '離', meaning: '화(火)' },
  { name: '진', symbol: '☳', hanja: '震', meaning: '뇌(雷)' },
  { name: '손', symbol: '☴', hanja: '巽', meaning: '풍(風)' },
  { name: '감', symbol: '☵', hanja: '坎', meaning: '수(水)' },
  { name: '간', symbol: '☶', hanja: '艮', meaning: '산(山)' },
  { name: '곤', symbol: '☷', hanja: '坤', meaning: '지(地)' },
];

interface OctahedronDiceProps {
  onComplete?: (trigram: typeof TRIGRAMS[0], yaoLines: boolean[]) => void;
  autoStart?: boolean;
  duration?: number;
}

export default function OctahedronDice({
  onComplete,
  autoStart = false,
  duration = 2500
}: OctahedronDiceProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [selectedTrigram, setSelectedTrigram] = useState<typeof TRIGRAMS[0] | null>(null);
  const [yaoLines, setYaoLines] = useState<boolean[]>([]);
  const [rotationX, setRotationX] = useState(-20);
  const [rotationY, setRotationY] = useState(25);
  const [phase, setPhase] = useState<'idle' | 'rolling' | 'revealing' | 'complete'>('idle');
  const [revealedLines, setRevealedLines] = useState(0);

  // 주사위 굴리기
  const rollDice = useCallback(() => {
    if (isRolling) return;

    setIsRolling(true);
    setPhase('rolling');
    setSelectedTrigram(null);
    setYaoLines([]);
    setRevealedLines(0);

    let frame = 0;
    let speedX = 25 + Math.random() * 15;
    let speedY = 20 + Math.random() * 10;

    // 빠르게 위아래로 굴리기
    const rollInterval = setInterval(() => {
      frame++;
      setRotationX(prev => prev + speedX);
      setRotationY(prev => prev + speedY * 0.3);

      // 점점 느려지기
      speedX *= 0.96;
      speedY *= 0.96;

      if (speedX < 1) {
        clearInterval(rollInterval);

        // 최종 괘 선택
        const randomIndex = Math.floor(Math.random() * TRIGRAMS.length);
        const trigram = TRIGRAMS[randomIndex];
        setSelectedTrigram(trigram);

        // 6효 생성
        const lines: boolean[] = [];
        for (let i = 0; i < 6; i++) {
          lines.push(Math.random() > 0.48);
        }
        setYaoLines(lines);

        setPhase('revealing');
        setIsRolling(false);
      }
    }, 30);

  }, [isRolling]);

  // 효 순차 공개
  useEffect(() => {
    if (phase === 'revealing' && revealedLines < 6) {
      const timer = setTimeout(() => {
        setRevealedLines(prev => prev + 1);
      }, 250);
      return () => clearTimeout(timer);
    } else if (phase === 'revealing' && revealedLines >= 6) {
      setPhase('complete');
      if (onComplete && selectedTrigram) {
        onComplete(selectedTrigram, yaoLines);
      }
    }
  }, [phase, revealedLines, onComplete, selectedTrigram, yaoLines]);

  // 자동 시작
  useEffect(() => {
    if (autoStart && phase === 'idle') {
      const timer = setTimeout(rollDice, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, phase, rollDice]);

  const reset = () => {
    setPhase('idle');
    setSelectedTrigram(null);
    setYaoLines([]);
    setRevealedLines(0);
    setRotationX(-20);
    setRotationY(25);
  };

  // D8 주사위 면 크기
  const size = 70;

  return (
    <div className="flex flex-col items-center justify-center py-6">
      {/* 상태 메시지 */}
      <div className="mb-4 text-center h-8">
        {phase === 'idle' && (
          <p className="text-purple-300 animate-pulse">주사위를 굴려 점괘를 뽑으세요</p>
        )}
        {phase === 'rolling' && (
          <p className="text-amber-300 animate-pulse">천기를 읽는 중... 🔮</p>
        )}
        {phase === 'revealing' && (
          <p className="text-cyan-300">효를 뽑는 중... ({revealedLines}/6)</p>
        )}
        {phase === 'complete' && selectedTrigram && (
          <p className="text-xl font-bold text-amber-400">
            {selectedTrigram.symbol} {selectedTrigram.name}괘 ({selectedTrigram.hanja})
          </p>
        )}
      </div>

      {/* D8 정팔면체 주사위 */}
      <div
        className="relative mb-6"
        style={{
          width: size * 2.5,
          height: size * 2.5,
          perspective: '800px',
        }}
      >
        <div
          className="d8-dice absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
            transition: isRolling ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {/* 상단 피라미드 4면 */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={`top-${i}`}
              className="d8-face absolute"
              style={{
                width: 0,
                height: 0,
                left: '50%',
                top: '50%',
                borderLeft: `${size}px solid transparent`,
                borderRight: `${size}px solid transparent`,
                borderBottom: `${size * 1.7}px solid`,
                borderBottomColor: `hsl(${220 + i * 30}, 70%, ${35 + i * 5}%)`,
                transformOrigin: '0 0',
                transform: `
                  translateX(-${size}px)
                  rotateY(${i * 90}deg)
                  rotateX(35deg)
                  translateZ(${size * 0.5}px)
                `,
                filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))',
              }}
            >
              <span
                className="absolute text-white font-bold"
                style={{
                  fontSize: `${size * 0.5}px`,
                  left: '0',
                  top: `${size * 0.5}px`,
                  transform: 'translateX(-50%) rotateX(180deg)',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                }}
              >
                {TRIGRAMS[i].symbol}
              </span>
            </div>
          ))}

          {/* 하단 피라미드 4면 */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={`bottom-${i}`}
              className="d8-face absolute"
              style={{
                width: 0,
                height: 0,
                left: '50%',
                top: '50%',
                borderLeft: `${size}px solid transparent`,
                borderRight: `${size}px solid transparent`,
                borderTop: `${size * 1.7}px solid`,
                borderTopColor: `hsl(${220 + i * 30}, 60%, ${25 + i * 5}%)`,
                transformOrigin: '0 0',
                transform: `
                  translateX(-${size}px)
                  rotateY(${i * 90 + 45}deg)
                  rotateX(-35deg)
                  translateZ(${size * 0.5}px)
                `,
                filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))',
              }}
            >
              <span
                className="absolute text-white font-bold"
                style={{
                  fontSize: `${size * 0.5}px`,
                  left: '0',
                  top: `-${size * 1.2}px`,
                  transform: 'translateX(-50%)',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                }}
              >
                {TRIGRAMS[i + 4].symbol}
              </span>
            </div>
          ))}
        </div>

        {/* 굴리는 중 빛 효과 */}
        {isRolling && (
          <>
            <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
            <div className="absolute inset-4 rounded-full bg-amber-500/10 animate-pulse" />
          </>
        )}
      </div>

      {/* 6효 표시 */}
      {(phase === 'revealing' || phase === 'complete') && (
        <div className="w-full max-w-xs mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-xs text-gray-500 mb-2 text-center">육효 (六爻)</p>
          <div className="flex flex-col-reverse gap-1">
            {yaoLines.map((isYang, i) => (
              <div
                key={i}
                className={`
                  flex items-center gap-2 transition-all duration-300
                  ${i < revealedLines ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                `}
              >
                <span className="text-xs text-gray-500 w-6">{i + 1}효</span>
                <div className={`
                  flex-1 h-6 flex items-center justify-center rounded
                  ${isYang
                    ? 'bg-amber-500/30 border border-amber-500/50'
                    : 'bg-blue-500/30 border border-blue-500/50'
                  }
                `}>
                  <span className="text-lg">
                    {isYang ? '⚊' : '⚋'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-3">
        {phase === 'idle' && (
          <button
            onClick={rollDice}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500
                       rounded-xl font-bold text-white shadow-lg shadow-purple-500/30
                       hover:scale-105 active:scale-95 transition-transform"
          >
            🎲 주사위 굴리기
          </button>
        )}

        {phase === 'complete' && (
          <>
            <button
              onClick={reset}
              className="px-5 py-2 bg-white/10 border border-white/20
                         rounded-lg text-white hover:bg-white/20 transition"
            >
              🔄 다시
            </button>
            <button
              onClick={() => onComplete?.(selectedTrigram!, yaoLines)}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500
                         rounded-lg font-bold text-white shadow-lg shadow-amber-500/30
                         hover:scale-105 transition-transform"
            >
              결과 보기 →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
