'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase-client';
import { Save, Send, Trash2, ArrowLeft, CheckCircle, XCircle, Globe } from 'lucide-react';

// Dynamic import for TipTap editor (reduces initial bundle by ~400KB)
const NewsEditor = dynamic(() => import('@/components/admin/NewsEditor'), {
    ssr: false,
    loading: () => <div className="h-64 bg-[#21262d] rounded-lg animate-pulse" />
});
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

export default function EditNewsPage() {
    const params = useParams(); // params is a Promise in Next.js 15+, but in 13/14 it's direct. Assuming standard behavior or unwrapping.
    const router = useRouter();
    const id = params?.id as string;
    const { showSuccess, showError } = useToast();

    // In Next.js 15, params is generic and might need `use` or await.
    // For safety in this prompt environment, let's treat it as directly accessible or handle the async nature if needed.
    // If id is undefined initially, we wait.

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [article, setArticle] = useState<any>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [content, setContent] = useState('');

    // 확인 모달 상태
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: 'save' | 'delete' | null; newStatus?: string }>({ isOpen: false, type: null });

    useEffect(() => {
        const fetchArticle = async (articleId: string) => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('id', articleId)
                .single();

            if (error) {
                showError('기사를 불러오지 못했습니다.');
                router.push('/admin/news');
                return;
            }

            setArticle(data);
            setTitle(data.title);
            setCategory(data.category || '');
            setContent(data.content || '');
            setIsLoading(false);
        };

        if (id) fetchArticle(id);
    }, [id, router]);

    // 저장 모달 열기
    const handleUpdate = (newStatus?: string) => {
        setConfirmModal({ isOpen: true, type: 'save', newStatus });
    };

    // 실제 저장 실행
    const executeUpdate = async () => {
        const newStatus = confirmModal.newStatus;
        setConfirmModal({ isOpen: false, type: null });
        setIsSaving(true);
        const supabase = createClient();

        const updates: any = {
            title,
            category,
            content,
            updated_at: new Date().toISOString(),
        };

        if (newStatus) {
            updates.status = newStatus;
            if (newStatus === 'published') {
                updates.published_at = new Date().toISOString();
            }
        }

        const { error } = await supabase
            .from('posts')
            .update(updates)
            .eq('id', id);

        if (error) {
            showError('저장 실패: ' + error.message);
        } else {
            showSuccess(newStatus === 'published' ? '기사가 발행되었습니다.' : '저장되었습니다.');
            if (newStatus === 'published') router.push('/admin/news');
        }
        setIsSaving(false);
    };

    // 삭제 모달 열기
    const handleDelete = () => {
        setConfirmModal({ isOpen: true, type: 'delete' });
    };

    // 실제 삭제 실행
    const executeDelete = async () => {
        setConfirmModal({ isOpen: false, type: null });
        setIsSaving(true);
        const supabase = createClient();
        const { error } = await supabase.from('posts').delete().eq('id', id);

        if (error) showError('삭제 실패: ' + error.message);
        else {
            showSuccess('삭제되었습니다.');
            router.push('/admin/news');
        }
        setIsSaving(false);
    };

    if (isLoading) return <div className="p-20 text-center">로딩 중...</div>;

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 z-20 bg-[#161b22] py-4 -mt-4 border-b border-[#30363d]/60 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <Link href="/admin/news" className="p-2 hover:bg-[#21262d] rounded-full text-[#8b949e]">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-[#6e7681] uppercase">기사 수정 및 검수</span>
                            {/* Status Badge */}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${article.status === 'published' ? 'bg-green-900/50 text-green-400' :
                                article.status === 'review' ? 'bg-amber-900/50 text-amber-400' :
                                    'bg-[#21262d] text-[#8b949e]'
                                }`}>
                                {article.status}
                            </span>
                        </div>
                        <h2 className="text-xl font-black text-[#e6edf3] truncate max-w-md">{title}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={handleDelete} disabled={isSaving} className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors" title="삭제">
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="h-8 w-px bg-[#30363d] mx-2"></div>
                    <button onClick={() => handleUpdate()} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded-lg hover:bg-[#21262d] font-bold text-sm">
                        <Save className="w-4 h-4" /> 저장
                    </button>

                    {/* Admin Actions */}
                    <button onClick={() => handleUpdate('rejected')} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-bold text-sm">
                        <XCircle className="w-4 h-4" /> 반려
                    </button>
                    <button onClick={() => handleUpdate('published')} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm shadow-md shadow-blue-200">
                        <Globe className="w-4 h-4" /> 승인 및 발행
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Editor (Left) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#161b22] p-6 rounded-xl border border-[#30363d] shadow-sm space-y-4">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-2xl font-black text-[#e6edf3] placeholder:text-[#6e7681] outline-none bg-transparent"
                            placeholder="기사 제목"
                        />
                        <NewsEditor content={content} onChange={setContent} />
                    </div>
                </div>

                {/* Sidebar (Right) - Metadata */}
                <div className="space-y-6">
                    <div className="bg-[#161b22] p-6 rounded-xl border border-[#30363d] shadow-sm space-y-6">
                        <h3 className="font-bold text-[#e6edf3] border-b border-[#21262d] pb-2">메타데이터 설정</h3>

                        <div>
                            <label className="block text-xs font-bold text-[#8b949e] mb-1">카테고리</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full p-2 bg-[#21262d] border border-[#30363d] rounded-lg text-sm font-medium text-[#c9d1d9]"
                            >
                                <option value="나주">나주</option>
                                <option value="광주">광주</option>
                                <option value="전남">전남</option>
                                <option value="교육">교육</option>
                                <option value="AI">AI/경제</option>
                                <option value="오피니언">오피니언</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8b949e] mb-1">썸네일 URL</label>
                            <input
                                type="text"
                                disabled
                                value={article.thumbnail_url || ''}
                                className="w-full p-2 bg-[#21262d] border border-[#30363d] rounded-lg text-xs text-[#8b949e] truncate"
                            />
                            {article.thumbnail_url && (
                                <div className="mt-2 rounded-lg overflow-hidden border border-[#30363d] aspect-video">
                                    <img src={article.thumbnail_url} className="w-full h-full object-cover" alt="thumbnail" />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8b949e] mb-1">AI 요약 (자동생성)</label>
                            <textarea
                                rows={4}
                                className="w-full p-2 bg-[#21262d] border border-[#30363d] rounded-lg text-sm resize-none text-[#c9d1d9]"
                                defaultValue={article.ai_summary}
                                placeholder="AI 요약이 여기 표시됩니다."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 확인 모달 */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-[#161b22] rounded-xl shadow-2xl w-full max-w-md p-6 mx-4 border border-[#30363d]">
                        <h3 className="text-lg font-bold text-[#e6edf3] mb-2">
                            {confirmModal.type === 'save' ? '저장 확인' : '삭제 확인'}
                        </h3>
                        <p className="text-[#c9d1d9] mb-6">
                            {confirmModal.type === 'save'
                                ? '변경 사항을 저장하시겠습니까?'
                                : '정말로 이 기사를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setConfirmModal({ isOpen: false, type: null })}
                                className="px-4 py-2 text-[#c9d1d9] bg-[#21262d] rounded-lg hover:bg-[#30363d] font-medium"
                            >
                                취소
                            </button>
                            <button
                                onClick={confirmModal.type === 'save' ? executeUpdate : executeDelete}
                                className={`px-4 py-2 text-white rounded-lg font-medium ${confirmModal.type === 'save' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                {confirmModal.type === 'save' ? '저장' : '삭제'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
