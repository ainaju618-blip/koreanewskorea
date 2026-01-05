/**
 * 지역뉴스 메인 페이지
 * /region - 17개 시/도 목록 표시
 */

import { Metadata } from 'next';
import Link from 'next/link';
import {
  getAllRegions,
  getMetropolitanRegions,
  getProvinces,
  getRegionTypeLabel,
  buildRegionPath,
} from '@/lib/national-regions';

export const metadata: Metadata = {
  title: '지역뉴스 - 전국 17개 시/도',
  description: '대한민국 전국 17개 시/도 지역뉴스를 한눈에. 서울, 부산, 대구, 인천, 광주, 대전, 울산, 세종, 경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주 뉴스.',
  openGraph: {
    title: '지역뉴스 - 전국 17개 시/도 | 코리아뉴스코리아',
    description: '대한민국 전국 17개 시/도 지역뉴스',
  },
};

export default function RegionPage() {
  const metropolitanRegions = getMetropolitanRegions();
  const provinces = getProvinces();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">지역뉴스</h1>
        <p className="text-gray-600">
          전국 17개 시/도의 지역 소식을 확인하세요
        </p>
      </div>

      {/* 광역시/특별시 섹션 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
          광역시 · 특별시
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {metropolitanRegions.map((region) => (
            <Link
              key={region.code}
              href={buildRegionPath(region.code)}
              className="group block p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="text-center">
                <span className="block text-2xl mb-2">🏙️</span>
                <span className="block text-lg font-medium text-gray-900 group-hover:text-blue-600">
                  {region.shortName}
                </span>
                <span className="block text-xs text-gray-500 mt-1">
                  {getRegionTypeLabel(region.type)}
                </span>
                <span className="block text-xs text-gray-400 mt-1">
                  {region.districts.length}개 {region.type === 'special' ? '' : '구/군'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 도 섹션 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-green-600 rounded-full"></span>
          도 · 특별자치도
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {provinces.map((region) => (
            <Link
              key={region.code}
              href={buildRegionPath(region.code)}
              className="group block p-4 bg-white rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="text-center">
                <span className="block text-2xl mb-2">🗺️</span>
                <span className="block text-lg font-medium text-gray-900 group-hover:text-green-600">
                  {region.shortName}
                </span>
                <span className="block text-xs text-gray-500 mt-1">
                  {getRegionTypeLabel(region.type)}
                </span>
                <span className="block text-xs text-gray-400 mt-1">
                  {region.districts.length}개 시/군
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 지도 영역 (추후 구현) */}
      <section className="mt-12 p-8 bg-gray-50 rounded-2xl border border-gray-200">
        <div className="text-center text-gray-500">
          <span className="block text-4xl mb-4">🗺️</span>
          <p className="text-lg font-medium">대한민국 지역 지도</p>
          <p className="text-sm mt-2">지도를 클릭하여 해당 지역의 뉴스를 확인하세요</p>
          <p className="text-xs text-gray-400 mt-4">(지도 컴포넌트 구현 예정)</p>
        </div>
      </section>
    </div>
  );
}
