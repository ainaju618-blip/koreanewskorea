"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    FileText,
    PenSquare,
    Eye,
    Clock,
    Loader2,
    Edit,
    Trash2,
    Check,
    Ban,
    Search,
    RefreshCw,
    Inbox,
    Calendar,
    ArrowRight,
    CheckCircle,
    XCircle,
    User,
    ChevronLeft,
    ChevronRight,
    LogOut,
} from "lucide-react";

interface Reporter {
    id: string;
    name: string;
    position: string;
    region: string;
    regionGroup?: string;
    access_level: number;
    profile_image?: string;
}

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
    rejection_reason?: string | null;
}

interface PressRelease {
    id: string;
    title: string;
    source: string;
    content_preview: string;
    region: string;
    received_at: string;
    is_read: boolean;
    status: "new" | "viewed" | "converted";
}

interface Stats {
    myRegionArticles: number;
    myArticles: number;
    publishedArticles: number;
    pendingArticles: number;
}

type TabType = "articles" | "press-releases";

interface ReporterDashboardEmbedProps {
    reporter: Reporter;
    onLogout: () => void;
    onClose: () => void;
}

export default function ReporterDashboardEmbed({ reporter, onLogout, onClose }: ReporterDashboardEmbedProps) {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>("articles");

    // Articles state
    const [articles, setArticles] = useState<Article[]>([]);
    const [articlesLoading, setArticlesLoading] = useState(false);
    const [articlePage, setArticlePage] = useState(1);
    const [articleTotalPages, setArticleTotalPages] = useState(1);
    const [articleSearch, setArticleSearch] = useState("");
    const [articleFilter, setArticleFilter] = useState("my-region");

    // Press releases state
    const [pressReleases, setPressReleases] = useState<PressRelease[]>([]);
    const [pressLoading, setPressLoading] = useState(false);

    // Processing state
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Selection state for bulk delete
    const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Initial data fetch
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const statsRes = await fetch("/api/reporter/stats");
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData.stats);
                }
            } catch (err) {
                console.error("Failed to fetch stats:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Fetch articles
    const fetchArticles = useCallback(async () => {
        setArticlesLoading(true);
        try {
            const res = await fetch(
                `/api/reporter/articles?filter=${articleFilter}&page=${articlePage}&limit=10`
            );
            if (res.ok) {
                const data = await res.json();
                setArticles(data.articles || []);
                setArticleTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (err) {
            console.error("Failed to fetch articles:", err);
        } finally {
            setArticlesLoading(false);
        }
    }, [articleFilter, articlePage]);

    // Fetch press releases
    const fetchPressReleases = useCallback(async () => {
        setPressLoading(true);
        try {
            const res = await fetch("/api/reporter/press-releases?limit=10");
            if (res.ok) {
                const data = await res.json();
                setPressReleases(data.releases || []);
            }
        } catch (err) {
            console.error("Failed to fetch press releases:", err);
        } finally {
            setPressLoading(false);
        }
    }, []);

    // Load data based on active tab
    useEffect(() => {
        if (activeTab === "articles") {
            fetchArticles();
        } else {
            fetchPressReleases();
        }
    }, [activeTab, fetchArticles, fetchPressReleases]);

    // Article actions
    const handleApprove = async (article: Article) => {
        if (!confirm(`"${article.title}" 기사를 승인하시겠습니까?`)) return;

        setProcessingId(article.id);
        try {
            const res = await fetch(`/api/reporter/articles/${article.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "published" }),
            });
            if (res.ok) {
                fetchArticles();
            }
        } catch (err) {
            console.error("Approve failed:", err);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (article: Article) => {
        if (!confirm(`"${article.title}" 기사를 반려하시겠습니까?`)) return;

        setProcessingId(article.id);
        try {
            const res = await fetch(`/api/reporter/articles/${article.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "rejected" }),
            });
            if (res.ok) {
                fetchArticles();
            }
        } catch (err) {
            console.error("Reject failed:", err);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (article: Article) => {
        if (!confirm(`"${article.title}" 기사를 삭제하시겠습니까?`)) return;

        setProcessingId(article.id);
        try {
            const res = await fetch(`/api/reporter/articles/${article.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchArticles();
            }
        } catch (err) {
            console.error("Delete failed:", err);
        } finally {
            setProcessingId(null);
        }
    };

    // Selection handlers
    const handleSelectArticle = (articleId: string, checked: boolean) => {
        setSelectedArticles(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(articleId);
            } else {
                newSet.delete(articleId);
            }
            return newSet;
        });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const editableIds = filteredArticles
                .filter(a => a.canEdit)
                .map(a => a.id);
            setSelectedArticles(new Set(editableIds));
        } else {
            setSelectedArticles(new Set());
        }
    };

    const handleBulkDelete = async () => {
        if (selectedArticles.size === 0) return;

        const count = selectedArticles.size;
        if (!confirm(`선택한 ${count}개의 기사를 삭제하시겠습니까?`)) return;

        setIsBulkDeleting(true);
        try {
            const deletePromises = Array.from(selectedArticles).map(id =>
                fetch(`/api/reporter/articles/${id}`, { method: "DELETE" })
            );
            await Promise.all(deletePromises);
            setSelectedArticles(new Set());
            fetchArticles();
        } catch (err) {
            console.error("Bulk delete failed:", err);
        } finally {
            setIsBulkDeleting(false);
        }
    };

    // Clear selection when page or filter changes
    useEffect(() => {
        setSelectedArticles(new Set());
    }, [articlePage, articleFilter]);

    // Filter articles by search
    const filteredArticles = articleSearch
        ? articles.filter((a) =>
              a.title.toLowerCase().includes(articleSearch.toLowerCase())
          )
        : articles;

    const unreadPressReleases = pressReleases.filter((p) => !p.is_read).length;

    return (
        <div className="bg-slate-50 border-b border-slate-200 shadow-lg">
            <div className="w-full max-w-[1400px] mx-auto px-4 py-6">
                {/* Header with Press Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        {/* Reporter Info */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                {reporter.profile_image ? (
                                    <img
                                        src={reporter.profile_image}
                                        alt={reporter.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <User className="w-8 h-8 text-emerald-600" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900">
                                    {reporter.name} {getPositionLabel(reporter.position)}
                                </h1>
                                <p className="text-sm text-slate-500">
                                    {reporter.regionGroup || reporter.region} 담당
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                    <Link
                                        href="/reporter/profile"
                                        onClick={onClose}
                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                                    >
                                        <Edit className="w-3 h-3" />
                                        프로필 수정
                                    </Link>
                                    <button
                                        onClick={onLogout}
                                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition-colors"
                                    >
                                        <LogOut className="w-3 h-3" />
                                        로그아웃
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Stats & Actions */}
                        <div className="flex flex-col items-end gap-3">
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                            ) : (
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-blue-500" />
                                        <span className="text-slate-600">기사</span>
                                        <span className="font-bold text-slate-900">{stats?.myRegionArticles || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-emerald-500" />
                                        <span className="text-slate-600">게시</span>
                                        <span className="font-bold text-slate-900">{stats?.publishedArticles || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-amber-500" />
                                        <span className="text-slate-600">대기</span>
                                        <span className="font-bold text-slate-900">{stats?.pendingArticles || 0}</span>
                                    </div>
                                </div>
                            )}
                            <Link
                                href="/reporter/write"
                                onClick={onClose}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-sm"
                            >
                                <PenSquare className="w-4 h-4" />
                                새 기사 작성
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Tabs + Content */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Tab Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 px-4">
                        <div className="flex">
                            <button
                                onClick={() => {
                                    setActiveTab("articles");
                                    setArticleFilter("my-region");
                                    setArticlePage(1);
                                }}
                                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition ${
                                    activeTab === "articles" && articleFilter === "my-region"
                                        ? "border-emerald-500 text-emerald-600"
                                        : "border-transparent text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                <FileText className="w-4 h-4" />
                                내지역기사
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab("articles");
                                    setArticleFilter("my-articles");
                                    setArticlePage(1);
                                }}
                                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition ${
                                    activeTab === "articles" && articleFilter === "my-articles"
                                        ? "border-emerald-500 text-emerald-600"
                                        : "border-transparent text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                <User className="w-4 h-4" />
                                내 기사
                            </button>
                            <button
                                onClick={() => setActiveTab("press-releases")}
                                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition ${
                                    activeTab === "press-releases"
                                        ? "border-emerald-500 text-emerald-600"
                                        : "border-transparent text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                <Inbox className="w-4 h-4" />
                                보도자료
                                {unreadPressReleases > 0 && (
                                    <span className="px-1.5 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 rounded-full">
                                        {unreadPressReleases}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Tab Actions */}
                        <div className="flex items-center gap-2">
                            {activeTab === "articles" && (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="검색..."
                                        value={articleSearch}
                                        onChange={(e) => setArticleSearch(e.target.value)}
                                        className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-40 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            )}
                            <button
                                onClick={() => activeTab === "articles" ? fetchArticles() : fetchPressReleases()}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                <RefreshCw className={`w-4 h-4 ${(articlesLoading || pressLoading) ? "animate-spin" : ""}`} />
                            </button>
                        </div>
                    </div>

                    {/* Bulk Delete Bar */}
                    {activeTab === "articles" && selectedArticles.size > 0 && (
                        <div className="flex items-center justify-between px-4 py-2 bg-red-50 border-b border-red-100">
                            <span className="text-sm text-red-700 font-medium">
                                {selectedArticles.size}개 선택됨
                            </span>
                            <button
                                onClick={handleBulkDelete}
                                disabled={isBulkDeleting}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {isBulkDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                선택 삭제
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {activeTab === "articles" ? (
                            <ArticlesList
                                articles={filteredArticles}
                                isLoading={articlesLoading}
                                processingId={processingId}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                onDelete={handleDelete}
                                onClose={onClose}
                                myRegion={reporter.region}
                                selectedArticles={selectedArticles}
                                onSelectArticle={handleSelectArticle}
                                onSelectAll={handleSelectAll}
                            />
                        ) : (
                            <PressReleasesList
                                releases={pressReleases}
                                isLoading={pressLoading}
                                onClose={onClose}
                            />
                        )}
                    </div>

                    {/* Pagination for Articles */}
                    {activeTab === "articles" && articleTotalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 py-3 border-t border-slate-100">
                            <button
                                onClick={() => setArticlePage((p) => Math.max(1, p - 1))}
                                disabled={articlePage === 1}
                                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-slate-600">
                                {articlePage} / {articleTotalPages}
                            </span>
                            <button
                                onClick={() => setArticlePage((p) => Math.min(articleTotalPages, p + 1))}
                                disabled={articlePage === articleTotalPages}
                                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

// Articles List Component
function ArticlesList({
    articles,
    isLoading,
    processingId,
    onApprove,
    onReject,
    onDelete,
    onClose,
    myRegion,
    selectedArticles,
    onSelectArticle,
    onSelectAll,
}: {
    articles: Article[];
    isLoading: boolean;
    processingId: string | null;
    onApprove: (article: Article) => void;
    onReject: (article: Article) => void;
    onDelete: (article: Article) => void;
    onClose: () => void;
    myRegion: string;
    selectedArticles: Set<string>;
    onSelectArticle: (id: string, checked: boolean) => void;
    onSelectAll: (checked: boolean) => void;
}) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (articles.length === 0) {
        return (
            <div className="py-12 text-center">
                <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500">기사가 없습니다</p>
            </div>
        );
    }

    const editableArticles = articles.filter(a => a.canEdit);
    const allSelected = editableArticles.length > 0 && editableArticles.every(a => selectedArticles.has(a.id));
    const someSelected = editableArticles.some(a => selectedArticles.has(a.id));

    return (
        <div className="divide-y divide-slate-100">
            {/* Select All Header */}
            {editableArticles.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-slate-100">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                            if (el) el.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={(e) => onSelectAll(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-500">전체 선택</span>
                </div>
            )}
            {articles.map((article) => (
                <ArticleRow
                    key={article.id}
                    article={article}
                    myRegion={myRegion}
                    isProcessing={processingId === article.id}
                    onApprove={onApprove}
                    onReject={onReject}
                    onDelete={onDelete}
                    onClose={onClose}
                    isSelected={selectedArticles.has(article.id)}
                    onSelect={onSelectArticle}
                />
            ))}
        </div>
    );
}

// Article Row Component
function ArticleRow({
    article,
    myRegion,
    isProcessing,
    onApprove,
    onReject,
    onDelete,
    onClose,
    isSelected,
    onSelect,
}: {
    article: Article;
    myRegion: string;
    isProcessing: boolean;
    onApprove: (article: Article) => void;
    onReject: (article: Article) => void;
    onDelete: (article: Article) => void;
    onClose: () => void;
    isSelected: boolean;
    onSelect: (id: string, checked: boolean) => void;
}) {
    const isMyRegion = article.source === myRegion;
    const isPending = article.status === "pending" || article.status === "draft";

    const statusBadge = () => {
        switch (article.status) {
            case "published":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        게시
                    </span>
                );
            case "pending":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        <Clock className="w-3 h-3" />
                        대기
                    </span>
                );
            case "draft":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                        <FileText className="w-3 h-3" />
                        초안
                    </span>
                );
            case "rejected":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        <XCircle className="w-3 h-3" />
                        반려
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition group ${isSelected ? "bg-red-50" : ""}`}>
            {/* Checkbox */}
            {article.canEdit && (
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelect(article.id, e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                />
            )}
            {/* Thumbnail */}
            <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                {article.thumbnail_url ? (
                    <img src={article.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-slate-300" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isMyRegion ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}>
                        {article.source}
                    </span>
                    {statusBadge()}
                </div>
                <Link
                    href={`/news/${article.id}`}
                    onClick={onClose}
                    className="font-medium text-slate-900 truncate text-sm hover:text-emerald-600 hover:underline block"
                >
                    {article.title}
                </Link>
                <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(article.published_at).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                    })}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                ) : (
                    <>
                        {isPending && article.canEdit && (
                            <>
                                <button
                                    onClick={() => onApprove(article)}
                                    className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition"
                                    title="승인"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onReject(article)}
                                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"
                                    title="반려"
                                >
                                    <Ban className="w-4 h-4" />
                                </button>
                            </>
                        )}
                        <Link
                            href={`/news/${article.id}`}
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition"
                            title="보기"
                        >
                            <Eye className="w-4 h-4" />
                        </Link>
                        {article.canEdit && (
                            <>
                                <Link
                                    href={`/reporter/edit/${article.id}`}
                                    onClick={onClose}
                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                    title="편집"
                                >
                                    <Edit className="w-4 h-4" />
                                </Link>
                                <button
                                    onClick={() => onDelete(article)}
                                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"
                                    title="삭제"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Press Releases List Component
function PressReleasesList({
    releases,
    isLoading,
    onClose,
}: {
    releases: PressRelease[];
    isLoading: boolean;
    onClose: () => void;
}) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (releases.length === 0) {
        return (
            <div className="py-12 text-center">
                <Inbox className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500">보도자료가 없습니다</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-slate-100">
            {releases.map((release) => (
                <PressReleaseRow key={release.id} release={release} onClose={onClose} />
            ))}
        </div>
    );
}

// Press Release Row Component
function PressReleaseRow({ release, onClose }: { release: PressRelease; onClose: () => void }) {
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;
        return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
    };

    return (
        <div className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition ${
            !release.is_read ? "bg-emerald-50/30" : ""
        }`}>
            {/* Status Indicator */}
            <div className="pt-1.5 flex-shrink-0">
                {release.status === "new" ? (
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                ) : release.status === "converted" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        release.status === "new"
                            ? "bg-emerald-100 text-emerald-700"
                            : release.status === "converted"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                    }`}>
                        {release.status === "new" ? "NEW" : release.status === "converted" ? "작성완료" : "읽음"}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatTime(release.received_at)}
                    </span>
                </div>
                <h3 className={`text-sm mb-0.5 ${!release.is_read ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                    {release.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">
                    {release.content_preview}
                </p>
                <span className="text-xs text-slate-400 mt-1 inline-block">
                    {release.source}
                </span>
            </div>

            {/* Action */}
            <div className="flex-shrink-0">
                {release.status === "converted" ? (
                    <span className="text-xs text-emerald-600 font-medium">작성완료</span>
                ) : (
                    <Link
                        href={`/reporter/write?press_release_id=${release.id}`}
                        onClick={onClose}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
                    >
                        기사 작성
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                )}
            </div>
        </div>
    );
}

function getPositionLabel(position: string): string {
    const positions: Record<string, string> = {
        national_chief_director: "전국총괄본부장",
        chief_director: "총괄본부장",
        editor_in_chief: "주필",
        branch_manager: "지사장",
        gwangju_branch_director: "광주지역본부장",
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
