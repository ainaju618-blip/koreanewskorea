import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import ShareButton from '@/components/news/ShareButton';
import { getSpecialtyTitle, formatByline } from '@/lib/reporter-utils';
import { getRegionByCode } from '@/constants/regions';
import type { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/seo';

export const dynamic = 'force-dynamic';

// SEO: 동적 메타데이터 생성
export async function generateMetadata({ params }: NewsDetailProps): Promise<Metadata> {
    const { id } = await params;
    const news = await getNewsById(id);

    if (!news) {
        return {
            title: '기사를 찾을 수 없습니다 | 코리아NEWS',
        };
    }

    // 본문에서 160자 추출 (메타 설명용)
    const description = news.ai_summary
        || news.content?.replace(/\[이미지[^\]]*\]:[^\n]+/g, '').slice(0, 160).trim() + '...'
        || '코리아NEWS 본사에서 전하는 대한민국 뉴스';

    const publishedTime = news.published_at || news.created_at;
    const modifiedTime = news.last_edited_at || news.published_at || news.created_at;

    return {
        title: news.title,
        description,
        keywords: [news.category, '전국뉴스', '대한민국', '정책브리핑', '코리아NEWS', news.source].filter(Boolean),
        authors: news.author_name ? [{ name: news.author_name }] : undefined,
        openGraph: {
            title: news.title,
            description,
            type: 'article',
            publishedTime,
            modifiedTime,
            authors: news.author_name ? [news.author_name] : undefined,
            section: news.category,
            tags: [news.category, '전국뉴스', '대한민국'],
            images: news.thumbnail_url ? [
                {
                    url: news.thumbnail_url,
                    width: 1200,
                    height: 630,
                    alt: `${news.title} - 코리아NEWS`,
                }
            ] : [],
            siteName: '코리아NEWS',
            locale: 'ko_KR',
        },
        twitter: {
            card: 'summary_large_image',
            title: news.title,
            description,
            images: news.thumbnail_url ? [news.thumbnail_url] : [],
        },
        alternates: {
            canonical: `https://koreanewsone.com/news/${id}`,
        },
        robots: {
            index: news.status === 'published',
            follow: true,
        },
    };
}

interface NewsDetailProps {
    params: Promise<{ id: string }>;
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

// View count increment function (Phase 3)
async function incrementViewCount(id: string) {
    try {
        // await supabaseAdmin.rpc('increment_view_count', { post_id: id });
    } catch {
        // ignored
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
        '광주': 'bg-cyan-500',
        '전남': 'bg-cyan-600',
        '나주': 'bg-cyan-500',
        'AI': 'bg-violet-500',
        'Global AI': 'bg-indigo-600',
        '교육': 'bg-cyan-600',
        '시정': 'bg-cyan-500',
        '의회': 'bg-slate-600',
        '여행': 'bg-emerald-500',
        '맛집': 'bg-orange-500',
        '비즈니스': 'bg-slate-700',
    };
    return colors[category] || 'bg-cyan-500';
}

// 평문에 줄바꿈 추가 (마침표 뒤 한글이면 문단 분리)
// DB에 <p> 태그 없이 저장된 기사도 올바르게 표시됨
function formatPlainTextToParagraphs(text: string): string {
    // 마침표/느낌표/물음표 + 공백 + 한글 -> 줄바꿈 추가
    const withBreaks = text.replace(/([.!?])\s+(?=[가-힣"'])/g, '$1</p><p>');
    return `<p>${withBreaks}</p>`;
}

// 본문에서 이미지 URL을 실제 img 태그로 변환
// SEO: title 매개변수 추가하여 이미지 alt 텍스트 최적화
function renderContent(content: string, title: string) {
    if (!content) return null;

    // 이미지 패턴: [이미지: URL] 또는 [이미지 N]: URL
    const imagePattern = /\[이미지[^\]]*\]:\s*(https?:\/\/[^\s\n]+)/g;
    const parts: (string | { type: 'image'; url: string; index: number })[] = [];
    let lastIndex = 0;
    let match;
    let imageIndex = 1;

    while ((match = imagePattern.exec(content)) !== null) {
        // 이미지 앞의 텍스트
        if (match.index > lastIndex) {
            parts.push(content.slice(lastIndex, match.index));
        }
        // 이미지 URL (인덱스 포함)
        parts.push({ type: 'image', url: match[1], index: imageIndex++ });
        lastIndex = match.index + match[0].length;
    }

    // 나머지 텍스트
    if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex));
    }

