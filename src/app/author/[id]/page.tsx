import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
    User,
    MapPin,
    Briefcase,
    Calendar,
    FileText,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

interface Reporter {
    id: string;
    name: string;
    position: string;
    region: string;
    bio: string | null;
    avatar_icon: string | null;
    type: string;
    created_at: string;
}

interface Article {
    id: string;
    title: string;
    source: string;
    category: string;
    thumbnail_url: string | null;
    published_at: string;
}

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ page?: string }>;
}

// 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;

    const { data: reporter } = await supabaseAdmin
        .from("reporters")
        .select("name, position, region, bio")
        .eq("id", id)
        .eq("status", "Active")
        .single();

    if (!reporter) {
        return {
            title: "기자를 찾을 수 없습니다 - 코리아NEWS",
        };
    }

    const positionLabel = getPositionLabel(reporter.position);
    const description = reporter.bio || `${reporter.name} ${positionLabel} - ${reporter.region} 담당`;

    return {
        title: `${reporter.name} ${positionLabel} - 코리아NEWS`,
        description,
        openGraph: {
            title: `${reporter.name} ${positionLabel}`,
            description,
            type: "profile",
        },
    };
}

function getPositionLabel(position: string): string {
    const positions: Record<string, string> = {
        editor_in_chief: "주필",
        branch_manager: "지사장",
        editor_chief: "편집국장",
        news_chief: "취재부장",
        senior_reporter: "수석기자",
        reporter: "기자",
        intern_reporter: "수습기자",
        citizen_reporter: "시민기자",
        opinion_writer: "오피니언",
        advisor: "고문",
        consultant: "자문위원",
        ambassador: "홍보대사",
        seoul_correspondent: "서울특파원",
        foreign_correspondent: "해외특파원",
    };
    return positions[position] || position;
}

export default async function AuthorPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { page: pageParam } = await searchParams;
    const page = parseInt(pageParam || "1");
    const limit = 10;
    const offset = (page - 1) * limit;

    // 기자 정보 조회
    const { data: reporter, error: reporterError } = await supabaseAdmin
        .from("reporters")
        .select("*")
        .eq("id", id)
        .eq("status", "Active")
        .single();

    if (reporterError || !reporter) {
        notFound();
    }

    // 기자가 작성한 기사 조회
    const { data: articles, count } = await supabaseAdmin
        .from("posts")
        .select("id, title, source, category, thumbnail_url, published_at", { count: "exact" })
        .eq("author_id", id)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(offset, offset + limit - 1);

    const totalArticles = count || 0;
    const totalPages = Math.ceil(totalArticles / limit);
    const positionLabel = getPositionLabel(reporter.position);

    // Schema.org 구조화 데이터
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: reporter.name,
        jobTitle: positionLabel,
        worksFor: {
            "@type": "Organization",
            name: "코리아NEWS",
            url: "https://koreanewsone.com",
        },
        description: reporter.bio || `${reporter.region} 담당 ${positionLabel}`,
    };

    return (
        <>
            {/* 구조화 데이터 */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* 뒤로가기 */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6"
                >
                    <ChevronLeft className="w-4 h-4" />
                    홈으로
                </Link>

                {/* 프로필 카드 */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* 아바타 */}
                        <div className="flex-shrink-0">
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center text-4xl md:text-5xl">
                                {reporter.avatar_icon || "👤"}
                            </div>
                        </div>

                        {/* 정보 */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    {reporter.name}
                                </h1>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                                    {positionLabel}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" />
                                    <span>{reporter.region} 담당</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Briefcase className="w-4 h-4" />
                                    <span>{reporter.type}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        {new Date(reporter.created_at).toLocaleDateString("ko-KR")} 합류
                                    </span>
                                </div>
                            </div>

                            {reporter.bio && (
                                <p className="text-gray-700 leading-relaxed">{reporter.bio}</p>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <FileText className="w-4 h-4" />
                                    <span>
                                        작성 기사 <strong className="text-gray-900">{totalArticles}</strong>건
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 작성 기사 목록 */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        작성 기사
                    </h2>

                    {articles && articles.length > 0 ? (
                        <>
                            <div className="space-y-4">
                                {articles.map((article: Article) => (
                                    <Link
                                        key={article.id}
                                        href={`/news/${article.id}`}
                                        className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition"
                                    >
                                        {/* 썸네일 */}
                                        <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            {article.thumbnail_url ? (
                                                <img
                                                    src={article.thumbnail_url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <FileText className="w-8 h-8 text-gray-300" />
                                                </div>
                                            )}
                                        </div>

                                        {/* 내용 */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                    {article.source}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {article.category}
                                                </span>
                                            </div>
                                            <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                                                {article.title}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(article.published_at).toLocaleDateString("ko-KR")}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* 페이지네이션 */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-8">
                                    <Link
                                        href={`/author/${id}?page=${Math.max(1, page - 1)}`}
                                        className={`p-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${
                                            page === 1 ? "opacity-50 pointer-events-none" : ""
                                        }`}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Link>
                                    <span className="px-4 py-2 text-sm text-gray-600">
                                        {page} / {totalPages}
                                    </span>
                                    <Link
                                        href={`/author/${id}?page=${Math.min(totalPages, page + 1)}`}
                                        className={`p-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${
                                            page === totalPages ? "opacity-50 pointer-events-none" : ""
                                        }`}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
                            아직 작성한 기사가 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
