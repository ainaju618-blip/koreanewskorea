/**
 * 시/군/구별 뉴스 페이지
 * /region/[sido]/[sigungu] - 해당 시/군/구의 뉴스 목록
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';

// 지역별 히어로 이미지 매핑
const REGION_HERO_IMAGES: Record<string, {
  image: string;
  alt: string;
  gradient: string;
  tagColor: string;
  description: string;
}> = {
  'mokpo': {
    image: '/images/hero/mokpo-hero.png',
    alt: '목포 유달산과 목포대교 야경',
    gradient: 'from-blue-600/85 to-cyan-500/70',
    tagColor: 'text-blue-200',
    description: '서남해안의 관문, 유달산과 바다가 어우러진 항구도시입니다.',
  },
  'suncheon': {
    image: '/images/hero/suncheon-hero.png',
    alt: '순천만 습지 갈대밭과 S자 물길',
    gradient: 'from-emerald-600/85 to-green-500/70',
    tagColor: 'text-emerald-200',
    description: '대한민국 생태수도, 순천만 습지와 정원의 도시입니다.',
  },
  'yeosu': {
    image: '/images/hero/yeosu-hero.png',
    alt: '여수 밤바다와 돌산대교 야경',
    gradient: 'from-indigo-600/85 to-purple-500/70',
    tagColor: 'text-indigo-200',
    description: '낭만의 도시, 아름다운 밤바다와 해양관광의 중심지입니다.',
  },
  'gwangju': {
    image: '/images/hero/gwangju-hero.png',
    alt: '광주 5·18민주광장과 도심 야경',
    gradient: 'from-rose-600/85 to-pink-500/70',
    tagColor: 'text-rose-200',
    description: '민주·인권·평화의 도시, 예술과 문화가 숨쉬는 광역시입니다.',
  },
  'jindo': {
    image: '/images/hero/jindo-hero.png',
    alt: '진도 신비의 바닷길과 진도개',
    gradient: 'from-teal-600/85 to-cyan-500/70',
    tagColor: 'text-teal-200',
    description: '신비의 바닷길과 진도개의 고장, 전통문화의 보고입니다.',
  },
  'naju': {
    image: '/images/hero/naju-hero.png',
    alt: '나주 영산강과 나주배 과수원',
    gradient: 'from-emerald-600/85 to-teal-500/70',
    tagColor: 'text-emerald-200',
    description: '천년의 역사를 간직한 영산강의 도시, 나주배와 곰탕의 고장입니다.',
  },
};
import {
  getRegionByCode,
  getDistrictByCode,
  buildBreadcrumbs,
  isValidDistrict,
  isMergedRegion,
} from '@/lib/national-regions';

interface Props {
  params: Promise<{ sido: string; sigungu: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sido, sigungu } = await params;
  const region = getRegionByCode(sido);
  const district = getDistrictByCode(sido, sigungu);

  if (!region || !district) {
    return {
      title: '지역을 찾을 수 없습니다',
    };
  }

  const fullName = `${region.shortName} ${district.name}`;

  return {
    title: `${fullName} 뉴스 - 지역뉴스`,
    description: `${fullName} 지역의 최신 뉴스와 소식을 확인하세요.`,
    openGraph: {
      title: `${fullName} 뉴스 | 코리아뉴스코리아`,
      description: `${fullName} 지역의 최신 뉴스와 소식`,
    },
  };
}

export default async function SigunguPage({ params }: Props) {
  const { sido, sigungu } = await params;

  // 유효성 검사
  if (!isValidDistrict(sido, sigungu)) {
    notFound();
  }

  const region = getRegionByCode(sido)!;
  const district = getDistrictByCode(sido, sigungu)!;
  const breadcrumbs = buildBreadcrumbs(sido, sigungu);
  const fullName = `${region.shortName} ${district.name}`;

  // 목포+신안 통합 안내
  const isMerged = isMergedRegion(sigungu);
  const mergedDistricts = district.mergedWith || [];

  // 히어로 이미지 정보 가져오기
  const heroInfo = REGION_HERO_IMAGES[sigungu];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner (히어로 이미지가 있는 지역만) */}
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
                {sigungu.toUpperCase()}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{district.name}</h1>
            <p className={heroInfo.tagColor.replace('text-', 'text-').replace('-200', '-100') + ' max-w-2xl'}>
              {heroInfo.description}
            </p>
          </div>
        </section>
      ) : (
        /* 기본 헤더 (히어로 이미지 없는 지역) */
        <section className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-6 h-6" />
              <span className="text-blue-200 text-sm font-medium">{region.shortName}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{district.name}</h1>
            <p className="text-blue-100">{fullName} 지역의 최신 소식을 확인하세요</p>
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
          {fullName} 뉴스
        </h1>
        <p className="text-gray-600">
          {fullName} 지역의 최신 소식을 확인하세요
        </p>

        {/* 통합 지역 안내 */}
        {isMerged && mergedDistricts.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              ℹ️ {district.name}과 {mergedDistricts.map(code => {
                const d = getDistrictByCode(sido, code);
                return d?.name;
              }).join(', ')} 뉴스가 함께 표시됩니다
            </p>
          </div>
        )}
      </div>

      {/* 뉴스 필터 */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium">
          전체
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">
          정치/경제
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">
          사회
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">
          문화
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">
          스포츠
        </button>
      </div>

      {/* 뉴스 목록 */}
      <section className="mb-12">
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
          <span className="block text-4xl mb-4">📰</span>
          <p className="text-lg font-medium">{fullName} 뉴스 목록</p>
          <p className="text-sm mt-2">
            이 지역의 뉴스 기사가 여기에 표시됩니다
          </p>
          <p className="text-xs text-gray-400 mt-4">
            (뉴스 목록 컴포넌트 및 페이지네이션 구현 예정)
          </p>
        </div>
      </section>

      {/* 사이드 정보 */}
      <section className="grid md:grid-cols-3 gap-6">
        {/* 지역 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📍 지역 정보
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">시/도</dt>
              <dd className="font-medium">{region.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">시/군/구</dt>
              <dd className="font-medium">{district.name}</dd>
            </div>
          </dl>
        </div>

        {/* 인기 기사 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🔥 인기 기사
          </h3>
          <div className="text-gray-500 text-sm">
            (인기 기사 목록 표시 예정)
          </div>
        </div>

        {/* 관련 지역 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🗺️ 인근 지역
          </h3>
          <div className="text-gray-500 text-sm">
            (인근 지역 링크 표시 예정)
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
