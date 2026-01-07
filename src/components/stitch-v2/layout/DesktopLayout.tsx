'use client';

import React from 'react';
import ResponsiveContainer from './ResponsiveContainer';

interface DesktopLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarPosition?: 'left' | 'right';
  mainCols?: 8 | 9;
  sidebarCols?: 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
  containerClassName?: string;
  stickyTop?: string;
}

/**
 * DesktopLayout - 12-column grid layout for desktop
 * Default: main 8 columns + sidebar 4 columns
 * Supports responsive behavior (stacked on mobile, grid on lg+)
 */
export default function DesktopLayout({
  children,
  sidebar,
  sidebarPosition = 'right',
  mainCols = 8,
  sidebarCols = 4,
  gap = 'md',
  className = '',
  containerClassName = '',
  stickyTop = 'top-20',
}: DesktopLayoutProps) {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  const mainColClasses = {
    8: 'lg:col-span-8',
    9: 'lg:col-span-9',
  };

  const sidebarColClasses = {
    3: 'lg:col-span-3',
    4: 'lg:col-span-4',
  };

  const mainContent = (
    <main className={`col-span-1 ${mainColClasses[mainCols]} min-w-0`}>
      {children}
    </main>
  );

  const sidebarContent = sidebar && (
    <aside className={`col-span-1 ${sidebarColClasses[sidebarCols]} min-w-0`}>
      <div className={`sticky ${stickyTop} space-y-6`}>
        {sidebar}
      </div>
    </aside>
  );

  return (
    <ResponsiveContainer className={containerClassName}>
      <div
        className={`grid grid-cols-1 lg:grid-cols-12 ${gapClasses[gap]} overflow-hidden ${className}`}
      >
        {sidebarPosition === 'left' ? (
          <>
            {sidebarContent}
            {mainContent}
          </>
        ) : (
          <>
            {mainContent}
            {sidebarContent}
          </>
        )}
      </div>
    </ResponsiveContainer>
  );
}
