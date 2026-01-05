/**
 * 시/도별 뉴스 페이지
 * /region/[sido] - 해당 시/도의 시/군/구 목록 및 뉴스 표시
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';

// 시/도별 히어로 이미지 매핑
const SIDO_HERO_IMAGES: Record<string, {
  image: string;
  alt: string;
  gradient: string;
  tagColor: string;
}> = {
  'gwangju': {
    image: '/images/hero/gwangju-hero.png',
    alt: '광주 5·18민주광장과 도심 야경',
    gradient: 'from-rose-600/85 to-pink-500/70',
    tagColor: 'text-rose-200',
  },
  // 다른 시/도 이미지 추가 가능
};
import {
  getRegionByCode,
  getDistrictsByRegion,
  buildRegionPath,
  buildBreadcrumbs,
  isValidRegion,
} from '@/lib/national-regions';

interface Props {
  params: Promise<{ sido: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sido } = await params;
  const region = getRegionByCode(sido);

  if (!region) {
    return {
      title: '지역을 찾을 수 없습니다',
    };
  }

  return {
    title: `${region.name} 뉴스 - 지역뉴스`,
    description: `${region.name} 지역의 최신 뉴스와 소식. ${region.districts.length}개 시/군/구 뉴스를 확인하세요.`,
    openGraph: {
      title: `${region.name} 뉴스 | 코리아뉴스코리아`,
      description: `${region.name} 지역의 최신 뉴스와 소식`,
    },
  };
}

export default async function SidoPage({ params }: Props) {
  const { sido } = await params;

  // 유효성 검사
  if (!isValidRegion(sido)) {
    notFound();
  }

  const region = getRegionByCode(sido)!;
  const districts = getDistrictsByRegion(sido);
  const breadcrumbs = buildBreadcrumbs(sido);

  // 도 지역인지 광역시인지 구분
  const isProvince = region.type === 'province' || region.type === 'special-province';
  const districtLabel = isProvince ? '시/군' : '구/군';

  // 히어로 이미지 정보 가져오기
  const heroInfo = SIDO_HERO_IMAGES[sido];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      {heroInfo ? (
        <section className="relative text-white py-16 overflow-hidden">
          {/* Background Image */}
          <Image
            src={heroInfo.image}
            alt={heroInfo.alt}
            fill
            className="object-cover"
            priority
          />
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-r ${heroInfo.gradient}`} />

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-6 h-6" />
              <span className={`text-sm font-medium ${heroInfo.tagColor}`}>
                {sido.toUpperCase()}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{region.name} 뉴스</h1>
            <p className={heroInfo.tagColor.replace('-200', '-100') + ' max-w-2xl'}>
              {region.name}의 {districts.length}개 {districtLabel} 소식을 확인하세요
            </p>
          </div>
        </section>
      ) : (
        /* 기본 헤더 (히어로 이미지 없는 시/도) */
        <section className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-6 h-6" />
              <span className="text-blue-200 text-sm font-medium">REGION</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{region.name} 뉴스</h1>
            <p className="text-blue-100">
              {region.name}의 {districts.length}개 {districtLabel} 소식을 확인하세요
            </p>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 브레드크럼 */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center gap-2 text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.code} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-300">/</span>}
              {crumb.isActive ? (
                <span className="text-gray-900 font-medium">{crumb.name}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-blue-600">
                  {crumb.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {region.name} 뉴스
        </h1>
        <p className="text-gray-600">
          {region.name}의 {districts.length}개 {districtLabel} 소식을 확인하세요
        </p>
      </div>

      {/* 시/군/구 그리드 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
          {districtLabel} 선택
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {districts
            .filter((d) => d.isPrimary !== false) // 신안군 등 통합 지역 제외
            .map((district) => (
              <Link
                key={district.code}
                href={buildRegionPath(sido, district.code)}
                className="group block p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200"
              >
                <div className="text-center">
                  <span className="block text-sm font-medium text-gray-900 group-hover:text-blue-600">
                    {district.name}
                  </span>
                  {district.mergedWith && (
                    <span className="block text-xs text-gray-400 mt-1">
                      +{district.mergedWith.length}개 통합
                    </span>
                  )}
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* 최신 뉴스 섹션 (데이터 연동 필요) */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-red-600 rounded-full"></span>
          {region.shortName} 최신 뉴스
        </h2>
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
          <span className="block text-4xl mb-4">📰</span>
          <p className="text-lg font-medium">{region.name} 뉴스</p>
          <p className="text-sm mt-2">
            이 지역의 최신 뉴스가 여기에 표시됩니다
          </p>
          <p className="text-xs text-gray-400 mt-4">
            (뉴스 목록 컴포넌트 구현 예정)
          </p>
        </div>
      </section>

      {/* 인기 뉴스/주요 뉴스 섹션 */}
      <section className="mt-12 grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🔥 인기 뉴스
          </h3>
          <div className="text-gray-500 text-sm">
            (인기 뉴스 목록 표시 예정)
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            ⭐ 주요 뉴스
          </h3>
          <div className="text-gray-500 text-sm">
            (주요 뉴스 목록 표시 예정)
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
