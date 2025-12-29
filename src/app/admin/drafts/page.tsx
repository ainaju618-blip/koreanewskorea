"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from 'next/dynamic';
import { Search, FileEdit, Trash2, Save, Loader2, Plus, Copy, Check } from "lucide-react";
import { useToast } from '@/components/ui/Toast';

// Dynamic import for TipTap editor (reduces initial bundle by ~400KB)
const NewsEditor = dynamic(() => import("@/components/admin/NewsEditor"), {
    ssr: false,
    loading: () => <div className="h-64 bg-[#21262d] rounded-lg animate-pulse" />
});

// 공통 컴포넌트 import
import {
    ConfirmModal,
    PageHeader,
    Pagination,
} from "@/components/admin/shared";

interface Draft {
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export default function AdminDraftsPage() {
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Panel State
    const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // 확인 모달 상태
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'bulk-delete' | 'single-delete' | null;
        message: string;
    }>({ isOpen: false, type: null, message: '' });

    const ITEMS_PER_PAGE = 20;
    const { showSuccess, showError, showWarning } = useToast();

    // 초안 목록 조회 (관리자: 전체 조회)
    const fetchDrafts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/memo?admin=true");
            if (res.ok) {
                const data = await res.json();
                setDrafts(data);
            }
        } catch (err) {
            console.error("Failed to fetch drafts:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrafts();
    }, []);

    // HTML 태그 제거 (미리보기용)
    const stripHtml = (html: string) => {
        if (typeof window === "undefined") return html;
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    // 날짜 포맷
    // 날짜 포맷
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("ko-KR", { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
    };

    // 패널 열기 (보기/편집)
    const openPanel = (draft: Draft) => {
        setSelectedDraft(draft);
        setEditTitle(draft.title);
        setEditContent(draft.content || "");
        setIsCreateMode(false);
        setIsPanelOpen(true);
    };

    // 패널 열기 (새로 작성)
    const openCreatePanel = () => {
        setSelectedDraft(null);
        setEditTitle("");
        setEditContent("");
        setIsCreateMode(true);
        setIsPanelOpen(true);
    };

    // 패널 닫기
    const closePanel = () => {
        setIsPanelOpen(false);
        setTimeout(() => {
            setSelectedDraft(null);
            setIsCreateMode(false);
        }, 300);
    };

    // 저장 (생성 또는 수정) - 저장 후 바로 목록으로 이동
    const handleSave = async () => {
        if (!editTitle.trim()) {
            showWarning("제목을 입력해주세요.");
            return;
        }
        setIsSaving(true);
        try {
            if (isCreateMode) {
                // 새로 생성
                const res = await fetch("/api/memo", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: editTitle, content: editContent }),
                });
                if (res.ok) {
                    closePanel();
                    fetchDrafts();
                }
            } else if (selectedDraft) {
                // 수정
                const res = await fetch(`/api/memo/${selectedDraft.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: editTitle, content: editContent }),
                });
                if (res.ok) {
                    closePanel();
                    fetchDrafts();
                }
            }
        } catch (err) {
            console.error("Failed to save:", err);
            showError("저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    // 삭제 모달 열기
    const openDeleteModal = () => {
        if (!selectedDraft) return;
        setConfirmModal({
            isOpen: true,
            type: 'single-delete',
            message: '이 초안을 삭제하시겠습니까?'
        });
    };

    // 벌크 삭제 모달 열기
    const openBulkDeleteModal = () => {
        if (selectedIds.size === 0) {
            showWarning('선택된 초안이 없습니다.');
            return;
        }
        setConfirmModal({
            isOpen: true,
            type: 'bulk-delete',
            message: `${selectedIds.size}개 초안을 삭제하시겠습니까?`
        });
    };

    // 확인 모달 액션
    const handleConfirmAction = async () => {
        const actionType = confirmModal.type;
        setConfirmModal({ isOpen: false, type: null, message: '' });

        if (actionType === 'single-delete') {
            await executeSingleDelete();
        } else if (actionType === 'bulk-delete') {
            await executeBulkDelete();
        }
    };

    // 단일 삭제 실행
    const executeSingleDelete = async () => {
        if (!selectedDraft) return;
        try {
            const res = await fetch(`/api/memo/${selectedDraft.id}`, { method: "DELETE" });
            if (res.ok) {
                setDrafts(drafts.filter((d) => d.id !== selectedDraft.id));
                closePanel();
                showSuccess("삭제되었습니다.");
            }
        } catch (err) {
            console.error("Failed to delete:", err);
            showError("삭제에 실패했습니다.");
        }
    };

    // 벌크 삭제 실행
    const executeBulkDelete = async () => {
        setIsBulkProcessing(true);
        try {
            const results = await Promise.allSettled(
                Array.from(selectedIds).map(async (id) => {
                    const res = await fetch(`/api/memo/${id}`, { method: "DELETE" });
                    if (!res.ok) throw new Error(`ID ${id} 삭제 실패`);
                    return id;
                })
            );

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            if (failed > 0) {
                showWarning(`${succeeded}개 삭제 완료, ${failed}개 실패`);
            } else {
                showSuccess(`${succeeded}개 초안이 삭제되었습니다.`);
            }
            setSelectedIds(new Set());
            fetchDrafts();
        } catch (error) {
            console.error('삭제 처리 오류:', error);
            showError('삭제 처리 중 오류가 발생했습니다.');
        } finally {
            setIsBulkProcessing(false);
        }
    };

    // 복사 (HTML 포함)
    const handleCopy = async () => {
        if (!selectedDraft) return;
        await navigator.clipboard.writeText(selectedDraft.content || "");
        setCopiedId(selectedDraft.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // 체크박스 토글
    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    // Memoized filtering - prevents recalculation on unrelated state changes
    const filteredDrafts = useMemo(() => {
        return drafts.filter(draft => {
            const matchesSearch = searchQuery === '' ||
                draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                stripHtml(draft.content).toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [drafts, searchQuery]);

    // Memoized pagination
    const totalPages = useMemo(() => Math.ceil(filteredDrafts.length / ITEMS_PER_PAGE), [filteredDrafts.length]);
    const paginatedDrafts = useMemo(() => {
        return filteredDrafts.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [filteredDrafts, currentPage]);

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <PageHeader
                title="기사 초안"
                description="기사 초안을 작성하고 관리합니다. 이미지와 서식을 포함한 기사를 미리 작성해 보세요."
                icon={FileEdit}
                iconBgColor="bg-amber-500"
                actions={
                    <div className="flex gap-2">
                        {selectedIds.size > 0 && (
                            <button
                                onClick={openBulkDeleteModal}
                                disabled={isBulkProcessing}
                                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {isBulkProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                                선택 삭제 ({selectedIds.size}개)
                            </button>
                        )}
                        <button
                            onClick={openCreatePanel}
                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            새 초안 작성
                        </button>
                    </div>
                }
            />

            {/* Toolbar */}
            <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d] flex items-center justify-between">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6e7681] w-4 h-4" />
                    <input
                        type="text"
                        placeholder="제목 또는 내용 검색..."
                        className="w-full pl-10 pr-4 py-2 border border-[#30363d] rounded-lg text-sm bg-[#0d1117] text-[#e6edf3] placeholder-[#6e7681] focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="text-sm text-[#8b949e]">
                    전체 {filteredDrafts.length}개
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-[#6e7681]" />
                    </div>
                ) : paginatedDrafts.length === 0 ? (
                    <div className="p-12 text-center text-[#8b949e]">
                        <FileEdit className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="mb-4">저장된 기사 초안이 없습니다</p>
                        <button
                            onClick={openCreatePanel}
                            className="px-4 py-2 bg-[#238636] text-white rounded-lg hover:bg-[#2ea043] transition"
                        >
                            첫 초안 작성하기
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#21262d] border-b border-[#30363d]">
                                <th className="py-2 px-3 w-10 text-center text-xs font-semibold text-[#8b949e]">No.</th>
                                <th className="py-2 px-3 w-10">
                                    <input
                                        type="checkbox"
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedIds(new Set(paginatedDrafts.map(d => d.id)));
                                            else setSelectedIds(new Set());
                                        }}
                                        checked={paginatedDrafts.length > 0 && selectedIds.size === paginatedDrafts.length}
                                        className="rounded border-[#30363d] bg-[#0d1117] text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                </th>
                                <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase">제목</th>
                                <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase w-40">작성일</th>
                                <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase w-40">수정일</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#21262d]">
                            {paginatedDrafts.map((draft, index) => (
                                <tr
                                    key={draft.id}
                                    className="hover:bg-[#21262d] transition cursor-pointer"
                                    onClick={() => openPanel(draft)}
                                >
                                    <td className="py-3 px-3 text-center text-xs text-[#8b949e]">
                                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                    </td>
                                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(draft.id)}
                                            onChange={() => toggleSelect(draft.id)}
                                            className="rounded border-[#30363d] bg-[#0d1117] text-blue-600 focus:ring-blue-500 h-4 w-4"
                                        />
                                    </td>
                                    <td className="py-3 px-3">
                                        <p className="text-sm font-medium text-[#e6edf3] line-clamp-1">{draft.title}</p>
                                        <p className="text-xs text-[#8b949e] line-clamp-1 mt-0.5">
                                            {stripHtml(draft.content) || "(내용 없음)"}
                                        </p>
                                    </td>
                                    <td className="py-3 px-3 text-xs text-[#e6edf3]">
                                        {formatDate(draft.created_at)}
                                    </td>
                                    <td className="py-3 px-3 text-xs text-[#8b949e]">
                                        {formatDate(draft.updated_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}

            {/* Full Screen Edit Modal */}
            {isPanelOpen && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#161b22] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-[#30363d]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[#30363d] bg-[#21262d] rounded-t-xl">
                            <div>
                                <h2 className="font-bold text-lg text-[#e6edf3]">
                                    {isCreateMode ? "새 초안 작성" : "초안 편집"}
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isCreateMode && selectedDraft && (
                                    <>
                                        <button
                                            onClick={handleCopy}
                                            className="p-2 bg-[#0d1117] border border-[#30363d] text-[#8b949e] rounded-lg hover:bg-[#21262d] hover:text-[#e6edf3] transition"
                                            title="HTML 복사"
                                        >
                                            {copiedId === selectedDraft.id ? (
                                                <Check className="w-4 h-4 text-[#3fb950]" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            onClick={openDeleteModal}
                                            className="p-2 bg-[#0d1117] border border-[#30363d] text-[#f85149] rounded-lg hover:bg-[#21262d] transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={closePanel}
                                    className="p-2 text-[#8b949e] hover:text-[#e6edf3] transition"
                                >
                                    <span className="text-xl">&times;</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0d1117]">
                            {/* 제목 */}
                            <div>
                                <label className="block text-xs font-medium text-[#8b949e] mb-1">
                                    제목 <span className="text-[#f85149]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full p-3 border border-[#30363d] rounded-lg focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] outline-none font-bold text-[#e6edf3] bg-[#161b22] placeholder-[#6e7681]"
                                    placeholder="기사 제목을 입력하세요"
                                />
                            </div>

                            {/* 본문 에디터 */}
                            <div>
                                <label className="block text-xs font-medium text-[#8b949e] mb-1">본문</label>
                                <NewsEditor
                                    content={editContent}
                                    onChange={setEditContent}
                                />
                            </div>

                            {/* 메타 정보 (수정 모드일 때만) */}
                            {!isCreateMode && selectedDraft && (
                                <div className="flex gap-4 p-3 bg-[#161b22] rounded-lg border border-[#30363d] text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#8b949e]">작성일:</span>
                                        <span className="font-medium text-[#e6edf3]">{formatDate(selectedDraft.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#8b949e]">수정일:</span>
                                        <span className="font-medium text-[#e6edf3]">{formatDate(selectedDraft.updated_at)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#30363d] bg-[#21262d] rounded-b-xl">
                            <button
                                onClick={closePanel}
                                className="px-4 py-2 border border-[#30363d] text-[#c9d1d9] rounded-lg hover:bg-[#30363d] transition"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-[#238636] text-white rounded-lg hover:bg-[#2ea043] transition flex items-center gap-2 font-medium disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ConfirmModal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="확인"
                message={confirmModal.message}
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirmModal({ isOpen: false, type: null, message: '' })}
            />
        </div>
    );
}
