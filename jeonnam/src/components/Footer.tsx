'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { CURRENT_SITE } from '@/config/site-regions';

/**
 * Korea NEWS Regional - Gangwon Ilbo Style Footer
 * ================================================
 * Dark footer (#333333) with company info
 * Includes admin edit functionality
 * Dynamic branding from site-regions config
 */

export default function Footer() {
    const pathname = usePathname();
    const router = useRouter();
    const { showError } = useToast();

    // Admin Edit modal state
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Check if on news page
    const getArticleId = (): string | null => {
        const match = pathname.match(/^\/news\/([a-zA-Z0-9-]+)/);
        return match ? match[1] : null;
    };

    const articleId = getArticleId();
    const isNewsPage = !!articleId;
    const currentYear = new Date().getFullYear();

    // Admin Edit button click
    const handleAdminEditClick = () => {
        if (isNewsPage) {
            setShowLoginModal(true);
        } else {
            window.open('/admin', '_blank');
        }
    };

    // Login submit
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                setShowLoginModal(false);
                setShowEditModal(true);
                setPassword('');
            } else {
                const data = await res.json();
                setError(data.message || 'Incorrect password');
            }
        } catch {
            setError('Server connection failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Navigate to edit page
    const handleEdit = () => {
        if (!articleId) return;
        router.push(`/admin/news/edit/${articleId}`);
        setShowEditModal(false);
    };

    // Delete confirmation
    const handleDeleteClick = (type: 'soft' | 'hard') => {
        setDeleteType(type);
        setShowDeleteConfirm(true);
    };

    // Execute delete
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
                setShowDeleteConfirm(false);
                setShowEditModal(false);
                router.push('/');
                router.refresh();
            } else {
                showError(data.error || 'Delete failed');
            }
        } catch (err) {
            console.error('Delete error:', err);
            showError('Error occurred during deletion');
        } finally {
            setIsDeleting(false);
        }
    };

    // Close modals
    const closeModals = () => {
        setShowLoginModal(false);
        setShowEditModal(false);
        setShowDeleteConfirm(false);
        setPassword('');
        setError('');
    };

    return (
        <>
            <footer className="kn-footer">
                <div className="container-kn">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Company Info */}
                        <div className="md:col-span-2">
                            <div className="kn-footer-logo">
                                코리아NEWS {CURRENT_SITE.name}
                            </div>
                            <div className="kn-footer-info">
                                <p>발행인: 코리아NEWS | 편집인: 코리아NEWS</p>
                                <p>주소: 전라남도 무안군 삼향읍</p>
                                <p>대표전화: 010-2631-3865 | 이메일: news@koreanewsone.com</p>
                                <p>등록번호: 전남 가 00000호 | 등록일: 2024년 1월 1일</p>
                            </div>

                            {/* Footer Links */}
                            <div className="kn-footer-links">
                                <Link href="/about" className="kn-footer-link">
                                    회사소개
                                </Link>
                                <Link href="/privacy" className="kn-footer-link">
                                    개인정보처리방침
                                </Link>
                                <Link href="/terms" className="kn-footer-link">
                                    이용약관
                                </Link>
                                <Link href="/contact" className="kn-footer-link">
                                    제보하기
                                </Link>
                                <Link href="/ad" className="kn-footer-link">
                                    광고문의
                                </Link>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-white text-sm font-semibold mb-4">바로가기</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <Link href="/category/politics" className="kn-footer-link">
                                        정치
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/category/economy" className="kn-footer-link">
                                        경제
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/category/society" className="kn-footer-link">
                                        사회
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/category/culture" className="kn-footer-link">
                                        문화
                                    </Link>
                                </li>
                                <li>
                                    <a
                                        href="https://www.koreanewsone.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="kn-footer-link"
                                    >
                                        본사 바로가기
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="kn-footer-copyright">
                        <p>
                            Copyright &copy; {currentYear} 코리아NEWS {CURRENT_SITE.name}. All rights reserved.
                        </p>
                        <p className="mt-1">
                            본 사이트의 모든 콘텐츠는 저작권법의 보호를 받으며 무단 전재, 복사, 배포를 금합니다.
                        </p>
                        <button
                            onClick={handleAdminEditClick}
                            className="mt-2 text-[11px] text-gray-600 hover:text-white transition-colors"
                        >
                            {isNewsPage ? 'Admin Edit' : 'Admin'}
                        </button>
                    </div>
                </div>
            </footer>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white max-w-sm w-full overflow-hidden">
                        <div className="bg-primary text-white px-5 py-4 flex items-center justify-between">
                            <h3 className="font-bold">관리자 인증</h3>
                            <button onClick={closeModals} className="p-1 hover:bg-white/10 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleLoginSubmit} className="p-5 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    비밀번호
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="관리자 비밀번호"
                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 focus:outline-none focus:border-primary"
                                        autoFocus
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || !password}
                                className="w-full py-3 bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white font-medium transition flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        확인 중...
                                    </>
                                ) : (
                                    '확인'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit/Delete Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white max-w-sm w-full overflow-hidden">
                        <div className="bg-primary text-white px-5 py-4 flex items-center justify-between">
                            <h3 className="font-bold">기사 관리</h3>
                            <button onClick={closeModals} className="p-1 hover:bg-white/10 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-3">
                            <p className="text-sm text-gray-500 mb-4">
                                ID: {articleId?.slice(0, 12)}...
                            </p>

                            <button
                                onClick={handleEdit}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-primary transition border border-gray-200"
                            >
                                <Pencil className="w-5 h-5" />
                                <span className="font-medium">수정하기</span>
                            </button>

                            <button
                                onClick={() => handleDeleteClick('soft')}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition border border-gray-200"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span className="font-medium">휴지통으로 이동</span>
                            </button>

                            <button
                                onClick={() => handleDeleteClick('hard')}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition border border-red-200"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span className="font-medium">완전 삭제</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white max-w-sm w-full overflow-hidden">
                        <div className={`p-4 ${deleteType === 'hard' ? 'bg-red-500' : 'bg-orange-500'} text-white`}>
                            <h3 className="font-bold">
                                {deleteType === 'hard' ? '완전 삭제' : '휴지통으로 이동'}
                            </h3>
                        </div>
                        <div className="p-5">
                            <p className="text-gray-600 mb-5">
                                {deleteType === 'hard'
                                    ? '이 기사를 완전히 삭제합니다. 복구할 수 없습니다.'
                                    : '이 기사를 휴지통으로 이동합니다. 나중에 복구할 수 있습니다.'
                                }
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className={`flex-1 px-4 py-2.5 text-white transition disabled:opacity-50 ${
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
