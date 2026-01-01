'use client';

import { useRef, useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// 8괘 데이터
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

// 정팔면체 면 중심 좌표 및 방향
const FACE_POSITIONS = [
  // 상단 4면
  { pos: [0.5, 0.5, 0.5], rot: [0.615, 0.785, 0] },
  { pos: [-0.5, 0.5, 0.5], rot: [0.615, -0.785, 0] },
  { pos: [-0.5, 0.5, -0.5], rot: [0.615, -2.356, 0] },
  { pos: [0.5, 0.5, -0.5], rot: [0.615, 2.356, 0] },
  // 하단 4면
  { pos: [0.5, -0.5, 0.5], rot: [-0.615, 0.785, 0] },
  { pos: [-0.5, -0.5, 0.5], rot: [-0.615, -0.785, 0] },
  { pos: [-0.5, -0.5, -0.5], rot: [-0.615, -2.356, 0] },
  { pos: [0.5, -0.5, -0.5], rot: [-0.615, 2.356, 0] },
];

interface OctahedronProps {
  isRolling: boolean;
  onRollComplete: (faceIndex: number) => void;
  targetRotation: THREE.Euler | null;
}

function Octahedron({ isRolling, onRollComplete, targetRotation }: OctahedronProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const rollStartTime = useRef(0);
  const hasCompleted = useRef(false);

  useEffect(() => {
    if (isRolling) {
      // 빠른 초기 속도
      setVelocity({
        x: 15 + Math.random() * 10,
        y: 8 + Math.random() * 5,
      });
      rollStartTime.current = Date.now();
      hasCompleted.current = false;
    }
  }, [isRolling]);

  useFrame(() => {
    if (!meshRef.current) return;

    if (isRolling && !hasCompleted.current) {
      const elapsed = (Date.now() - rollStartTime.current) / 1000;
      const decay = Math.exp(-elapsed * 1.5);

      // 위아래(X축) 중심 회전 + 약간의 Y축 회전
      meshRef.current.rotation.x += velocity.x * decay * 0.02;
      meshRef.current.rotation.y += velocity.y * decay * 0.01;

      // 충분히 느려지면 완료
      if (decay < 0.05 && !hasCompleted.current) {
        hasCompleted.current = true;
        // 랜덤 면 선택
        const faceIndex = Math.floor(Math.random() * 8);
        onRollComplete(faceIndex);
      }
    } else if (targetRotation && !isRolling) {
      // 부드럽게 목표 회전으로 이동
      meshRef.current.rotation.x += (targetRotation.x - meshRef.current.rotation.x) * 0.1;
      meshRef.current.rotation.y += (targetRotation.y - meshRef.current.rotation.y) * 0.1;
    } else if (!isRolling && !targetRotation) {
      // 대기 상태: 천천히 회전
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={meshRef} castShadow>
      {/* 정팔면체 지오메트리 */}
      <octahedronGeometry args={[1.5, 0]} />
      {/* 광택 있는 재질 */}
      <meshPhysicalMaterial
        color="#1e1b4b"
        metalness={0.3}
        roughness={0.2}
        clearcoat={1}
        clearcoatRoughness={0.1}
        envMapIntensity={1}
      />

      {/* 각 면에 괘 심볼 */}
      {FACE_POSITIONS.map((face, i) => (
        <Text
          key={i}
          position={[
            face.pos[0] * 1.05,
            face.pos[1] * 1.05,
            face.pos[2] * 1.05,
          ]}
          rotation={[face.rot[0], face.rot[1], face.rot[2]]}
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {TRIGRAMS[i].symbol}
        </Text>
      ))}
    </mesh>
  );
}

interface Dice3DProps {
  onComplete?: (trigram: typeof TRIGRAMS[0], yaoLines: boolean[]) => void;
  autoStart?: boolean;
}

export default function Dice3D({ onComplete, autoStart = false }: Dice3DProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [selectedTrigram, setSelectedTrigram] = useState<typeof TRIGRAMS[0] | null>(null);
  const [yaoLines, setYaoLines] = useState<boolean[]>([]);
  const [phase, setPhase] = useState<'idle' | 'rolling' | 'revealing' | 'complete'>('idle');
  const [revealedLines, setRevealedLines] = useState(0);
  const [targetRotation, setTargetRotation] = useState<THREE.Euler | null>(null);

  const rollDice = useCallback(() => {
    if (isRolling) return;
    setIsRolling(true);
    setPhase('rolling');
    setSelectedTrigram(null);
    setYaoLines([]);
    setRevealedLines(0);
    setTargetRotation(null);
  }, [isRolling]);

  const handleRollComplete = useCallback((faceIndex: number) => {
    setIsRolling(false);
    const trigram = TRIGRAMS[faceIndex];
    setSelectedTrigram(trigram);

    // 6효 생성
    const lines: boolean[] = [];
    for (let i = 0; i < 6; i++) {
      lines.push(Math.random() > 0.48);
    }
    setYaoLines(lines);
    setPhase('revealing');
  }, []);

  // 효 순차 공개
  useEffect(() => {
    if (phase === 'revealing' && revealedLines < 6) {
      const timer = setTimeout(() => {
        setRevealedLines((prev) => prev + 1);
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
    setTargetRotation(null);
  };

  return (
    <div className="flex flex-col items-center justify-center py-4">
      {/* 상태 메시지 */}
      <div className="mb-2 text-center h-8">
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

      {/* 3D 캔버스 */}
      <div className="w-64 h-64 mb-4">
        <Canvas
          camera={{ position: [0, 2, 5], fov: 45 }}
          shadows
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <spotLight
              position={[5, 10, 5]}
              angle={0.3}
              penumbra={1}
              intensity={1}
              castShadow
            />
            <pointLight position={[-5, 5, -5]} intensity={0.5} color="#a78bfa" />

            <Octahedron
              isRolling={isRolling}
              onRollComplete={handleRollComplete}
              targetRotation={targetRotation}
            />

            <ContactShadows
              position={[0, -2, 0]}
              opacity={0.5}
              scale={10}
              blur={2}
              far={4}
            />

            <Environment preset="city" />
          </Suspense>
        </Canvas>
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
                <div
                  className={`
                  flex-1 h-6 flex items-center justify-center rounded
                  ${
                    isYang
                      ? 'bg-amber-500/30 border border-amber-500/50'
                      : 'bg-blue-500/30 border border-blue-500/50'
                  }
                `}
                >
                  <span className="text-lg">{isYang ? '⚊' : '⚋'}</span>
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
