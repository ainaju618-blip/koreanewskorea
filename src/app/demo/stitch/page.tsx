'use client';

import Link from 'next/link';

const demoPages = [
  {
    category: '페이지 컴포넌트',
    items: [
      { name: '전국판 홈', path: '/demo/stitch/home', desc: 'NationalHome - 메인 페이지' },
      { name: '광역시/도', path: '/demo/stitch/metro', desc: 'MetroHome - 광역시/도 페이지' },
      { name: '시/군', path: '/demo/stitch/city', desc: 'CityHome - 시/군 페이지' },
      { name: '기사 상세', path: '/demo/stitch/article', desc: 'ArticleDetail - 뉴스 상세' },
      { name: '카테고리', path: '/demo/stitch/category', desc: 'CategoryPage - 카테고리별 뉴스' },
      { name: '검색 결과', path: '/demo/stitch/search', desc: 'SearchResults - 검색 결과' },
      { name: '지도 정책', path: '/demo/stitch/map', desc: 'MapPolicy - 전국 지도' },
    ],
  },
  {
    category: '인증 페이지',
    items: [
      { name: '로그인', path: '/demo/stitch/login', desc: 'LoginPage' },
      { name: '회원가입', path: '/demo/stitch/signup', desc: 'SignupPage' },
      { name: '마이페이지', path: '/demo/stitch/mypage', desc: 'MyPage' },
    ],
  },
  {
    category: '데스크탑 레이아웃',
    items: [
      { name: '데스크탑 전체', path: '/demo/stitch/desktop', desc: '헤더 + 본문 + 사이드바 + 푸터' },
    ],
  },
  {
    category: 'UI 컴포넌트',
    items: [
      { name: '모달 시스템', path: '/demo/stitch/modals', desc: 'Confirm, Share, Info, Form, Lightbox' },
      { name: '사이드바 위젯', path: '/demo/stitch/widgets', desc: 'Weather, PopularNews, Newsletter, Ad, RegionMap' },
      { name: '404 페이지', path: '/demo/stitch/404', desc: 'NotFoundPage' },
    ],
  },
];

export default function StitchDemoIndex() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Stitch v2 컴포넌트 데모
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            koreanewskorea.com 전국판 디자인 시스템
          </p>
        </div>

        <div className="space-y-8">
          {demoPages.map((section) => (
            <div key={section.category} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-blue-600 px-6 py-3">
                <h2 className="text-lg font-semibold text-white">{section.category}</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {section.items.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                    </div>
                    <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>컴포넌트 위치: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">src/components/stitch-v2/</code></p>
        </div>
      </div>
    </div>
  );
}
