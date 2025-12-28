"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Search, CheckCircle, Trash2, Save, Loader2, ExternalLink,
    RefreshCw, Globe, Sparkles, BarChart3, Edit3, X
} from "lucide-react";
import { useToast } from '@/components/ui/Toast';
import {
    StatusBadge,
    ConfirmModal,
    FilterTabs,
    PageHeader,
    Pagination,
    ImageThumbnail,
} from "@/components/admin/shared";

export const dynamic = 'force-dynamic';

// ============================================
// 타입 정의
// ============================================
interface AIArticle {
    id: string;
    title: string;
    original_title?: string;
    content: string;
    status: string;
    published_at: string;
    source: string;
    original_link?: string;
    thumbnail_url?: string;
    ai_source?: string;
    region?: string;
    created_at: string; // 추가
}

interface UsageStats {
    projects: {
        name: string;
        used: number;
        limit: number;
        percent: number;
        is_active: boolean;
    }[];
    total_used: number;
    total_limit: number;
    total_percent: number;
    days_left: number;
}

// ============================================
// Suspense 래퍼
// ============================================
export default function AINewsPageWrapper() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-gray-400">로딩 중...</div>}>
            <AINewsPage />
        </Suspense>
    );
}

// ============================================
// 메인 컴포넌트
// ============================================
function AINewsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlStatus = searchParams.get('status') || 'all';
    const { showSuccess, showError, showWarning } = useToast();

    // 상태
    const [articles, setArticles] = useState<AIArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState(urlStatus);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // 선택된 기사 (우측 패널)
    const [selectedArticle, setSelectedArticle] = useState<AIArticle | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // 사용량 통계
    const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

    // 확인 모달
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'approve' | 'delete' | null;
        message: string;
    }>({ isOpen: false, type: null, message: '' });

    // ============================================
    // 데이터 로드
    // ============================================
    const fetchArticles = async () => {
        setLoading(true);
        try {
            // AI 뉴스만 필터링 (region=global 또는 category=AI)
            const statusParam = filterStatus !== 'all' ? `&status=${filterStatus}` : '';
            const res = await fetch(`/api/posts?limit=20&page=${currentPage}&region=global${statusParam}&sort=created_at`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            setArticles(data.posts || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error('Fetch error:', err);
            setArticles([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsageStats = async () => {
        try {
            const res = await fetch('/api/translation-usage');
            if (res.ok) {
                const data = await res.json();
                setUsageStats(data);
            }
        } catch {
            // 사용량 API 없어도 페이지는 동작
        }
    };

    useEffect(() => {
        fetchArticles();
    }, [filterStatus, currentPage]);

    useEffect(() => {
        fetchUsageStats();
    }, []);

    useEffect(() => {
        setFilterStatus(urlStatus);
        setCurrentPage(1);
    }, [urlStatus]);

    // ============================================
    // 기사 선택
    // ============================================
    const selectArticle = (article: AIArticle) => {
        setSelectedArticle(article);
        setEditTitle(article.title);
        setEditContent(article.content);
    };

    const clearSelection = () => {
        setSelectedArticle(null);
        setEditTitle("");
        setEditContent("");
    };

    // ============================================
    // 저장
    // ============================================
    const handleSave = async () => {
        if (!selectedArticle) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/posts/${selectedArticle.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editTitle, content: editContent })
            });

            if (res.ok) {
                setArticles(articles.map(a =>
                    a.id === selectedArticle.id
                        ? { ...a, title: editTitle, content: editContent }
                        : a
                ));
                setSelectedArticle({ ...selectedArticle, title: editTitle, content: editContent });
                showSuccess("저장되었습니다.");
            } else {
                throw new Error("저장 실패");
            }
        } catch (err) {
            showError("저장에 실패했습니다.");
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    // ============================================
    // 승인
    // ============================================
    const handleApprove = async () => {
        if (!selectedArticle) return;
        try {
            const bodyData: any = { status: 'published' };
            if (!selectedArticle.published_at) {
                bodyData.published_at = new Date().toISOString();
            }

            const res = await fetch(`/api/posts/${selectedArticle.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            if (res.ok) {
                showSuccess("기사가 발행되었습니다!");
                setConfirmModal({ isOpen: false, type: null, message: '' });
                clearSelection();
                fetchArticles();
            } else {
                throw new Error("승인 실패");
            }
        } catch (err) {
            showError("승인에 실패했습니다.");
        }
    };

    // ============================================
    // 삭제
    // ============================================
    const handleDelete = async () => {
        if (!selectedArticle) return;
        try {
            const res = await fetch(`/api/posts/${selectedArticle.id}`, { method: 'DELETE' });
            if (res.ok) {
                showSuccess("삭제되었습니다.");
                setConfirmModal({ isOpen: false, type: null, message: '' });
                clearSelection();
                fetchArticles();
            } else {
                throw new Error("삭제 실패");
            }
        } catch (err) {
            showError("삭제에 실패했습니다.");
        }
    };

    // ============================================
    // 필터링
    // ============================================
    const filteredArticles = articles.filter(article =>
        searchQuery === '' ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ============================================
    // 렌더링
    // ============================================
    return (
        <div className="space-y-4 h-[calc(100vh-100px)]">
            {/* 상단: 사용량 대시보드 */}
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        <span className="font-medium">Google Translation API</span>
                    </div>
                    {usageStats && (
                        <span className="text-sm opacity-80">리셋: {usageStats.days_left}일 후</span>
                    )}
                </div>
                <div className="flex gap-4">
                    {usageStats?.projects.map((proj, i) => (
                        <div key={i} className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                                <span>{proj.name}</span>
                                <span>{(proj.used / 1000).toFixed(0)}K / {(proj.limit / 1000).toFixed(0)}K</span>
                            </div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${proj.is_active ? 'bg-green-400' : 'bg-white/60'}`}
                                    style={{ width: `${Math.min(proj.percent, 100)}%` }}
                                />
                            </div>
                        </div>
                    )) || (
                            <div className="text-sm opacity-60">사용량 데이터 없음 (API 설정 필요)</div>
                        )}
                </div>
            </div>

            {/* 헤더 */}
            <PageHeader
                title="AI 뉴스 관리"
                description="해외 AI 뉴스 스크래핑 기사를 편집하고 발행합니다."
                icon={Sparkles}
                iconBgColor="bg-purple-600"
                actions={
                    <button
                        onClick={() => fetchArticles()}
                        className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        새로고침
                    </button>
                }
            />

            {/* 필터 툴바 */}
            <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d] shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6e7681] w-4 h-4" />
                    <input
                        type="text"
                        placeholder="제목 또는 내용 검색..."
                        className="w-full pl-10 pr-4 py-2 border border-[#30363d] rounded-lg text-sm bg-[#0d1117] text-[#e6edf3] placeholder-[#6e7681] focus:ring-2 focus:ring-purple-500 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <FilterTabs
                    tabs={[
                        { key: "all", label: "전체" },
                        { key: "draft", label: "대기" },
                        { key: "published", label: "발행됨" },
                        { key: "trash", label: "삭제됨" }
                    ]}
                    activeTab={filterStatus}
                    onChange={(key) => {
                        setFilterStatus(key);
                        const url = key === 'all' ? '/admin/ai-news' : `/admin/ai-news?status=${key}`;
                        router.push(url, { scroll: false });
                    }}
                />
            </div>

            {/* 메인 콘텐츠: 2단 레이아웃 */}
            <div className="flex gap-4 h-[calc(100%-280px)]">
                {/* 왼쪽: 기사 목록 */}
                <div className="w-1/2 bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                            </div>
                        ) : filteredArticles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-[#6e7681]">
                                <Globe className="w-12 h-12 mb-2" />
                                <p>AI 뉴스가 없습니다.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#21262d]">
                                {filteredArticles.map((article) => (
                                    <div
                                        key={article.id}
                                        onClick={() => selectArticle(article)}
                                        className={`p-4 cursor-pointer hover:bg-[#21262d] transition ${selectedArticle?.id === article.id ? 'bg-purple-900/30 border-l-4 border-purple-500' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {article.thumbnail_url && (
                                                <ImageThumbnail
                                                    src={article.thumbnail_url}
                                                    alt={article.title}
                                                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <StatusBadge type="article" status={article.status} />
                                                    <span className="text-xs text-[#8b949e]">{article.source}</span>
                                                    <div className="ml-auto flex gap-3 text-[10px]">
                                                        <span className="text-[#58a6ff]" title="원문작성일">
                                                            {article.published_at ? new Date(article.published_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}
                                                        </span>
                                                        <span className="text-[#6e7681]" title="수집일">
                                                            {new Date(article.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <h3 className="font-medium text-[#e6edf3] truncate">{article.title}</h3>
                                                <p className="text-sm text-[#8b949e] line-clamp-2 mt-1">
                                                    {article.content.substring(0, 100)}...
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 페이지네이션 */}
                    <div className="border-t border-[#30363d] p-3">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>

                {/* 오른쪽: 기사 상세 + 편집 */}
                <div className="w-1/2 bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm overflow-hidden flex flex-col">
                    {selectedArticle ? (
                        <>
                            {/* 헤더 */}
                            <div className="p-4 border-b border-[#30363d] flex items-center justify-between bg-[#21262d]">
                                <div className="flex items-center gap-2">
                                    <Edit3 className="w-5 h-5 text-purple-600" />
                                    <span className="font-medium">기사 편집</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-1"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        저장
                                    </button>
                                    <button
                                        onClick={() => setConfirmModal({ isOpen: true, type: 'approve', message: '이 기사를 발행하시겠습니까?' })}
                                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        승인
                                    </button>
                                    <button
                                        onClick={() => setConfirmModal({ isOpen: true, type: 'delete', message: '이 기사를 삭제하시겠습니까?' })}
                                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        삭제
                                    </button>
                                    <button
                                        onClick={clearSelection}
                                        className="p-1.5 text-[#6e7681] hover:text-[#c9d1d9]"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* 편집 폼 */}
                            <div className="flex-1 p-4 overflow-auto space-y-4">
                                {/* 원문 링크 */}
                                {selectedArticle.original_link && (
                                    <a
                                        href={selectedArticle.original_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-purple-600 hover:underline"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        원문 보기
                                    </a>
                                )}

                                {/* 제목 */}
                                <div>
                                    <label className="block text-sm font-medium text-[#c9d1d9] mb-1">제목</label>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="w-full px-3 py-2 border border-[#30363d] rounded-lg bg-[#0d1117] text-[#e6edf3] focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>

                                {/* 원본 제목 */}
                                {selectedArticle.original_title && (
                                    <div>
                                        <label className="block text-sm font-medium text-[#6e7681] mb-1">원본 제목 (영문)</label>
                                        <p className="text-sm text-[#8b949e] bg-[#21262d] p-2 rounded-lg">
                                            {selectedArticle.original_title}
                                        </p>
                                    </div>
                                )}

                                {/* 본문 */}
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-[#c9d1d9] mb-1">본문</label>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full h-64 px-3 py-2 border border-[#30363d] rounded-lg bg-[#0d1117] text-[#e6edf3] focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                    />
                                </div>

                                {/* 메타 정보 */}
                                <div className="grid grid-cols-2 gap-4 text-sm text-[#8b949e]">
                                    <div>
                                        <span className="font-medium">출처:</span> {selectedArticle.source}
                                    </div>
                                    <div>
                                        <span className="font-medium">상태:</span> <StatusBadge type="article" status={selectedArticle.status} />
                                    </div>
                                    <div className="col-span-2 flex flex-col gap-1 mt-2 text-xs border-t border-[#30363d] pt-2">
                                        <div className="flex gap-2">
                                            <span className="text-[#8b949e] w-20">원문작성일:</span>
                                            <span className={selectedArticle.published_at ? "text-[#58a6ff] font-bold" : "text-[#6e7681]"}>
                                                {selectedArticle.published_at ? new Date(selectedArticle.published_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-[#8b949e] w-20">수집일:</span>
                                            <span className="text-[#c9d1d9]">{new Date(selectedArticle.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-[#6e7681]">
                            <Sparkles className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg">기사를 선택하세요</p>
                            <p className="text-sm">왼쪽 목록에서 편집할 기사를 클릭하세요</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 확인 모달 */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                message={confirmModal.message}
                onConfirm={() => {
                    if (confirmModal.type === 'approve') handleApprove();
                    else if (confirmModal.type === 'delete') handleDelete();
                }}
                onCancel={() => setConfirmModal({ isOpen: false, type: null, message: '' })}
            />
        </div>
    );
}
