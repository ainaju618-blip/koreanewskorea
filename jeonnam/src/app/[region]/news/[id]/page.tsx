import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import ShareButton from '@/components/news/ShareButton';
import { getSpecialtyTitle } from '@/lib/reporter-utils';
import { getRegionByCode } from '@/constants/regions';
import { getSiteConfig, isValidRegion, BASE_DOMAIN } from '@/config/site-regions';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface NewsDetailProps {
    params: Promise<{ region: string; id: string }>;
}

// SEO: Dynamic metadata generation
export async function generateMetadata({ params }: NewsDetailProps): Promise<Metadata> {
    const { region, id } = await params;
    const config = getSiteConfig(region);
    const news = await getNewsById(id);

    if (!news) {
        return {
            title: `기사를 찾을 수 없습니다 | ${config.name} | 코리아NEWS`,
        };
    }

    const description = news.ai_summary
        || news.content?.replace(/\[이미지[^\]]*\]:[^\n]+/g, '').slice(0, 160).trim() + '...'
        || `${config.name} 코리아NEWS에서 전하는 지역 소식`;

    const publishedTime = news.published_at || news.created_at;
    const modifiedTime = news.last_edited_at || news.published_at || news.created_at;

    return {
        title: `${news.title} | ${config.name}`,
        description,
        keywords: [news.category, config.name, '지역뉴스', '코리아NEWS', news.source].filter(Boolean),
        authors: news.author_name ? [{ name: news.author_name }] : undefined,
        openGraph: {
            title: news.title,
            description,
            type: 'article',
            publishedTime,
            modifiedTime,
            authors: news.author_name ? [news.author_name] : undefined,
            section: news.category,
            tags: [news.category, config.name],
            images: news.thumbnail_url ? [
                {
                    url: news.thumbnail_url,
                    width: 1200,
                    height: 630,
                    alt: `${news.title} - ${config.name} 코리아NEWS`,
                }
            ] : [],
            siteName: `${config.name} 코리아NEWS`,
            locale: 'ko_KR',
        },
        twitter: {
            card: 'summary_large_image',
            title: news.title,
            description,
            images: news.thumbnail_url ? [news.thumbnail_url] : [],
        },
        alternates: {
            canonical: `${BASE_DOMAIN}/${region}/news/${id}`,
        },
        robots: {
            index: news.status === 'published',
            follow: true,
        },
    };
}

async function getNewsById(id: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return data;
    } catch {
        return null;
    }
}

async function getRelatedNews(category: string, currentId: string) {
    try {
        const { data } = await supabaseAdmin
            .from('posts')
            .select('id, title, category, published_at')
            .eq('status', 'published')
            .eq('category', category)
            .neq('id', currentId)
            .order('published_at', { ascending: false })
            .limit(5);
        return data || [];
    } catch {
        return [];
    }
}

const REPORTER_SELECT_FIELDS = 'id, name, email, region, position, specialty, bio, profile_image, avatar_icon, user_id';

async function getRandomReporter(articleRegion?: string) {
    try {
        let koreanRegionName: string | null = null;
        if (articleRegion) {
            const regionInfo = getRegionByCode(articleRegion);
            koreanRegionName = regionInfo?.name || null;
        }

        if (koreanRegionName) {
            const { data: regionReporters } = await supabaseAdmin
                .from('reporters')
                .select(REPORTER_SELECT_FIELDS)
                .eq('status', 'Active')
                .eq('type', 'Human')
                .eq('region', koreanRegionName);

            if (regionReporters && regionReporters.length > 0) {
                const randomIndex = Math.floor(Math.random() * regionReporters.length);
                return regionReporters[randomIndex];
            }
        }

        const { data: allRegionReporters } = await supabaseAdmin
            .from('reporters')
            .select(REPORTER_SELECT_FIELDS)
            .eq('status', 'Active')
            .eq('type', 'Human')
            .eq('region', '전체');

        if (allRegionReporters && allRegionReporters.length > 0) {
            const randomIndex = Math.floor(Math.random() * allRegionReporters.length);
            return allRegionReporters[randomIndex];
        }

        const { data: anyReporters } = await supabaseAdmin
            .from('reporters')
            .select(REPORTER_SELECT_FIELDS)
            .eq('status', 'Active')
            .eq('type', 'Human')
            .limit(10);

        if (anyReporters && anyReporters.length > 0) {
            const randomIndex = Math.floor(Math.random() * anyReporters.length);
            return anyReporters[randomIndex];
        }

        return null;
    } catch {
        return null;
    }
}

