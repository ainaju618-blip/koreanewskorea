import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, ExternalLink, Share2, Facebook, Twitter } from 'lucide-react';

export const dynamic = 'force-dynamic';

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

// 조회수 증가 함수 (Phase 3에서 활성화)
// 조회수 증가 함수 (Phase 3에서 활성화)
async function incrementViewCount(id: string) {
    try {
        // await supabaseAdmin.rpc('increment_view_count', { post_id: id });
    } catch {
        // 무시
    }
}

function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
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

// 본문에서 이미지 URL을 실제 img 태그로 변환
function renderContent(content: string) {
    if (!content) return null;

    // 이미지 패턴: [이미지: URL] 또는 [이미지 N]: URL
    const imagePattern = /\[이미지[^\]]*\]:\s*(https?:\/\/[^\s\n]+)/g;
    const parts: (string | { type: 'image'; url: string })[] = [];
    let lastIndex = 0;
    let match;

    while ((match = imagePattern.exec(content)) !== null) {
        // 이미지 앞의 텍스트
        if (match.index > lastIndex) {
            parts.push(content.slice(lastIndex, match.index));
        }
        // 이미지 URL
        parts.push({ type: 'image', url: match[1] });
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
                    return cleanedText ? (
                        <div key={i} className="whitespace-pre-wrap leading-relaxed text-slate-700 mb-4">
                            {cleanedText}
                        </div>
                    ) : null;
                } else {
                    return (
                        <div key={i} className="my-6">
                            <img
                                src={part.url}
                                alt="기사 이미지"
                                className="max-w-full h-auto rounded-lg shadow-md"
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

    const relatedNews = await getRelatedNews(news.category, news.id);

    // 조회수 증가 (Phase 3)
    // await incrementViewCount(id);

    return (
        <div className="min-h-screen bg-white">
            {/* 상단 네비게이션 */}
            <div className="bg-slate-50 border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">홈으로</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {/* 공유 버튼 (Phase 3) */}
                        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="공유하기">
                            <Share2 className="w-5 h-5" />
                        </button>
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
                        {formatDate(news.published_at || news.created_at)}
                    </span>
                </div>

                {/* 제목 */}
                <h1 className="text-3xl md:text-[40px] font-bold text-gray-900 leading-tight mb-4 tracking-tight">
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

                {/* 기자 및 메타 정보 (강원일보 스타일) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-t border-b border-gray-200 mb-8 bg-gray-50/50 px-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2 md:mb-0">
                        {/* 기자 정보 (Mock or Real) - Author logic will be improved later */}
                        <div className="font-bold text-gray-800 text-[15px]">
                            {/* Assuming reporter info might come from author_id relation later, using static for now or news.author_name if available */}
                            취재기자
                        </div>
                        <span className="text-gray-300">|</span>
                        <a href={`mailto:news@koreanews.com`} className="text-gray-500 hover:text-blue-600 text-[14px]">
                            news@koreanews.com
                        </a>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-[13px] text-gray-500 flex flex-col md:flex-row md:gap-2">
                            <span>입력: {formatDate(news.created_at)}</span>
                            {news.published_at && news.published_at !== news.created_at && (
                                <span className="text-gray-400"> (수정: {formatDate(news.published_at)})</span>
                            )}
                        </div>

                        {/* 공유 버튼 (작게 배치) */}
                        <div className="flex items-center gap-1">
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-gray-400 hover:text-[#1877F2] transition-colors"
                                title="페이스북 공유"
                            >
                                <Facebook className="w-4 h-4" />
                            </a>
                            <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(news.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-gray-400 hover:text-[#1DA1F2] transition-colors"
                                title="X(트위터) 공유"
                            >
                                <Twitter className="w-4 h-4" />
                            </a>
                            <button className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors" title="URL 복사">
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* AI 요약 (있는 경우) */}
                {news.ai_summary && (
                    <div className="bg-slate-50 border-l-4 border-indigo-500 p-6 mb-8 rounded-r-lg">
                        <p className="text-[15px] font-medium text-slate-700 leading-relaxed">
                            <span className="text-indigo-600 font-bold block mb-2">✨ AI 요약</span>
                            {news.ai_summary}
                        </p>
                    </div>
                )}

                {/* 썸네일 이미지 */}
                {news.thumbnail_url && (
                    <div className="mb-10 text-center">
                        <img
                            src={news.thumbnail_url}
                            alt={news.title}
                            className="max-w-full h-auto mx-auto rounded-lg shadow-sm"
                        />
                        <p className="mt-2 text-sm text-gray-500">
                            {/* 캡션 기능이 추가되면 여기에 표시 */}
                            {news.title} 관련 이미지
                        </p>
                    </div>
                )}

                {/* 본문 */}
                <div id="article-body" className="prose prose-lg max-w-none mb-12 text-gray-800 leading-[1.8] tracking-wide break-keep">
                    {renderContent(news.content)}
                </div>

                {/* 관련 기사 */}
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
                                        href={`/news/${item.id}`}
                                        className="block text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors line-clamp-1"
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
