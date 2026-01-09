'use client';

import { ReactNode } from 'react';

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  showBottomNav?: boolean;
}

export default function MobileLayout({
  children,
  className = '',
  showBottomNav = true
}: MobileLayoutProps) {
  return (
    <div className={`relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-[#101722] shadow-xl ${className}`}>
      {children}
      {/* Bottom padding for fixed nav */}
      {showBottomNav && <div className="h-24" />}
    </div>
  );
}
