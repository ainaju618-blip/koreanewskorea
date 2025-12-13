"use client";

import React, { useState, useEffect } from "react";
import { Search, FileEdit, Trash2, Save, Loader2, Plus, Copy, Check } from "lucide-react";
import NewsEditor from "@/components/admin/NewsEditor";
import { useToast } from '@/components/ui/Toast';

interface Draft {
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export default function ReporterDraftsPage() {
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
    const { showSuccess, showError, showWarning } = useToast();

    // 확인 모달 상태
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'bulk-delete' | 'single-delete' | null;
        message: string;
    }>({ isOpen: false, type: null, message: '' });

    const ITEMS_PER_PAGE = 20;

    // 초안 목록 조회
    const fetchDrafts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/memo");
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
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("ko-KR");
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

    // 필터링
    const filteredDrafts = drafts.filter(draft => {
        const matchesSearch = searchQuery === '' ||
            draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stripHtml(draft.content).toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    // 페이지네이션
    const totalPages = Math.ceil(filteredDrafts.length / ITEMS_PER_PAGE);
    const paginatedDrafts = filteredDrafts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileEdit className="w-7 h-7 text-amber-500" />
                        기사 초안
                    </h1>
                    <p className="text-gray-500 mt-1">
                        기사 초안을 작성하고 관리합니다.
                    </p>
                </div>
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
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="제목 또는 내용 검색..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="text-sm text-gray-500">
                    전체 {filteredDrafts.length}개
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                    </div>
                ) : paginatedDrafts.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <FileEdit className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="mb-4">저장된 기사 초안이 없습니다</p>
                        <button
                            onClick={openCreatePanel}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            첫 초안 작성하기
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="py-2 px-3 w-10 text-center text-xs font-semibold text-gray-500">No.</th>
                                <th className="py-2 px-3 w-10">
                                    <input
                                        type="checkbox"
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedIds(new Set(paginatedDrafts.map(d => d.id)));
                                            else setSelectedIds(new Set());
                                        }}
                                        checked={paginatedDrafts.length > 0 && selectedIds.size === paginatedDrafts.length}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                </th>
                                <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase">제목</th>
                                <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase w-40">작성일</th>
                                <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase w-40">수정일</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedDrafts.map((draft, index) => (
                                <tr
                                    key={draft.id}
                                    className="hover:bg-gray-50 transition cursor-pointer"
                                    onClick={() => openPanel(draft)}
                                >
                                    <td className="py-3 px-3 text-center text-xs text-gray-400">
                                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                    </td>
                                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(draft.id)}
                                            onChange={() => toggleSelect(draft.id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                        />
                                    </td>
                                    <td className="py-3 px-3">
                                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{draft.title}</p>
                                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                            {stripHtml(draft.content) || "(내용 없음)"}
                                        </p>
                                    </td>
                                    <td className="py-3 px-3 text-xs text-gray-500">
                                        {formatDate(draft.created_at)}
                                    </td>
                                    <td className="py-3 px-3 text-xs text-gray-500">
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
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                        이전
                    </button>
                    <span className="px-4 py-1.5 text-sm text-gray-600">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                        다음
                    </button>
                </div>
            )}

            {/* Full Screen Edit Modal */}
            {isPanelOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                            <div>
                                <h2 className="font-bold text-lg text-gray-900">
                                    {isCreateMode ? "새 초안 작성" : "초안 편집"}
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isCreateMode && selectedDraft && (
                                    <>
                                        <button
                                            onClick={handleCopy}
                                            className="p-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
                                            title="HTML 복사"
                                        >
                                            {copiedId === selectedDraft.id ? (
                                                <Check className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            onClick={openDeleteModal}
                                            className="p-2 bg-white border border-gray-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={closePanel}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition"
                                >
                                    <span className="text-xl">&times;</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* 제목 */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    제목 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900"
                                    placeholder="기사 제목을 입력하세요"
                                />
                            </div>

                            {/* 본문 에디터 */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">본문</label>
                                <NewsEditor
                                    content={editContent}
                                    onChange={setEditContent}
                                />
                            </div>

                            {/* 메타 정보 (수정 모드일 때만) */}
                            {!isCreateMode && selectedDraft && (
                                <div className="flex gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">작성일:</span>
                                        <span className="font-medium">{formatDate(selectedDraft.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">수정일:</span>
                                        <span className="font-medium">{formatDate(selectedDraft.updated_at)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <button
                                onClick={closePanel}
                                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">확인</h3>
                        <p className="text-gray-600 mb-6">{confirmModal.message}</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmModal({ isOpen: false, type: null, message: '' })}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