function formatDate(dateString: string) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}. ${month}. ${day}. ${hour}:${minute}`;
}

function getCategoryColor(category: string) {
    const colors: Record<string, string> = {
        '광주': 'bg-blue-500',
        '전남': 'bg-green-500',
        '나주': 'bg-teal-500',
        'AI': 'bg-violet-500',
        'Global AI': 'bg-indigo-600',
        '교육': 'bg-indigo-500',
    };
    return colors[category] || 'bg-slate-500';
}

function formatPlainTextToParagraphs(text: string): string {
    const withBreaks = text.replace(/([.!?])\s+(?=[가-힣"'])/g, '$1</p><p>');
    return `<p>${withBreaks}</p>`;
}

function renderContent(content: string, title: string) {
    if (!content) return null;

    const imagePattern = /\[이미지[^\]]*\]:\s*(https?:\/\/[^\s\n]+)/g;
    const parts: (string | { type: 'image'; url: string; index: number })[] = [];
    let lastIndex = 0;
    let match;
    let imageIndex = 1;

    while ((match = imagePattern.exec(content)) !== null) {
        if (match.index > lastIndex) {
            parts.push(content.slice(lastIndex, match.index));
        }
        parts.push({ type: 'image', url: match[1], index: imageIndex++ });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex));
    }

    return (
        <>
            {parts.map((part, i) => {
                if (typeof part === 'string') {
                    const cleanedText = part.replace(/---\s*첨부 이미지\s*---/g, '').trim();
                    if (!cleanedText) return null;

                    if (cleanedText.includes('<p>') || cleanedText.includes('<h4>') || cleanedText.includes('<ul>')) {
                        return (
                            <div
                                key={i}
                                className="html-content mb-4"
                                dangerouslySetInnerHTML={{ __html: cleanedText }}
                            />
                        );
                    }

                    const formattedHtml = formatPlainTextToParagraphs(cleanedText);
                    return (
                        <div
                            key={i}
                            className="html-content mb-4"
                            dangerouslySetInnerHTML={{ __html: formattedHtml }}
                        />
                    );
                } else {
                    const altText = `${title} 관련 이미지 ${part.index} - 코리아NEWS`;
                    return (
                        <div key={i} className="my-6">
                            <img
                                src={part.url}
                                alt={altText}
                                className="max-w-full h-auto rounded-lg shadow-md"
                                loading="lazy"
                            />
                        </div>
                    );
                }
            })}
        </>
    );
}

export default async function NewsDetailPage({ params }: NewsDetailProps) {
    const { region, id } = await params;

    if (!isValidRegion(region)) {
        notFound();
    }

    const config = getSiteConfig(region);
    const news = await getNewsById(id);

    if (!news) {
        notFound();
    }

    let reporter = null;

    if (news.author_id) {
        const { data } = await supabaseAdmin
            .from('reporters')
            .select(REPORTER_SELECT_FIELDS)
            .eq('user_id', news.author_id)
            .single();
        reporter = data;
    }

    if (!reporter && news.author_name) {
        const { data } = await supabaseAdmin
            .from('reporters')
            .select(REPORTER_SELECT_FIELDS)
            .eq('name', news.author_name)
            .eq('status', 'Active')
            .single();
        reporter = data;
    }

    if (!reporter) {
        reporter = await getRandomReporter(news.region);
    }

    const relatedNews = await getRelatedNews(news.category, news.id);
    const reporterTitle = reporter ? getSpecialtyTitle(reporter) : null;
    const authorProfileUrl = reporter ? `${BASE_DOMAIN}/${region}/author/${reporter.id}` : undefined;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: news.title,
        description: news.ai_summary || news.content?.slice(0, 160),
        image: news.thumbnail_url ? [news.thumbnail_url] : [],
        datePublished: news.published_at || news.created_at,
        dateModified: news.last_edited_at || news.published_at || news.created_at,
        author: {
            '@type': 'Person',
            name: reporter?.name || news.author_name || '코리아NEWS 취재팀',
            url: authorProfileUrl,
            jobTitle: reporterTitle || undefined,
            worksFor: {
                '@type': 'NewsMediaOrganization',
                name: `${config.name} 코리아NEWS`,
                url: `${BASE_DOMAIN}/${region}`,
            },
        },
        publisher: {
            '@type': 'NewsMediaOrganization',
            name: `${config.name} 코리아NEWS`,
            url: `${BASE_DOMAIN}/${region}`,
            logo: {
                '@type': 'ImageObject',
                url: `${BASE_DOMAIN}/logo.png`,
                width: 600,
                height: 60,
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${BASE_DOMAIN}/${region}/news/${id}`,
        },
        articleSection: news.category,
        keywords: [news.category, config.name, '지역뉴스'].join(', '),
        isAccessibleForFree: true,
        inLanguage: 'ko-KR',
        ...(news.region && {
            contentLocation: {
                '@type': 'Place',
                name: getRegionByCode(news.region)?.name || news.region,
                address: {
                    '@type': 'PostalAddress',
                    addressRegion: '전라남도',
                    addressCountry: 'KR',
                },
            },
        }),
    };

    return (
        <div className="min-h-screen bg-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="bg-slate-50 border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href={`/${region}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">홈으로</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <ShareButton title={news.title} />
                    </div>
                </div>
            </div>

            <article className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                <div className="flex items-center gap-3 mb-6">
                    <span className={`px-3 py-1 text-xs font-bold text-white rounded ${getCategoryColor(news.category)}`}>
                        {news.category}
                    </span>
                    <span className="text-sm text-slate-400 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {news.published_at ? formatDate(news.published_at) : formatDate(news.created_at)}
                    </span>
                </div>

                <h1 className="text-3xl md:text-[40px] font-serif font-bold text-gray-900 leading-tight mb-4 tracking-tight">
                    {news.title}
                </h1>

                {news.subtitle && (
                    <div className="mb-6 pl-4 border-l-4 border-[color:var(--color-primary)]">
                        <h2 className="text-xl md:text-2xl font-medium text-gray-700 leading-relaxed">
                            {news.subtitle}
                        </h2>
                    </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-t border-b border-gray-200 mb-8 bg-gray-50/50 px-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2 md:mb-0">
                        {reporter ? (
                            <Link
                                href={`/${region}/author/${reporter.id}`}
                                rel="author"
                                className="font-bold text-gray-800 text-[15px] hover:text-blue-600 hover:underline"
                            >
                                {reporter.region && reporter.region !== '전체' ? (
                                    <>
                                        <span className="text-gray-500 font-normal">({reporter.region}=코리아뉴스)</span>
                                        {' '}{reporter.name} {reporterTitle}
                                    </>
                                ) : (
                                    <>코리아뉴스 {reporter.name} {reporterTitle}</>
                                )}
                            </Link>
                        ) : (
                            <div className="font-bold text-gray-800 text-[15px]">
                                코리아NEWS 취재팀
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-[13px] text-gray-500 flex flex-col md:flex-row md:gap-3">
                            {news.published_at && (
                                <span>최초 게시: {formatDate(news.published_at)}</span>
                            )}
                            {news.last_edited_at && (
                                <span>수정: {formatDate(news.last_edited_at)}</span>
                            )}
                        </div>
                        <ShareButton title={news.title} size="sm" className="p-1.5" />
                    </div>
                </div>

                {news.thumbnail_url && (
                    <figure className="mb-6 text-center">
                        <img
                            src={news.thumbnail_url}
                            alt={`${news.title} - ${news.category} 뉴스 | ${config.name} 코리아NEWS`}
                            className="max-w-full h-auto mx-auto rounded-lg shadow-sm"
                            loading="eager"
                        />
                        <figcaption className="mt-2 text-sm text-gray-500">
                            {news.title} 관련 이미지 - {config.name} 코리아NEWS
                        </figcaption>
                    </figure>
                )}

                {news.ai_summary && (
                    <div className="article-summary bg-gradient-to-br from-sky-50 to-sky-100 border-l-4 border-sky-600 px-5 py-4 mb-10 rounded-r-lg text-[1.05em] leading-relaxed text-sky-900">
                        {news.ai_summary}
                    </div>
                )}

                <div id="article-body" className="prose prose-lg max-w-none mb-12 text-gray-800 leading-[1.8] tracking-wide break-keep">
                    {renderContent(news.content, news.title)}
                </div>

                {news.tags && news.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-12">
                        {news.tags.map((tag: string, i: number) => (
                            <Link
                                key={i}
                                href={`/${region}/tag/${encodeURIComponent(tag)}`}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                                #{tag}
                            </Link>
                        ))}
                    </div>
                )}

                {relatedNews.length > 0 && (
                    <div className="bg-slate-50 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-indigo-500 rounded"></span>
                            관련 기사
                        </h3>
                        <ul className="space-y-3">
                            {relatedNews.map((item: any) => (
                                <li key={item.id}>
                                    <Link
                                        href={`/${region}/news/${item.id}`}
                                        className="block text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors line-clamp-1"
                                    >
                                        - {item.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </article>
        </div>
    );
}
