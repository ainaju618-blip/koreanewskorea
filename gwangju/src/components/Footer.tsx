'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Mail, Phone, MapPin, ExternalLink, Lock, Eye, EyeOff, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

/**
 * Korea NEWS Gwangju - Unique Footer
 * ==================================
 * Design Philosophy:
 *   - Dark background with Korea Red accents
 *   - Newspaper-style branding (ChosunilboMyungjo)
 *   - Clean, professional layout
 *   - Admin edit functionality preserved
 */

export default function Footer() {
    const pathname = usePathname();
    const router = useRouter();
    const { showSuccess, showError } = useToast();

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

    const currentYear = new Date().getFullYear();

    return (
        <>
            <footer className="bg-slate-900 text-white">
                {/* Main Footer */}
                <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                        {/* Brand Column */}
                        <div className="lg:col-span-1">
                            <Link href="/" className="inline-block mb-4">
                                <span
                                    className="text-2xl font-bold text-white"
                                    style={{ fontFamily: 'ChosunilboMyungjo, serif' }}
                                >
                                    코리아NEWS
                                </span>
                                <span className="text-lg font-bold text-primary ml-1">광주</span>
                            </Link>
                            <p className="text-sm text-slate-400 leading-relaxed mb-4">
                                빛고을 광주, 시민과 함께하는 뉴스<br />
                                지역의 목소리를 전하는 신뢰받는 언론
                            </p>
                            {/* Contact Info */}
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                                    <span>광주광역시 동구 독립로 338, 501호</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                                    <a href="tel:010-2631-3865" className="hover:text-white transition-colors">
                                        010-2631-3865
                                    </a>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                                    <a href="mailto:editor@gwangju.koreanewsone.com" className="hover:text-white transition-colors">
                                        editor@gwangju.koreanewsone.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Categories */}
                        <div>
                            <h4 className="text-sm font-bold text-white mb-4 pb-2 border-b border-primary/50">
                                뉴스 카테고리
                            </h4>
                            <ul className="space-y-2">
                                <FooterLink href="/category/politics">정치</FooterLink>
                                <FooterLink href="/category/economy">경제</FooterLink>
                                <FooterLink href="/category/society">사회</FooterLink>
                                <FooterLink href="/category/culture">문화</FooterLink>
                                <FooterLink href="/category/gwangju">광주소식</FooterLink>
                            </ul>
                        </div>

                        {/* Info Links */}
                        <div>
                            <h4 className="text-sm font-bold text-white mb-4 pb-2 border-b border-slate-700">
                                이용안내
                            </h4>
                            <ul className="space-y-2">
                                <FooterLink href="/about">회사소개</FooterLink>
                                <FooterLink href="/privacy" highlight>개인정보처리방침</FooterLink>
                                <FooterLink href="/terms">이용약관</FooterLink>
                                <FooterLink href="/contact">광고문의</FooterLink>
                                <FooterLink href="/reporter/apply">기자 모집</FooterLink>
                            </ul>
                        </div>

                        {/* External Links */}
                        <div>
                            <h4 className="text-sm font-bold text-white mb-4 pb-2 border-b border-slate-700">
                                관련 사이트
                            </h4>
                            <ul className="space-y-2">
                                <li>
                                    <a
                                        href="https://www.koreanewsone.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center gap-1.5"
                                    >
                                        코리아NEWS 본사
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.gwangju.go.kr"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                                    >
                                        광주광역시청
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://council.gwangju.go.kr"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                                    >
                                        광주광역시의회
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar - Korea Red accent line */}
                <div className="border-t-2 border-primary bg-slate-950">
                    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                            <div className="text-center md:text-left">
                                <p className="mb-1">
                                    <strong className="text-slate-400">발행인:</strong> 고광욱 |
                                    <strong className="text-slate-400 ml-2">등록번호:</strong> 광주, 아00517 |
                                    <strong className="text-slate-400 ml-2">등록일:</strong> 2024.09.19
                                </p>
                                <p>&copy; {currentYear} 코리아NEWS 광주. All rights reserved.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleAdminEditClick}
                                    className="text-[11px] text-slate-600 hover:text-primary transition-colors"
                                >
                                    {isNewsPage ? 'Admin Edit' : 'Admin'}
                                </button>
                                <span className="text-slate-700">|</span>
                                <Link
                                    href="/admin"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-slate-600 hover:text-primary transition-colors"
                                >
                                    Admin Mode
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-lg max-w-sm w-full shadow-2xl overflow-hidden">
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                            <h3 className="font-bold text-lg">관리자 인증</h3>
                            <button onClick={closeModals} className="p-1 hover:bg-white/10 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
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
                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                                className="w-full py-3 bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white font-medium rounded transition flex items-center justify-center gap-2"
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
                    <div className="bg-white rounded-lg max-w-sm w-full shadow-2xl overflow-hidden">
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                            <h3 className="font-bold text-lg">기사 관리</h3>
                            <button onClick={closeModals} className="p-1 hover:bg-white/10 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-3">
                            <p className="text-sm text-gray-500 mb-4">
                                ID: {articleId?.slice(0, 12)}...
                            </p>

                            <button
                                onClick={handleEdit}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition border border-gray-200"
                            >
                                <Pencil className="w-5 h-5" />
                                <span className="font-medium">수정하기</span>
                            </button>

                            <button
                                onClick={() => handleDeleteClick('soft')}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded transition border border-gray-200"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span className="font-medium">휴지통으로 이동</span>
                            </button>

                            <button
                                onClick={() => handleDeleteClick('hard')}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded transition border border-red-200"
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
                    <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full overflow-hidden">
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
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className={`flex-1 px-4 py-2.5 text-white rounded transition disabled:opacity-50 ${
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

function FooterLink({ href, children, highlight = false }: { href: string; children: React.ReactNode; highlight?: boolean }) {
    return (
        <li>
            <Link
                href={href}
                className={`text-sm transition-colors duration-200 block ${highlight ? 'text-primary font-medium' : 'text-slate-400 hover:text-white'}`}
            >
                {children}
            </Link>
        </li>
    );
}
