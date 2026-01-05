import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-server';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * Category Section - 본사(전국판) 분야별 뉴스 섹션
 * ================================================
 * 각 분야별 카드 뉴스 형태로 표시
 *
 * TODO: DB에 scope 필드 추가 후 WHERE scope = 'national' 필터링
 */

interface Article {
  id: string;
  title: string;
  ai_summary?: string;
  thumbnail_url?: string;
  category?: string;
  published_at: string;
}

interface CategorySectionProps {
  categoryName: string;
  categoryNameEn: string;
  categorySlug: string;
  categories?: string[]; // Multiple categories for combined sections like "정치/경제"
  limit?: number;
  accentColor?: string;
}

async function getCategoryArticles(categories: string[], limit: number): Promise<Article[]> {
  const supabase = await createClient();

  // Build OR filter for multiple categories
  const categoryFilter = categories.map(cat => `category.eq.${cat}`).join(',');

  const { data } = await supabase
    .from('posts')
    .select('id, title, ai_summary, thumbnail_url, category, published_at')
    .eq('status', 'published')
    .or(categoryFilter)
    // TODO: Add scope filter when field is added
    // .eq('scope', 'national')
    .order('published_at', { ascending: false })
    .limit(limit);

  return data || [];
}

export default async function CategorySection({
  categoryName,
  categoryNameEn,
  categorySlug,
  categories,
  limit = 5,
  accentColor = '#A6121D',
}: CategorySectionProps) {
  const categoryList = categories || [categoryName];
  const articles = await getCategoryArticles(categoryList, limit);

  if (articles.length === 0) {
    return null;
  }

  const [mainArticle, ...sideArticles] = articles;

  return (
    <section className="mb-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6" style={{ backgroundColor: accentColor }} />
          <h2 className="text-xl font-bold text-slate-900">{categoryName}</h2>
          <span className="text-sm text-slate-500">{categoryNameEn}</span>
        </div>
        <Link
          href={`/category/${categorySlug}`}
          className="text-sm hover:underline"
          style={{ color: accentColor }}
        >
          더보기 →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Article (Left) */}
        <div className="lg:col-span-5">
          <Link href={`/news/${mainArticle.id}`} className="group block">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-md mb-3">
              {mainArticle.thumbnail_url ? (
                <Image
                  src={mainArticle.thumbnail_url}
                  alt={mainArticle.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <span className="text-4xl text-slate-300">📰</span>
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#A6121D] transition-colors line-clamp-2 mb-2">
              {mainArticle.title}
            </h3>
            {mainArticle.ai_summary && (
              <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                {mainArticle.ai_summary}
              </p>
            )}
            <time className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(mainArticle.published_at), {
                addSuffix: true,
                locale: ko
              })}
            </time>
          </Link>
        </div>

        {/* Side Articles (Right) */}
        <div className="lg:col-span-7">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sideArticles.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.id}`}
                className="group block"
              >
                <div className="relative aspect-[4/3] rounded-md overflow-hidden shadow-sm mb-2">
                  {article.thumbnail_url ? (
                    <Image
                      src={article.thumbnail_url}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <span className="text-2xl text-slate-300">📰</span>
                    </div>
                  )}
                </div>
                <h4 className="text-sm font-medium text-slate-800 group-hover:text-[#A6121D] transition-colors line-clamp-2">
                  {article.title}
                </h4>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="w-full h-px bg-slate-100 mt-8" />
    </section>
  );
}
