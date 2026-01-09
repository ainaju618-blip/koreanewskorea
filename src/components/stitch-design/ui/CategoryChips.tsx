'use client';

import { useState } from 'react';

interface Category {
  id: string;
  label: string;
}

interface CategoryChipsProps {
  categories: Category[];
  defaultActive?: string;
  onChange?: (categoryId: string) => void;
  sticky?: boolean;
  stickyTop?: string;
}

export default function CategoryChips({
  categories,
  defaultActive = 'all',
  onChange,
  sticky = false,
  stickyTop = 'top-[73px]',
}: CategoryChipsProps) {
  const [active, setActive] = useState(defaultActive);

  const handleClick = (categoryId: string) => {
    setActive(categoryId);
    onChange?.(categoryId);
  };

  return (
    <div className={`${sticky ? `sticky ${stickyTop} z-40` : ''} bg-white dark:bg-[#101722] border-b border-gray-100 dark:border-gray-800`}>
      <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleClick(cat.id)}
            className={`flex h-9 shrink-0 items-center justify-center px-4 rounded-full transition-colors ${
              active === cat.id
                ? 'bg-[#111418] dark:bg-white text-white dark:text-[#111418]'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span className={`text-sm ${active === cat.id ? 'font-bold' : 'font-medium'}`}>
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