    return (
        <>
            {parts.map((part, i) => {
                if (typeof part === 'string') {
                    // "--- 첨부 이미지 ---" 라인은 숨김
                    const cleanedText = part.replace(/---\s*첨부 이미지\s*---/g, '').trim();
                    if (!cleanedText) return null;

                    // HTML 태그가 포함된 경우 dangerouslySetInnerHTML 사용
                    if (cleanedText.includes('<p>') || cleanedText.includes('<h4>') || cleanedText.includes('<ul>')) {
                        return (
                            <div
                                key={i}
                                className="html-content mb-4"
                                dangerouslySetInnerHTML={{ __html: cleanedText }}
                            />
                        );
                    }

                    // 평문(plain text): 마침표 기준으로 문단 분리하여 HTML로 변환
                    const formattedHtml = formatPlainTextToParagraphs(cleanedText);
                    return (
                        <div
                            key={i}
                            className="html-content mb-4"
                            dangerouslySetInnerHTML={{ __html: formattedHtml }}
                        />
                    );
                } else {
                    // SEO: 의미 있는 alt 텍스트 생성
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
    // Next.js 15+에서 params는 Promise
    const { id } = await params;
    const news = await getNewsById(id);

    if (!news) {
        notFound();
    }

    // 1. Fetch Reporter Info
    // Priority: author_id -> author_name -> null (NO random selection!)
    // Random assignment should ONLY happen at approval time, not on page load
    let reporter = null;

    // Try 1: Match by author_id (references profiles.id -> reporters.user_id)
    if (news.author_id) {
        const { data } = await supabaseAdmin
            .from('reporters')
            .select('id, name, email, region, position, specialty, bio, profile_image, avatar_icon, user_id')
            .eq('user_id', news.author_id)
            .single();
        reporter = data;
    }

    // Try 2: Match by author_name (fallback when author_id not in profiles)
    if (!reporter && news.author_name) {
        const { data } = await supabaseAdmin
            .from('reporters')
            .select('id, name, email, region, position, specialty, bio, profile_image, avatar_icon, user_id')
            .eq('name', news.author_name)
            .eq('status', 'Active')
            .single();
        reporter = data;
    }

    // NO random selection here!
    // If no reporter found, article will display "코리아NEWS 취재팀"
    // To fix articles without author, use bulk-assign-authors API

    const relatedNews = await getRelatedNews(news.category, news.id);

    // 조회수 증가 (Phase 3)
    // await incrementViewCount(id);

    // Get specialty title for SEO
    const reporterTitle = reporter ? getSpecialtyTitle(reporter) : null;
    const authorProfileUrl = reporter
        ? `https://koreanewsone.com/author/${reporter.id}`
        : undefined;

    // SEO: NewsArticle structured data (JSON-LD) - E-E-A-T optimized
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
                name: '코리아NEWS',
                url: 'https://koreanewsone.com',
            },
            sameAs: undefined,
        },
        publisher: {
            '@type': 'NewsMediaOrganization',
            name: '코리아NEWS',
            url: 'https://koreanewsone.com',
            logo: {
                '@type': 'ImageObject',
                url: 'https://koreanewsone.com/logo.png',
                width: 600,
                height: 60,
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://koreanewsone.com/news/${id}`,
        },
        articleSection: news.category,
        keywords: [news.category, '광주', '전남', '지역뉴스'].join(', '),
        isAccessibleForFree: true,
        inLanguage: 'ko-KR',
        // SEO: contentLocation for local news (important for regional search)
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

    // Breadcrumb items for this article
    const breadcrumbItems = [
        ...(news.category ? [{ name: news.category, url: `/category/${news.category.toLowerCase()}` }] : []),
        { name: news.title.length > 50 ? news.title.substring(0, 50) + '...' : news.title, url: `/news/${id}` },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* SEO: NewsArticle Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* SEO: Breadcrumb Schema for navigation */}
            <BreadcrumbSchema items={breadcrumbItems} />
            {/* 상단 네비게이션 */}
            <div className="bg-slate-50 border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">홈으로</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {/* 공유 버튼 */}
                        <ShareButton title={news.title} />
                    </div>
                </div>
            </div>

            {/* 메인 콘텐츠 */}
            <article className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                {/* 카테고리 & 날짜 */}
                <div className="flex items-center gap-3 mb-6">
                    <span className={`px-3 py-1 text-xs font-bold text-white rounded ${getCategoryColor(news.category)}`}>
                        {news.category}
                    </span>
                    <span className="text-sm text-slate-400 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {news.published_at ? formatDate(news.published_at) : formatDate(news.created_at)}
                    </span>
                </div>

                {/* 제목 - 조선일보명조 적용 */}
                <h1 className="text-3xl md:text-[40px] font-serif font-bold text-gray-900 leading-tight mb-4 tracking-tight">
                    {news.title}
                </h1>

                {/* 부제목 (신규 추가) */}
                {news.subtitle && (
                    <div className="mb-6 pl-4 border-l-4 border-[color:var(--color-primary)]">
                        <h2 className="text-xl md:text-2xl font-medium text-gray-700 leading-relaxed">
                            {news.subtitle}
                        </h2>
                    </div>
                )}

                {/* Byline - SEO/E-E-A-T optimized format: (region=koreaNews) name title */}
                <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-t border-b border-gray-200 mb-8 bg-gray-50/50 px-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2 md:mb-0">
                        {/* Reporter Info (Linked to Profile) */}
                        {reporter ? (
                            <Link
                                href={`/author/${reporter.id}`}
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

                        {/* 공유 버튼 */}
                        <ShareButton title={news.title} size="sm" className="p-1.5" />
                    </div>
                </div>



                {/* 썸네일 이미지 - SEO 최적화 */}
                {news.thumbnail_url && (
                    <figure className="mb-6 text-center">
                        <img
                            src={news.thumbnail_url}
                            alt={`${news.title} - ${news.category} 뉴스 | 코리아NEWS`}
                            className="max-w-full h-auto mx-auto rounded-lg shadow-sm"
                            loading="eager"
                        />
                        <figcaption className="mt-2 text-sm text-gray-500">
                            {news.title} 관련 이미지 ⓒ 코리아NEWS
                        </figcaption>
                    </figure>
                )}

                {/* Summary Box - displayed from ai_summary field (below image) */}
                {news.ai_summary && (
                    <div className="article-summary bg-gradient-to-br from-cyan-50 to-cyan-100 border-l-4 border-cyan-500 px-5 py-4 mb-10 rounded-r-lg text-[1.05em] leading-relaxed text-cyan-900">
                        {news.ai_summary}
                    </div>
                )}

                {/* 본문 */}
                <div id="article-body" className="prose prose-lg max-w-none mb-12 text-gray-800 leading-[1.8] tracking-wide break-keep">
                    {renderContent(news.content, news.title)}
                </div>

                {/* 태그 (키워드) - 클릭 시 태그별 기사 목록으로 이동 */}
                {news.tags && news.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-12">
                        {news.tags.map((tag: string, i: number) => (
                            <Link
                                key={i}
                                href={`/tag/${encodeURIComponent(tag)}`}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                                #{tag}
                            </Link>
                        ))}
                    </div>
                )}

                {/* 기사 요약 박스 제거됨 - AI가 본문 상단에 요약을 이미 포함하므로 중복 */}

                {/* 관련 기사 */}
                {relatedNews.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-cyan-500 rounded"></span>
                            관련 기사
                        </h3>
                        <ul className="space-y-3">
                            {relatedNews.map((item: any) => (
                                <li key={item.id}>
                                    <Link
                                        href={`/news/${item.id}`}
                                        className="block text-sm font-medium text-gray-700 hover:text-cyan-600 transition-colors line-clamp-1"
                                    >
                                        • {item.title}
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
