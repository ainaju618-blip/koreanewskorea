import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-server';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowRight } from 'lucide-react';

/**
 * CategoryNewsGrid - 카테고리별 뉴스 그리드
 * ==========================================
 * 선택된 카테고리의 뉴스 6개 표시
 * 반응형: 1열 (모바일) → 2열 (태블릿) → 3열 (데스크탑)
 */

interface Article {
  id: string;
  title: string;
  ai_summary?: string;
  thumbnail_url?: string;
  category?: string;
  published_at: string;
  view_count?: number;
}

interface CategoryNewsGridProps {
  category?: string;
  limit?: number;
  showMoreLink?: boolean;
}

// Category 매핑
const CATEGORY_MAP: Record<string, string[]> = {
  all: [],
  politics: ['정치', '경제', '국회', '청와대', '기획재정부'],
  education: ['교육', '문화', '예술', '교육부', '문화체육관광부'],
  society: ['사회', '복지', '보건', '보건복지부', '고용노동부'],
  tech: ['AI', '과학', '기술', '과학기술정보통신부', '산업통상자원부'],
  region: ['지역', '광주', '전남', '전북'],
  trending: [],
};

async function getCategoryNews(category: string, limit: number): Promise<Article[]> {
  const supabase = await createClient();

  let query = supabase
    .from('posts')
    .select('id, title, ai_summary, thumbnail_url, category, published_at, view_count')
    .eq('status', 'published');

  // 카테고리 필터링
  if (category === 'trending') {
    query = query.order('view_count', { ascending: false, nullsFirst: false });
  } else if (category !== 'all' && CATEGORY_MAP[category]?.length > 0) {
    // 여러 카테고리 키워드로 필터링
    const keywords = CATEGORY_MAP[category];
    query = query.or(keywords.map(k => `category.ilike.%${k}%`).join(','));
  }

  query = query.order('published_at', { ascending: false }).limit(limit);

  const { data } = await query;
  return data || [];
}

export default async function CategoryNewsGrid({
  category = 'all',
  limit = 6,
  showMoreLink = true,
}: CategoryNewsGridProps) {
  const articles = await getCategoryNews(category, limit);

  if (articles.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">해당 카테고리의 뉴스가 없습니다.</p>
      </div>
    );
  }

  return (
    <section className="py-6">
      {/* 뉴스 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map((article, index) => (
          <Link
            key={article.id}
            href={`/news/${article.id}`}
            className="group block bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {/* 이미지 */}
            <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
              {article.thumbnail_url ? (
                <Image
                  src={article.thumbnail_url}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  priority={index < 3}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                  <span className="text-4xl">📰</span>
                </div>
              )}

              {/* 카테고리 뱃지 */}
              {article.category && (
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#A6121D] text-white text-xs font-medium rounded">
                  {article.category}
                </span>
              )}
            </div>

            {/* 콘텐츠 */}
            <div className="p-4">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-[#A6121D] line-clamp-2 leading-snug mb-2 transition-colors">
                {article.title}
              </h3>

              {article.ai_summary && (
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                  {article.ai_summary}
                </p>
              )}

              {/* 메타 정보 */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <time dateTime={new Date(article.published_at).toISOString()}>
                  {formatDistanceToNow(new Date(article.published_at), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </time>
                {article.view_count !== undefined && article.view_count > 0 && (
                  <span className="flex items-center gap-1">
                    <span>👁️</span>
                    {article.view_count.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 더보기 링크 */}
      {showMoreLink && (
        <div className="mt-6 text-center">
          <Link
            href={category === 'all' ? '/news' : `/category/${category}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <span>더 많은 뉴스 보기</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </section>
  );
}

// Skeleton for loading
export function CategoryNewsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl overflow-hidden border border-slate-200"
          >
            <div className="aspect-[16/9] bg-slate-200 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-slate-200 rounded animate-pulse" />
              <div className="h-5 bg-slate-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
