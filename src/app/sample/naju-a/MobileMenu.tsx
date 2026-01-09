'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  MapPin,
  Globe,
  Utensils,
  Landmark,
  ChevronDown,
} from 'lucide-react';

const menuItems = [
  { label: '시정', href: '/city' },
  { label: '의회', href: '/council' },
  { label: '교육', href: '/education' },
  { label: '생활', href: '/life' },
  { label: '오피니언', href: '/opinion' },
];

const specialItems = [
  { label: '여행', href: '/travel', icon: Globe },
  { label: '맛집', href: '/food', icon: Utensils },
  { label: '문화유적', href: '/heritage', icon: Landmark },
];

const regions = [
  { label: '전국', href: '/', active: false },
  { label: '광주', href: '/region/gwangju', active: false },
  { label: '나주', href: '/region/naju', active: true },
  { label: '진도', href: '/region/jindo', active: false },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);

  return (
    <>
      {/* 햄버거 버튼 - 44px 터치 타겟 */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden flex items-center justify-center w-11 h-11 -mr-2 text-gray-700"
        aria-label="메뉴 열기"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 슬라이드 메뉴 */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="text-lg font-bold text-gray-900">메뉴</span>
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-11 h-11 -mr-2 text-gray-500"
            aria-label="메뉴 닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 지역 선택 */}
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={() => setRegionOpen(!regionOpen)}
            className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700"
          >
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              지역 선택
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${regionOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {regionOpen && (
            <div className="mt-2 space-y-1 pl-6">
              {regions.map((region) => (
                <Link
                  key={region.label}
                  href={region.href}
                  onClick={() => setIsOpen(false)}
                  className={`block py-2 text-sm ${
                    region.active
                      ? 'text-red-600 font-medium'
                      : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  {region.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 메인 메뉴 */}
        <nav className="p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block py-3 text-sm font-medium text-gray-700 hover:text-red-600 border-b border-gray-100"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* 특별 메뉴 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-400 mb-2">생활/문화</p>
            <ul className="space-y-1">
              {specialItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 py-3 text-sm font-medium text-gray-700 hover:text-red-600"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </>
  );
}
