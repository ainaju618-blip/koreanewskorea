import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import { ArrowLeft, Tag, Clock } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface TagPageProps {
    params: Promise<{ tag: string }>;
}

// Site URL for canonical
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koreanewsone.com';

// SEO: Dynamic metadata
export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
    const { tag } = await params;
    const decodedTag = decodeURIComponent(tag);

    return {
        title: `#${decodedTag} - 태그별 기사 | 코리아NEWS`,
        description: `${decodedTag} 관련 뉴스 모음 - 광주, 전남 지역 소식을 전하는 코리아NEWS`,
        openGraph: {
            title: `#${decodedTag} - 태그별 기사 | 코리아NEWS`,
            description: `${decodedTag} 관련 뉴스 모음`,
            type: 'website',
            siteName: '코리아NEWS',
            url: `${siteUrl}/tag/${tag}`,
            images: [`${siteUrl}/og-image.png`],
        },
        twitter: {
            card: 'summary_large_image',
            title: `#${decodedTag} - 태그별 기사 | 코리아NEWS`,
            description: `${decodedTag} 관련 뉴스 모음`,
            images: [`${siteUrl}/og-image.png`],
        },
        alternates: {
            canonical: `${siteUrl}/tag/${tag}`,
        },
    };
}

async function getArticlesByTag(tag: string) {
    try {
        // Query articles where tags array contains the tag
        const { data, error } = await supabaseAdmin
            .from('posts')
            .select('id, title, subtitle, ai_summary, category, published_at, thumbnail_url, tags, source')
            .eq('status', 'published')
            .contains('tags', [tag])
            .order('published_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching articles by tag:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Error:', err);
        return [];
    }
}

function formatDate(dateString: string) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
}

function getCategoryColor(category: string) {
    const colors: Record<string, string> = {
        '광주': 'bg-blue-500',
        '전남': 'bg-green-500',
        '나주': 'bg-teal-500',
        'AI': 'bg-violet-500',
        '교육': 'bg-indigo-500',
    };
    return colors[category] || 'bg-slate-500';
}

export default async function TagPage({ params }: TagPageProps) {
    const { tag } = await params;
    const decodedTag = decodeURIComponent(tag);
    const articles = await getArticlesByTag(decodedTag);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">홈으로</span>
                    </Link>
                </div>
            </div>

            {/* Tag Header */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 py-12 px-4">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                        <Tag className="w-5 h-5 text-white" />
                        <span className="text-white/90 text-sm">태그 검색</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        #{decodedTag}
                    </h1>
                    <p className="text-white/80">
                        {articles.length}개의 관련 기사
                    </p>
                </div>
            </div>

            {/* Articles List */}
            <div className="max-w-5xl mx-auto px-4 py-8">
                {articles.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-gray-400 mb-4">
                            <Tag className="w-16 h-16 mx-auto opacity-50" />
                        </div>
                        <h2 className="text-xl font-medium text-gray-600 mb-2">
                            관련 기사가 없습니다
                        </h2>
                        <p className="text-gray-500">
                            다른 태그를 검색해 보세요
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {articles.map((article) => (
                            <Link
                                key={article.id}
                                href={`/news/${article.id}`}
                                className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden"
                            >
                                <div className="flex flex-col md:flex-row">
                                    {/* Thumbnail */}
                                    {article.thumbnail_url && (
                                        <div className="md:w-48 h-40 md:h-auto flex-shrink-0">
                                            <img
                                                src={article.thumbnail_url}
                                                alt={article.title}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 p-5">
                                        {/* Category & Date */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-0.5 text-xs font-medium text-white rounded ${getCategoryColor(article.category)}`}>
                                                {article.category}
                                            </span>
                                            {article.published_at && (
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(article.published_at)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                                            {article.title}
                                        </h2>

                                        {/* Subtitle or Summary */}
                                        {(article.subtitle || article.ai_summary) && (
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                {article.subtitle || article.ai_summary}
                                            </p>
                                        )}

                                        {/* Tags */}
                                        {article.tags && article.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {article.tags.slice(0, 5).map((t: string, i: number) => (
                                                    <span
                                                        key={i}
                                                        className={`px-2 py-0.5 text-xs rounded-full ${
                                                            t === decodedTag
                                                                ? 'bg-blue-100 text-blue-700 font-medium'
                                                                : 'bg-gray-100 text-gray-500'
                                                        }`}
                                                    >
                                                        #{t}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
