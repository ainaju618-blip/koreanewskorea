'use client';

import { useState } from 'react';

interface YaoSliderProps {
  value: number;
  onChange: (value: number) => void;
  isYang?: boolean; // true: 양효(九), false: 음효(六)
  onYinYangChange?: (isYang: boolean) => void;
}

// 효 이름 매핑
const YAO_NAMES = {
  yang: ['초구', '구이', '구삼', '구사', '구오', '상구'],
  yin: ['초육', '육이', '육삼', '육사', '육오', '상육'],
};

const YAO_DESCRIPTIONS = [
  { position: 1, meaning: '시작, 잠재력', hint: '때를 기다리는 시기' },
  { position: 2, meaning: '성장, 기반', hint: '기반을 다지는 시기' },
  { position: 3, meaning: '도전, 위험', hint: '조심해야 할 시기' },
  { position: 4, meaning: '변화, 선택', hint: '결정의 기로' },
  { position: 5, meaning: '정점, 성공', hint: '가장 좋은 때' },
  { position: 6, meaning: '완성, 주의', hint: '마무리의 시기' },
];

export default function YaoSlider({
  value,
  onChange,
  isYang = true,
  onYinYangChange,
}: YaoSliderProps) {
  const [showRandom, setShowRandom] = useState(false);

  const yaoName = isYang ? YAO_NAMES.yang[value - 1] : YAO_NAMES.yin[value - 1];
  const yaoDesc = YAO_DESCRIPTIONS[value - 1];

  const handleRandomYao = () => {
    const randomPosition = Math.floor(Math.random() * 6) + 1;
    const randomYinYang = Math.random() > 0.5;
    onChange(randomPosition);
    onYinYangChange?.(randomYinYang);
    setShowRandom(true);
    setTimeout(() => setShowRandom(false), 1000);
  };

  return (
    <div className="space-y-4">
      {/* 음양 선택 */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-300">
          효 선택
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onYinYangChange?.(true)}
            className={`
              px-3 py-1 rounded-full text-sm font-medium transition
              ${isYang ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}
            `}
          >
            ☯ 양(陽)
          </button>
          <button
            onClick={() => onYinYangChange?.(false)}
            className={`
              px-3 py-1 rounded-full text-sm font-medium transition
              ${!isYang ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}
            `}
          >
            ☯ 음(陰)
          </button>
        </div>
      </div>

      {/* 효 위치 표시 */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-2xl font-bold text-amber-400 gua-font">
              {yaoName}
            </span>
            <span className="text-sm text-gray-500 ml-2">
              ({value}효)
            </span>
          </div>
          <button
            onClick={handleRandomYao}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition
              ${showRandom ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}
            `}
          >
            {showRandom ? '✓ 선택됨!' : '🎲 랜덤'}
          </button>
        </div>

        {/* 효 의미 */}
        <div className="text-sm">
          <p className="font-medium text-white">{yaoDesc.meaning}</p>
          <p className="text-gray-500 text-xs mt-1">{yaoDesc.hint}</p>
        </div>
      </div>

      {/* 슬라이더 */}
      <div className="space-y-2">
        <input
          type="range"
          min="1"
          max="6"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="yao-slider w-full cursor-pointer"
        />

        {/* 효 버튼들 */}
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5, 6].map((pos) => (
            <button
              key={pos}
              onClick={() => onChange(pos)}
              className={`
                w-10 h-10 rounded-full text-sm font-medium transition-all
                ${
                  value === pos
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 scale-110'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }
              `}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* 효 이름 라벨 */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>초효</span>
          <span>이효</span>
          <span>삼효</span>
          <span>사효</span>
          <span>오효</span>
          <span>상효</span>
        </div>
      </div>

      {/* 효 시각화 (괘 모양) */}
      <div className="flex justify-center">
        <div className="flex flex-col-reverse gap-1">
          {[1, 2, 3, 4, 5, 6].map((pos) => (
            <div
              key={pos}
              className={`
                h-3 rounded transition-all
                ${value === pos ? 'bg-amber-500 w-20' : 'bg-white/10 w-16'}
                ${pos <= 3 ? 'opacity-60' : 'opacity-100'}
              `}
              style={{
                boxShadow: value === pos ? '0 0 10px rgba(245, 158, 11, 0.5)' : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
