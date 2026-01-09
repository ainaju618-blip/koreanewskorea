'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, PenSquare, Loader2, X, User, Save, Send, ChevronUp, Upload, Link as LinkIcon, Eye, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';

interface ReporterAuthSectionProps {
    reporterId: string;
    reporterName: string;
    reporterRegion?: string;  // 기자 지역 추가
}

// 지역별 카테고리 매핑 (DB 값과 일치해야 함: "나주시", "광주광역시", "장성군" 등)
// ⚠️ 다른 파일에서도 사용하므로 export - 하드코딩 금지!
export const REGION_CATEGORIES: Record<string, string[]> = {
    // 시 단위
    "나주시": ["나주시소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "목포시": ["목포시소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "순천시": ["순천시소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "여수시": ["여수시소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "광양시": ["광양시소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    // 광역시
    "광주광역시": ["광주소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    // 군 단위
    "담양군": ["담양군소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "곡성군": ["곡성군소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "구례군": ["구례군소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "고흥군": ["고흥군소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "보성군": ["보성군소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "화순군": ["화순군소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "장흥군": ["장흥군소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "강진군": ["강진군소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "해남군": ["해남군소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "영암군": ["영암군소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "무안군": ["무안군소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "함평군": ["함평군소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "영광군": ["영광군소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "장성군": ["장성군소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "완도군": ["완도군소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "진도군": ["진도군소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "신안군": ["신안군소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    // 광역 단위
    "전체": ["전국소식", "정치", "경제", "사회", "문화", "오피니언", "맛집", "여행"],
    "전라남도": ["전남소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
    "전라남도교육청": ["교육소식", "학교소식", "정책소식", "오피니언"],
    "광주시교육청": ["교육소식", "학교소식", "정책소식", "오피니언"],
    // 기본값
    "default": ["지역소식", "의회소식", "교육소식", "소방서소식", "기업소식", "오피니언", "맛집", "여행"],
};

// ⚠️ 다른 파일에서도 사용하므로 export - 하드코딩 금지!
export function getCategoriesForRegion(region: string): string[] {
    return REGION_CATEGORIES[region] || REGION_CATEGORIES["default"];
}

export default function ReporterAuthSection({ reporterId, reporterName, reporterRegion = '나주시' }: ReporterAuthSectionProps) {
    // 기자 지역에 맞는 카테고리 목록
    const categories = getCategoriesForRegion(reporterRegion);
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isOwnPage, setIsOwnPage] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showWriteForm, setShowWriteForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loginLoading, setLoginLoading] = useState(false);
    const [error, setError] = useState('');

    // Login form
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    // Article form
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState(categories[0] || '지역소식');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [articleError, setArticleError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);

    // Check if current user is the reporter of this page
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setIsLoggedIn(true);

                    // Check if logged in user is the owner of this page
                    const { data: reporter } = await supabase
                        .from('reporters')
                        .select('id')
                        .eq('user_id', session.user.id)
                        .single();

                    if (reporter && reporter.id === reporterId) {
                        setIsOwnPage(true);
                    }
                }
            } catch (err) {
                console.error('Auth check error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [reporterId]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoginLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: name, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || '로그인에 실패했습니다.');
                return;
            }

            // Login successful - 기자 대시보드로 이동
            router.push('/reporter');
        } catch (err) {
            setError('서버 연결에 실패했습니다.');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setIsOwnPage(false);
        setShowWriteForm(false);
        router.refresh();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (4.5MB limit)
        if (file.size > 4.5 * 1024 * 1024) {
            setArticleError('이미지 크기는 4.5MB 이하여야 합니다.');
            return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            setArticleError('이미지 파일만 업로드할 수 있습니다.');
            return;
        }

        setIsUploading(true);
        setArticleError('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'articles');

            const res = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                setArticleError(data.error || '이미지 업로드에 실패했습니다.');
                return;
            }

            setThumbnailUrl(data.url);
        } catch (err) {
            setArticleError('이미지 업로드 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmitArticle = async (status: 'draft' | 'pending' | 'published') => {
        console.log('[Submit] Called with status:', status);

        if (!title.trim()) {
            setArticleError('제목을 입력해주세요.');
            return;
        }
        if (!content.trim()) {
            setArticleError('내용을 입력해주세요.');
            return;
        }

        setArticleError('');
        setSuccessMessage('');
        setIsSaving(true);
        setShowPublishConfirm(false);

        console.log('[Submit] Sending request...');
        try {
            const res = await fetch('/api/reporter/write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    subtitle: subtitle || null,
                    content,
                    category,
                    thumbnail_url: thumbnailUrl || null,
                    status,
                }),
            });

            const data = await res.json();
            console.log('[Submit] Response:', { ok: res.ok, data });

            if (!res.ok) {
                setArticleError(data.message || '기사 작성에 실패했습니다.');
                return;
            }

            // 성공 메시지
            const messages = {
                draft: '임시저장 되었습니다.',
                pending: '승인요청이 완료되었습니다.',
                published: '기사가 발행되었습니다!'
            };
            setSuccessMessage(messages[status]);

            // Reset form after success
            setTimeout(() => {
                setTitle('');
                setSubtitle('');
                setContent('');
                setCategory(categories[0] || '지역소식');
                setThumbnailUrl('');
                setSuccessMessage('');
                if (status === 'pending' || status === 'published') {
                    setShowWriteForm(false);
                }
            }, 2000);

        } catch (err) {
            console.error('[Submit] Error:', err);
            setArticleError('서버 연결에 실패했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center gap-3">
                {isLoggedIn && isOwnPage ? (
                    // Logged in as page owner - show write button
                    <>
                        <button
                            onClick={() => setShowWriteForm(!showWriteForm)}
                            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                showWriteForm
                                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                            {showWriteForm ? (
                                <>
                                    <ChevronUp className="w-4 h-4" />
                                    접기
                                </>
                            ) : (
                                <>
                                    <PenSquare className="w-4 h-4" />
                                    기사쓰기
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            로그아웃
                        </button>
                    </>
                ) : (
                    // Not logged in or not page owner - show login button
                    <button
                        onClick={() => setShowLoginModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <LogIn className="w-4 h-4" />
                        기자 로그인
                    </button>
                )}
            </div>

            {/* Inline Article Write Form */}
            {showWriteForm && isLoggedIn && isOwnPage && (
                <div className="fixed inset-x-0 top-[150px] bottom-0 z-40 bg-white overflow-y-auto border-t border-gray-200 shadow-lg">
                    <div className="max-w-4xl mx-auto px-4 py-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <PenSquare className="w-6 h-6 text-blue-600" />
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">새 기사 작성</h2>
                                    <p className="text-sm text-gray-500">{reporterName} 기자</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowWriteForm(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Success Message */}
                        {successMessage && (
                            <div className="bg-green-50 border border-green-200 text-green-600 text-sm rounded-lg p-3 mb-4">
                                {successMessage}
                            </div>
                        )}

                        {/* Error Message */}
                        {articleError && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-4">
                                {articleError}
                            </div>
                        )}

                        {/* Form */}
                        <div className="space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    제목 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="기사 제목을 입력하세요"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    disabled={isSaving}
                                />
                            </div>

                            {/* Subtitle */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    부제목
                                </label>
                                <input
                                    type="text"
                                    value={subtitle}
                                    onChange={(e) => setSubtitle(e.target.value)}
                                    placeholder="부제목을 입력하세요 (선택)"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    disabled={isSaving}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    카테고리
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    disabled={isSaving}
                                >
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    대표 이미지
                                </label>

                                {/* 이미지 미리보기 */}
                                {thumbnailUrl && (
                                    <div className="relative inline-block mb-3">
                                        <img
                                            src={thumbnailUrl}
                                            alt="썸네일 미리보기"
                                            className="h-40 object-cover rounded-lg border border-gray-200"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setThumbnailUrl('')}
                                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-md"
                                            disabled={isSaving}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* 파일 업로드 */}
                                <div className="flex gap-3 items-start">
                                    <label className={`flex flex-col items-center justify-center w-32 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition flex-shrink-0 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={isSaving || isUploading}
                                        />
                                        {isUploading ? (
                                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                                <span className="text-xs text-gray-500">파일 선택</span>
                                            </>
                                        )}
                                    </label>

                                    {/* URL 입력 */}
                                    <div className="flex-1">
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="url"
                                                value={thumbnailUrl}
                                                onChange={(e) => setThumbnailUrl(e.target.value)}
                                                placeholder="또는 이미지 URL 입력"
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                                                disabled={isSaving || isUploading}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">파일 업로드 또는 URL 직접 입력</p>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    내용 <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="기사 내용을 입력하세요..."
                                    rows={12}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-y"
                                    disabled={isSaving}
                                />
                                <p className="text-sm text-gray-400 mt-1 text-right">
                                    {content.length.toLocaleString()}자
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowPreview(true)}
                                        disabled={isSaving || !title.trim()}
                                        className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                                    >
                                        <Eye className="w-4 h-4" />
                                        미리보기
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowWriteForm(false)}
                                        className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                        disabled={isSaving}
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={() => handleSubmitArticle('draft')}
                                        disabled={isSaving}
                                        className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        임시저장
                                    </button>
                                    <button
                                        onClick={() => handleSubmitArticle('pending')}
                                        disabled={isSaving}
                                        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                        승인요청
                                    </button>
                                    <button
                                        onClick={() => setShowPublishConfirm(true)}
                                        disabled={isSaving}
                                        className="px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Zap className="w-4 h-4" />
                                        )}
                                        승인없이 게시
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-blue-600" />
                                미리보기
                            </h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {thumbnailUrl && (
                                <img
                                    src={thumbnailUrl}
                                    alt="썸네일"
                                    className="w-full h-64 object-cover rounded-lg mb-4"
                                />
                            )}
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded mb-3">
                                {category}
                            </span>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                {title || '제목 없음'}
                            </h1>
                            {subtitle && (
                                <p className="text-lg text-gray-600 mb-4">{subtitle}</p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 pb-4 border-b">
                                <span>{reporterName} 기자</span>
                                <span>·</span>
                                <span>{new Date().toLocaleDateString('ko-KR')}</span>
                            </div>
                            <div className="prose prose-gray max-w-none whitespace-pre-wrap">
                                {content || '내용 없음'}
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="w-full py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Publish Confirmation Modal */}
            {showPublishConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-8 h-8 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                정말로 발행하시겠습니까?
                            </h3>
                            <p className="text-gray-500 mb-6">
                                승인 없이 바로 기사가 게시됩니다.<br />
                                발행 후에는 홈페이지에 즉시 노출됩니다.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPublishConfirm(false)}
                                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                    disabled={isSaving}
                                >
                                    취소
                                </button>
                                <button
                                    onClick={() => handleSubmitArticle('published')}
                                    className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium flex items-center justify-center gap-2"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Zap className="w-4 h-4" />
                                    )}
                                    발행하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">기자 로그인</h3>
                                    <p className="text-xs text-gray-500">{reporterName} 기자님의 페이지</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    이름
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    placeholder="기자 이름 입력"
                                    required
                                    disabled={loginLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    비밀번호
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    placeholder="비밀번호 입력"
                                    required
                                    disabled={loginLoading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loginLoading}
                                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                            >
                                {loginLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <LogIn className="w-5 h-5" />
                                        로그인
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="px-6 pb-6 text-center">
                            <p className="text-xs text-gray-400">
                                비밀번호를 잊으셨나요? 관리자에게 문의하세요.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
