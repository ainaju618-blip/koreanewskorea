'use client';

import React from 'react';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'main';
  noPadding?: boolean;
}

/**
 * ResponsiveContainer - max-w-[1280px] responsive container
 * Provides consistent horizontal padding and max-width constraint
 */
export default function ResponsiveContainer({
  children,
  className = '',
  as: Component = 'div',
  noPadding = false,
}: ResponsiveContainerProps) {
  const paddingClasses = noPadding ? '' : 'px-4 lg:px-8';

  return (
    <Component
      className={`max-w-[1280px] mx-auto ${paddingClasses} ${className}`}
    >
      {children}
    </Component>
  );
}
