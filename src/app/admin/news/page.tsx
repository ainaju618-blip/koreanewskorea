"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, CheckCircle, FileEdit, Trash2, X, Globe, Save, Loader2, RotateCcw, AlertTriangle, PauseCircle } from "lucide-react";
import { useToast } from '@/components/ui/Toast';

// 공통 컴포넌트 import
import {
    StatusBadge,
    ConfirmModal,
    FilterTabs,
    PageHeader,
    Pagination,
    SlidePanel,
    ImageThumbnail,
} from "@/components/admin/shared";

// Next.js 15: useSearchParams 사용 시 정적 생성 방지
export const dynamic = 'force-dynamic';

interface Category {
    id: string;
    name: string;
    slug: string;
    depth: number;
}

// Suspense 바운더리 내에서 useSearchParams를 사용하는 래퍼 컴포넌트
export default function AdminNewsListPageWrapper() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-[#8b949e]">로딩 중...</div>}>
            <AdminNewsListPage />
        </Suspense>
    );
}

function AdminNewsListPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const urlStatus = searchParams.get('status') || 'all';
    const { showSuccess, showError, showWarning, showInfo } = useToast();

    const [articles, setArticles] = useState<any[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filterStatus, setFilterStatus] = useState(urlStatus);
    const [filterCategory, setFilterCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    // UUID는 문자열이므로 Set<string> 사용
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [totalPages, setTotalPages] = useState(1);

    // Status counts for tabs
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
        all: 0, draft: 0, published: 0, rejected: 0, trash: 0
    });

    // Keyboard navigation state
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);

    // Preview & Edit State
    const [previewArticle, setPreviewArticle] = useState<any>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [editSubtitle, setEditSubtitle] = useState("");  // 부제목 추가
    const [editIsFocus, setEditIsFocus] = useState(false); // Focus 여부 추가
    const [isSaving, setIsSaving] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    // AI 승인 진행 상황 모달 상태
    interface ProgressLog {
        timestamp: string;
        step: string;
        message: string;
        duration?: number;  // ms
        status: 'info' | 'success' | 'error' | 'warning';
    }
    const [progressModal, setProgressModal] = useState<{
        isOpen: boolean;
        title: string;
        logs: ProgressLog[];
        currentStep: string;
        startTime: number;
        isComplete: boolean;
    }>({
        isOpen: false,
        title: '',
        logs: [],
        currentStep: '',
        startTime: 0,
        isComplete: false
    });

    // 진행 상황 로그 추가 함수
    const addProgressLog = (step: string, message: string, status: ProgressLog['status'] = 'info', duration?: number) => {
        const timestamp = new Date().toLocaleTimeString('ko-KR', { hour12: false });
        setProgressModal(prev => ({
            ...prev,
            currentStep: step,
            logs: [...prev.logs, { timestamp, step, message, status, duration }]
        }));
    };

    // 확인 모달 상태 (window.confirm 대체)
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'bulk-approve' | 'bulk-delete' | 'bulk-restore' | 'bulk-all-approve' | 'bulk-all-delete' | 'single-approve' | 'single-delete' | 'single-restore' | 'single-hold' | 'bulk-hold' | null;
        message: string;
    }>({ isOpen: false, type: null, message: '' });

    // URL 파라미터 변경 시 상태 동기화
    useEffect(() => {
        setFilterStatus(urlStatus);
        // 상태 변경 시 페이지 1로 리셋
        setCurrentPage(1);
    }, [urlStatus]);

    // Fetch Articles from API - 서버 사이드 필터링 및 페이지네이션
    const fetchArticles = async () => {
        setLoading(true);
        try {
            // URL 파라미터 및 페이지 상태 전달
            const statusParam = filterStatus !== 'all' ? `&status=${filterStatus}` : '';
            const pageParam = `&page=${currentPage}`;
            const limitParam = `&limit=20`; // Server-side paging (20 items)
            const sortParam = `&sort=created_at`; // Admin wants to see latest created first

            const res = await fetch(`/api/posts?${limitParam}${pageParam}${statusParam}${sortParam}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            // API 응답 데이터 매핑
            const mapped = (data.posts || []).map((p: any) => ({
                id: p.id,
                title: p.title || '[제목 없음]',
                content: p.content || '',
                status: p.status || 'draft',
                created_at: p.created_at, // 수집일 (추가)
                published_at: p.published_at, // 원본 작성일 or 발행일
                views: p.view_count || 0,
                category: p.category || '미분류',
                source: p.source || 'Korea NEWS',
                author: p.author || 'AI Reporter',
                original_link: p.original_link,
                thumbnail_url: p.thumbnail_url,
                subtitle: p.subtitle || '',
                is_focus: p.is_focus || false
            }));

            setArticles(mapped);
            setTotalPages(data.totalPages || 1); // Use API returned totalPages
        } catch (err) {
            console.error('Fetch error:', err);
            setArticles([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    // 카테고리 목록 로딩
    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories?flat=true');
            if (res.ok) {
                const data = await res.json();
                setCategories(data.flat || []);
            }
        } catch (err) {
            console.error('카테고리 로딩 실패:', err);
        }
    };

    // 상태별 개수 로딩 (탭 배지용)
    const fetchStatusCounts = async () => {
        try {
            const res = await fetch('/api/posts/stats/by-status');
            if (res.ok) {
                const data = await res.json();
                setStatusCounts(data);
            }
        } catch (err) {
            console.error('상태별 개수 로딩 실패:', err);
        }
    };

    // 상태 필터 또는 페이지 변경 시 API 재호출
    useEffect(() => {
        fetchArticles();
    }, [filterStatus, currentPage]);

    useEffect(() => {
        fetchCategories();
        fetchStatusCounts();
    }, []);

    // 기사 목록 변경 시 개수도 새로고침
    useEffect(() => {
        fetchStatusCounts();
    }, [articles]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Calculate current visible articles
            const visibleArticles = articles.filter(article => {
                const matchesCategory = filterCategory === "all" || article.category === filterCategory;
                const matchesSearch = searchQuery === '' ||
                    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    article.content.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesCategory && matchesSearch;
            });

            // Ignore when typing in input fields
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                // Only allow Escape in input fields
                if (e.key === 'Escape' && isPanelOpen) {
                    closePreview();
                }
                return;
            }

            // Panel open state shortcuts
            if (isPanelOpen && previewArticle) {
                switch (e.key) {
                    case 'Escape':
                        e.preventDefault();
                        closePreview();
                        break;
                    case 'a':
                    case 'A':
                        // Approve (only for draft)
                        if (previewArticle.status === 'draft' && !isApproving) {
                            e.preventDefault();
                            handleApprove();
                        }
                        break;
                    case 'd':
                    case 'D':
                        // Delete
                        e.preventDefault();
                        handleDelete();
                        break;
                    case 's':
                        // Save with Ctrl/Cmd+S
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            if (!isSaving) handleSave();
                        }
                        break;
                }
                return;
            }

            // List navigation shortcuts (when panel is closed)
            switch (e.key) {
                case 'j':
                case 'J':
                case 'ArrowDown':
                    // Move down
                    e.preventDefault();
                    setFocusedIndex(prev => {
                        const next = prev + 1;
                        return next >= visibleArticles.length ? 0 : next;
                    });
                    break;
                case 'k':
                case 'K':
                case 'ArrowUp':
                    // Move up
                    e.preventDefault();
                    setFocusedIndex(prev => {
                        const next = prev - 1;
                        return next < 0 ? visibleArticles.length - 1 : next;
                    });
                    break;
                case 'Enter':
                    // Open focused article
                    if (focusedIndex >= 0 && focusedIndex < visibleArticles.length) {
                        e.preventDefault();
                        openPreview(visibleArticles[focusedIndex]);
                    }
                    break;
                case ' ':
                    // Toggle selection with Space
                    if (focusedIndex >= 0 && focusedIndex < visibleArticles.length) {
                        e.preventDefault();
                        toggleSelect(visibleArticles[focusedIndex].id);
                    }
                    break;
                case '?':
                    // Show keyboard shortcuts help
                    e.preventDefault();
                    showInfo('Keyboard Shortcuts: J/K (navigate), Enter (open), Space (select), A (approve), D (delete), Esc (close)');
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isPanelOpen, previewArticle, focusedIndex, articles, filterCategory, searchQuery, isApproving, isSaving]);

    // Reset focused index when articles change
    useEffect(() => {
        setFocusedIndex(-1);
    }, [filterStatus, currentPage]);

    // Open Preview
    const openPreview = (article: any) => {
        setPreviewArticle(article);
        setEditTitle(article.title);
        setEditSubtitle(article.subtitle || '');  // 부제목 로드
        setEditIsFocus(article.is_focus || false); // Focus 여부 로드
        setEditContent(article.content);
        setIsPanelOpen(true);
    };

    // Close Preview
    const closePreview = () => {
        setIsPanelOpen(false);
        setTimeout(() => setPreviewArticle(null), 300); // Wait for animation
    };

    // 확인 모달 열기 (벌크)
    const openBulkConfirmModal = (type: 'bulk-approve' | 'bulk-delete' | 'bulk-restore') => {
        if (selectedIds.size === 0) {
            showWarning('선택된 기사가 없습니다.');
            return;
        }
        let message = '';
        if (type === 'bulk-approve') message = `${selectedIds.size}개 기사를 승인하시겠습니까?`;
        else if (type === 'bulk-restore') message = `${selectedIds.size}개 기사를 복구하시겠습니까? (승인 대기 상태로 이동)`;
        else if (type === 'bulk-delete') {
            message = filterStatus === 'trash'
                ? `${selectedIds.size}개 기사를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
                : `${selectedIds.size}개 기사를 삭제하시겠습니까? (휴지통으로 이동)`;
        }
        setConfirmModal({ isOpen: true, type, message });
    };

    // 일괄 처리 모달 열기 (전체 대상)
    const openBulkAllConfirmModal = (type: 'bulk-all-approve' | 'bulk-all-delete') => {
        let message = '';
        if (type === 'bulk-all-approve') {
            message = `현재 탭의 모든 기사를 일괄 승인하시겠습니까?\n⚠️ 이 작업은 현재 필터에 해당하는 모든 기사에 적용됩니다.`;
        } else if (type === 'bulk-all-delete') {
            message = filterStatus === 'trash'
                ? `현재 탭의 모든 기사를 영구 삭제하시겠습니까?\n⚠️ 이 작업은 되돌릴 수 없습니다!`
                : `현재 탭의 모든 기사를 삭제하시겠습니까?\n⚠️ 이 작업은 현재 필터에 해당하는 모든 기사를 휴지통으로 이동합니다.`;
        }
        setConfirmModal({ isOpen: true, type, message });
    };

    // 단일 기사 승인/삭제 모달 열기
    const openSingleConfirmModal = (type: 'single-approve' | 'single-delete' | 'single-restore' | 'single-hold') => {
        if (!previewArticle) return;
        let message = '';
        if (type === 'single-approve') message = '이 기사를 승인하고 발행하시겠습니까?';
        else if (type === 'single-restore') message = '이 기사를 복구하시겠습니까? (승인 대기 상태로 이동)';
        else if (type === 'single-hold') message = '이 기사를 보류 처리하시겠습니까? (승인 대기 상태로 변경)';
        else if (type === 'single-delete') {
            message = previewArticle.status === 'trash'
                ? '이 기사를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
                : '이 기사를 삭제하시겠습니까? (휴지통으로 이동)';
        }
        setConfirmModal({ isOpen: true, type, message });
    };

    // 벌크 보류 모달 열기
    const openBulkHoldConfirmModal = () => {
        if (selectedIds.size === 0) {
            showWarning('선택된 기사가 없습니다.');
            return;
        }
        setConfirmModal({
            isOpen: true,
            type: 'bulk-hold',
            message: `${selectedIds.size}개 기사를 보류 처리하시겠습니까? (승인 대기 상태로 변경)`
        });
    };

    // 확인 모달에서 확인 클릭 시 실행
    const handleConfirmAction = async () => {
        const actionType = confirmModal.type;
        setConfirmModal({ isOpen: false, type: null, message: '' });

        if (actionType === 'bulk-approve') {
            await executeBulkApprove();
        } else if (actionType === 'bulk-delete') {
            await executeBulkDelete();
        } else if (actionType === 'single-approve') {
            await executeSingleApprove();
        } else if (actionType === 'single-delete') {
            await executeSingleDelete();
        } else if (actionType === 'bulk-restore') {
            await executeBulkRestore();
        } else if (actionType === 'single-restore') {
            await executeSingleRestore();
        } else if (actionType === 'bulk-all-approve') {
            await executeBulkAllApprove();
        } else if (actionType === 'bulk-all-delete') {
            await executeBulkAllDelete();
        } else if (actionType === 'single-hold') {
            await executeSingleHold();
        } else if (actionType === 'bulk-hold') {
            await executeBulkHold();
        }
    };

    // Bulk Approve - Single API call for all selected items
    const executeBulkApprove = async () => {
        console.log('=== 선택 승인 시작 ===');
        const ids = Array.from(selectedIds);
        console.log('선택된 ID 개수:', ids.length);

        setIsBulkProcessing(true);
        try {
            const res = await fetch('/api/posts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids, action: 'approve' })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Bulk approve failed');
            }

            console.log('=== 승인 결과 ===', data);

            if (data.failed > 0) {
                showWarning(`${data.success}개 승인 완료, ${data.failed}개 실패`);
            } else {
                showSuccess(`${data.success}개 기사가 승인되었습니다.`);
            }
            setSelectedIds(new Set());
            fetchArticles();
        } catch (error) {
            console.error('승인 처리 오류:', error);
            showError('승인 처리 중 오류가 발생했습니다.');
        } finally {
            setIsBulkProcessing(false);
        }
    };

    // Bulk Delete - Single API call
    const executeBulkDelete = async () => {
        setIsBulkProcessing(true);
        const isTrash = filterStatus === 'trash';
        const ids = Array.from(selectedIds);

        try {
            const res = await fetch('/api/posts/delete-by-ids', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids, force: isTrash })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            if (data.failed > 0) {
                showWarning(`${data.success}개 ${isTrash ? '영구 삭제' : '삭제'} 완료, ${data.failed}개 실패`);
            } else {
                showSuccess(`${data.success}개 기사가 ${isTrash ? '영구 삭제' : '휴지통으로 이동'}되었습니다.`);
            }
            setSelectedIds(new Set());
            fetchArticles();
        } catch (error) {
            console.error('삭제 처리 오류:', error);
            showError('삭제 처리 중 오류가 발생했습니다.');
        } finally {
            setIsBulkProcessing(false);
        }
    };

    // Bulk Restore - Single API call
    const executeBulkRestore = async () => {
        setIsBulkProcessing(true);
        const ids = Array.from(selectedIds);

        try {
            const res = await fetch('/api/posts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids, status: 'draft' })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            if (data.failed > 0) {
                showWarning(`${data.success}개 복구 완료, ${data.failed}개 실패`);
            } else {
                showSuccess(`${data.success}개 기사가 복구되었습니다 (승인 대기 상태).`);
            }
            setSelectedIds(new Set());
            fetchArticles();
        } catch (error) {
            console.error('복구 처리 오류:', error);
            showError('복구 처리 중 오류가 발생했습니다.');
        } finally {
            setIsBulkProcessing(false);
        }
    };

    // Bulk Hold - Single API call
    const executeBulkHold = async () => {
        setIsBulkProcessing(true);
        const ids = Array.from(selectedIds);

        try {
            const res = await fetch('/api/posts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids, action: 'hold' })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            const succeeded = data.success || 0;
            const failed = data.failed || 0;

            if (failed > 0) {
                showWarning(`${succeeded}개 보류 완료, ${failed}개 실패`);
            } else {
                showSuccess(`${succeeded}개 기사가 보류 처리되었습니다.`);
            }
            setSelectedIds(new Set());
            fetchArticles();
        } catch (error) {
            console.error('보류 처리 오류:', error);
            showError('보류 처리 중 오류가 발생했습니다.');
        } finally {
            setIsBulkProcessing(false);
        }
    };

    // Bulk All Approve - Single API call (no batch processing)
    const executeBulkAllApprove = async () => {
        setIsBulkProcessing(true);
        try {
            // Get all articles for current filter (no pagination)
            const statusParam = filterStatus !== 'all' ? `&status=${filterStatus}` : '';
            const listRes = await fetch(`/api/posts?limit=1000${statusParam}`);
            if (!listRes.ok) throw new Error('Failed to fetch articles');
            const listData = await listRes.json();
            const allIds: string[] = (listData.posts || []).map((p: any) => p.id);

            if (allIds.length === 0) {
                showWarning('승인할 기사가 없습니다.');
                setIsBulkProcessing(false);
                return;
            }

            showInfo(`${allIds.length}개 기사 일괄 승인 중...`);

            // Single bulk API call
            const res = await fetch('/api/posts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: allIds, action: 'approve' })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            const succeeded = data.success || 0;
            const failed = data.failed || 0;

            if (failed > 0) {
                showWarning(`${succeeded}개 일괄 승인 완료, ${failed}개 실패`);
            } else {
                showSuccess(`${succeeded}개 기사가 일괄 승인되었습니다.`);
            }
            setSelectedIds(new Set());
            fetchArticles();
        } catch (error) {
            console.error('Bulk all approve error:', error);
            showError('일괄 승인 처리 중 오류가 발생했습니다.');
        } finally {
            setIsBulkProcessing(false);
        }
    };

    // Bulk All Delete - Single API call (no batch processing)
    const executeBulkAllDelete = async () => {
        setIsBulkProcessing(true);
        const isTrash = filterStatus === 'trash';
        try {
            // Get all articles for current filter (no pagination)
            const statusParam = filterStatus !== 'all' ? `&status=${filterStatus}` : '';
            const listRes = await fetch(`/api/posts?limit=1000${statusParam}`);
            if (!listRes.ok) throw new Error('Failed to fetch articles');
            const listData = await listRes.json();
            const allIds: string[] = (listData.posts || []).map((p: any) => p.id);

            if (allIds.length === 0) {
                showWarning('삭제할 기사가 없습니다.');
                setIsBulkProcessing(false);
                return;
            }

            showInfo(`${allIds.length}개 기사 일괄 ${isTrash ? '영구 삭제' : '삭제'} 중...`);

            // POST 기반 삭제 API 호출 (Vercel DELETE body 문제 우회)
            const res = await fetch('/api/posts/delete-by-ids', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: allIds, force: isTrash })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            const succeeded = data.success || 0;
            const failed = data.failed || 0;

            if (failed > 0) {
                showWarning(`${succeeded}개 일괄 ${isTrash ? '영구 삭제' : '삭제'} 완료, ${failed}개 실패`);
            } else {
                showSuccess(`${succeeded}개 기사가 ${isTrash ? '영구 삭제' : '휴지통으로 이동'}되었습니다.`);
            }
            setSelectedIds(new Set());
            fetchArticles();
        } catch (error) {
            console.error('Bulk all delete error:', error);
            showError('일괄 삭제 처리 중 오류가 발생했습니다.');
        } finally {
            setIsBulkProcessing(false);
        }
    };

    // Save Edit
    const handleSave = async () => {
        if (!previewArticle) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/posts/${previewArticle.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editTitle,
                    subtitle: editSubtitle,  // 부제목 저장
                    is_focus: editIsFocus,   // Focus 여부 저장
                    content: editContent
                })
            });

            if (res.ok) {
                // Update Local State
                setArticles(articles.map(a =>
                    a.id === previewArticle.id
                        ? { ...a, title: editTitle, subtitle: editSubtitle, is_focus: editIsFocus, content: editContent }
                        : a
                ));
                showSuccess("저장되었습니다.");
            } else {
                throw new Error("저장 실패");
            }
        } catch (err) {
            showError("저장에 실패했습니다. (DB 연결 확인 필요)");
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    // Approve & Publish Article (모달 트리거)
    const handleApprove = () => {
        openSingleConfirmModal('single-approve');
    };


    // 실제 단일 승인 실행 (Cloudinary 이미지 최적화 + AI 재가공 + 자동 기자 배정)
    const executeSingleApprove = async () => {
        if (!previewArticle) return;

        const totalStartTime = Date.now();

        // 진행 모달 열기
        setProgressModal({
            isOpen: true,
            title: `기사 승인 처리 중`,
            logs: [],
            currentStep: '초기화',
            startTime: totalStartTime,
            isComplete: false
        });

        setIsApproving(true);

        addProgressLog('시작', `기사: ${previewArticle.title.substring(0, 40)}...`, 'info');
        addProgressLog('시작', `출처: ${previewArticle.source}`, 'info');

        try {
            let finalThumbnailUrl = previewArticle.thumbnail_url;
            let finalTitle = editTitle;
            let finalContent = editContent;
            let aiProcessed = false;

            // 0. AI 설정 확인 - 이 지역이 AI 재가공 활성화되어 있는지 체크
            const step0Start = Date.now();
            addProgressLog('AI 설정', 'AI 설정 확인 중...', 'info');

            try {
                const settingsRes = await fetch('/api/admin/ai-settings');
                const step0Duration = Date.now() - step0Start;

                if (settingsRes.ok) {
                    const settings = await settingsRes.json();
                    const aiEnabled = settings.enabled === true;
                    const enabledRegions: string[] = settings.enabledRegions || [];

                    addProgressLog('AI 설정', `마스터 스위치: ${aiEnabled ? 'ON' : 'OFF'} (${step0Duration}ms)`, aiEnabled ? 'success' : 'warning', step0Duration);
                    addProgressLog('AI 설정', `활성화 지역: ${enabledRegions.join(', ') || '없음'}`, 'info');

                    // 기사의 region이 AI 활성화 지역에 포함되어 있는지 확인
                    // previewArticle.source에서 region 추출 (예: "광주광역시" -> "gwangju")
                    const regionMap: Record<string, string> = {
                        '광주광역시': 'gwangju', '전라남도': 'jeonnam',
                        '목포시': 'mokpo', '여수시': 'yeosu', '순천시': 'suncheon',
                        '나주시': 'naju', '광양시': 'gwangyang',
                        '담양군': 'damyang', '곡성군': 'gokseong', '구례군': 'gurye',
                        '고흥군': 'goheung', '보성군': 'boseong', '화순군': 'hwasun',
                        '장흥군': 'jangheung', '강진군': 'gangjin', '해남군': 'haenam',
                        '영암군': 'yeongam', '무안군': 'muan', '함평군': 'hampyeong',
                        '영광군': 'yeonggwang', '장성군': 'jangseong', '완도군': 'wando',
                        '진도군': 'jindo', '신안군': 'sinan',
                        '광주교육청': 'gwangju_edu', '전남교육청': 'jeonnam_edu'
                    };

                    const articleRegion = regionMap[previewArticle.source] || '';
                    const shouldRewrite = aiEnabled && enabledRegions.includes(articleRegion);

                    addProgressLog('AI 설정', `이 기사 지역: ${previewArticle.source} -> ${articleRegion || '(매핑없음)'}`, 'info');
                    addProgressLog('AI 설정', `AI 재가공 대상: ${shouldRewrite ? 'YES' : 'NO'}`, shouldRewrite ? 'success' : 'warning');

                    if (shouldRewrite) {
                        const step1Start = Date.now();
                        addProgressLog('AI 재가공', `AI 재가공 시작 (본문 ${editContent.length}자)...`, 'info');

                        const rewriteRes = await fetch('/api/ai/rewrite', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                text: editContent,
                                parseJson: true,
                                articleId: previewArticle.id,
                                region: articleRegion
                            })
                        });

                        const step1Duration = Date.now() - step1Start;

                        if (rewriteRes.ok) {
                            const rewriteData = await rewriteRes.json();
                            if (rewriteData.parsed && rewriteData.parsed.title && rewriteData.parsed.content) {
                                finalTitle = rewriteData.parsed.title;
                                finalContent = rewriteData.parsed.content;
                                aiProcessed = true;
                                addProgressLog('AI 재가공', `완료! (${(step1Duration / 1000).toFixed(1)}초)`, 'success', step1Duration);
                                addProgressLog('AI 재가공', `새 제목: ${finalTitle.substring(0, 35)}...`, 'success');
                            } else {
                                const errorDetail = rewriteData.parseError || '필수 필드 누락';
                                addProgressLog('AI 재가공', `파싱 실패: ${errorDetail}`, 'error', step1Duration);
                                throw new Error(`AI 재가공 실패: ${errorDetail}\n\n이 기사는 발행되지 않았습니다.`);
                            }
                        } else {
                            const errorData = await rewriteRes.json().catch(() => ({}));
                            const errorMsg = errorData.error || errorData.message || `HTTP ${rewriteRes.status}`;
                            addProgressLog('AI 재가공', `API 오류: ${errorMsg}`, 'error', step1Duration);
                            throw new Error(`AI 재가공 API 오류: ${errorMsg}\n\n이 기사는 발행되지 않았습니다.`);
                        }
                    } else {
                        addProgressLog('AI 재가공', '스킵 (비활성 지역)', 'warning');
                    }
                }
            } catch (aiErr) {
                // AI 관련 에러는 게시 중지
                if (aiErr instanceof Error && aiErr.message.includes('AI 재가공')) {
                    throw aiErr;
                }
                addProgressLog('AI 설정', `설정 확인 실패 (원본으로 진행)`, 'warning');
            }

            // 1. 외부 이미지가 있으면 Cloudinary로 업로드
            if (previewArticle.thumbnail_url && !previewArticle.thumbnail_url.includes('res.cloudinary.com')) {
                const step2Start = Date.now();
                addProgressLog('이미지', 'Cloudinary 업로드 시작...', 'info');

                try {
                    const uploadRes = await fetch('/api/upload/from-url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            imageUrl: previewArticle.thumbnail_url,
                            referer: previewArticle.original_link
                        })
                    });

                    const uploadData = await uploadRes.json();
                    const step2Duration = Date.now() - step2Start;

                    if (uploadData.cloudinaryUrl && !uploadData.error) {
                        finalThumbnailUrl = uploadData.cloudinaryUrl;
                        addProgressLog('이미지', `업로드 완료 (${(step2Duration / 1000).toFixed(1)}초)`, 'success', step2Duration);
                    } else {
                        addProgressLog('이미지', `업로드 실패: ${uploadData.error || 'Unknown'}`, 'warning', step2Duration);
                    }
                } catch (uploadErr) {
                    addProgressLog('이미지', `업로드 에러 (원본 사용)`, 'warning');
                }
            } else {
                addProgressLog('이미지', previewArticle.thumbnail_url ? '이미 Cloudinary (스킵)' : '이미지 없음', 'info');
            }

            // 2. DB update
            const step3Start = Date.now();
            addProgressLog('DB 저장', 'DB 업데이트 중...', 'info');

            const bodyData: Record<string, unknown> = {
                status: 'published',
                title: finalTitle,
                content: finalContent,
                thumbnail_url: finalThumbnailUrl,
                ai_processed: aiProcessed
            };
            if (aiProcessed) {
                bodyData.ai_processed_at = new Date().toISOString();
            }
            if (!previewArticle.published_at) {
                bodyData.published_at = new Date().toISOString();
            }

            const res = await fetch(`/api/posts/${previewArticle.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            const step3Duration = Date.now() - step3Start;

            if (res.ok) {
                const responseData = await res.json();
                addProgressLog('DB 저장', `완료 (${step3Duration}ms)`, 'success', step3Duration);

                setArticles(articles.map(a =>
                    a.id === previewArticle.id
                        ? { ...a, status: 'published', title: finalTitle, content: finalContent, published_at: a.published_at || new Date().toISOString(), thumbnail_url: finalThumbnailUrl }
                        : a
                ));

                // 최종 결과
                const totalDuration = Date.now() - totalStartTime;
                const aiText = aiProcessed ? ' (AI 재가공)' : '';

                addProgressLog('완료', `총 소요 시간: ${(totalDuration / 1000).toFixed(1)}초`, 'success', totalDuration);

                if (responseData._assignment) {
                    addProgressLog('완료', `기자 배정: ${responseData._assignment.reporter}`, 'success');
                }

                addProgressLog('완료', `기사 발행 성공!${aiText}`, 'success');

                // 모달 완료 상태로 변경
                setProgressModal(prev => ({ ...prev, isComplete: true, currentStep: '완료' }));

                showSuccess(`Published!${aiText} (${(totalDuration / 1000).toFixed(1)}s)`);

                // 2초 후 모달 닫기
                setTimeout(() => {
                    setProgressModal(prev => ({ ...prev, isOpen: false }));
                    closePreview();
                    fetchArticles();
                }, 2000);
            } else {
                addProgressLog('DB 저장', `실패 (HTTP ${res.status})`, 'error', step3Duration);
                throw new Error("DB 업데이트 실패");
            }
        } catch (err) {
            const totalDuration = Date.now() - totalStartTime;
            addProgressLog('에러', `처리 실패 (${(totalDuration / 1000).toFixed(1)}초 경과)`, 'error', totalDuration);

            if (err instanceof Error) {
                addProgressLog('에러', err.message.split('\n')[0], 'error');
            }

            setProgressModal(prev => ({ ...prev, isComplete: true, currentStep: '실패' }));

            if (err instanceof Error && err.message.includes('AI 재가공')) {
                showError(err.message);
            } else {
                showError("Approval failed. (Check DB connection)");
            }
            console.error('[Approve] Error:', err);
        } finally {
            setIsApproving(false);
        }
    };

    // Restore Article (모달 트리거)
    const handleRestore = () => {
        openSingleConfirmModal('single-restore');
    };

    // 실제 단일 복구 실행
    const executeSingleRestore = async () => {
        if (!previewArticle) return;
        setIsApproving(true); // 재사용
        try {
            const res = await fetch(`/api/posts/${previewArticle.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'draft' })
            });

            if (res.ok) {
                setArticles(articles.map(a =>
                    a.id === previewArticle.id ? { ...a, status: 'draft' } : a
                ));
                showSuccess("기사가 복구되었습니다.");
                closePreview();
                // 목록에서 제거하려면 여기 필터링 추가하면 됨 (선택사항)
                fetchArticles();
            } else {
                throw new Error("복구 실패");
            }
        } catch (err) {
            showError("복구 실패");
            console.error(err);
        } finally {
            setIsApproving(false);
        }
    };

    // Hold Article (modal trigger)
    const handleHold = () => {
        openSingleConfirmModal('single-hold');
    };

    // 실제 단일 보류 실행 (published -> draft)
    const executeSingleHold = async () => {
        if (!previewArticle) return;
        setIsApproving(true);
        try {
            const res = await fetch(`/api/posts/${previewArticle.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'draft' })
            });

            if (res.ok) {
                setArticles(articles.map(a =>
                    a.id === previewArticle.id ? { ...a, status: 'draft' } : a
                ));
                showSuccess("기사가 보류 처리되었습니다.");
                closePreview();
                fetchArticles();
            } else {
                throw new Error("보류 처리 실패");
            }
        } catch (err) {
            showError("보류 처리 실패");
            console.error(err);
        } finally {
            setIsApproving(false);
        }
    };

    // Delete Article (모달 트리거)
    const handleDelete = () => {
        openSingleConfirmModal('single-delete');
    };

    // 실제 단일 삭제 실행
    const executeSingleDelete = async () => {
        if (!previewArticle) return;
        const isTrash = previewArticle.status === 'trash';
        try {
            const url = `/api/posts/${previewArticle.id}${isTrash ? '?force=true' : ''}`;
            const res = await fetch(url, { method: 'DELETE' });
            if (res.ok) {
                setArticles(articles.filter(a => a.id !== previewArticle.id));
                closePreview();
                showSuccess(isTrash ? "영구 삭제되었습니다." : "휴지통으로 이동되었습니다.");
            } else {
                throw new Error("삭제 실패");
            }
        } catch (err) {
            showError("삭제 실패");
        }
    };

    // Select Row - ID는 string (UUID)
    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    // Filter Logic - 상태는 서버에서 필터링됨, 검색은 클라이언트에서 (현재 페이지 내)
    const filteredArticles = articles.filter(article => {
        const matchesCategory = filterCategory === "all" || article.category === filterCategory;
        const matchesSearch = searchQuery === '' ||
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const paginatedArticles = filteredArticles;

    return (
        <div className="space-y-6 relative h-[calc(100vh-100px)]">
            {/* Header - 공통 컴포넌트 사용 */}
            <PageHeader
                title="기사 통합 관리"
                description="전체 기사를 검색하고 승인/반려 처리를 수행합니다."
                icon={FileEdit}
                iconBgColor="bg-blue-600"
                actions={
                    <div className="flex gap-2 flex-wrap">
                        {/* 선택 승인/복구/보류 버튼 - 상태에 따라 다르게 표시 */}
                        {filterStatus === 'trash' ? (
                            <button
                                onClick={() => openBulkConfirmModal('bulk-restore')}
                                disabled={isBulkProcessing || selectedIds.size === 0}
                                className={`px-4 py-2 font-medium rounded-lg shadow-sm transition flex items-center gap-2 ${selectedIds.size > 0
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-[#21262d] text-[#6e7681] cursor-not-allowed border border-[#30363d]'
                                    }`}
                            >
                                {isBulkProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                                <RotateCcw className="w-4 h-4" />
                                선택 복구 {selectedIds.size > 0 && `(${selectedIds.size}개)`}
                            </button>
                        ) : filterStatus === 'published' ? (
                            <button
                                onClick={openBulkHoldConfirmModal}
                                disabled={isBulkProcessing || selectedIds.size === 0}
                                className={`px-4 py-2 font-medium rounded-lg shadow-sm transition flex items-center gap-2 ${selectedIds.size > 0
                                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                                    : 'bg-[#21262d] text-[#6e7681] cursor-not-allowed border border-[#30363d]'
                                    }`}
                            >
                                {isBulkProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                                <PauseCircle className="w-4 h-4" />
                                선택 보류 {selectedIds.size > 0 && `(${selectedIds.size}개)`}
                            </button>
                        ) : (
                            <button
                                onClick={() => openBulkConfirmModal('bulk-approve')}
                                disabled={isBulkProcessing || selectedIds.size === 0}
                                className={`px-4 py-2 font-medium rounded-lg shadow-sm transition flex items-center gap-2 ${selectedIds.size > 0
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-[#21262d] text-[#6e7681] cursor-not-allowed border border-[#30363d]'
                                    }`}
                            >
                                {isBulkProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                                <CheckCircle className="w-4 h-4" />
                                선택 승인 {selectedIds.size > 0 && `(${selectedIds.size}개)`}
                            </button>
                        )}

                        {/* 선택 삭제 버튼 - 항상 표시, 선택 없으면 비활성화 */}
                        <button
                            onClick={() => openBulkConfirmModal('bulk-delete')}
                            disabled={isBulkProcessing || selectedIds.size === 0}
                            className={`px-4 py-2 font-medium rounded-lg shadow-sm transition flex items-center gap-2 ${selectedIds.size > 0
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-[#21262d] text-[#6e7681] cursor-not-allowed border border-[#30363d]'
                                }`}
                        >
                            {isBulkProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                            {filterStatus === 'trash' && selectedIds.size > 0 && <AlertTriangle className="w-4 h-4" />}
                            <Trash2 className="w-4 h-4" />
                            {filterStatus === 'trash' ? '선택 영구삭제' : '선택 삭제'} {selectedIds.size > 0 && `(${selectedIds.size}개)`}
                        </button>

                        {/* 구분선 */}
                        <div className="w-px h-8 bg-gray-300 mx-1" />

                        {/* 일괄 승인 버튼 (휴지통 제외) */}
                        {filterStatus !== 'trash' && filterStatus !== 'published' && (
                            <button
                                onClick={() => openBulkAllConfirmModal('bulk-all-approve')}
                                disabled={isBulkProcessing}
                                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {isBulkProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                                <CheckCircle className="w-4 h-4" />
                                일괄 승인
                            </button>
                        )}

                        {/* 일괄 삭제 버튼 */}
                        <button
                            onClick={() => openBulkAllConfirmModal('bulk-all-delete')}
                            disabled={isBulkProcessing}
                            className="px-4 py-2 bg-rose-700 text-white font-medium rounded-lg hover:bg-rose-800 shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {isBulkProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                            <AlertTriangle className="w-4 h-4" />
                            {filterStatus === 'trash' ? '휴지통 비우기' : '전체 휴지통으로'} (위험)
                        </button>
                    </div>
                }
            />

            {/* Toolbar */}
            <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d] shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="제목 또는 내용 검색..."
                            className="w-full pl-10 pr-4 py-2 border border-[#30363d] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-[#0d1117] text-[#e6edf3] placeholder-[#8b949e]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="border border-[#30363d] rounded-lg px-3 py-2 text-sm bg-[#0d1117] text-[#e6edf3]"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="all">모든 카테고리</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>
                                {'  '.repeat(cat.depth)}{cat.name}
                            </option>
                        ))}
                    </select>
                </div>
                {/* FilterTabs - 공통 컴포넌트 사용 */}
                <FilterTabs
                    tabs={[
                        { key: "all", label: "전체", count: statusCounts.all },
                        { key: "draft", label: "승인 대기", count: statusCounts.draft },
                        { key: "published", label: "발행됨", count: statusCounts.published },
                        { key: "rejected", label: "반려됨", count: statusCounts.rejected },
                        { key: "trash", label: "휴지통", count: statusCounts.trash }
                    ]}
                    activeTab={filterStatus}
                    onChange={(key) => {
                        // 같은 탭을 다시 클릭하면 데이터만 새로고침
                        if (key === filterStatus) {
                            fetchArticles();
                            return;
                        }
                        setFilterStatus(key);
                        const url = key === 'all' ? '/admin/news' : `/admin/news?status=${key}`;
                        router.push(url, { scroll: false });
                    }}
                />
            </div>

            {/* Table */}
            <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm overflow-hidden flex-1">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#21262d] border-b border-[#30363d]">
                            <th className="py-2 px-3 w-10 text-center text-xs font-semibold text-[#8b949e]">No.</th>
                            <th className="py-2 px-3 w-10">
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedIds(new Set(paginatedArticles.map(a => a.id)));
                                        else setSelectedIds(new Set());
                                    }}
                                    checked={paginatedArticles.length > 0 && selectedIds.size === paginatedArticles.length}
                                    className="rounded border-[#30363d] bg-[#0d1117] text-blue-600 focus:ring-blue-500 h-4 w-4"
                                />
                            </th>
                            <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase">상태</th>
                            <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase">제목</th>
                            <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase">카테고리</th>
                            <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase">작성자/출처</th>
                            <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase">원문작성일</th>
                            <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase">수집일</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#21262d]">
                        {paginatedArticles.map((article, index) => (
                            <tr
                                key={article.id}
                                className={`hover:bg-[#21262d] transition cursor-pointer ${focusedIndex === index ? 'bg-[#1f6feb]/20 ring-1 ring-[#1f6feb]/50' : ''
                                    }`}
                                onClick={() => openPreview(article)}
                            >
                                <td className="py-1 px-3 text-center text-xs text-[#8b949e]">
                                    {(currentPage - 1) * 20 + index + 1}
                                </td>
                                <td className="py-1 px-3" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(article.id)}
                                        onChange={() => toggleSelect(article.id)}
                                        className="rounded border-[#30363d] bg-[#0d1117] text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                </td>
                                <td className="py-1 px-3">
                                    <StatusBadge type="article" status={article.status} />
                                </td>
                                <td className="py-1 px-3" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-2">
                                        {article.is_focus && (
                                            <span className="px-1.5 py-0.5 bg-orange-900/40 text-orange-300 text-[10px] font-bold rounded border border-orange-700/50">Focus</span>
                                        )}
                                        {/* Title clickable: published -> homepage, unpublished -> original source */}
                                        {article.status === 'published' ? (
                                            <a
                                                href={`/news/${article.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium text-[#e6edf3] line-clamp-1 hover:text-blue-400 transition cursor-pointer"
                                                title="게시된 기사 보기"
                                            >
                                                {article.title}
                                            </a>
                                        ) : article.original_link ? (
                                            <a
                                                href={article.original_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium text-[#e6edf3] line-clamp-1 hover:text-blue-400 transition cursor-pointer"
                                                title="원본 기사 보기"
                                            >
                                                {article.title}
                                            </a>
                                        ) : (
                                            <p className="text-sm font-medium text-[#e6edf3] line-clamp-1">{article.title}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="py-1 px-3">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                                        {article.category}
                                    </span>
                                </td>
                                <td className="py-1 px-3">
                                    <div className="flex items-center text-xs">
                                        <span className="text-[#e6edf3] font-medium mr-1.5 truncate max-w-[80px]">{article.author}</span>
                                        <span className="text-[#8b949e]">| {article.source}</span>
                                    </div>
                                </td>
                                <td className="py-1 px-3 text-xs text-[#e6edf3]">
                                    {article.published_at
                                        ? new Date(article.published_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
                                        : '-'}
                                </td>
                                <td className="py-1 px-3 text-xs text-[#8b949e]">
                                    {new Date(article.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {paginatedArticles.length === 0 && (
                    <div className="p-12 text-center text-[#8b949e]">데이터가 없습니다.</div>
                )}
            </div>

            {/* Pagination - 공통 컴포넌트 사용 */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}

            {/* SlidePanel - 공통 컴포넌트 사용 */}
            <SlidePanel
                isOpen={isPanelOpen}
                onClose={closePreview}
                title="기사 상세 및 편집"
                subtitle={previewArticle ? `ID: ${previewArticle.id} | 작성자: ${previewArticle.author}` : ''}
                width="2xl"
                headerActions={
                    <>
                        <button onClick={handleSave} disabled={isSaving} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm font-medium disabled:opacity-50">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            저장
                        </button>
                        <button onClick={handleDelete} className="p-2 bg-[#21262d] border border-[#30363d] text-[#f85149] rounded-lg hover:bg-[#30363d] transition">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </>
                }
            >
                {previewArticle && (
                    <div className="space-y-3">
                        {/* Original Link - 맨 위 배치 */}
                        {previewArticle.original_link && (
                            <a
                                href={previewArticle.original_link}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 text-sm text-[#58a6ff] hover:underline p-2 bg-[#1f6feb]/10 rounded-lg border border-[#1f6feb]/30"
                            >
                                <Globe className="w-4 h-4" />
                                원문 보기 ({previewArticle.source})
                            </a>
                        )}

                        {/* Meta Info - 컴팩트하게 한 줄로 */}
                        <div className="flex gap-4 p-2 bg-[#21262d] rounded-lg border border-[#30363d] text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-[#8b949e]">상태:</span>
                                <StatusBadge type="article" status={previewArticle.status} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[#8b949e]">카테고리:</span>
                                <span className="font-medium text-[#e6edf3]">{previewArticle.category}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[#8b949e]">조회수:</span>
                                <span className="font-medium text-[#e6edf3]">{previewArticle.views}회</span>
                            </div>
                        </div>

                        {/* Edit Fields - 제목 */}
                        <div>
                            <label className="block text-xs font-medium text-[#8b949e] mb-1">제목</label>
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full p-2 border border-[#30363d] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-[#e6edf3] bg-[#0d1117] text-sm"
                            />
                        </div>

                        {/* 부제목 입력 필드 */}
                        <div>
                            <label className="block text-xs font-medium text-[#8b949e] mb-1">부제목 (선택)</label>
                            <input
                                type="text"
                                value={editSubtitle}
                                onChange={(e) => setEditSubtitle(e.target.value)}
                                placeholder="기사의 부제목을 입력하세요"
                                className="w-full p-2 border border-[#30363d] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-[#c9d1d9] bg-[#0d1117] text-sm placeholder-[#6e7681]"
                            />
                        </div>

                        {/* Focus 토글 - 컴팩트하게 */}
                        <div className="flex items-center gap-2 p-2 bg-orange-900/20 rounded-lg border border-orange-700/50">
                            <input
                                type="checkbox"
                                id="is_focus"
                                checked={editIsFocus}
                                onChange={(e) => setEditIsFocus(e.target.checked)}
                                className="w-4 h-4 rounded border-orange-700 bg-[#0d1117] text-orange-500 focus:ring-orange-500"
                            />
                            <label htmlFor="is_focus" className="flex-1 text-sm">
                                <span className="font-bold text-orange-300">Focus 기사</span>
                                <span className="text-orange-400/80 ml-2">메인 페이지 'Focus' 섹션 노출</span>
                            </label>
                        </div>

                        {/* 이미지 썸네일 미리보기 - 높이 축소 */}
                        <ImageThumbnail
                            src={previewArticle.thumbnail_url}
                            alt="기사 썸네일"
                            heightClass="h-32"
                        />

                        <div className="flex-1 flex flex-col">
                            <label className="block text-xs font-medium text-[#8b949e] mb-1">본문 내용</label>
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full flex-1 min-h-[350px] p-3 border border-[#30363d] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed text-[#c9d1d9] bg-[#0d1117] resize-none"
                            />
                        </div>



                        {/* Approve & Publish Button - Only for draft articles */}
                        {previewArticle.status === 'draft' && (
                            <button
                                onClick={handleApprove}
                                disabled={isApproving}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-sm transition disabled:opacity-50 mt-4"
                            >
                                {isApproving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                {isApproving ? '승인 처리 중...' : '승인 및 발행'}
                            </button>
                        )}

                        {/* Restore Button */}
                        {previewArticle.status === 'trash' && (
                            <button
                                onClick={handleRestore}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-sm transition mt-4"
                            >
                                <RotateCcw className="w-5 h-5" />
                                기사 복구
                            </button>
                        )}

                        {/* Hold Button - Only for published articles */}
                        {previewArticle.status === 'published' && (
                            <button
                                onClick={handleHold}
                                disabled={isApproving}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 shadow-sm transition disabled:opacity-50 mt-4"
                            >
                                {isApproving ? <Loader2 className="w-5 h-5 animate-spin" /> : <PauseCircle className="w-5 h-5" />}
                                {isApproving ? '보류 처리 중...' : '보류'}
                            </button>
                        )}
                    </div>
                )}
            </SlidePanel>

            {/* Progress Popup - 우측 하단 팝업창 */}
            {progressModal.isOpen && (
                <div className="fixed bottom-4 right-4 z-50 w-96">
                    <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl flex flex-col max-h-[400px]">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {!progressModal.isComplete && (
                                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                )}
                                {progressModal.isComplete && progressModal.currentStep === '완료' && (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                                {progressModal.isComplete && progressModal.currentStep === '실패' && (
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-sm font-medium text-[#e6edf3]">
                                    {progressModal.isComplete
                                        ? (progressModal.currentStep === '완료' ? '처리 완료!' : '처리 실패')
                                        : progressModal.currentStep
                                    }
                                </span>
                            </div>
                            <button
                                onClick={() => setProgressModal(prev => ({ ...prev, isOpen: false }))}
                                className="text-[#8b949e] hover:text-[#e6edf3] transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Log List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-0.5 font-mono text-[11px] max-h-[280px]">
                            {progressModal.logs.map((log, idx) => (
                                <div
                                    key={idx}
                                    className={`flex gap-1.5 py-0.5 ${log.status === 'success' ? 'text-green-400' :
                                        log.status === 'error' ? 'text-red-400' :
                                            log.status === 'warning' ? 'text-yellow-400' :
                                                'text-[#8b949e]'
                                        }`}
                                >
                                    <span className="text-[#58a6ff] flex-shrink-0">[{log.step}]</span>
                                    <span className="flex-1 truncate">{log.message}</span>
                                    {log.duration && log.duration >= 500 && (
                                        <span className="text-[#6e7681] flex-shrink-0">
                                            {log.duration >= 1000 ? `${(log.duration / 1000).toFixed(1)}s` : `${log.duration}ms`}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-[#30363d] text-xs text-[#8b949e]">
                            경과: {((Date.now() - progressModal.startTime) / 1000).toFixed(1)}초
                        </div>
                    </div>
                </div>
            )}

            {/* ConfirmModal - 공통 컴포넌트 사용 */}
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
