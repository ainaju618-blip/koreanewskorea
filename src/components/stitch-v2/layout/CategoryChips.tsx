'use client';

import React, { useRef, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
}

interface CategoryChipsProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (categoryId: string) => void;
  className?: string;
}

export default function CategoryChips({
  categories,
  activeCategory,
  onSelect,
  className = '',
}: CategoryChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChipRef = useRef<HTMLButtonElement>(null);

  // Scroll active chip into view
  useEffect(() => {
    if (activeChipRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const chip = activeChipRef.current;
      const containerRect = container.getBoundingClientRect();
      const chipRect = chip.getBoundingClientRect();

      // Check if chip is outside visible area
      if (chipRect.left < containerRect.left || chipRect.right > containerRect.right) {
        chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeCategory]);

  return (
    <div
      ref={scrollRef}
      className={`flex gap-2 overflow-x-auto no-scrollbar px-4 py-3 ${className}`}
    >
      {categories.map((category) => {
        const isActive = category.id === activeCategory;

        return (
          <button
            key={category.id}
            ref={isActive ? activeChipRef : null}
            onClick={() => onSelect(category.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? 'bg-[#111418] text-white dark:bg-white dark:text-[#111418]'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
