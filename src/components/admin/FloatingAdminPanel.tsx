'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Settings, Pencil, Trash2, Copy, Check, X, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

/**
 * 플로팅 관리자 패널
 * - 관리자 로그인 시에만 표시
 * - /news/[id] 페이지에서 해당 기사 수정/삭제 가능
 * - URL에서 기사 ID 자동 추출
 */
export default function FloatingAdminPanel() {
    const pathname = usePathname();
    const router = useRouter();
    const { showSuccess, showError } = useToast();

    const [isAdmin, setIsAdmin] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');

    // 관리자 인증 확인 (localStorage 사용 - 모든 탭에서 공유)
    useEffect(() => {
        const checkAdmin = () => {
            if (typeof window !== 'undefined') {
                const auth = localStorage.getItem('korea_news_admin_auth');
                setIsAdmin(auth === 'authenticated');
            }
        };

        checkAdmin();
        // storage 이벤트 감지 (다른 탭에서 로그인/로그아웃 시)
        window.addEventListener('storage', checkAdmin);
        return () => window.removeEventListener('storage', checkAdmin);
    }, []);

    // URL에서 기사 ID 추출 (/news/[id])
    const getArticleId = (): string | null => {
        const match = pathname.match(/^\/news\/([a-zA-Z0-9-]+)/);
        return match ? match[1] : null;
    };

    const articleId = getArticleId();
    const isNewsPage = !!articleId;

    // 관리자가 아니면 렌더링 안함
    if (!isAdmin) return null;

    // ID 복사
    const handleCopyId = async () => {
        if (!articleId) return;
        try {
            await navigator.clipboard.writeText(articleId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // 수정 페이지로 이동
    const handleEdit = () => {
        if (!articleId) return;
        router.push(`/admin/news/edit/${articleId}`);
    };

    // 삭제 확인 모달 열기
    const handleDeleteClick = (type: 'soft' | 'hard') => {
        setDeleteType(type);
        setShowConfirm(true);
    };

    // 삭제 실행
    const handleDelete = async () => {
        if (!articleId) return;

        setIsDeleting(true);
        try {
            const force = deleteType === 'hard';
            const res = await fetch(`/api/admin/news?id=${articleId}&force=${force}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (res.ok) {
                setShowConfirm(false);
                // 삭제 후 홈으로 이동
                router.push('/');
                router.refresh();
            } else {
                showError(data.error || '삭제 실패');
            }
        } catch (err) {
            console.error('Delete error:', err);
            showError('삭제 중 오류가 발생했습니다.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            {/* 플로팅 버튼 */}
            <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
                {/* 확장 메뉴 */}
                {isOpen && (
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden min-w-[180px] animate-in slide-in-from-bottom-2 duration-200">
                        {/* 헤더 */}
                        <div className="bg-gray-900 text-white px-4 py-2 text-sm font-medium flex items-center justify-between">
                            <span>관리자 메뉴</span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-gray-700 rounded p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {isNewsPage ? (
                            <div className="p-2">
                                {/* 기사 ID */}
                                <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100 mb-1">
                                    ID: {articleId?.slice(0, 8)}...
                                </div>

                                {/* 수정 */}
                                <button
                                    onClick={handleEdit}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                                >
                                    <Pencil className="w-4 h-4" />
                                    <span>수정</span>
                                </button>

                                {/* 휴지통 (Soft Delete) */}
                                <button
                                    onClick={() => handleDeleteClick('soft')}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>휴지통으로</span>
                                </button>

                                {/* 완전 삭제 (Hard Delete) */}
                                <button
                                    onClick={() => handleDeleteClick('hard')}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-red-600 hover:bg-red-50 rounded-lg transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>완전 삭제</span>
                                </button>

                                {/* ID 복사 */}
                                <button
                                    onClick={handleCopyId}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-green-500" />
                                            <span className="text-green-600">복사됨!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            <span>ID 복사</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 text-sm text-gray-500 text-center">
                                기사 페이지에서<br />수정/삭제 가능
                            </div>
                        )}

                        {/* 관리자 페이지 링크 */}
                        <div className="border-t border-gray-100 p-2">
                            <button
                                onClick={() => router.push('/admin')}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition"
                            >
                                <Settings className="w-4 h-4" />
                                <span>관리자 대시보드</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 메인 플로팅 버튼 */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
                        isOpen
                            ? 'bg-gray-900 text-white rotate-180'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {isOpen ? (
                        <ChevronUp className="w-6 h-6" />
                    ) : (
                        <Settings className="w-6 h-6" />
                    )}
                </button>
            </div>

            {/* 삭제 확인 모달 */}
            {showConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
                        <div className={`p-4 ${deleteType === 'hard' ? 'bg-red-500' : 'bg-orange-500'} text-white`}>
                            <h3 className="font-bold text-lg">
                                {deleteType === 'hard' ? '완전 삭제' : '휴지통으로 이동'}
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 mb-6">
                                {deleteType === 'hard'
                                    ? '이 기사를 완전히 삭제합니다. 복구할 수 없습니다.'
                                    : '이 기사를 휴지통으로 이동합니다. 나중에 복구할 수 있습니다.'
                                }
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className={`flex-1 px-4 py-2.5 text-white rounded-lg transition disabled:opacity-50 ${
                                        deleteType === 'hard'
                                            ? 'bg-red-500 hover:bg-red-600'
                                            : 'bg-orange-500 hover:bg-orange-600'
                                    }`}
                                >
                                    {isDeleting ? '삭제 중...' : '삭제'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
