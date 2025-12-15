'use client';

import { useState, useRef } from 'react';
import {
    X, Save, Eye, Send, Languages, Sparkles, ImagePlus, Loader2, Upload, Trash2
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

// 타입 정의
interface NewsItem {
    id: string;
    title: string;
    content: string;
    ai_summary?: string;
    category: string;
    original_link: string;
    source: string;
    thumbnail_url?: string | null;
    status: 'draft' | 'published' | 'archived';
}

interface ArticleEditorProps {
    article: NewsItem;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updated: NewsItem) => Promise<void>;
    onPublish: (article: NewsItem) => Promise<void>;
}

export default function ArticleEditor({
    article,
    isOpen,
    onClose,
    onSave,
    onPublish,
}: ArticleEditorProps) {
    const { showSuccess, showError } = useToast();

    // 편집 상태
    const [title, setTitle] = useState(article.title);
    const [content, setContent] = useState(article.content);
    const [category, setCategory] = useState(article.category);
    const [aiSummary, setAiSummary] = useState(article.ai_summary || '');
    const [thumbnailUrl, setThumbnailUrl] = useState(article.thumbnail_url || '');

    // 본문 이미지 (여러 개)
    const [images, setImages] = useState<string[]>([]);

    // UI 상태
    const [isPreview, setIsPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isRewriting, setIsRewriting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    // 카테고리 옵션
    const categories = ['광주', '전남', '나주', 'AI', 'Global AI', '교육', '전국'];

    // AI 번역
    const handleTranslate = async () => {
        setIsTranslating(true);
        try {
            const res = await fetch('/api/ai/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: content, targetLang: 'ko' }),
            });
            if (res.ok) {
                const data = await res.json();
                setContent(data.translated);
            } else {
                showError('번역 실패');
            }
        } catch (error) {
            showError('번역 중 오류 발생');
        } finally {
            setIsTranslating(false);
        }
    };

    // AI 재작성
    const handleRewrite = async () => {
        setIsRewriting(true);
        try {
            const res = await fetch('/api/ai/rewrite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: content, style: 'news' }),
            });
            if (res.ok) {
                const data = await res.json();
                setContent(data.rewritten);
            } else {
                showError('재작성 실패');
            }
        } catch (error) {
            showError('재작성 중 오류 발생');
        } finally {
            setIsRewriting(false);
        }
    };

    // 이미지 업로드 핸들러
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isThumbnail: boolean = false) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                if (isThumbnail) {
                    setThumbnailUrl(data.url);
                } else {
                    setImages(prev => [...prev, data.url]);
                }
            } else {
                // API가 없으면 로컬 미리보기 사용
                const reader = new FileReader();
                reader.onloadend = () => {
                    const dataUrl = reader.result as string;
                    if (isThumbnail) {
                        setThumbnailUrl(dataUrl);
                    } else {
                        setImages(prev => [...prev, dataUrl]);
                    }
                };
                reader.readAsDataURL(file);
            }
        } catch (error) {
            // 에러 시 로컬 미리보기 사용
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                if (isThumbnail) {
                    setThumbnailUrl(dataUrl);
                } else {
                    setImages(prev => [...prev, dataUrl]);
                }
            };
            reader.readAsDataURL(file);
        } finally {
            setIsUploading(false);
        }
    };

    // 이미지 삭제
    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    // 이미지를 본문에 삽입
    const insertImageToContent = (url: string) => {
        setContent(prev => prev + `\n\n[이미지: ${url}]\n`);
    };

    // 저장
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 이미지 태그를 본문 끝에 추가
            let finalContent = content;
            if (images.length > 0) {
                finalContent += '\n\n--- 첨부 이미지 ---\n' + images.map((url, i) => `[이미지 ${i + 1}]: ${url}`).join('\n');
            }

            await onSave({
                ...article,
                title,
                content: finalContent,
                category,
                ai_summary: aiSummary,
                thumbnail_url: thumbnailUrl || null,
            });
        } finally {
            setIsSaving(false);
        }
    };

    // 발행 모달 트리거
    const handlePublish = () => {
        setShowPublishConfirm(true);
    };

    // 실제 발행 실행
    const executePublish = async () => {
        setShowPublishConfirm(false);
        setIsPublishing(true);

        try {
            let finalContent = content;
            if (images.length > 0) {
                finalContent += '\n\n--- 첨부 이미지 ---\n' + images.map((url, i) => `[이미지 ${i + 1}]: ${url}`).join('\n');
            }

            await onPublish({
                ...article,
                title,
                content: finalContent,
                category,
                ai_summary: aiSummary,
                thumbnail_url: thumbnailUrl || null,
                status: 'published',
            });
            onClose();
        } finally {
            setIsPublishing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden my-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">📝 기사 편집기</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsPreview(!isPreview)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${isPreview ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                                }`}
                        >
                            <Eye className="w-4 h-4" />
                            미리보기
                        </button>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* 본문 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* 메타 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-600 mb-1">제목</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-medium"
                                placeholder="기사 제목"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">카테고리</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 h-[42px]"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* AI 버튼 */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleTranslate}
                            disabled={isTranslating}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-2"
                        >
                            {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                            한국어 번역
                        </button>
                        <button
                            onClick={handleRewrite}
                            disabled={isRewriting}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center gap-2"
                        >
                            {isRewriting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            AI 재작성
                        </button>
                    </div>

                    {/* 본문 편집 (textarea) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">본문</label>
                        {isPreview ? (
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 min-h-[250px] whitespace-pre-wrap">
                                {content}
                            </div>
                        ) : (
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[250px] resize-y font-mono text-sm"
                                placeholder="기사 본문을 입력하세요..."
                            />
                        )}
                    </div>

                    {/* 이미지 업로드 영역 */}
                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                <ImagePlus className="w-4 h-4" />
                                이미지 첨부
                            </label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, false)}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center gap-1"
                            >
                                {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                이미지 추가
                            </button>
                        </div>

                        {/* 첨부된 이미지 목록 */}
                        {images.length > 0 && (
                            <div className="space-y-2">
                                {images.map((url, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 group">
                                        {/* 썸네일 - 클릭하면 새 탭에서 원본 열기 */}
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                            <img src={url} alt={`이미지 ${i + 1}`} className="h-12 w-12 object-cover rounded border border-slate-300 hover:opacity-80 cursor-pointer" />
                                        </a>
                                        {/* URL 표시 */}
                                        <div className="flex-1 min-w-0">
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block">
                                                {url.length > 60 ? url.slice(0, 60) + '...' : url}
                                            </a>
                                            <span className="text-[10px] text-slate-400">클릭하면 원본 이미지 보기</span>
                                        </div>
                                        {/* 삭제 버튼 */}
                                        <button
                                            onClick={() => handleRemoveImage(i)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {images.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-3 border-2 border-dashed border-slate-200 rounded-lg">
                                이미지를 추가하려면 위 버튼을 클릭하세요
                            </p>
                        )}
                    </div>

                    {/* 썸네일 & 요약 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">썸네일 이미지</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={thumbnailUrl}
                                    onChange={(e) => setThumbnailUrl(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                    placeholder="URL 입력 또는 파일 업로드"
                                />
                                <input
                                    type="file"
                                    ref={thumbnailInputRef}
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, true)}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => thumbnailInputRef.current?.click()}
                                    className="px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200"
                                >
                                    <Upload className="w-4 h-4" />
                                </button>
                            </div>
                            {/* 썸네일 미리보기 영역 */}
                            <div className="mt-2">
                                {thumbnailUrl ? (
                                    <div className="relative group">
                                        <a href={thumbnailUrl} target="_blank" rel="noopener noreferrer" className="block">
                                            <img
                                                src={thumbnailUrl}
                                                alt="썸네일"
                                                className="h-32 w-full object-cover rounded-lg border border-slate-200 hover:opacity-90 cursor-pointer"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x200/1e293b/ffffff?text=Image+Error';
                                                }}
                                            />
                                        </a>
                                        <button
                                            onClick={() => setThumbnailUrl('')}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                        <span className="text-[10px] text-slate-400 mt-1 block">클릭하면 원본 이미지 보기</span>
                                    </div>
                                ) : (
                                    <div className="h-32 w-full rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                                        <ImagePlus className="w-8 h-8 mb-2" />
                                        <span className="text-xs">썸네일 이미지 없음</span>
                                        <span className="text-[10px]">URL 입력 또는 파일 업로드</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">AI 요약</label>
                            <textarea
                                value={aiSummary}
                                onChange={(e) => setAiSummary(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none h-20 text-sm"
                                placeholder="기사 요약..."
                            />
                        </div>
                    </div>

                    {/* 원본 링크 & 출처 */}
                    <div className="text-sm text-slate-500 flex items-center gap-4">
                        <span>출처: <strong>{article.source}</strong></span>
                        <a href={article.original_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            원본 보기 →
                        </a>
                    </div>
                </div>

                {/* 푸터 */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-600 text-white hover:bg-slate-700 flex items-center gap-2"
                    >
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Save className="w-4 h-4" />
                        임시저장
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="px-6 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 shadow-md"
                    >
                        {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        🚀 송고하기
                    </button>
                </div>
            </div>

            {/* 발행 확인 모달 */}
            {showPublishConfirm && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">📤 기사 발행 확인</h3>
                        <p className="text-gray-600 mb-6">이 기사를 발행하시겠습니까?</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowPublishConfirm(false)}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                            >
                                취소
                            </button>
                            <button
                                onClick={executePublish}
                                className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-medium"
                            >
                                발행
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
