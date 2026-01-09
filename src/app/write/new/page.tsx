'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    Save, Send, Eye, X, Upload, Loader2,
    ImageIcon, ArrowLeft, AlertCircle
} from 'lucide-react';

interface Reporter {
    id: string;
    name: string;
    email: string;
}

const categories = [
    { value: 'government', label: '나주시소식' },
    { value: 'council', label: '의회소식' },
    { value: 'education', label: '교육소식' },
    { value: 'fire', label: '소방서소식' },
    { value: 'business', label: '기업소식' },
    { value: 'opinion', label: '오피니언' },
];

export default function WriteNewPage() {
    const router = useRouter();
    const [reporters, setReporters] = useState<Reporter[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

    const [formData, setFormData] = useState({
        category: 'government',
        title: '',
        subtitle: '',
        content: '',
        reporter_id: '',
        thumbnail_url: '',
    });

    // 기자 목록 로드
    useEffect(() => {
        fetchReporters();
        loadDraft();
    }, []);

    // 자동 저장 (3초마다)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.title || formData.content) {
                saveDraft();
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [formData]);

    const fetchReporters = async () => {
        try {
            const res = await fetch('/api/admin/reporters');
            const data = await res.json();
            if (data.reporters) {
                setReporters(data.reporters);
                if (data.reporters.length > 0 && !formData.reporter_id) {
                    setFormData(prev => ({ ...prev, reporter_id: data.reporters[0].id }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch reporters:', error);
        }
    };

    const loadDraft = () => {
        try {
            const saved = localStorage.getItem('write_draft');
            if (saved) {
                const parsed = JSON.parse(saved);
                setFormData(prev => ({ ...prev, ...parsed }));
            }
        } catch (error) {
            console.error('Failed to load draft:', error);
        }
    };

    const saveDraft = useCallback(() => {
        try {
            setAutoSaveStatus('saving');
            localStorage.setItem('write_draft', JSON.stringify(formData));
            setAutoSaveStatus('saved');
        } catch (error) {
            console.error('Failed to save draft:', error);
            setAutoSaveStatus('error');
        }
    }, [formData]);

    const clearDraft = () => {
        localStorage.removeItem('write_draft');
    };

    // 이미지 업로드
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 파일 크기 체크 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('파일 크기는 10MB 이하여야 합니다.');
            return;
        }

        // 이미지 타입 체크
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (res.ok && data.url) {
                setFormData(prev => ({ ...prev, thumbnail_url: data.url }));
            } else {
                throw new Error(data.error || '업로드 실패');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('이미지 업로드에 실패했습니다.');
        } finally {
            setUploading(false);
        }
    };

    // 임시 저장
    const handleSaveDraft = async () => {
        if (!formData.title) {
            alert('제목을 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/admin/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    status: 'draft',
                }),
            });

            const data = await res.json();

            if (res.ok) {
                clearDraft();
                alert('임시 저장되었습니다.');
                router.push('/write');
            } else {
                throw new Error(data.error || '저장 실패');
            }
        } catch (error) {
            console.error('Save failed:', error);
            alert('저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 발행 요청
    const handlePublish = async () => {
        if (!formData.title) {
            alert('제목을 입력해주세요.');
            return;
        }
        if (!formData.content) {
            alert('본문을 입력해주세요.');
            return;
        }

        if (!confirm('기사를 발행하시겠습니까?')) return;

        setLoading(true);
        try {
            const res = await fetch('/api/admin/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    status: 'published',
                }),
            });

            const data = await res.json();

            if (res.ok) {
                clearDraft();
                alert('기사가 발행되었습니다.');
                router.push('/write');
            } else {
                throw new Error(data.error || '발행 실패');
            }
        } catch (error) {
            console.error('Publish failed:', error);
            alert('발행에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 본문을 HTML로 변환 (미리보기용)
    const contentToHtml = (text: string) => {
        return text
            .split('\n\n')
            .filter(p => p.trim())
            .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
            .join('');
    };

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">새 기사 작성</h1>
                        {autoSaveStatus === 'saved' && (
                            <p className="text-sm text-green-600 mt-1">자동 저장됨</p>
                        )}
                        {autoSaveStatus === 'saving' && (
                            <p className="text-sm text-gray-500 mt-1">저장 중...</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                        <Eye className="w-4 h-4" />
                        미리보기
                    </button>
                    <button
                        onClick={handleSaveDraft}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        임시저장
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition disabled:opacity-50 shadow-sm"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        발행하기
                    </button>
                </div>
            </div>

            {/* 폼 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 space-y-6">
                    {/* 카테고리 & 기자 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                카테고리 *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                기자
                            </label>
                            <select
                                value={formData.reporter_id}
                                onChange={(e) => setFormData({ ...formData, reporter_id: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">선택 안함</option>
                                {reporters.map((reporter) => (
                                    <option key={reporter.id} value={reporter.id}>
                                        {reporter.name} ({reporter.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 제목 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            제목 *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="기사 제목을 입력하세요"
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                        />
                    </div>

                    {/* 부제목 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            부제목
                        </label>
                        <input
                            type="text"
                            value={formData.subtitle}
                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                            placeholder="부제목을 입력하세요 (선택)"
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* 이미지 업로드 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            대표 이미지
                        </label>
                        {formData.thumbnail_url ? (
                            <div className="relative inline-block">
                                <Image
                                    src={formData.thumbnail_url}
                                    alt="대표 이미지"
                                    width={400}
                                    height={300}
                                    className="rounded-lg border border-gray-200 object-cover"
                                />
                                <button
                                    onClick={() => setFormData({ ...formData, thumbnail_url: '' })}
                                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                                {uploading ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                        <p className="mt-2 text-sm text-gray-500">업로드 중...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <ImageIcon className="w-12 h-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-500">클릭하여 이미지 업로드</p>
                                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF (최대 10MB)</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        )}
                    </div>

                    {/* 본문 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            본문 *
                        </label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="기사 본문을 입력하세요. 문단은 빈 줄로 구분됩니다."
                            rows={15}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                            * 빈 줄 (Enter 2번)로 문단을 구분합니다.
                        </p>
                    </div>
                </div>
            </div>

            {/* 미리보기 모달 */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">미리보기</h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <article className="prose prose-lg max-w-none">
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">
                                    {categories.find(c => c.value === formData.category)?.label}
                                </span>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    {formData.title || '(제목 없음)'}
                                </h1>
                                {formData.subtitle && (
                                    <p className="text-xl text-gray-600 mb-6">
                                        {formData.subtitle}
                                    </p>
                                )}
                                {formData.thumbnail_url && (
                                    <Image
                                        src={formData.thumbnail_url}
                                        alt="대표 이미지"
                                        width={800}
                                        height={450}
                                        className="w-full rounded-lg mb-6"
                                    />
                                )}
                                <div
                                    className="text-gray-700 leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                        __html: contentToHtml(formData.content) || '<p class="text-gray-400">(본문 없음)</p>'
                                    }}
                                />
                            </article>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
