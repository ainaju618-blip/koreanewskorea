'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Newspaper, Facebook, Instagram, Youtube, Mail, Phone, MapPin,
  ExternalLink, Lock, Eye, EyeOff, Loader2, Pencil, Trash2, X
} from 'lucide-react';

export default function StitchFooter() {
  const pathname = usePathname();
  const router = useRouter();

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

      if (res.ok) {
        setShowDeleteConfirm(false);
        setShowEditModal(false);
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Delete error:', err);
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
      <footer className="bg-gray-900 text-gray-400">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Newspaper className="w-6 h-6 text-cyan-500" />
                <span className="text-xl font-black text-white">
                  코리아<span className="text-cyan-500">NEWS</span>
                </span>
              </Link>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                세상을 바꾸는 뉴스, 정직한 보도와 깊이 있는 분석으로 독자 여러분과 함께합니다.
              </p>
              <div className="flex items-center gap-3">
                <SocialLink href="#" icon={<Facebook className="w-4 h-4" />} />
                <SocialLink href="#" icon={<Instagram className="w-4 h-4" />} />
                <SocialLink href="#" icon={<Youtube className="w-4 h-4" />} />
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">회사소개</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-cyan-500 transition-colors">코리아NEWS 소개</Link></li>
                <li><Link href="/history" className="hover:text-cyan-500 transition-colors">연혁</Link></li>
                <li><Link href="/organization" className="hover:text-cyan-500 transition-colors">조직도</Link></li>
                <li><Link href="/location" className="hover:text-cyan-500 transition-colors">오시는 길</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">서비스</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/report" className="hover:text-cyan-500 transition-colors">기사제보</Link></li>
                <li><Link href="/ad-inquiry" className="hover:text-cyan-500 transition-colors">광고문의</Link></li>
                <li><Link href="/subscribe" className="hover:text-cyan-500 transition-colors">뉴스레터</Link></li>
                <li>
                  <a href="#" className="hover:text-cyan-500 transition-colors flex items-center gap-1">
                    남도 다이소 <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal & Contact */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">약관 및 정책</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-cyan-500 transition-colors">이용약관</Link></li>
                <li><Link href="/privacy" className="text-cyan-500 font-bold hover:text-cyan-400 transition-colors">개인정보처리방침</Link></li>
                <li><Link href="/youth-policy" className="hover:text-cyan-500 transition-colors">청소년보호정책</Link></li>
              </ul>
            </div>
          </div>

          {/* Contact Info Bar */}
          <div className="border-t border-gray-800 pt-8 pb-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> 010-2631-3865
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" /> editor@koreanewsone.com
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> 광주광역시 동구 독립로 338, 501호
              </span>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-gray-600 text-center md:text-left">
              <p>제호: 코리아NEWS | 발행·편집인: 고광욱 | 등록번호: 광주, 아00517 | 등록일자: 2024.09.19</p>
              <p className="mt-1">© 2024 Korea News. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <button
                onClick={handleAdminEditClick}
                className="text-gray-600 hover:text-cyan-500 transition-colors"
              >
                {isNewsPage ? 'Edit' : 'Admin'}
              </button>
              <Link
                href="/admin"
                target="_blank"
                className="text-gray-600 hover:text-cyan-500 transition-colors"
              >
                관리자
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* 로그인 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
            <div className="bg-cyan-500 text-white px-6 py-4 flex items-center justify-between">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="관리자 비밀번호"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
              >
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> 확인 중...</> : '확인'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 수정/삭제 선택 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
            <div className="bg-cyan-500 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">기사 관리</h3>
              <button onClick={closeModals} className="p-1 hover:bg-white/10 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-500 mb-4">ID: {articleId?.slice(0, 12)}...</p>
              <button
                onClick={handleEdit}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 rounded-lg transition border border-gray-200"
              >
                <Pencil className="w-5 h-5" />
                <span className="font-medium">수정하기</span>
              </button>
              <button
                onClick={() => handleDeleteClick('soft')}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition border border-gray-200"
              >
                <Trash2 className="w-5 h-5" />
                <span className="font-medium">휴지통으로 이동</span>
              </button>
              <button
                onClick={() => handleDeleteClick('hard')}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition border border-red-200"
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
                  : '이 기사를 휴지통으로 이동합니다.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`flex-1 px-4 py-2.5 text-white rounded-lg transition ${
                    deleteType === 'hard' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'
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

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-cyan-500 hover:text-white transition-colors"
    >
      {icon}
    </a>
  );
}
