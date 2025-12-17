"use client";

import React, { useEffect, useState, useCallback } from "react";
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
    Trash2,
    UserCog,
    X,
    Check,
    Ban,
    MoreHorizontal,
    RefreshCw,
    User,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmModal";

interface Article {
    id: string;
    title: string;
    source: string;
    category: string;
    published_at: string;
    status: string;
    author_id: string | null;
    author_name?: string | null;
    thumbnail_url: string | null;
    canEdit: boolean;
    rejection_reason?: string | null;
}

interface Reporter {
    id: string;
    name: string;
    email: string;
    region: string;
    position: string;
    access_level: number;
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
    access_level: number;
}

export default function ReporterArticlesPage() {
    const searchParams = useSearchParams();
    const initialFilter = searchParams.get("filter") || "all";

    const [articles, setArticles] = useState<Article[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [reporter, setReporter] = useState<ReporterInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [filter, setFilter] = useState(initialFilter);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    // 삭제/기자변경을 위한 상태
    const [reportersList, setReportersList] = useState<Reporter[]>([]);
    const [authorModalArticle, setAuthorModalArticle] = useState<Article | null>(null);
    const [selectedAuthorId, setSelectedAuthorId] = useState<string>("");
    const [isChangingAuthor, setIsChangingAuthor] = useState(false);

    // 승인/반려 처리 중
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Rejection modal state
    const [rejectModalArticle, setRejectModalArticle] = useState<Article | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isRejecting, setIsRejecting] = useState(false);

    const { showSuccess, showError } = useToast();
    const { confirmDelete, confirm } = useConfirm();

    const fetchArticles = useCallback(async () => {
        setIsLoading(true);
        try {
            let url = `/api/reporter/articles?filter=${filter}&page=${page}&limit=20`;
            if (statusFilter !== "all") {
                url += `&status=${statusFilter}`;
            }
            const res = await fetch(url);
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
    }, [filter, page, statusFilter]);

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    // 소속 기자 목록 조회 (기자 변경 모달용)
    const fetchReporters = useCallback(async (region: string) => {
        try {
            const res = await fetch(`/api/reporter/reporters?region=${encodeURIComponent(region)}`);
            if (res.ok) {
                const data = await res.json();
                setReportersList(data.reporters);
            }
        } catch (err) {
            console.error("Failed to fetch reporters:", err);
        }
    }, []);

    // 기사 승인 핸들러
    const handleApprove = useCallback(async (article: Article) => {
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
        } catch (err) {
            console.error("Approve error:", err);
            showError("승인 중 오류가 발생했습니다.");
        } finally {
            setProcessingId(null);
        }
    }, [confirm, showSuccess, showError, fetchArticles]);

    // Open rejection modal
    const handleReject = useCallback((article: Article) => {
        setRejectModalArticle(article);
        setRejectionReason("");
    }, []);

    // Process rejection with reason
    const processRejection = useCallback(async () => {
        if (!rejectModalArticle) return;

        setIsRejecting(true);
        try {
            const res = await fetch(`/api/reporter/articles/${rejectModalArticle.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "rejected",
                    rejection_reason: rejectionReason || null,
                }),
            });

            if (res.ok) {
                showSuccess("기사가 반려되었습니다.");
                setRejectModalArticle(null);
                setRejectionReason("");
                fetchArticles();
            } else {
                const data = await res.json();
                showError(data.message || "반려에 실패했습니다.");
            }
        } catch (err) {
            console.error("Reject error:", err);
            showError("반려 중 오류가 발생했습니다.");
        } finally {
            setIsRejecting(false);
        }
    }, [rejectModalArticle, rejectionReason, showSuccess, showError, fetchArticles]);

    // 기사 삭제 핸들러
    const handleDelete = useCallback(async (article: Article) => {
        const confirmed = await confirmDelete(
            `"${article.title}" 기사를 삭제하시겠습니까?\n\n삭제된 기사는 휴지통으로 이동됩니다.`
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
        } catch (err) {
            console.error("Delete error:", err);
            showError("삭제 중 오류가 발생했습니다.");
        } finally {
            setProcessingId(null);
        }
    }, [confirmDelete, showSuccess, showError, fetchArticles]);

    // 기자 변경 모달 열기
    const openAuthorModal = useCallback(async (article: Article) => {
        setAuthorModalArticle(article);
        setSelectedAuthorId(article.author_id || "");
        await fetchReporters(article.source);
    }, [fetchReporters]);

    // 기자 변경 핸들러
    const handleChangeAuthor = useCallback(async () => {
        if (!authorModalArticle || !selectedAuthorId) return;

        setIsChangingAuthor(true);
        try {
            const res = await fetch(`/api/reporter/articles/${authorModalArticle.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ author_id: selectedAuthorId }),
            });

            if (res.ok) {
                showSuccess("기자가 변경되었습니다.");
                setAuthorModalArticle(null);
                fetchArticles();
            } else {
                const data = await res.json();
                showError(data.message || "기자 변경에 실패했습니다.");
            }
        } catch (err) {
            console.error("Change author error:", err);
            showError("기자 변경 중 오류가 발생했습니다.");
        } finally {
            setIsChangingAuthor(false);
        }
    }, [authorModalArticle, selectedAuthorId, showSuccess, showError, fetchArticles]);

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
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                        <CheckCircle className="w-3.5 h-3.5" />
                        게시됨
                    </span>
                );
            case "pending":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        <Clock className="w-3.5 h-3.5" />
                        대기중
                    </span>
                );
            case "draft":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                        <FileText className="w-3.5 h-3.5" />
                        초안
                    </span>
                );
            case "rejected":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        <XCircle className="w-3.5 h-3.5" />
                        반려
                    </span>
                );
            default:
                return null;
        }
    };

    const canChangeAuthor = (reporter?.access_level || 0) >= 2;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        기사 관리
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {reporter?.regionGroup || reporter?.region} 소속 · 총 {pagination?.total || 0}개의 기사
                    </p>
                </div>
                <button
                    onClick={fetchArticles}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-600 font-medium"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    새로고침
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Region Filter Tabs */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <div className="flex gap-1.5 flex-wrap">
                            {[
                                { value: "all", label: "전체" },
                                { value: "my-region", label: `${reporter?.regionGroup || reporter?.region || "내 지역"}` },
                                { value: "my-articles", label: "내 기사" },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        setFilter(opt.value);
                                        setPage(1);
                                    }}
                                    className={`
                                        px-4 py-2 text-sm font-medium rounded-lg transition
                                        ${filter === opt.value
                                            ? "bg-blue-500 text-white shadow-sm"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">상태:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="all">전체</option>
                            <option value="published">게시됨</option>
                            <option value="pending">대기중</option>
                            <option value="draft">초안</option>
                            <option value="rejected">반려</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="기사 제목 검색..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Article List */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            <p className="text-slate-500 text-sm">기사 목록 로딩 중...</p>
                        </div>
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="text-center py-16">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">기사가 없습니다.</p>
                        <p className="text-slate-400 text-sm mt-1">필터 조건을 변경해보세요.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredArticles.map((article) => (
                            <ArticleRow
                                key={article.id}
                                article={article}
                                getStatusBadge={getStatusBadge}
                                myRegion={reporter?.region || ""}
                                canChangeAuthor={canChangeAuthor}
                                isProcessing={processingId === article.id}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                onDelete={handleDelete}
                                onChangeAuthor={openAuthorModal}
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
                        className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 text-sm text-slate-600 font-medium">
                        {page} / {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={page === pagination.totalPages}
                        className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* 기자 변경 모달 */}
            {authorModalArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setAuthorModalArticle(null)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in-up">
                        <button
                            onClick={() => setAuthorModalArticle(null)}
                            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <UserCog className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">기자 배정</h3>
                                    <p className="text-sm text-slate-500">{authorModalArticle.source} 소속</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 mb-4 line-clamp-2 p-3 bg-slate-50 rounded-lg">
                                {authorModalArticle.title}
                            </p>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                담당 기자 선택
                            </label>
                            <select
                                value={selectedAuthorId}
                                onChange={(e) => setSelectedAuthorId(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="">기자를 선택하세요...</option>
                                {reportersList.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name} ({getPositionLabel(r.position)})
                                    </option>
                                ))}
                            </select>
                            {authorModalArticle.author_id && (
                                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    현재 담당: {authorModalArticle.author_name || "알 수 없음"}
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
                            <button
                                onClick={() => setAuthorModalArticle(null)}
                                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleChangeAuthor}
                                disabled={!selectedAuthorId || isChangingAuthor}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                            >
                                {isChangingAuthor && <Loader2 className="w-4 h-4 animate-spin" />}
                                배정하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {rejectModalArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setRejectModalArticle(null)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in-up">
                        <button
                            onClick={() => setRejectModalArticle(null)}
                            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                    <Ban className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Reject Article</h3>
                                    <p className="text-sm text-slate-500">Please provide a reason</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 mb-4 line-clamp-2 p-3 bg-slate-50 rounded-lg">
                                {rejectModalArticle.title}
                            </p>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Rejection Reason
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Enter the reason for rejection (optional but recommended)..."
                                rows={4}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-white resize-none"
                            />
                            <p className="text-xs text-slate-400 mt-2">
                                The author will be notified with this reason.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
                            <button
                                onClick={() => setRejectModalArticle(null)}
                                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={processRejection}
                                disabled={isRejecting}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                            >
                                {isRejecting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ArticleRow({
    article,
    getStatusBadge,
    myRegion,
    canChangeAuthor,
    isProcessing,
    onApprove,
    onReject,
    onDelete,
    onChangeAuthor,
}: {
    article: Article;
    getStatusBadge: (status: string) => React.ReactNode;
    myRegion: string;
    canChangeAuthor: boolean;
    isProcessing: boolean;
    onApprove: (article: Article) => void;
    onReject: (article: Article) => void;
    onDelete: (article: Article) => void;
    onChangeAuthor: (article: Article) => void;
}) {
    const isMyRegion = article.source === myRegion;
    const isPending = article.status === "pending" || article.status === "draft";
    const [showActions, setShowActions] = useState(false);

    return (
        <div className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition group">
            {/* Thumbnail */}
            <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                {article.thumbnail_url ? (
                    <img
                        src={article.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${isMyRegion
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                            }`}
                    >
                        {article.source}
                    </span>
                    {getStatusBadge(article.status)}
                    {article.author_name && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {article.author_name}
                        </span>
                    )}
                </div>
                <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition">
                    {article.title}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                    {new Date(article.published_at).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                    })}
                </p>
                {/* Rejection reason display */}
                {article.status === "rejected" && article.rejection_reason && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {article.rejection_reason.length > 50
                            ? `${article.rejection_reason.substring(0, 50)}...`
                            : article.rejection_reason}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
                {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                ) : (
                    <>
                        {/* 승인/반려 버튼 (대기 중인 기사만, 편집 권한 있을 때) */}
                        {isPending && article.canEdit && (
                            <>
                                <button
                                    onClick={() => onApprove(article)}
                                    className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                                    title="승인"
                                >
                                    <Check className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => onReject(article)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="반려"
                                >
                                    <Ban className="w-5 h-5" />
                                </button>
                            </>
                        )}

                        {/* 보기 버튼 */}
                        <Link
                            href={`/news/${article.id}`}
                            target="_blank"
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            title="보기"
                        >
                            <Eye className="w-5 h-5" />
                        </Link>

                        {/* 편집 권한 있을 때만 표시되는 버튼들 */}
                        {article.canEdit && (
                            <>
                                <Link
                                    href={`/reporter/edit/${article.id}`}
                                    className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                                    title="편집"
                                >
                                    <Edit className="w-5 h-5" />
                                </Link>

                                {/* 기자 배정 버튼 (지사장 이상) */}
                                {canChangeAuthor && (
                                    <button
                                        onClick={() => onChangeAuthor(article)}
                                        className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                                        title="기자 배정"
                                    >
                                        <UserCog className="w-5 h-5" />
                                    </button>
                                )}

                                {/* 삭제 버튼 */}
                                <button
                                    onClick={() => onDelete(article)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="삭제"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function getPositionLabel(position: string): string {
    const positions: Record<string, string> = {
        editor_in_chief: "주필",
        branch_manager: "지사장",
        editor_chief: "편집국장",
        news_chief: "보도국장",
        senior_reporter: "선임기자",
        reporter: "기자",
        intern_reporter: "수습기자",
        citizen_reporter: "시민기자",
    };
    return positions[position] || position;
}
