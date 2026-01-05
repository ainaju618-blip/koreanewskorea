'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Newspaper, Menu, X, Search, MapPin, ChevronDown, Bell, Globe,
  Home, Map, Building2, UtensilsCrossed, Briefcase, Compass
} from 'lucide-react';

// Navigation items
const NAV_ITEMS = [
  { href: '/en', label: 'Home', icon: Home },
  { href: '/en/map', label: 'News Map', icon: Map },
  { href: '/en/region/naju', label: 'Local News', icon: Building2 },
  { href: '/en/category/travel', label: 'Travel', icon: Compass },
  { href: '/en/category/food', label: 'Food', icon: UtensilsCrossed },
  { href: '/en/category/business', label: 'Business', icon: Briefcase },
];

// Region list
const REGIONS = [
  { id: 'all', name: 'All Korea', href: '/en' },
  { id: 'seoul', name: 'Seoul', href: '/en/region/seoul' },
  { id: 'gyeonggi', name: 'Gyeonggi', href: '/en/region/gyeonggi' },
  { id: 'incheon', name: 'Incheon', href: '/en/region/incheon' },
  { id: 'busan', name: 'Busan', href: '/en/region/busan' },
  { id: 'daegu', name: 'Daegu', href: '/en/region/daegu' },
  { id: 'gwangju', name: 'Gwangju', href: '/en/region/gwangju' },
  { id: 'daejeon', name: 'Daejeon', href: '/en/region/daejeon' },
  { id: 'ulsan', name: 'Ulsan', href: '/en/region/ulsan' },
  { id: 'sejong', name: 'Sejong', href: '/en/region/sejong' },
  { id: 'jeonnam', name: 'Jeonnam', href: '/en/region/jeonnam' },
  { id: 'naju', name: 'Naju', href: '/en/region/naju' },
];

interface StitchHeaderENProps {
  currentRegion?: string;
  showSearch?: boolean;
}

export default function StitchHeaderEN({ currentRegion = 'All Korea', showSearch = true }: StitchHeaderENProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Search:', searchQuery);
    }
  };

  // Get current date in English format
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'Asia/Seoul'
  });

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        {/* Top Bar */}
        <div className="bg-gray-900 text-white py-1.5 px-4 text-xs hidden lg:block">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-gray-400">{currentDate}</span>
              <span className="text-cyan-400 font-medium">Headlines: Nationwide cold wave alert issued</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                <Globe className="w-3 h-3" />
                한국어
              </Link>
              <Link href="#" className="hover:text-cyan-400 transition-colors">Login</Link>
              <Link href="#" className="hover:text-cyan-400 transition-colors">Sign Up</Link>
              <Link href="#" className="hover:text-cyan-400 transition-colors">Advertise</Link>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-7xl mx-auto">
          <div className="px-4 h-14 lg:h-16 flex items-center justify-between gap-4">
            {/* Left: Logo */}
            <Link href="/en" className="flex items-center gap-1.5 shrink-0">
              <Newspaper className="w-6 h-6 lg:w-7 lg:h-7 text-cyan-500" />
              <h1 className="text-lg lg:text-xl font-black tracking-tight">
                Korea<span className="text-cyan-500">NEWS</span>
              </h1>
            </Link>

            {/* Center: Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                  (item.href !== '/en' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                      isActive
                        ? 'bg-cyan-50 text-cyan-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Region Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsRegionOpen(!isRegionOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                >
                  <MapPin className="w-4 h-4 text-cyan-500" />
                  <span className="font-bold text-gray-900">{currentRegion}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isRegionOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Region Dropdown */}
                {isRegionOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsRegionOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-80 overflow-y-auto">
                      {REGIONS.map((region) => (
                        <Link
                          key={region.id}
                          href={region.href}
                          onClick={() => setIsRegionOpen(false)}
                          className={`block px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            currentRegion === region.name
                              ? 'text-cyan-600 font-bold bg-cyan-50'
                              : 'text-gray-700'
                          }`}
                        >
                          {region.name}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Search Button */}
              {showSearch && (
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
              )}

              {/* Notification */}
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative hidden lg:flex">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors lg:hidden"
                aria-label="Menu"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Search Bar (Expandable) */}
          {isSearchOpen && (
            <div className="px-4 pb-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white">
            <nav className="px-4 py-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                  (item.href !== '/en' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-cyan-50 text-cyan-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <Link href="/" className="text-sm text-gray-600 flex items-center gap-1 hover:text-cyan-600">
                  <Globe className="w-4 h-4" />
                  Switch to Korean
                </Link>
              </div>
              <div className="flex gap-2">
                <Link
                  href="#"
                  className="flex-1 py-2 text-center text-sm font-medium text-gray-600 hover:text-cyan-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="#"
                  className="flex-1 py-2 text-center text-sm font-medium bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
