'use client';

import React from 'react';

interface Category {
  id: string;
  label: string;
}

interface CategoryChipsProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  className?: string;
  variant?: 'pill' | 'underline';
}

const defaultCategories: Category[] = [
  { id: 'all', label: '전체' },
  { id: 'politics', label: '정치' },
  { id: 'economy', label: '경제' },
  { id: 'society', label: '사회' },
  { id: 'culture', label: '문화' },
  { id: 'opinion', label: '오피니언' },
];

export default function CategoryChips({
  categories = defaultCategories,
  activeCategory,
  onCategoryChange,
  className = '',
  variant = 'pill',
}: CategoryChipsProps) {
  if (variant === 'underline') {
    return (
      <nav className={`flex overflow-x-auto no-scrollbar px-4 gap-6 border-b border-gray-100 dark:border-gray-800 ${className}`}>
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex flex-col items-center justify-center border-b-[2px] pb-2.5 pt-1 min-w-fit transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <span className={`text-sm tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {category.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Pill variant (default)
  return (
    <div className={`flex gap-2 overflow-x-auto no-scrollbar px-4 py-3 ${className}`}>
      {categories.map((category) => {
        const isActive = activeCategory === category.id;
        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex h-8 shrink-0 items-center justify-center rounded-full px-4 transition-colors ${
              isActive
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>
              {category.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
