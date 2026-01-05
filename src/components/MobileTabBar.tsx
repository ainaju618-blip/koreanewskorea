'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, Building2, UtensilsCrossed, User } from 'lucide-react';

const TAB_ITEMS = [
  { href: '/', label: '홈', icon: Home },
  { href: '/map', label: '뉴스지도', icon: Map },
  { href: '/region/naju', label: '지역', icon: Building2 },
  { href: '/category/food', label: '맛집', icon: UtensilsCrossed },
  { href: '/mypage', label: '마이', icon: User },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {TAB_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive
                  ? 'text-cyan-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
      `}</style>
    </nav>
  );
}
