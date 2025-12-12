'use client';

import Link from 'next/link';
import { Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCategoryByCode, CATEGORY_COLOR_CLASSES, type Category } from '@/constants/categories';
import { useEffect, useState } from 'react';

// 기사 타입 정의
interface Post {
    id: string;
    title: string;
    excerpt?: string;
    content?: string;
    category?: string;
    created_at: string;
    image_url?: string;
    region?: string;
}

interface CategoryPageTemplateProps {
    categoryCode: string;
}

export default function CategoryPageTemplate({ categoryCode }: CategoryPageTemplateProps) {
    const category = getCategoryByCode(categoryCode);
    const colorClasses = category ? CATEGORY_COLOR_CLASSES[category.color] : CATEGORY_COLOR_CLASSES.slate;

    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const postsPerPage = 12;

    // 카테고리별 기사 불러오기
    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/posts?limit=100&status=published`);
                if (res.ok) {
                    const data = await res.json();
                    // 해당 카테고리 기사만 필터링
                    const filteredPosts = data.filter((post: Post) =>
                        post.category === categoryCode ||
                        post.category === category?.name
                    );

                    // 페이지네이션 계산
                    setTotalPages(Math.ceil(filteredPosts.length / postsPerPage) || 1);
                    const startIdx = (page - 1) * postsPerPage;
                    setPosts(filteredPosts.slice(startIdx, startIdx + postsPerPage));
                }
            } catch (err) {
                console.error('기사 로드 실패:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, [categoryCode, category, page]);

    // 카테고리가 없는 경우
    if (!category) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800 mb-4">카테고리를 찾을 수 없습니다</h1>
                    <p className="text-slate-500 mb-6">요청하신 카테고리 '{categoryCode}'가 존재하지 않습니다.</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        홈으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <section className={`bg-gradient-to-br from-${category.color}-700 via-${category.color}-600 to-${category.color}-800 text-white py-16`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-5xl">{category.icon}</span>
                        <h1 className="text-4xl font-black tracking-tight">{category.name}</h1>
                    </div>
                    <p className="text-white/80 text-lg max-w-2xl">
                        {category.description}
                    </p>
                </div>
            </section>

            {/* 기사 목록 */}
            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 mb-6">
                        <Newspaper className={`w-6 h-6 ${colorClasses.text}`} />
                        <h2 className="text-2xl font-bold text-slate-800">{category.name} 최신 기사</h2>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-slate-100 rounded-xl h-48 animate-pulse" />
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-16">
                            <div className={`w-16 h-16 ${colorClasses.bgLight} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                <span className="text-3xl">{category.icon}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-600 mb-2">등록된 기사가 없습니다</h3>
                            <p className="text-slate-400 mb-6">{category.name} 카테고리의 기사가 아직 없습니다.</p>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                            >
                                다른 뉴스 둘러보기
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {posts.map((post) => (
                                    <article
                                        key={post.id}
                                        className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group"
                                    >
                                        {post.image_url && (
                                            <div className="h-40 bg-slate-200 overflow-hidden">
                                                <img
                                                    src={post.image_url}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        )}
                                        <div className="p-4">
                                            <span className={`text-xs font-medium px-2 py-0.5 ${colorClasses.bgLight} ${colorClasses.text} rounded mb-2 inline-block`}>
                                                {category.name}
                                            </span>
                                            <h3 className="font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                <Link href={`/news/${post.id}`}>{post.title}</Link>
                                            </h3>
                                            <p className="text-sm text-slate-500 line-clamp-2">{post.excerpt}</p>
                                            <p className="text-xs text-slate-400 mt-2">
                                                {new Date(post.created_at).toLocaleDateString('ko-KR')}
                                            </p>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {/* 페이지네이션 */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-10">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm text-slate-600 px-4">
                                        {page} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
