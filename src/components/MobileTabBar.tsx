'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Home, Search, Newspaper, UtensilsCrossed, User, X } from 'lucide-react';

const TAB_ITEMS = [
  { href: '/', label: '홈', icon: Home },
  { href: '/search', label: '검색', icon: Search, isSearch: true },
  { href: '/region/naju/news', label: '뉴스', icon: Newspaper },
  { href: '/category/food', label: '맛집', icon: UtensilsCrossed },
  { href: '/mypage', label: '마이', icon: User },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* 검색 모달 */}
      {showSearch && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden">
          <div className="absolute bottom-16 left-0 right-0 bg-white dark:bg-gray-900 p-4 rounded-t-2xl shadow-2xl safe-area-bottom">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white">뉴스 검색</h3>
              <button
                onClick={() => setShowSearch(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="검색어를 입력하세요..."
                  autoFocus
                  className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>
            {/* 인기 검색어 (선택적) */}
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">인기 검색어</p>
              <div className="flex flex-wrap gap-2">
                {['나주시', '의회', '교육', '축제'].map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => {
                      router.push(`/search?q=${encodeURIComponent(keyword)}`);
                      setShowSearch(false);
                    }}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 하단 탭바 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {TAB_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            // 검색 버튼은 모달 토글
            if (item.isSearch) {
              return (
                <button
                  key={item.href}
                  onClick={() => setShowSearch(true)}
                  className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                    showSearch
                      ? 'text-cyan-500'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${showSearch ? 'stroke-[2.5]' : ''}`} />
                  <span className={`text-[10px] ${showSearch ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </button>
              );
            }

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
    </>
  );
}
