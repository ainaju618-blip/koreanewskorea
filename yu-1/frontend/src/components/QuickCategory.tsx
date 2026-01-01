'use client';

import { useState } from 'react';

interface QuickCategoryProps {
  onCategorySelect: (categoryId: number) => void;
  onDetailClick: () => void;
}

// 9개 대분류 카테고리
const CATEGORIES = [
  { id: 1, name: '재물', emoji: '💰', color: 'from-yellow-500/10 to-amber-600/10', border: 'border-amber-500/20', desc: '투자/재테크' },
  { id: 4, name: '연애', emoji: '💕', color: 'from-pink-500/10 to-rose-600/10', border: 'border-pink-500/20', desc: '사랑/관계' },
  { id: 2, name: '직업', emoji: '💼', color: 'from-blue-500/10 to-indigo-600/10', border: 'border-blue-500/20', desc: '취업/이직' },
  { id: 9, name: '오늘운세', emoji: '🔮', color: 'from-purple-500/10 to-violet-600/10', border: 'border-purple-500/20', desc: '전체운' },
];

const ALL_CATEGORIES = [
  { id: 1, name: '재물', emoji: '💰' },
  { id: 2, name: '직업', emoji: '💼' },
  { id: 3, name: '학업', emoji: '📚' },
  { id: 4, name: '연애', emoji: '💕' },
  { id: 5, name: '대인', emoji: '👥' },
  { id: 6, name: '건강', emoji: '🏥' },
  { id: 7, name: '취미', emoji: '🎮' },
  { id: 8, name: '운명', emoji: '✨' },
  { id: 9, name: '기타', emoji: '🔮' },
];

export default function QuickCategory({ onCategorySelect, onDetailClick }: QuickCategoryProps) {
  const [showAll, setShowAll] = useState(false);

  return (
    <section className="space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🔥</span>
          <span>빠른 점괘</span>
        </h2>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-purple-400 hover:text-purple-300 transition"
        >
          {showAll ? '접기' : '전체보기 →'}
        </button>
      </div>

      {/* 빠른 선택 버튼 (4개) */}
      {!showAll && (
        <div className="grid grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              className={`
                relative overflow-hidden rounded-xl p-4
                bg-gradient-to-br ${cat.color}
                backdrop-blur-sm border ${cat.border}
                text-white shadow-lg
                hover:scale-105 active:scale-95
                transition-all duration-200
              `}
            >
              <div className="text-center">
                <span className="text-2xl block mb-1">{cat.emoji}</span>
                <span className="text-sm font-medium block">{cat.name}</span>
                <span className="text-xs text-gray-300">{cat.desc}</span>
              </div>
              {/* 반짝이 효과 */}
              <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      )}

      {/* 전체 카테고리 (9개) */}
      {showAll && (
        <div className="grid grid-cols-3 gap-3">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              className="
                backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4
                hover:border-amber-400/50 hover:bg-white/10
                active:scale-95
                transition-all duration-200
              "
            >
              <div className="text-center">
                <span className="text-2xl block mb-1">{cat.emoji}</span>
                <span className="text-sm font-medium text-gray-200">{cat.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 자세히 입력하기 버튼 */}
      <button
        onClick={onDetailClick}
        className="
          w-full py-4 rounded-xl
          border-2 border-dashed border-white/20
          text-gray-300 font-medium
          hover:border-white/30 hover:bg-white/5
          transition-all duration-200
          flex items-center justify-center gap-2
        "
      >
        <span>✏️</span>
        <span>자세히 입력하기</span>
        <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">250개 카테고리</span>
      </button>
    </section>
  );
}
