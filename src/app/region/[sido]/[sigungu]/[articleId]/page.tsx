/**
 * 기사 상세 페이지
 * /region/[sido]/[sigungu]/[articleId] - 지역 뉴스 기사 상세
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getRegionByCode,
  getDistrictByCode,
  buildBreadcrumbs,
  buildRegionPath,
  isValidDistrict,
} from '@/lib/national-regions';

interface Props {
  params: Promise<{ sido: string; sigungu: string; articleId: string }>;
}

// TODO: 실제 기사 데이터 조회 함수로 교체
async function getArticle(articleId: string) {
  // Placeholder - 실제로는 Supabase에서 조회
  return {
    id: articleId,
    title: '기사 제목 예시',
    subtitle: '기사 부제목 예시',
    content: '<p>기사 본문 내용이 여기에 표시됩니다.</p>',
    author: '기자명',
    publishedAt: new Date().toISOString(),
    category: '사회',
    imageUrl: null,
    viewCount: 0,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sido, sigungu, articleId } = await params;
  const region = getRegionByCode(sido);
  const district = getDistrictByCode(sido, sigungu);
  const article = await getArticle(articleId);

  if (!region || !district || !article) {
    return {
      title: '기사를 찾을 수 없습니다',
    };
  }

  const fullName = `${region.shortName} ${district.name}`;

  return {
    title: `${article.title} - ${fullName} 뉴스`,
    description: article.subtitle || article.title,
    openGraph: {
      title: article.title,
      description: article.subtitle || article.title,
      type: 'article',
      images: article.imageUrl ? [article.imageUrl] : [],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { sido, sigungu, articleId } = await params;

  // 지역 유효성 검사
  if (!isValidDistrict(sido, sigungu)) {
    notFound();
  }

  const region = getRegionByCode(sido)!;
  const district = getDistrictByCode(sido, sigungu)!;
  const article = await getArticle(articleId);

  if (!article) {
    notFound();
  }

  const breadcrumbs = buildBreadcrumbs(sido, sigungu);
  const fullName = `${region.shortName} ${district.name}`;

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* 브레드크럼 */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center gap-2 text-gray-500 flex-wrap">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.code} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-300">/</span>}
              <Link href={crumb.href} className="hover:text-blue-600">
                {crumb.name}
              </Link>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">기사</span>
          </li>
        </ol>
      </nav>

      {/* 기사 헤더 */}
      <header className="mb-8">
        {/* 카테고리 & 지역 태그 */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {article.category}
          </span>
          <Link
            href={buildRegionPath(sido, sigungu)}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
          >
            📍 {fullName}
          </Link>
        </div>

        {/* 제목 */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
          {article.title}
        </h1>

        {/* 부제목 */}
        {article.subtitle && (
          <p className="text-xl text-gray-600 mb-6">{article.subtitle}</p>
        )}

        {/* 메타 정보 */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-6 border-b border-gray-200">
          <span className="flex items-center gap-1">
            ✍️ {article.author}
          </span>
          <span>
            📅 {new Date(article.publishedAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span>👁️ {article.viewCount.toLocaleString()}회</span>
        </div>
      </header>

      {/* 대표 이미지 */}
      {article.imageUrl && (
        <figure className="mb-8">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full rounded-xl"
          />
        </figure>
      )}

      {/* 기사 본문 */}
      <div
        className="prose prose-lg max-w-none mb-12"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* 공유 버튼 */}
      <div className="flex items-center gap-4 py-6 border-t border-b border-gray-200 mb-8">
        <span className="text-sm text-gray-500">공유하기</span>
        <div className="flex gap-2">
          <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            📋
          </button>
          <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            🐦
          </button>
          <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            📘
          </button>
        </div>
      </div>

      {/* 관련 기사 */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">관련 기사</h2>
        <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
          <p className="text-sm">(관련 기사 목록 표시 예정)</p>
        </div>
      </section>

      {/* 같은 지역 뉴스 */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {fullName} 다른 뉴스
          </h2>
          <Link
            href={buildRegionPath(sido, sigungu)}
            className="text-blue-600 text-sm hover:underline"
          >
            더보기 →
          </Link>
        </div>
        <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
          <p className="text-sm">(같은 지역 뉴스 목록 표시 예정)</p>
        </div>
      </section>
    </article>
  );
}
