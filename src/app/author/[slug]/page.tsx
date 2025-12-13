import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import {
    MapPin,
    Briefcase,
    Calendar,
    FileText,
    ChevronLeft,
    ChevronRight,
    Award,
    Hash,
    Twitter,
    Facebook,
    Linkedin,
    Users,
    Eye,
} from "lucide-react";
import SubscribeButton from "@/components/author/SubscribeButton";

interface Reporter {
    id: string;
    name: string;
    position: string;
    region: string;
    bio: string | null;
    avatar_icon: string | null;
    profile_image: string | null;
    type: string;
    created_at: string;
    slug: string | null;
    department: string | null;
    specialties: string[] | null;
    career_years: number | null;
    awards: string[] | null;
    sns_twitter: string | null;
    sns_facebook: string | null;
    sns_linkedin: string | null;
    subscriber_count: number;
    total_views: number;
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
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string; tab?: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getReporter(slugOrId: string) {
    let query = supabaseAdmin
        .from("reporters")
        .select("*")
        .eq("status", "Active");

    if (UUID_REGEX.test(slugOrId)) {
        query = query.eq("id", slugOrId);
    } else {
        query = query.eq("slug", slugOrId);
    }

    const { data, error } = await query.single();
    return { data: data as Reporter, error };
}

// 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const { data: reporter } = await getReporter(slug);

    if (!reporter) {
        return {
            title: "기자를 찾을 수 없습니다 - 코리아NEWS",
        };
    }

