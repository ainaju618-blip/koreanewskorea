"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    FileText,
    Search,
    Filter,
    Edit,
    Eye,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Clock,
    CheckCircle,
    XCircle,
} from "lucide-react";

interface Article {
    id: string;
    title: string;
    source: string;
    category: string;
    published_at: string;
    status: string;
    author_id: string | null;
    thumbnail_url: string | null;
    canEdit: boolean;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface ReporterInfo {
    id: string;
    position: string;
    region: string;
    regionGroup: string;
    accessibleRegions: string[] | null;
}

export default function ReporterArticlesPage() {
    const searchParams = useSearchParams();
    const initialFilter = searchParams.get("filter") || "all";

    const [articles, setArticles] = useState<Article[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [reporter, setReporter] = useState<ReporterInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [filter, setFilter] = useState(initialFilter);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchArticles = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(
                `/api/reporter/articles?filter=${filter}&page=${page}&limit=20`
            );
            if (res.ok) {
                const data = await res.json();
                setArticles(data.articles);
                setPagination(data.pagination);
                setReporter(data.reporter);
            }
        } catch (err) {
            console.error("Failed to fetch articles:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, [filter, page]);

    // 검색 필터링 (클라이언트 사이드)
    const filteredArticles = searchQuery
        ? articles.filter((a) =>
              a.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : articles;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "published":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                        <CheckCircle className="w-3 h-3" />
                        게시됨
                    </span>
                );
            case "pending":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                        <Clock className="w-3 h-3" />
                        대기중
                    </span>
                );
            case "draft":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        <FileText className="w-3 h-3" />
                        임시저장
                    </span>
                );
            case "rejected":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                        <XCircle className="w-3 h-3" />
                        반려
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-7 h-7 text-blue-600" />
                        기사 관리
                    </h1>
                    <p className="text-gray-500 mt-1">
                        총 {pagination?.total || 0}개의 기사
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <div className="flex gap-1">
                            {[
                                { value: "all", label: "전체" },
                                { value: "my-region", label: `내 권한 (${reporter?.regionGroup || reporter?.region || ""})` },
                                { value: "my-articles", label: "내 기사" },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        setFilter(opt.value);
                                        setPage(1);
                                    }}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                                        filter === opt.value
                                            ? "bg-blue-100 text-blue-700"
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="기사 제목 검색..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Articles List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        기사가 없습니다.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredArticles.map((article) => (
                            <ArticleRow
                                key={article.id}
                                article={article}
                                getStatusBadge={getStatusBadge}
                                myRegion={reporter?.region || ""}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600">
                        {page} / {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={page === pagination.totalPages}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

function ArticleRow({
    article,
    getStatusBadge,
    myRegion,
}: {
    article: Article;
    getStatusBadge: (status: string) => React.ReactNode;
    myRegion: string;
}) {
    const isMyRegion = article.source === myRegion;

    return (
        <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition">
            {/* Thumbnail */}
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {article.thumbnail_url ? (
                    <img
                        src={article.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-300" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span
                        className={`text-xs px-2 py-0.5 rounded ${
                            isMyRegion
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                        }`}
                    >
                        {article.source}
                    </span>
                    {getStatusBadge(article.status)}
                </div>
                <h3 className="font-medium text-gray-900 truncate">{article.title}</h3>
                <p className="text-sm text-gray-500">
                    {new Date(article.published_at).toLocaleDateString("ko-KR")}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                    href={`/news/${article.id}`}
                    target="_blank"
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    title="보기"
                >
                    <Eye className="w-5 h-5" />
                </Link>
                {article.canEdit && (
                    <Link
                        href={`/reporter/edit/${article.id}`}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        title="편집"
                    >
                        <Edit className="w-5 h-5" />
                    </Link>
                )}
            </div>
        </div>
    );
}
