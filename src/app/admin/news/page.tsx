"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, CheckCircle, FileEdit, Trash2, X, Globe, Save, Loader2, RotateCcw, AlertTriangle, UserPlus } from "lucide-react";
import { useToast } from '@/components/ui/Toast';

// 공통 컴포넌트 import
import {
    StatusBadge,
    ConfirmModal,
    DangerConfirmModal,
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

// GNB 카테고리 (메인 메뉴와 동일)
interface GnbCategory {
    id: string;
    name: string;
    slug: string;
    children?: GnbCategory[];
}

// 기본 기자 정보 (기자 목록이 비어있을 때 사용)
const DEFAULT_REPORTER = {
    id: 'default-koreanews',  // 특수 ID (실제 DB에는 이 ID로 저장하지 않음)
    name: '코리아뉴스',
    email: 'news@koreanewsone.com'
};

// Suspense 바운더리 내에서 useSearchParams를 사용하는 래퍼 컴포넌트
export default function AdminNewsListPageWrapper() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-gray-400">로딩 중...</div>}>
            <AdminNewsListPage />
        </Suspense>
    );
}

function AdminNewsListPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const urlStatus = searchParams.get('status') || 'all';
    const { showSuccess, showError, showWarning } = useToast();

    const [articles, setArticles] = useState<any[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [gnbCategories, setGnbCategories] = useState<GnbCategory[]>([]); // GNB 메뉴용
    const [filterStatus, setFilterStatus] = useState(urlStatus);
    const [filterCategory, setFilterCategory] = useState("all");
    const [activeGnbCategory, setActiveGnbCategory] = useState<string | null>(null); // 선택된 GNB 카테고리
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    // UUID는 문자열이므로 Set<string> 사용
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [totalPages, setTotalPages] = useState(1);

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

    // 확인 모달 상태 (window.confirm 대체)
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'bulk-approve' | 'bulk-delete' | 'bulk-restore' | 'bulk-all-approve' | 'bulk-all-delete' | 'single-approve' | 'single-delete' | 'single-restore' | null;
        message: string;
    }>({ isOpen: false, type: null, message: '' });

    // 기자 지정 관련 상태
    const [reporters, setReporters] = useState<{ id: string; name: string; position: string; region: string }[]>([]);
    const [bulkReporterId, setBulkReporterId] = useState<string>(""); // 일괄 배정용

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
            const categoryParam = activeGnbCategory ? `&category=${encodeURIComponent(activeGnbCategory)}` : '';

            const res = await fetch(`/api/posts?${limitParam}${pageParam}${statusParam}${sortParam}${categoryParam}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            // API 응답 데이터 매핑
            const mapped = (data.posts || []).map((p: any) => ({
                id: p.id,
                title: p.title || '[제목 없음]',
                content: p.content || '',
                status: p.status || 'draft',
                published_at: p.published_at || p.created_at,
                views: p.view_count || 0,
                category: p.category || '미분류',
                source: p.source || 'Korea NEWS',
                author: p.author_name || 'AI Reporter',  // DB 필드명: author_name
                author_id: p.author_id,  // 기자 ID (UUID)
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

    // 카테고리 목록 로딩 (드롭다운용)
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

    // GNB 카테고리 로딩 (상단 메뉴용)
    const fetchGnbCategories = async () => {
        try {
            const res = await fetch('/api/categories?gnb=true');
            if (res.ok) {
                const data = await res.json();
                setGnbCategories(data.categories || []);
            }
        } catch (err) {
            console.error('GNB 카테고리 로딩 실패:', err);
        }
    };

    // 상태 필터, 페이지, 또는 GNB 카테고리 변경 시 API 재호출
    useEffect(() => {
        fetchArticles();
    }, [filterStatus, currentPage, activeGnbCategory]);

    useEffect(() => {
        fetchCategories();
        fetchGnbCategories();
    }, []);

    // 기자 목록 로딩
    const fetchReporters = async () => {
        try {
            console.log('[fetchReporters] 기자 목록 로딩 시작...');
            const res = await fetch('/api/users/reporters?simple=true');
            if (res.ok) {
                const data = await res.json();
                console.log('[fetchReporters] 기자 목록 로딩 완료:', data?.length || 0, '명');
                console.log('[fetchReporters] 기자 목록:', data);
                setReporters(data || []);
            } else {
                console.error('[fetchReporters] API 응답 실패:', res.status, res.statusText);
            }
        } catch (err) {
            console.error('[fetchReporters] 기자 목록 로딩 실패:', err);
        }
    };

    useEffect(() => {
        fetchReporters();
    }, []);

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
    const openSingleConfirmModal = (type: 'single-approve' | 'single-delete' | 'single-restore') => {
        if (!previewArticle) return;
        let message = '';
        if (type === 'single-approve') message = '이 기사를 승인하고 발행하시겠습니까?';
        else if (type === 'single-restore') message = '이 기사를 복구하시겠습니까? (승인 대기 상태로 이동)';
        else if (type === 'single-delete') {
            message = previewArticle.status === 'trash'
                ? '이 기사를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
                : '이 기사를 삭제하시겠습니까? (휴지통으로 이동)';
        }
        setConfirmModal({ isOpen: true, type, message });
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
        }
    };

    // Bulk Approve 실행 - 랜덤 기자 배정 포함
    const executeBulkApprove = async () => {
        console.log('=== 선택 승인 시작 ===');
        console.log('선택된 ID 개수:', selectedIds.size);
        console.log('선택된 ID 목록:', Array.from(selectedIds));
        console.log('[executeBulkApprove] reporters 배열 길이:', reporters.length);
        console.log('[executeBulkApprove] reporters 목록:', reporters);

        setIsBulkProcessing(true);
        let assignedCount = 0;

        try {
            // reporters가 비어있으면 직접 API에서 로드
            let availableReporters = reporters;
            if (availableReporters.length === 0) {
                console.log('[executeBulkApprove] reporters가 비어있어 API에서 직접 로드...');
                try {
                    const reporterRes = await fetch('/api/users/reporters?simple=true');
                    if (reporterRes.ok) {
                        availableReporters = await reporterRes.json();
                        console.log('[executeBulkApprove] API에서 로드된 기자:', availableReporters?.length || 0, '명');
                        if (availableReporters.length > 0) {
                            setReporters(availableReporters); // 상태 업데이트
                        }
                    }
                } catch (e) {
                    console.error('[executeBulkApprove] 기자 목록 로드 실패:', e);
                }
            }

            const results = await Promise.allSettled(
                Array.from(selectedIds).map(async (id) => {
                    console.log(`[승인 요청] ID: ${id}`);

                    // 해당 기사의 현재 author_id 확인
                    const article = articles.find(a => a.id === id);
                    const updateData: Record<string, unknown> = {
                        status: 'published',
                        published_at: new Date().toISOString()
                    };

                    // 기자가 배정되지 않은 경우 랜덤 배정 또는 기본 기자
                    if (!article?.author_id) {
                        if (availableReporters.length > 0) {
                            const randomIndex = Math.floor(Math.random() * availableReporters.length);
                            const randomReporter = availableReporters[randomIndex];
                            updateData.author_id = randomReporter.id;
                            updateData.author_name = randomReporter.name;  // DB 필드명
                            assignedCount++;
                            console.log(`[랜덤 기자 배정] ID: ${id} → ${randomReporter.name}`);
                        } else {
                            // 기자 목록이 비어있으면 기본 기자(코리아뉴스) 사용
                            updateData.author_name = DEFAULT_REPORTER.name;
                            assignedCount++;
                            console.log(`[기본 기자 배정] ID: ${id} → ${DEFAULT_REPORTER.name}`);
                        }
                    }

                    const res = await fetch(`/api/posts/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updateData)
                    });

                    const responseData = await res.json();
                    console.log(`[응답] ID: ${id}, Status: ${res.status}, Data:`, responseData);

                    if (!res.ok) {
                        throw new Error(`ID ${id} 승인 실패: ${responseData.message || res.statusText}`);
                    }
                    return id;
                })
            );

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            console.log('=== 승인 결과 ===');
            console.log(`성공: ${succeeded}, 실패: ${failed}, 랜덤 기자 배정: ${assignedCount}`);
            results.forEach((r, i) => {
                if (r.status === 'rejected') {
                    console.error(`실패 항목 ${i}:`, r.reason);
                }
            });

            if (failed > 0) {
                showWarning(`${succeeded}개 승인 완료, ${failed}개 실패`);
            } else {
                const assignMsg = assignedCount > 0 ? ` (${assignedCount}개 랜덤 기자 배정)` : '';
                showSuccess(`${succeeded}개 기사가 승인되었습니다.${assignMsg}`);
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

    // Bulk Delete 실행 - Promise.allSettled로 개별 응답 확인
    const executeBulkDelete = async () => {
        setIsBulkProcessing(true);
        const isTrash = filterStatus === 'trash';
        try {
            const results = await Promise.allSettled(
                Array.from(selectedIds).map(async (id) => {
                    const url = `/api/posts/${id}${isTrash ? '?force=true' : ''}`;
                    const res = await fetch(url, { method: 'DELETE' });
                    if (!res.ok) throw new Error(`ID ${id} 삭제 실패`);
                    return id;
                })
            );

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            if (failed > 0) {
                showWarning(`${succeeded}개 ${isTrash ? '영구 삭제' : '삭제'} 완료, ${failed}개 실패`);
            } else {
                showSuccess(`${succeeded}개 기사가 ${isTrash ? '영구 삭제' : '휴지통으로 이동'}되었습니다.`);
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

    // Bulk Restore 실행
    const executeBulkRestore = async () => {
        setIsBulkProcessing(true);
        try {
            const results = await Promise.allSettled(
                Array.from(selectedIds).map(async (id) => {
                    const res = await fetch(`/api/posts/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'draft' }) // 복구 시 draft 상태로
                    });
                    if (!res.ok) throw new Error(`ID ${id} 복구 실패`);
                    return id;
                })
            );

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            if (failed > 0) {
                showWarning(`${succeeded}개 복구 완료, ${failed}개 실패`);
            } else {
                showSuccess(`${succeeded}개 기사가 복구되었습니다 (승인 대기 상태).`);
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

    // 일괄 승인 실행 (현재 필터의 모든 기사) - 랜덤 기자 배정 포함
    const executeBulkAllApprove = async () => {
        setIsBulkProcessing(true);
        try {
            // 현재 필터 상태로 모든 기사 가져오기 (페이지네이션 없이)
            const statusParam = filterStatus !== 'all' ? `&status=${filterStatus}` : '';
            const res = await fetch(`/api/posts?limit=1000${statusParam}`);
            if (!res.ok) throw new Error('기사 목록 조회 실패');
            const data = await res.json();
            const allPosts = data.posts || [];

            if (allPosts.length === 0) {
                showWarning('승인할 기사가 없습니다.');
                setIsBulkProcessing(false);
                return;
            }

            // reporters가 비어있으면 직접 API에서 로드
            let availableReporters = reporters;
            if (availableReporters.length === 0) {
                console.log('[executeBulkAllApprove] reporters가 비어있어 API에서 직접 로드...');
                try {
                    const reporterRes = await fetch('/api/users/reporters?simple=true');
                    if (reporterRes.ok) {
                        availableReporters = await reporterRes.json();
                        console.log('[executeBulkAllApprove] API에서 로드된 기자:', availableReporters?.length || 0, '명');
                        if (availableReporters.length > 0) {
                            setReporters(availableReporters);
                        }
                    }
                } catch (e) {
                    console.error('[executeBulkAllApprove] 기자 목록 로드 실패:', e);
                }
            }

            let assignedCount = 0;
            const results = await Promise.allSettled(
                allPosts.map(async (post: any) => {
                    // 기자가 배정되지 않은 경우 랜덤 배정 또는 기본 기자
                    const updateData: Record<string, unknown> = {
                        status: 'published',
                        published_at: new Date().toISOString()
                    };

                    if (!post.author_id) {
                        if (availableReporters.length > 0) {
                            const randomIndex = Math.floor(Math.random() * availableReporters.length);
                            const randomReporter = availableReporters[randomIndex];
                            updateData.author_id = randomReporter.id;
                            updateData.author_name = randomReporter.name;  // DB 필드명
                            assignedCount++;
                        } else {
                            // 기자 목록이 비어있으면 기본 기자(코리아뉴스) 사용
                            updateData.author_name = DEFAULT_REPORTER.name;
                            assignedCount++;
                        }
                    }

                    const res = await fetch(`/api/posts/${post.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updateData)
                    });
                    if (!res.ok) throw new Error(`ID ${post.id} 승인 실패`);
                    return post.id;
                })
            );

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            if (failed > 0) {
                showWarning(`${succeeded}개 일괄 승인 완료, ${failed}개 실패`);
            } else {
                const assignMsg = assignedCount > 0 ? ` (${assignedCount}개 기사에 랜덤 기자 배정)` : '';
                showSuccess(`${succeeded}개 기사가 일괄 승인되었습니다.${assignMsg}`);
            }
            setSelectedIds(new Set());
            fetchArticles();
        } catch (error) {
            console.error('일괄 승인 처리 오류:', error);
            showError('일괄 승인 처리 중 오류가 발생했습니다.');
        } finally {
            setIsBulkProcessing(false);
        }
    };

    // 일괄 삭제 실행 (현재 필터의 모든 기사)
    const executeBulkAllDelete = async () => {
        setIsBulkProcessing(true);
        const isTrash = filterStatus === 'trash';
        try {
            // 현재 필터 상태로 모든 기사 가져오기 (페이지네이션 없이)
            const statusParam = filterStatus !== 'all' ? `&status=${filterStatus}` : '';
            const res = await fetch(`/api/posts?limit=1000${statusParam}`);
            if (!res.ok) throw new Error('기사 목록 조회 실패');
            const data = await res.json();
            const allIds = (data.posts || []).map((p: any) => p.id);

            if (allIds.length === 0) {
                showWarning('삭제할 기사가 없습니다.');
                setIsBulkProcessing(false);
                return;
            }

            const results = await Promise.allSettled(
                allIds.map(async (id: string) => {
                    const url = `/api/posts/${id}${isTrash ? '?force=true' : ''}`;
                    const res = await fetch(url, { method: 'DELETE' });
                    if (!res.ok) throw new Error(`ID ${id} 삭제 실패`);
                    return id;
                })
            );

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            if (failed > 0) {
                showWarning(`${succeeded}개 일괄 ${isTrash ? '영구 삭제' : '삭제'} 완료, ${failed}개 실패`);
            } else {
                showSuccess(`${succeeded}개 기사가 ${isTrash ? '영구 삭제' : '휴지통으로 이동'}되었습니다.`);
            }
            setSelectedIds(new Set());
            fetchArticles();
        } catch (error) {
            console.error('일괄 삭제 처리 오류:', error);
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

    // 일괄 기자 배정 함수 (체크박스 선택된 기사들)
    const handleBulkAssignReporter = async () => {
        if (selectedIds.size === 0) {
            showWarning('기사를 먼저 선택해주세요.');
            return;
        }
        if (!bulkReporterId) {
            showWarning('배정할 기자를 선택해주세요.');
            return;
        }

        setIsBulkProcessing(true);
        const selectedReporter = reporters.find(r => r.id === bulkReporterId);
        try {
            const results = await Promise.allSettled(
                Array.from(selectedIds).map(async (id) => {
                    const res = await fetch(`/api/posts/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            author_id: bulkReporterId,
                            author_name: selectedReporter?.name  // DB 필드명
                        })
                    });
                    if (!res.ok) throw new Error(`ID ${id} 기자 배정 실패`);
                    return id;
                })
            );

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            // 로컬 상태 업데이트
            setArticles(articles.map(a =>
                selectedIds.has(a.id)
                    ? { ...a, author: selectedReporter?.name || '지정됨', author_id: bulkReporterId }
                    : a
            ));

            if (failed > 0) {
                showWarning(`${succeeded}개 기자 배정 완료, ${failed}개 실패`);
            } else {
                showSuccess(`${succeeded}개 기사에 ${selectedReporter?.name} 기자가 배정되었습니다.`);
            }
            setSelectedIds(new Set());
            setBulkReporterId('');
        } catch (error) {
            console.error('기자 배정 처리 오류:', error);
            showError('기자 배정 처리 중 오류가 발생했습니다.');
        } finally {
            setIsBulkProcessing(false);
        }
    };

    // 실제 단일 승인 실행 (Cloudinary 이미지 최적화 + 랜덤 기자 배정 포함)
    const executeSingleApprove = async () => {
        if (!previewArticle) return;

        setIsApproving(true);
        try {
            let finalThumbnailUrl = previewArticle.thumbnail_url;

            // 1. 외부 이미지가 있으면 Cloudinary로 업로드
            if (previewArticle.thumbnail_url && !previewArticle.thumbnail_url.includes('res.cloudinary.com')) {
                console.log('[승인] Cloudinary 이미지 업로드 시작...');
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

                    if (uploadData.cloudinaryUrl && !uploadData.error) {
                        finalThumbnailUrl = uploadData.cloudinaryUrl;
                        console.log('[승인] Cloudinary 업로드 완료:', finalThumbnailUrl);
                    } else {
                        console.warn('[승인] Cloudinary 업로드 실패, 원본 URL 사용:', uploadData.error);
                    }
                } catch (uploadErr) {
                    console.warn('[승인] Cloudinary 업로드 오류, 원본 URL 사용:', uploadErr);
                    // 실패해도 발행은 진행 (graceful degradation)
                }
            }

            // 2. 기자가 배정되지 않은 경우 랜덤 배정 (또는 기본 기자)
            let assignedAuthorId = previewArticle.author_id;
            let assignedAuthorName = previewArticle.author;
            let useDefaultReporter = false;

            // reporters가 비어있으면 직접 API에서 로드
            let availableReporters = reporters;
            if (availableReporters.length === 0) {
                console.log('[executeSingleApprove] reporters가 비어있어 API에서 직접 로드...');
                try {
                    const reporterRes = await fetch('/api/users/reporters?simple=true');
                    if (reporterRes.ok) {
                        availableReporters = await reporterRes.json();
                        console.log('[executeSingleApprove] API에서 로드된 기자:', availableReporters?.length || 0, '명');
                        if (availableReporters.length > 0) {
                            setReporters(availableReporters);
                        }
                    }
                } catch (e) {
                    console.error('[executeSingleApprove] 기자 목록 로드 실패:', e);
                }
            }

            if (!assignedAuthorId) {
                if (availableReporters.length > 0) {
                    // 랜덤으로 기자 선택
                    const randomIndex = Math.floor(Math.random() * availableReporters.length);
                    const randomReporter = availableReporters[randomIndex];
                    assignedAuthorId = randomReporter.id;
                    assignedAuthorName = randomReporter.name;
                    console.log(`[승인] 랜덤 기자 배정: ${randomReporter.name} (${randomReporter.region})`);
                } else {
                    // 기자 목록이 비어있으면 기본 기자(코리아뉴스) 사용
                    // author_id는 null로 두고 이름만 설정 (또는 author 필드만 업데이트)
                    assignedAuthorId = null; // DB에 특수 ID 대신 null 저장
                    assignedAuthorName = DEFAULT_REPORTER.name;
                    useDefaultReporter = true;
                    console.log(`[승인] 기본 기자 배정: ${DEFAULT_REPORTER.name}`);
                }
            }

            // 3. DB 업데이트 (thumbnail_url + author_id/author 포함)
            const updateData: Record<string, unknown> = {
                status: 'published',
                published_at: new Date().toISOString(),
                thumbnail_url: finalThumbnailUrl
            };

            // 기자 배정 추가 (author_id + author_name 모두 업데이트)
            if (assignedAuthorId) {
                updateData.author_id = assignedAuthorId;
                updateData.author_name = assignedAuthorName;  // DB 필드명
            }
            // 기본 기자(코리아뉴스)인 경우 author_name 필드만 업데이트
            if (useDefaultReporter) {
                updateData.author_name = DEFAULT_REPORTER.name;
            }

            const res = await fetch(`/api/posts/${previewArticle.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (res.ok) {
                setArticles(articles.map(a =>
                    a.id === previewArticle.id
                        ? {
                            ...a,
                            status: 'published',
                            published_at: new Date().toISOString(),
                            thumbnail_url: finalThumbnailUrl,
                            author_id: assignedAuthorId,
                            author: assignedAuthorName
                        }
                        : a
                ));

                // 랜덤 배정된 경우 메시지에 기자 이름 포함
                if (!previewArticle.author_id && assignedAuthorName) {
                    showSuccess(`기사가 발행되었습니다! (${assignedAuthorName} 기자 배정)`);
                } else {
                    showSuccess("기사가 메인 페이지에 발행되었습니다!");
                }
                closePreview();
                fetchArticles();
            } else {
                throw new Error("승인 실패");
            }
        } catch (err) {
            showError("승인에 실패했습니다. (DB 연결 확인 필요)");
            console.error(err);
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

    // GNB 카테고리 클릭 핸들러
    const handleGnbCategoryClick = (categoryName: string | null) => {
        setActiveGnbCategory(categoryName);
        setCurrentPage(1); // 페이지 리셋
        setSelectedIds(new Set()); // 선택 초기화
    };

    return (
        <div className="space-y-4 relative h-[calc(100vh-100px)]">
            {/* GNB 스타일 카테고리 메뉴 - 메인 사이트와 동일 */}
            <div className="bg-white border-b-2 border-[#0a192f] rounded-t-xl overflow-hidden">
                <div className="flex items-center h-[50px] px-4 gap-1 overflow-x-auto">
                    {/* 전체 버튼 */}
                    <button
                        onClick={() => handleGnbCategoryClick(null)}
                        className={`px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors rounded-lg ${
                            activeGnbCategory === null
                                ? 'bg-[#0a192f] text-white'
                                : 'text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        전체
                    </button>

                    {/* GNB 카테고리들 */}
                    {gnbCategories.map((category) => (
                        <div key={category.id} className="relative group">
                            <button
                                onClick={() => handleGnbCategoryClick(category.name)}
                                className={`px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors rounded-lg flex items-center gap-1 ${
                                    activeGnbCategory === category.name
                                        ? 'bg-[#ff2e63] text-white'
                                        : 'text-slate-700 hover:bg-slate-100 hover:text-[#ff2e63]'
                                }`}
                            >
                                {category.name}
                                {category.children && category.children.length > 0 && (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                )}
                            </button>

                            {/* 서브 카테고리 드롭다운 */}
                            {category.children && category.children.length > 0 && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-2 min-w-[150px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                    {category.children.map((child) => (
                                        <button
                                            key={child.id}
                                            onClick={() => handleGnbCategoryClick(child.name)}
                                            className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                                                activeGnbCategory === child.name
                                                    ? 'bg-[#ff2e63]/10 text-[#ff2e63] font-bold'
                                                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#ff2e63]'
                                            }`}
                                        >
                                            {child.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* 현재 선택된 카테고리 표시 */}
                {activeGnbCategory && (
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm text-slate-600">
                            <span className="font-bold text-[#ff2e63]">{activeGnbCategory}</span> 카테고리 기사
                        </span>
                        <button
                            onClick={() => handleGnbCategoryClick(null)}
                            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                        >
                            <X className="w-3 h-3" />
                            필터 해제
                        </button>
                    </div>
                )}
            </div>

            {/* Header - 공통 컴포넌트 사용 */}
            <PageHeader
                title="기사 통합 관리"
                description="전체 기사를 검색하고 승인/반려 처리를 수행합니다."
                icon={FileEdit}
                iconBgColor="bg-blue-600"
                actions={
                    <div className="flex gap-2 flex-wrap items-center">
                        {/* 기자 일괄배정 - 휴지통 제외 */}
                        {filterStatus !== 'trash' && (
                            <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
                                <UserPlus className="w-4 h-4 text-purple-600" />
                                <select
                                    value={bulkReporterId}
                                    onChange={(e) => setBulkReporterId(e.target.value)}
                                    className="border-0 bg-transparent text-sm focus:ring-0 outline-none text-purple-800 font-medium min-w-[120px]"
                                >
                                    <option value="">기자 선택</option>
                                    {reporters.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name} ({r.region})
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleBulkAssignReporter}
                                    disabled={isBulkProcessing || selectedIds.size === 0 || !bulkReporterId}
                                    className={`px-3 py-1.5 font-medium rounded-lg text-sm transition flex items-center gap-1 ${
                                        selectedIds.size > 0 && bulkReporterId
                                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {isBulkProcessing && <Loader2 className="w-3 h-3 animate-spin" />}
                                    배정 {selectedIds.size > 0 && `(${selectedIds.size})`}
                                </button>
                            </div>
                        )}

                        {/* 구분선 */}
                        {filterStatus !== 'trash' && <div className="w-px h-8 bg-gray-300 mx-1" />}

                        {/* 선택 승인/복구 버튼 - 항상 표시, 선택 없으면 비활성화 */}
                        {filterStatus === 'trash' ? (
                            <button
                                onClick={() => openBulkConfirmModal('bulk-restore')}
                                disabled={isBulkProcessing || selectedIds.size === 0}
                                className={`px-4 py-2 font-medium rounded-lg shadow-sm transition flex items-center gap-2 ${selectedIds.size > 0
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {isBulkProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                                <RotateCcw className="w-4 h-4" />
                                선택 복구 {selectedIds.size > 0 && `(${selectedIds.size}개)`}
                            </button>
                        ) : (
                            <button
                                onClick={() => openBulkConfirmModal('bulk-approve')}
                                disabled={isBulkProcessing || selectedIds.size === 0}
                                className={`px-4 py-2 font-medium rounded-lg shadow-sm transition flex items-center gap-2 ${selectedIds.size > 0
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
                            {filterStatus === 'trash' ? '일괄 영구삭제' : '일괄 삭제'}
                        </button>
                    </div>
                }
            />

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="제목 또는 내용 검색..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
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
                        { key: "all", label: "전체" },
                        { key: "draft", label: "승인 대기" },
                        { key: "limited", label: "제한공개" },
                        { key: "published", label: "발행됨" },
                        { key: "rejected", label: "노출불가" },
                        { key: "trash", label: "휴지통" }
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="py-2 px-3 w-10 text-center text-xs font-semibold text-gray-500">No.</th>
                            <th className="py-2 px-3 w-10">
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedIds(new Set(paginatedArticles.map(a => a.id)));
                                        else setSelectedIds(new Set());
                                    }}
                                    checked={paginatedArticles.length > 0 && selectedIds.size === paginatedArticles.length}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                />
                            </th>
                            <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase">상태</th>
                            <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase">제목</th>
                            <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase">카테고리</th>
                            <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase">작성자/출처</th>
                            <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase">작성일</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginatedArticles.map((article, index) => (
                            <tr
                                key={article.id}
                                className="hover:bg-gray-50 transition cursor-pointer"
                                onClick={() => openPreview(article)}
                            >
                                <td className="py-1 px-3 text-center text-xs text-gray-400">
                                    {(currentPage - 1) * 20 + index + 1}
                                </td>
                                <td className="py-1 px-3" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(article.id)}
                                        onChange={() => toggleSelect(article.id)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                </td>
                                <td className="py-1 px-3">
                                    <StatusBadge type="article" status={article.status} />
                                </td>
                                <td className="py-1 px-3">
                                    <div className="flex items-center gap-2">
                                        {article.is_focus && (
                                            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded">Focus</span>
                                        )}
                                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{article.title}</p>
                                    </div>
                                </td>
                                <td className="py-1 px-3">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded textxs font-medium bg-gray-100 text-gray-600">
                                        {article.category}
                                    </span>
                                </td>
                                <td className="py-1 px-3">
                                    <div className="flex items-center text-xs">
                                        <span className="text-gray-900 font-medium mr-1.5 truncate max-w-[80px]">{article.author}</span>
                                        <span className="text-gray-400">| {article.source}</span>
                                    </div>
                                </td>
                                <td className="py-1 px-3 text-xs text-gray-500">
                                    {new Date(article.published_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {paginatedArticles.length === 0 && (
                    <div className="p-12 text-center text-gray-400">데이터가 없습니다.</div>
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
                        <button onClick={handleDelete} className="p-2 bg-white border border-gray-300 text-red-600 rounded-lg hover:bg-red-50 transition">
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
                                className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-2 bg-blue-50 rounded-lg"
                            >
                                <Globe className="w-4 h-4" />
                                원문 보기 ({previewArticle.source})
                            </a>
                        )}

                        {/* Meta Info - 컴팩트하게 한 줄로 */}
                        <div className="flex gap-4 p-2 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">상태:</span>
                                <StatusBadge type="article" status={previewArticle.status} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">카테고리:</span>
                                <span className="font-medium">{previewArticle.category}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">조회수:</span>
                                <span className="font-medium">{previewArticle.views}회</span>
                            </div>
                        </div>

                        {/* Edit Fields - 제목 */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">제목</label>
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900 text-sm"
                            />
                        </div>

                        {/* 부제목 입력 필드 */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">부제목 (선택)</label>
                            <input
                                type="text"
                                value={editSubtitle}
                                onChange={(e) => setEditSubtitle(e.target.value)}
                                placeholder="기사의 부제목을 입력하세요"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 text-sm"
                            />
                        </div>

                        {/* Focus 토글 - 컴팩트하게 */}
                        <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                            <input
                                type="checkbox"
                                id="is_focus"
                                checked={editIsFocus}
                                onChange={(e) => setEditIsFocus(e.target.checked)}
                                className="w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                            />
                            <label htmlFor="is_focus" className="flex-1 text-sm">
                                <span className="font-bold text-orange-800">🌟 Focus 기사</span>
                                <span className="text-orange-600 ml-2">메인 페이지 '나주 Focus' 섹션 노출</span>
                            </label>
                        </div>

                        {/* 이미지 썸네일 미리보기 - 높이 축소 */}
                        <ImageThumbnail
                            src={previewArticle.thumbnail_url}
                            alt="기사 썸네일"
                            heightClass="h-32"
                        />

                        <div className="flex-1 flex flex-col">
                            <label className="block text-xs font-medium text-gray-500 mb-1">본문 내용</label>
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full flex-1 min-h-[350px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed text-gray-800 resize-none"
                            />
                        </div>



                        {/* Approve & Publish Button - Only for draft articles */}
                        {previewArticle.status === 'draft' && (
                            <button
                                onClick={handleApprove}
                                disabled={isApproving}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-sm transition disabled:opacity-50 mt-2"
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
                    </div>
                )}
            </SlidePanel>

            {/* ConfirmModal - 일반 확인용 */}
            {!(confirmModal.type === 'bulk-all-delete' && filterStatus === 'trash') && (
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    title="확인"
                    message={confirmModal.message}
                    confirmLabel="확인"
                    onConfirm={handleConfirmAction}
                    onCancel={() => setConfirmModal({ isOpen: false, type: null, message: '' })}
                />
            )}

            {/* DangerConfirmModal - 휴지통 일괄 영구삭제용 (5번 확인) */}
            {confirmModal.type === 'bulk-all-delete' && filterStatus === 'trash' && (
                <DangerConfirmModal
                    isOpen={confirmModal.isOpen}
                    message={confirmModal.message}
                    onConfirm={handleConfirmAction}
                    onCancel={() => setConfirmModal({ isOpen: false, type: null, message: '' })}
                />
            )}
        </div>
    );
}
