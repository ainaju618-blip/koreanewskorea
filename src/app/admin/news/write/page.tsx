'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Save, Send, Image as ImageIcon, ArrowLeft, Loader2 } from 'lucide-react';

// Dynamic import for TipTap editor (reduces initial bundle by ~400KB)
const NewsEditor = dynamic(() => import('@/components/admin/NewsEditor'), {
    ssr: false,
    loading: () => <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
});
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client'; // Client-side Supabase
import { useToast } from '@/components/ui/Toast';

// Mock Categories (To be replaced with DB data)
const CATEGORIES = [
    { id: 'naju', name: '나주' },
    { id: 'gwangju', name: '광주' },
    { id: 'jeonnam', name: '전남' },
    { id: 'edu', name: '교육' },
    { id: 'ai', name: 'AI/경제' },
    { id: 'opinion', name: '오피니언' },
];

export default function WriteNewsPage() {
    const router = useRouter();
    const { showSuccess, showError } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [category, setCategory] = useState('');
    const [isFocus, setIsFocus] = useState(false);
    const [content, setContent] = useState('');
    const [thumbnail, setThumbnail] = useState<string | null>(null);

    // 송고 확인 모달
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    const handleSaveDraft = async () => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('로그인이 필요합니다.');

            const { error } = await supabase.from('posts').insert({
                title,
                subtitle,
                category,
                content,
                is_focus: isFocus,
                status: 'draft',
                author_id: user.id,
                thumbnail_url: thumbnail,
                published_at: new Date().toISOString(), // 임시
            });

            if (error) throw error;

            showSuccess('임시 저장되었습니다.');
            router.push('/admin/my-articles');
        } catch (e: any) {
            console.error(e);
            showError('저장 중 오류가 발생했습니다: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 송고 모달 열기
    const handleSubmit = () => {
        if (!title || !content || !category) {
            showError('필수 항목을 모두 입력해주세요 (제목, 카테고리, 본문)');
            return;
        }
        setShowSubmitConfirm(true);
    };

    // 실제 송고 실행
    const executeSubmit = async () => {
        setShowSubmitConfirm(false);

        setIsLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('로그인이 필요합니다.');

            const { error } = await supabase.from('posts').insert({
                title,
                subtitle,
                category,
                content,
                is_focus: isFocus,
                status: 'draft',
                author_id: user.id,
                thumbnail_url: thumbnail,
                published_at: new Date().toISOString(),
            });

            if (error) throw error;

            showSuccess('기사가 송고되었습니다. 승인 대기 목록으로 이동합니다.');
            router.push('/admin/my-articles');
        } catch (e: any) {
            console.error(e);
            showError('송고 중 오류가 발생했습니다: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Top Action Bar */}
            <div className="flex items-center justify-between sticky top-0 z-20 bg-slate-50 py-4 -mt-4 border-b border-slate-200/60 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <Link href="/admin/news" className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h2 className="text-xl font-black text-slate-900">기사 작성</h2>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSaveDraft}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-bold text-sm transition-colors disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        임시저장
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm shadow-md shadow-blue-200 transition-all disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        기사 송고
                    </button>
                </div>
            </div>

            {/* Input Form */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-6">

                {/* Focus Option */}
                <div className="flex items-center gap-2 mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <input
                        type="checkbox"
                        id="isFocus"
                        checked={isFocus}
                        onChange={(e) => setIsFocus(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isFocus" className="font-bold text-slate-800 cursor-pointer">
                        [메인] 나주 Focus 섹션에 고정 노출 (상단 4개)
                    </label>
                </div>

                {/* 1. Category & Title */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">카테고리 <span className="text-red-500">*</span></label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full md:w-1/3 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                        >
                            <option value="">카테고리 선택</option>
                            {CATEGORIES.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">기사 제목 <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            className="w-full p-4 text-xl font-bold bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-300/80 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">부제목 (선택)</label>
                        <textarea
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            placeholder="부제목을 입력하세요 (선택사항, 줄바꿈 가능)"
                            rows={2}
                            className="w-full p-3 text-lg bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-300/80 transition-all resize-none"
                        />
                    </div>
                </div>

                {/* 2. Thumbnail Upload (Mock) */}
                <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg group hover:border-blue-400 transition-colors">
                    <div className="flex flex-col items-center justify-center py-4 cursor-pointer">
                        <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                            <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                        </div>
                        <p className="text-sm font-bold text-slate-500 group-hover:text-blue-600">대표 이미지 업로드</p>
                        <p className="text-xs text-slate-400 mt-1">클릭하여 이미지를 선택하거나 이곳에 드래그하세요</p>
                    </div>
                </div>

                {/* 3. Editor */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">기사 본문 <span className="text-red-500">*</span></label>
                    <NewsEditor content={content} onChange={setContent} />
                </div>
            </div>

            {/* 송고 확인 모달 */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">📤 기사 송고</h3>
                        <p className="text-gray-600 mb-6">데스크에 승인 요청(송고) 하시겠습니까?</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowSubmitConfirm(false)}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                            >
                                취소
                            </button>
                            <button
                                onClick={executeSubmit}
                                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium"
                            >
                                송고
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