    const positionLabel = getPositionLabel(reporter.position);
    const title = `${reporter.name} ${positionLabel} - 코리아NEWS`;
    const description = reporter.bio || `${reporter.name} ${reporter.department || reporter.region} ${positionLabel}. 코리아NEWS에서 최신 기사를 확인하세요.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "profile",
            images: reporter.profile_image ? [reporter.profile_image] : [],
        },
        twitter: {
            card: "summary_large_image",
            creator: reporter.sns_twitter ? `@${reporter.sns_twitter.split("/").pop()}` : undefined,
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
    const { slug } = await params;
    const { page: pageParam, tab: tabParam } = await searchParams;

    // 기자 정보 조회
    const { data: reporter, error: reporterError } = await getReporter(slug);

    if (reporterError || !reporter) {
        notFound();
    }

    // UUID로 접속했지만 slug가 있는 경우, slug URL로 리다이렉트 (SEO)
    if (UUID_REGEX.test(slug) && reporter.slug) {
        redirect(`/author/${reporter.slug}`);
    }

    const page = parseInt(pageParam || "1");
    const tab = tabParam || "articles"; // articles | popular | profile
    const limit = 10;
    const offset = (page - 1) * limit;

    // 구독 상태 확인 (로그인 유저인 경우)
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    let isSubscribed = false;

    if (session?.user) {
        const { data: sub } = await supabase
            .from("reporter_subscriptions")
            .select("id")
            .eq("subscriber_id", session.user.id)
            .eq("reporter_id", reporter.id)
            .single();
        isSubscribed = !!sub;
    }

    // 기사 조회
    let articlesQuery = supabaseAdmin
        .from("posts")
        .select("id, title, source, category, thumbnail_url, published_at, views", { count: "exact" })
        .eq("author_id", reporter.id)
        .eq("status", "published");

    // 정렬 (최신순 vs 인기순)
    if (tab === "popular") {
        articlesQuery = articlesQuery.order("views", { ascending: false });
    } else {
        articlesQuery = articlesQuery.order("published_at", { ascending: false });
    }

    const { data: articles, count } = await articlesQuery.range(offset, offset + limit - 1);

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
            "@type": "NewsMediaOrganization",
            name: "코리아NEWS",
            url: "https://koreanewsone.com",
        },
        description: reporter.bio,
        image: reporter.profile_image,
        sameAs: [
            reporter.sns_twitter,
            reporter.sns_facebook,
            reporter.sns_linkedin
        ].filter(Boolean),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* 상단 네비게이션 */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6"
                >
                    <ChevronLeft className="w-4 h-4" />
                    홈으로
                </Link>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* 메인 컬럼 */}
                    <div className="flex-1 min-w-0">

                        {/* 프로필 헤더 카드 */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-8 shadow-sm">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                {/* 사진 */}
                                <div className="flex-shrink-0 mx-auto md:mx-0">
                                    {reporter.profile_image ? (
                                        <img
                                            src={reporter.profile_image}
                                            alt={reporter.name}
                                            className="w-32 h-32 rounded-2xl object-cover shadow-md"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-5xl shadow-inner">
                                            {reporter.avatar_icon || "👤"}
                                        </div>
                                    )}
                                </div>

                                {/* 정보 */}
                                <div className="flex-1 text-center md:text-left w-full">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                                        <div>
                                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                                <h1 className="text-3xl font-bold text-gray-900">
                                                    {reporter.name}
                                                </h1>
                                                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-md border border-blue-100">
                                                    {positionLabel}
                                                </span>
                                            </div>
                                            <p className="text-gray-500 font-medium">
                                                {reporter.department || reporter.region}
                                                {reporter.department && reporter.region !== '전체' && ` · ${reporter.region}`}
                                            </p>
                                        </div>

                                        {/* 구독 버튼 */}
                                        <SubscribeButton
                                            reporterId={reporter.id}
                                            initialIsSubscribed={isSubscribed}
                                            initialSubscriberCount={reporter.subscriber_count || 0}
                                            isLoggedIn={!!session?.user}
                                        />
                                    </div>

                                    {reporter.bio && (
                                        <blockquote className="text-gray-700 leading-relaxed mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400 italic">
                                            "{reporter.bio}"
                                        </blockquote>
                                    )}

                                    {/* 통계 배지 */}
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-6 pt-2 border-t border-gray-100">
                                        {reporter.career_years && reporter.career_years > 0 && (
                                            <div className="flex items-center gap-1.5 text-gray-600" title="취재 경력">
                                                <Briefcase className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm">경력 <strong>{reporter.career_years}년</strong></span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 text-gray-600" title="작성 기사">
                                            <FileText className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm">기사 <strong>{totalArticles.toLocaleString()}건</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-600" title="총 조회수">
                                            <Eye className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm">누적 조회 <strong>{(reporter.total_views || 0).toLocaleString()}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 탭 네비게이션 */}
                        <div className="flex border-b border-gray-200 mb-6">
                            <Link
                                href={`/author/${slug}?tab=articles`}
                                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${tab === 'articles' || !tab
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                최신 기사
                            </Link>
                            <Link
                                href={`/author/${slug}?tab=popular`}
                                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${tab === 'popular'
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                <Users className="w-4 h-4" />
                                많이 본 기사
                            </Link>
                        </div>

                        {/* 기사 목록 */}
                        {articles && articles.length > 0 ? (
                            <div className="space-y-4">
                                {articles.map((article: any) => (
                                    <Link
                                        key={article.id}
                                        href={`/news/${article.id}`}
                                        className="block bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group overflow-hidden"
                                    >
                                        <div className="flex p-4 gap-4 md:gap-6">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                        {article.category}
                                                    </span>
                                                    <span className="text-xs text-gray-400 bg-white">
                                                        {new Date(article.published_at).toLocaleDateString("ko-KR")}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2 leading-snug">
                                                    {article.title}
                                                </h3>
                                                {/* 요약이 있다면 여기에 추가 */}
                                            </div>

                                            {article.thumbnail_url && (
                                                <div className="w-24 h-24 md:w-32 md:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={article.thumbnail_url}
                                                        alt=""
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">작성된 기사가 없습니다.</p>
                            </div>
                        )}

                        {/* 페이지네이션 */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <Link
                                    href={`/author/${slug}?tab=${tab}&page=${Math.max(1, page - 1)}`}
                                    className={`p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition ${page === 1 ? "opacity-50 pointer-events-none" : ""
                                        }`}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Link>
                                <span className="px-4 py-2 text-sm text-gray-600 font-medium">
                                    {page} / {totalPages}
                                </span>
                                <Link
                                    href={`/author/${slug}?tab=${tab}&page=${Math.min(totalPages, page + 1)}`}
                                    className={`p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition ${page === totalPages ? "opacity-50 pointer-events-none" : ""
                                        }`}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* 사이드바 (데스크탑) */}
                    <aside className="w-full lg:w-80 flex-shrink-0 space-y-6">

                        {/* 전문 분야 카드 */}
                        {reporter.specialties && reporter.specialties.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-blue-500" />
                                    전문 분야
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {reporter.specialties.map((spec, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                                            #{spec}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 수상 이력 카드 */}
                        {reporter.awards && reporter.awards.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-amber-500" />
                                    수상 이력
                                </h3>
                                <ul className="space-y-2">
                                    {reporter.awards.map((award, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0"></span>
                                            <span>{award}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* 소셜 미디어 & 연락처 */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                소셜 & 연락처
                            </h3>
                            <div className="space-y-3">
                                {reporter.sns_twitter && (
                                    <a href={reporter.sns_twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-blue-400 transition">
                                        <Twitter className="w-5 h-5" />
                                        <span className="text-sm">Twitter</span>
                                    </a>
                                )}
                                {reporter.sns_facebook && (
                                    <a href={reporter.sns_facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition">
                                        <Facebook className="w-5 h-5" />
                                        <span className="text-sm">Facebook</span>
                                    </a>
                                )}
                                {reporter.sns_linkedin && (
                                    <a href={reporter.sns_linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-blue-700 transition">
                                        <Linkedin className="w-5 h-5" />
                                        <span className="text-sm">LinkedIn</span>
                                    </a>
                                )}
                                {reporter.region && (
                                    <div className="flex items-center gap-3 text-gray-600 pt-2 border-t border-gray-100 mt-2">
                                        <MapPin className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm">{reporter.region}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm">{new Date(reporter.created_at).toLocaleDateString('ko-KR')} 합류</span>
                                </div>
                            </div>
                        </div>

                    </aside>
                </div>
            </div>
        </>
    );
}
