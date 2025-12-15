'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, ExternalLink, Lock, Eye, EyeOff, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function Footer() {
    const pathname = usePathname();
    const router = useRouter();
    const { showSuccess, showError } = useToast();

    // Admin Edit 모달 상태
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // 현재 기사 페이지인지 확인
    const getArticleId = (): string | null => {
        const match = pathname.match(/^\/news\/([a-zA-Z0-9-]+)/);
        return match ? match[1] : null;
    };

    const articleId = getArticleId();
    const isNewsPage = !!articleId;

    // Admin Edit 버튼 클릭
    const handleAdminEditClick = () => {
        if (isNewsPage) {
            setShowLoginModal(true);
        } else {
            // 기사 페이지가 아니면 관리자 페이지로 이동
            window.open('/admin', '_blank');
        }
    };

    // 로그인 제출
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
                setError(data.message || '비밀번호가 올바르지 않습니다.');
            }
        } catch {
            setError('서버 연결에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 수정 페이지로 이동
    const handleEdit = () => {
        if (!articleId) return;
        router.push(`/admin/news/edit/${articleId}`);
        setShowEditModal(false);
    };

    // 삭제 확인
    const handleDeleteClick = (type: 'soft' | 'hard') => {
        setDeleteType(type);
        setShowDeleteConfirm(true);
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
                setShowDeleteConfirm(false);
                setShowEditModal(false);
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

    // 모달 닫기
    const closeModals = () => {
        setShowLoginModal(false);
        setShowEditModal(false);
        setShowDeleteConfirm(false);
        setPassword('');
        setError('');
    };

    return (
        <>
            <footer className="bg-[#0a192f] text-slate-400 border-t-4 border-[#A6121D]">
                <div className="max-w-[1400px] mx-auto px-6 py-16">

                    {/* Top Section: Brand & Navigation */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16 border-b border-white/10 pb-12">

                        {/* Brand Column */}
                        <div className="lg:col-span-4 space-y-6">
                            <Link href="/" className="inline-block group">
                                <span className="text-4xl font-black text-white tracking-tighter">
                                    코리아<span className="text-[#A6121D]">NEWS</span>
                                </span>
                            </Link>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                                세상을 바꾸는 뉴스, 코리아NEWS는 정직한 보도와 깊이 있는 분석으로 독자 여러분과 함께합니다.
                            </p>
                            <div className="flex items-center gap-4 pt-2">
                                <SocialLink icon={<Facebook className="w-5 h-5" />} href="#" label="Facebook" />
                                <SocialLink icon={<Instagram className="w-5 h-5" />} href="#" label="Instagram" />
                                <SocialLink icon={<Youtube className="w-5 h-5" />} href="#" label="Youtube" />
                                <SocialLink icon={<Twitter className="w-5 h-5" />} href="#" label="Twitter" />
                            </div>
                        </div>

                        {/* Navigation Columns */}
                        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div>
                                <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider text-opacity-80">회사소개</h4>
                                <ul className="space-y-3 text-sm">
                                    <FooterLink href="/about">코리아NEWS 소개</FooterLink>
                                    <FooterLink href="/history">연혁</FooterLink>
                                    <FooterLink href="/organization">조직도</FooterLink>
                                    <FooterLink href="/location">오시는 길</FooterLink>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider text-opacity-80">고객센터</h4>
                                <ul className="space-y-3 text-sm">
                                    <FooterLink href="/notice">공지사항</FooterLink>
                                    <FooterLink href="/report">기사제보</FooterLink>
                                    <FooterLink href="/ad-inquiry">광고문의</FooterLink>
                                    <FooterLink href="/contact">제휴문의</FooterLink>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider text-opacity-80">약관 및 정책</h4>
                                <ul className="space-y-3 text-sm">
                                    <FooterLink href="/terms">이용약관</FooterLink>
                                    <FooterLink href="/privacy" highlight>개인정보처리방침</FooterLink>
                                    <FooterLink href="/youth-policy">청소년보호정책</FooterLink>
                                    <FooterLink href="/ethical-code">윤리강령</FooterLink>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider text-opacity-80">Family Site</h4>
                                <ul className="space-y-3 text-sm">
                                    <a href="#" className="flex items-center gap-2 hover:text-white transition-colors group">
                                        남도 다이소 <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                    </a>
                                    <a href="#" className="flex items-center gap-2 hover:text-white transition-colors group">
                                        뉴스TV <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                    </a>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Info & Copyright */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 text-[13px] leading-relaxed text-slate-500 font-light">

                        <div className="space-y-2">
                            <div className="flex flex-wrap gap-x-6 gap-y-1">
                                <span><strong className="text-slate-400 font-medium">제호:</strong> 코리아NEWS (Korea News)</span>
                                <span><strong className="text-slate-400 font-medium">발행·편집인:</strong> 고광욱</span>
                                <span><strong className="text-slate-400 font-medium">등록번호:</strong> 광주, 아00517</span>
                                <span><strong className="text-slate-400 font-medium">등록일자:</strong> 2024.09.19</span>
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-1">
                                <span><strong className="text-slate-400 font-medium">사업자등록번호:</strong> 801-07-03054</span>
                                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> 010-2631-3865</span>
                                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> editor@koreanewsone.com</span>
                            </div>
                            <div className="flex items-center gap-1 pt-1">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span>(우 61421) 광주광역시 동구 독립로 338, 501호 (계림동)</span>
                            </div>
                        </div>

                        <div className="text-left md:text-right">
                            <p className="mb-2">
                                본 본사는 한국신문윤리위원회 인터넷신문윤리강령 및 심의규정을 준수합니다.
                            </p>
                            <p className="font-medium text-slate-400">
                                © 2024 Korea News. All rights reserved.
                            </p>
                            <div className="flex items-center gap-3 mt-2 justify-start md:justify-end">
                                <button
                                    onClick={handleAdminEditClick}
                                    className="text-[11px] text-slate-600 hover:text-[#A6121D] transition-colors border-b border-transparent hover:border-[#A6121D]"
                                >
                                    {isNewsPage ? 'Admin Edit' : 'Admin'}
                                </button>
                                <span className="text-slate-700">|</span>
                                <Link
                                    href="/admin"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-slate-600 hover:text-[#A6121D] transition-colors border-b border-transparent hover:border-[#A6121D]"
                                >
                                    Admin Mode
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </footer>

            {/* 로그인 모달 */}
            {showLoginModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
                        <div className="bg-[#0a192f] text-white px-6 py-4 flex items-center justify-between">
                            <h3 className="font-bold text-lg">관리자 인증</h3>
                            <button onClick={closeModals} className="p-1 hover:bg-white/10 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
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
                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a192f] focus:border-transparent"
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
                                className="w-full py-3 bg-[#0a192f] hover:bg-[#0a192f]/90 disabled:bg-gray-300 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
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

            {/* 수정/삭제 선택 모달 */}
            {showEditModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
                        <div className="bg-[#0a192f] text-white px-6 py-4 flex items-center justify-between">
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
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition border border-gray-200"
                            >
                                <Pencil className="w-5 h-5" />
                                <span className="font-medium">수정하기</span>
                            </button>

                            <button
                                onClick={() => handleDeleteClick('soft')}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition border border-gray-200"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span className="font-medium">휴지통으로 이동</span>
                            </button>

                            <button
                                onClick={() => handleDeleteClick('hard')}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition border border-red-200"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span className="font-medium">완전 삭제</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 삭제 확인 모달 */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
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

function FooterLink({ href, children, highlight = false }: { href: string; children: React.ReactNode; highlight?: boolean }) {
    return (
        <li>
            <Link
                href={href}
                className={`transition-colors duration-200 block ${highlight ? 'text-white font-bold' : 'hover:text-white'}`}
            >
                {children}
            </Link>
        </li>
    );
}

function SocialLink({ icon, href, label }: { icon: React.ReactNode; href: string; label: string }) {
    return (
        <a
            href={href}
            aria-label={label}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#A6121D] hover:text-white transition-all duration-300 group"
        >
            <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                {icon}
            </div>
        </a>
    );
}
