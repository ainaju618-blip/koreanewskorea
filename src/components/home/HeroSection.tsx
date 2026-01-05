'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Eye, Clock, ChevronRight } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  excerpt?: string;
  thumbnail?: string;
  category?: string;
  author?: string;
  publishedAt?: string;
  views?: number;
}

interface HeroSectionProps {
  mainArticle?: Article;
  policyArticles?: Article[];
}

// 샘플 데이터 (실제 API 연동 시 제거)
const defaultMainArticle: Article = {
  id: '1',
  title: '정부, 내년도 AI 기술 지원 예산 2배 확대... "디지털 강국 도약"',
  excerpt: '과학기술정보통신부는 오늘 브리핑을 통해 인공지능 분야의 글로벌 경쟁력을 강화하기 위한 대규모 예산 증액안을 발표했습니다. 중소기업 기술 지원과 인재 양성에 집중될 예정입니다.',
  thumbnail: '/images/placeholder-news.jpg',
  category: '정치',
  author: '김한국 기자',
  publishedAt: '2024.01.05',
  views: 15000,
};

const defaultPolicyArticles: Article[] = [
  {
    id: '2',
    title: '하반기 소상공인 대출 금리 인하 정책 발표',
    thumbnail: '/images/placeholder-news-2.jpg',
    category: '경제',
    publishedAt: '2024.01.05 14:00',
  },
  {
    id: '3',
    title: '신도시 주택 공급 계획 수정안 공고',
    thumbnail: '/images/placeholder-news-3.jpg',
    category: '부동산',
    publishedAt: '2024.01.05 11:30',
  },
  {
    id: '4',
    title: '국가 첨단 전략 산업 특화단지 지정 결과',
    thumbnail: '/images/placeholder-news-4.jpg',
    category: '산업',
    publishedAt: '2024.01.05 09:15',
  },
];

export default function HeroSection({
  mainArticle = defaultMainArticle,
  policyArticles = defaultPolicyArticles,
}: HeroSectionProps) {
  const formatViews = (views: number) => {
    if (views >= 10000) return `${(views / 10000).toFixed(1)}만`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}천`;
    return views.toString();
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 메인 뉴스 카드 (좌측 60%) */}
      <article className="lg:col-span-7 xl:col-span-8 flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer hover:shadow-md transition-shadow">
        <Link href={`/news/${mainArticle.id}`} className="block">
          <div className="relative aspect-video w-full overflow-hidden">
            {/* 카테고리 뱃지 */}
            <div className="absolute top-4 left-4 z-10 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              {mainArticle.category}
            </div>

            {/* 썸네일 이미지 */}
            {mainArticle.thumbnail ? (
              <Image
                src={mainArticle.thumbnail}
                alt={mainArticle.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                <span className="text-slate-400 text-lg">이미지 없음</span>
              </div>
            )}
          </div>

          <div className="p-5 flex flex-col gap-3">
            <h2 className="text-2xl font-bold leading-tight text-slate-900 group-hover:text-primary transition-colors font-serif">
              {mainArticle.title}
            </h2>

            {mainArticle.excerpt && (
              <p className="text-slate-500 line-clamp-2 leading-relaxed text-base">
                {mainArticle.excerpt}
              </p>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              {mainArticle.author && (
                <span className="font-medium text-primary">{mainArticle.author}</span>
              )}
              <span>•</span>
              <span>{mainArticle.publishedAt}</span>
              {mainArticle.views && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {formatViews(mainArticle.views)}
                  </span>
                </>
              )}
            </div>
          </div>
        </Link>
      </article>

      {/* 정책 브리핑 리스트 (우측 40%) */}
      <aside className="lg:col-span-5 xl:col-span-4 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 h-full">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 font-serif">
            <Clock className="w-5 h-5 text-primary" />
            최신 정책 브리핑
          </h3>
          <Link
            href="/category/policy"
            className="text-xs text-slate-500 hover:text-primary font-medium flex items-center gap-1"
          >
            더보기 <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 기사 리스트 */}
        <div className="flex flex-col divide-y divide-gray-100">
          {policyArticles.map((article) => (
            <Link
              key={article.id}
              href={`/news/${article.id}`}
              className="flex gap-4 p-4 hover:bg-slate-50 transition-colors group"
            >
              {/* 썸네일 */}
              <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-slate-200">
                {article.thumbnail ? (
                  <Image
                    src={article.thumbnail}
                    alt={article.title}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
                )}
              </div>

              {/* 텍스트 */}
              <div className="flex flex-col justify-center">
                <span className="text-xs font-bold text-primary mb-1">
                  {article.category}
                </span>
                <h4 className="text-sm font-bold text-slate-900 leading-snug group-hover:underline decoration-primary underline-offset-2 line-clamp-2">
                  {article.title}
                </h4>
                <span className="text-xs text-slate-500 mt-1">
                  {article.publishedAt}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </aside>
    </section>
  );
}
