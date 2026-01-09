'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  filledIcon?: string;
}

interface BottomNavProps {
  variant?: 'national' | 'regional';
}

const nationalNavItems: NavItem[] = [
  { href: '/', icon: 'home', filledIcon: 'home', label: '홈' },
  { href: '/region', icon: 'location_on', label: '내 지역' },
  { href: '/write', icon: 'add', label: '' }, // 중앙 버튼
  { href: '/bookmarks', icon: 'bookmark', label: '스크랩' },
  { href: '/menu', icon: 'menu', label: '전체' },
];

const regionalNavItems: NavItem[] = [
  { href: '/', icon: 'home', filledIcon: 'home', label: '홈' },
  { href: '/map', icon: 'map', label: '지도' },
  { href: '/forum', icon: 'forum', label: '소통' },
  { href: '/mypage', icon: 'person', label: 'MY' },
];

export default function BottomNav({ variant = 'national' }: BottomNavProps) {
  const pathname = usePathname();
  const navItems = variant === 'national' ? nationalNavItems : regionalNavItems;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  if (variant === 'national') {
    return (
      <nav className="fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
        <div className="max-w-md mx-auto flex justify-around items-center h-[60px] px-2">
          {navItems.map((item, index) => {
            const active = isActive(item.href);

            // 중앙 + 버튼 (특수 처리)
            if (item.icon === 'add') {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center w-full h-full gap-1 text-gray-400 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
                >
                  <div className="bg-primary rounded-full p-2 -mt-6 shadow-lg shadow-primary/40 border-4 border-white dark:border-slate-900">
                    <span className="material-symbols-outlined text-white text-[24px]">add</span>
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                  active
                    ? 'text-primary'
                    : 'text-gray-400 dark:text-slate-400 hover:text-primary dark:hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined text-[24px] ${active && item.filledIcon ? 'filled' : ''}`}>
                  {active && item.filledIcon ? item.filledIcon : item.icon}
                </span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
        {/* Safe Area Spacing for iOS Home Indicator */}
        <div className="h-1 bg-white dark:bg-slate-900 w-full" />
      </nav>
    );
  }

  // Regional variant (나주판 등)
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-white dark:bg-[#101722] border-t border-gray-100 dark:border-gray-800 pb-safe">
      <div className="flex justify-between items-center px-6 h-[60px]">
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-12 transition-colors ${
                active
                  ? 'text-primary'
                  : 'text-gray-400 dark:text-gray-500 hover:text-primary'
              }`}
            >
              <span className={`material-symbols-outlined text-[24px] ${active ? 'filled' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
