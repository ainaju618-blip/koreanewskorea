"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
    Filter,
    AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmModal";

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
    view_count?: number;
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

export default function ReporterDashboard() {
    const [reporter, setReporter] = useState<Reporter | null>(null);
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
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Error state
    const [articlesError, setArticlesError] = useState<string | null>(null);
    const [pressError, setPressError] = useState<string | null>(null);

    // Press releases state
    const [pressReleases, setPressReleases] = useState<PressRelease[]>([]);
    const [pressLoading, setPressLoading] = useState(false);

    // Processing state
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Selection state for bulk actions
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    const { showSuccess, showError } = useToast();
    const { confirmDelete, confirm } = useConfirm();
    const router = useRouter();

    // Logout state
    const [loggingOut, setLoggingOut] = useState(false);

    // Logout handler
    const handleLogout = async () => {
        const confirmed = await confirm({
            title: "로그아웃",
            message: "정말 로그아웃 하시겠습니까?",
            confirmText: "로그아웃",
            cancelText: "취소",
        });

        if (!confirmed) return;

        setLoggingOut(true);
        try {
            const res = await fetch("/api/auth/logout", { method: "POST" });
            if (res.ok) {
                showSuccess("로그아웃되었습니다.");
                router.push("/reporter/login");
            } else {
                showError("로그아웃에 실패했습니다.");
            }
        } catch {
            showError("로그아웃 중 오류가 발생했습니다.");
        } finally {
            setLoggingOut(false);
        }
    };

    // Initial data fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [meRes, statsRes] = await Promise.all([
                    fetch("/api/auth/me"),
                    fetch("/api/reporter/stats"),
                ]);

                if (meRes.ok) {
                    const meData = await meRes.json();
                    setReporter(meData.reporter);
                }
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData.stats);
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Fetch articles
    const fetchArticles = useCallback(async () => {
        setArticlesLoading(true);
        setArticlesError(null);
        try {
            const statusParam = statusFilter !== "all" ? `&status=${statusFilter}` : "";
            const res = await fetch(
                `/api/reporter/articles?filter=${articleFilter}&page=${articlePage}&limit=15${statusParam}`
            );
            if (res.ok) {
                const data = await res.json();
                setArticles(data.articles);
                setArticleTotalPages(data.pagination?.totalPages || 1);
            } else {
                const data = await res.json();
                setArticlesError(data.message || "기사를 불러오는데 실패했습니다.");
            }
        } catch (err) {
            console.error("Failed to fetch articles:", err);
            setArticlesError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setArticlesLoading(false);
        }
    }, [articleFilter, articlePage, statusFilter]);

    // Fetch press releases
    const fetchPressReleases = useCallback(async () => {
        setPressLoading(true);
        setPressError(null);
        try {
            const res = await fetch("/api/reporter/press-releases?limit=20");
            if (res.ok) {
                const data = await res.json();
                setPressReleases(data.releases || []);
            } else {
                const data = await res.json();
                setPressError(data.message || "보도자료를 불러오는데 실패했습니다.");
            }
        } catch (err) {
            console.error("Failed to fetch press releases:", err);
            setPressError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
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
        const confirmed = await confirm({
            title: "기사 승인",
            message: `"${article.title}" 기사를 승인하시겠습니까?`,
            type: "info",
            confirmText: "승인",
            cancelText: "취소",
        });
        if (!confirmed) return;

        setProcessingId(article.id);
        try {
            const res = await fetch(`/api/reporter/articles/${article.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "published" }),
            });
            if (res.ok) {
                showSuccess("기사가 승인되었습니다.");
                fetchArticles();
            } else {
                const data = await res.json();
                showError(data.message || "승인에 실패했습니다.");
            }
        } catch {
            showError("승인 중 오류가 발생했습니다.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (article: Article) => {
        const confirmed = await confirm({
            title: "기사 반려",
            message: `"${article.title}" 기사를 반려하시겠습니까?`,
            type: "danger",
            confirmText: "반려",
            cancelText: "취소",
        });
        if (!confirmed) return;

        setProcessingId(article.id);
        try {
            const res = await fetch(`/api/reporter/articles/${article.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "rejected" }),
            });
            if (res.ok) {
                showSuccess("기사가 반려되었습니다.");
                fetchArticles();
            } else {
                const data = await res.json();
                showError(data.message || "반려에 실패했습니다.");
            }
        } catch {
            showError("반려 중 오류가 발생했습니다.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (article: Article) => {
        const confirmed = await confirmDelete(
            `"${article.title}" 기사를 삭제하시겠습니까?`
        );
        if (!confirmed) return;

        setProcessingId(article.id);
        try {
            const res = await fetch(`/api/reporter/articles/${article.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                showSuccess("기사가 삭제되었습니다.");
                fetchArticles();
            } else {
                const data = await res.json();
                showError(data.message || "삭제에 실패했습니다.");
            }
        } catch {
            showError("삭제 중 오류가 발생했습니다.");
        } finally {
            setProcessingId(null);
        }
    };

    // Selection handlers
    const handleSelectArticle = (id: string, checked: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (checked) {
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const editableIds = filteredArticles.filter(a => a.canEdit).map(a => a.id);
            setSelectedIds(new Set(editableIds));
        } else {
            setSelectedIds(new Set());
        }
    };

    // Bulk action handlers
    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        const confirmed = await confirmDelete(
            `선택한 ${selectedIds.size}개의 기사를 삭제하시겠습니까?`
        );
        if (!confirmed) return;

        setIsBulkProcessing(true);
        let successCount = 0;
        let failCount = 0;

        for (const id of selectedIds) {
            try {
                const res = await fetch(`/api/reporter/articles/${id}`, {
                    method: "DELETE",
                });
                if (res.ok) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch {
                failCount++;
            }
        }

        setIsBulkProcessing(false);
        setSelectedIds(new Set());
        fetchArticles();

        if (successCount > 0) {
            showSuccess(`${successCount}개의 기사가 삭제되었습니다.`);
        }
        if (failCount > 0) {
            showError(`${failCount}개의 기사 삭제에 실패했습니다.`);
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;

        const confirmed = await confirm({
            title: "일괄 승인",
            message: `선택한 ${selectedIds.size}개의 기사를 승인하시겠습니까?`,
            type: "info",
            confirmText: "승인",
            cancelText: "취소",
        });
        if (!confirmed) return;

        setIsBulkProcessing(true);
        let successCount = 0;
        let failCount = 0;

        for (const id of selectedIds) {
            try {
                const res = await fetch(`/api/reporter/articles/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "published" }),
                });
                if (res.ok) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch {
                failCount++;
            }
        }

        setIsBulkProcessing(false);
        setSelectedIds(new Set());
        fetchArticles();

        if (successCount > 0) {
            showSuccess(`${successCount}개의 기사가 승인되었습니다.`);
        }
        if (failCount > 0) {
            showError(`${failCount}개의 기사 승인에 실패했습니다.`);
        }
    };

    const handleBulkReject = async () => {
        if (selectedIds.size === 0) return;

        const confirmed = await confirm({
            title: "일괄 반려",
            message: `선택한 ${selectedIds.size}개의 기사를 반려하시겠습니까?`,
            type: "danger",
            confirmText: "반려",
            cancelText: "취소",
        });
        if (!confirmed) return;

        setIsBulkProcessing(true);
        let successCount = 0;
        let failCount = 0;

        for (const id of selectedIds) {
            try {
                const res = await fetch(`/api/reporter/articles/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "rejected" }),
                });
                if (res.ok) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch {
                failCount++;
            }
        }

        setIsBulkProcessing(false);
        setSelectedIds(new Set());
        fetchArticles();

        if (successCount > 0) {
            showSuccess(`${successCount}개의 기사가 반려되었습니다.`);
        }
        if (failCount > 0) {
            showError(`${failCount}개의 기사 반려에 실패했습니다.`);
        }
    };

    // Filter articles by search
    const filteredArticles = articleSearch
        ? articles.filter((a) =>
              a.title.toLowerCase().includes(articleSearch.toLowerCase())
          )
        : articles;

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="text-slate-500 text-sm">로딩 중...</p>
                </div>
            </div>
        );
    }

    const unreadPressReleases = pressReleases.filter((p) => !p.is_read).length;

    return (
        <div className="space-y-4 max-w-7xl mx-auto">
            {/* Header with Press Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Press Card Section */}
                    <div className="flex items-start gap-4">
                        {/* Press Card with Photo */}
                        <div
                            className="relative flex-shrink-0"
                            style={{ width: '140px', height: '200px' }}
                        >
                            {/* Press Card Background */}
                            <img
                                src="/press-card.png"
                                alt="Press Card"
                                className="w-full h-full object-contain"
                            />
                            {/* Reporter Photo Overlay */}
                            <div
                                className="absolute overflow-hidden bg-white"
                                style={{
                                    top: '28%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '55px',
                                    height: '70px'
                                }}
                            >
                                {reporter?.profile_image ? (
                                    <img
                                        src={reporter.profile_image}
                                        alt={reporter.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                        <User className="w-6 h-6 text-slate-400" />
                                    </div>
                                )}
                            </div>
                            {/* Name Overlay */}
                            <div
                                className="absolute text-white text-xs font-bold truncate text-center"
                                style={{
                                    bottom: '26%',
                                    left: '35%',
                                    right: '8%',
                                    fontSize: '9px'
                                }}
                            >
                                {reporter?.name}
                            </div>
                            {/* Region Overlay */}
                            <div
                                className="absolute text-white text-xs truncate text-center"
                                style={{
                                    bottom: '18%',
                                    left: '35%',
                                    right: '8%',
                                    fontSize: '8px'
                                }}
                            >
                                {reporter?.regionGroup || reporter?.region}
                            </div>
                        </div>

                        {/* Reporter Info */}
                        <div className="pt-2">
                            <h1 className="text-lg font-bold text-slate-900">
                                {reporter?.name} {getPositionLabel(reporter?.position || "")}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {reporter?.regionGroup || reporter?.region} 담당
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <Link
                                    href="/reporter/profile"
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                                >
                                    <Edit className="w-3 h-3" />
                                    프로필 수정
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    disabled={loggingOut}
                                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                >
                                    {loggingOut ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <LogOut className="w-3 h-3" />
                                    )}
                                    로그아웃
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex flex-col items-end gap-3">
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
                        <Link
                            href="/reporter/write"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                        >
                            <PenSquare className="w-4 h-4" />
                            새 기사
                        </Link>
                    </div>
                </div>
            </div>

            {/* Tabs + Content */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Tab Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-4">
                    <div className="flex">
                        {/* Article Filter Tabs */}
                        <button
                            onClick={() => {
                                setActiveTab("articles");
                                setArticleFilter("my-region");
                                setArticlePage(1);
                            }}
                            className={`flex items-center gap-2 px-4 py-3.5 font-medium text-sm border-b-2 transition ${
                                activeTab === "articles" && articleFilter === "my-region"
                                    ? "border-blue-500 text-blue-600"
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
                            className={`flex items-center gap-2 px-4 py-3.5 font-medium text-sm border-b-2 transition ${
                                activeTab === "articles" && articleFilter === "my-articles"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <User className="w-4 h-4" />
                            내 기사
                        </button>
                        <button
                            onClick={() => setActiveTab("press-releases")}
                            className={`flex items-center gap-2 px-4 py-3.5 font-medium text-sm border-b-2 transition ${
                                activeTab === "press-releases"
                                    ? "border-blue-500 text-blue-600"
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
                            <>
                                {/* Status Filter Dropdown */}
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value);
                                            setArticlePage(1);
                                        }}
                                        className="pl-9 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="all">전체 상태</option>
                                        <option value="published">게시됨</option>
                                        <option value="pending">대기중</option>
                                        <option value="draft">초안</option>
                                        <option value="rejected">반려됨</option>
                                    </select>
                                </div>
                                {/* Search Input */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="제목 검색..."
                                        value={articleSearch}
                                        onChange={(e) => setArticleSearch(e.target.value)}
                                        className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-48 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </>
                        )}
                        <button
                            onClick={() => activeTab === "articles" ? fetchArticles() : fetchPressReleases()}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            title="새로고침"
                        >
                            <RefreshCw className={`w-4 h-4 ${(articlesLoading || pressLoading) ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>

                {/* Bulk Action Toolbar */}
                {activeTab === "articles" && selectedIds.size > 0 && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {selectedIds.size}
                            </div>
                            <span className="text-sm font-semibold text-blue-800">
                                개 기사 선택됨
                            </span>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                onClick={handleBulkApprove}
                                disabled={isBulkProcessing}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition shadow-sm"
                            >
                                {isBulkProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                일괄 승인
                            </button>
                            <button
                                onClick={handleBulkReject}
                                disabled={isBulkProcessing}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition shadow-sm"
                            >
                                {isBulkProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Ban className="w-4 h-4" />
                                )}
                                일괄 반려
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={isBulkProcessing}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition shadow-sm ring-2 ring-red-300"
                            >
                                {isBulkProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                일괄 삭제
                            </button>
                            <div className="w-px h-6 bg-slate-300 mx-1"></div>
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition border border-transparent hover:border-slate-200"
                            >
                                선택 해제
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                {activeTab === "articles" ? (
                    <ArticlesList
                        articles={filteredArticles}
                        isLoading={articlesLoading}
                        processingId={processingId}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onDelete={handleDelete}
                        myRegion={reporter?.region || ""}
                        selectedIds={selectedIds}
                        onSelectArticle={handleSelectArticle}
                        onSelectAll={handleSelectAll}
                        error={articlesError}
                        onRetry={fetchArticles}
                    />
                ) : (
                    <PressReleasesList
                        releases={pressReleases}
                        isLoading={pressLoading}
                        error={pressError}
                        onRetry={fetchPressReleases}
                    />
                )}

                {/* Pagination for Articles */}
                {activeTab === "articles" && articleTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 py-4 border-t border-slate-200 bg-slate-50">
                        <button
                            onClick={() => setArticlePage(1)}
                            disabled={articlePage === 1}
                            className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            처음
                        </button>
                        <button
                            onClick={() => setArticlePage((p) => Math.max(1, p - 1))}
                            disabled={articlePage === 1}
                            className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1">
                            <span className="px-3 py-1 bg-blue-600 text-white font-bold rounded-lg text-sm">
                                {articlePage}
                            </span>
                            <span className="text-slate-500 mx-1">/</span>
                            <span className="text-slate-600 font-medium text-sm">
                                {articleTotalPages}
                            </span>
                        </div>
                        <button
                            onClick={() => setArticlePage((p) => Math.min(articleTotalPages, p + 1))}
                            disabled={articlePage === articleTotalPages}
                            className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setArticlePage(articleTotalPages)}
                            disabled={articlePage === articleTotalPages}
                            className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            마지막
                        </button>
                    </div>
                )}
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
    myRegion,
    selectedIds,
    onSelectArticle,
    onSelectAll,
    error,
    onRetry,
}: {
    articles: Article[];
    isLoading: boolean;
    processingId: string | null;
    onApprove: (article: Article) => void;
    onReject: (article: Article) => void;
    onDelete: (article: Article) => void;
    myRegion: string;
    selectedIds: Set<string>;
    onSelectArticle: (id: string, checked: boolean) => void;
    onSelectAll: (checked: boolean) => void;
    error: string | null;
    onRetry: () => void;
}) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-sm text-slate-500">기사를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-red-600 font-medium mb-2">오류 발생</p>
                <p className="text-slate-500 text-sm mb-4">{error}</p>
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                    <RefreshCw className="w-4 h-4" />
                    다시 시도
                </button>
            </div>
        );
    }

    if (articles.length === 0) {
        return (
            <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium mb-1">기사가 없습니다</p>
                <p className="text-slate-400 text-sm">새 기사를 작성하거나 필터를 변경해보세요.</p>
            </div>
        );
    }

    const editableArticles = articles.filter(a => a.canEdit);
    const allEditableSelected = editableArticles.length > 0 && editableArticles.every(a => selectedIds.has(a.id));
    const someSelected = editableArticles.some(a => selectedIds.has(a.id));

    return (
        <div>
            {/* Select All Header */}
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-slate-100">
                <input
                    type="checkbox"
                    checked={allEditableSelected}
                    disabled={editableArticles.length === 0}
                    ref={(el) => {
                        if (el) {
                            el.indeterminate = someSelected && !allEditableSelected;
                        }
                    }}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className={`w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 ${
                        editableArticles.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                    }`}
                />
                <span className="text-sm text-slate-600">
                    전체 선택 {editableArticles.length > 0 ? `(${editableArticles.length}개 편집 가능)` : '(편집 가능한 기사 없음)'}
                </span>
            </div>
            <div className="divide-y divide-slate-100">
                {articles.map((article) => (
                    <ArticleRow
                        key={article.id}
                        article={article}
                        myRegion={myRegion}
                        isProcessing={processingId === article.id}
                        onApprove={onApprove}
                        onReject={onReject}
                        onDelete={onDelete}
                        isSelected={selectedIds.has(article.id)}
                        onSelect={onSelectArticle}
                    />
                ))}
            </div>
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
    isSelected,
    onSelect,
}: {
    article: Article;
    myRegion: string;
    isProcessing: boolean;
    onApprove: (article: Article) => void;
    onReject: (article: Article) => void;
    onDelete: (article: Article) => void;
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
        <div className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition group ${isSelected ? 'bg-blue-50' : ''}`}>
            {/* Checkbox */}
            <input
                type="checkbox"
                checked={isSelected}
                disabled={!article.canEdit}
                onChange={(e) => onSelect(article.id, e.target.checked)}
                className={`w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 flex-shrink-0 ${
                    article.canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                }`}
                onClick={(e) => e.stopPropagation()}
                title={article.canEdit ? '선택' : '편집 권한 없음'}
            />

            {/* Thumbnail */}
            <div className="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                {article.thumbnail_url ? (
                    <img src={article.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-slate-300" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isMyRegion ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                    }`}>
                        {article.source}
                    </span>
                    {article.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                            {article.category}
                        </span>
                    )}
                    {statusBadge()}
                </div>
                <Link
                    href={`/news/${article.id}`}
                    target="_blank"
                    className="font-medium text-slate-900 truncate text-sm hover:text-blue-600 hover:underline block"
                >
                    {article.title}
                </Link>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(article.published_at).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            timeZone: "Asia/Seoul"
                        })}
                    </span>
                    {article.view_count !== undefined && (
                        <span className="flex items-center gap-1 text-emerald-600">
                            <Eye className="w-3 h-3" />
                            {article.view_count.toLocaleString()}회
                        </span>
                    )}
                    {article.rejection_reason && (
                        <span className="text-red-500 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            반려: {article.rejection_reason.substring(0, 30)}...
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
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
                            target="_blank"
                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition"
                            title="보기"
                        >
                            <Eye className="w-4 h-4" />
                        </Link>
                        {article.canEdit && (
                            <>
                                <Link
                                    href={`/reporter/edit/${article.id}`}
                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                    title="편집"
                                >
                                    <Edit className="w-4 h-4" />
                                </Link>
                                <button
                                    onClick={() => onDelete(article)}
                                    className="p-1.5 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition border border-transparent hover:border-red-600"
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
    error,
    onRetry,
}: {
    releases: PressRelease[];
    isLoading: boolean;
    error: string | null;
    onRetry: () => void;
}) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-sm text-slate-500">보도자료를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-red-600 font-medium mb-2">오류 발생</p>
                <p className="text-slate-500 text-sm mb-4">{error}</p>
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                    <RefreshCw className="w-4 h-4" />
                    다시 시도
                </button>
            </div>
        );
    }

    if (releases.length === 0) {
        return (
            <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                    <Inbox className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium mb-1">보도자료가 없습니다</p>
                <p className="text-slate-400 text-sm">새로운 보도자료가 도착하면 여기에 표시됩니다.</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-slate-100">
            {releases.map((release) => (
                <PressReleaseRow key={release.id} release={release} />
            ))}
        </div>
    );
}

// Press Release Row Component
function PressReleaseRow({ release }: { release: PressRelease }) {
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
            !release.is_read ? "bg-blue-50/30" : ""
        }`}>
            {/* Status Indicator */}
            <div className="pt-1.5 flex-shrink-0">
                {release.status === "new" ? (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
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
                            ? "bg-blue-100 text-blue-700"
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
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
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
