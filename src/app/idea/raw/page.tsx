"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Rss,
    Search,
    ExternalLink,
    Clock,
    CheckCircle,
    AlertCircle,
    Sparkles,
    RefreshCw,
    X,
    Trash2,
    Loader2,
    Edit2,
    Save
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';

// 원문 기사 타입
interface RawArticle {
    id: string;
    source_code: string;
    source_name: string;
    source_url: string;
    url_hash: string;
    title: string;
    content?: string;
    summary?: string;
    author?: string;
    thumbnail_url?: string;
    published_at?: string;
    collected_at: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    error_message?: string;
}

interface AISource {
    code: string;
    name: string;
    type: 'rss' | 'scraping';
    feed_url?: string;
    enabled: boolean;
}

// 상태 배지
function StatusBadge({ status }: { status: RawArticle['status'] }) {
    const config = {
        pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: '대기' },
        processing: { color: 'bg-blue-100 text-blue-700', icon: RefreshCw, label: '처리중' },
        done: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: '완료' },
        error: { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: '오류' }
    };
    const { color, icon: Icon, label } = config[status];

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
            <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
            {label}
        </span>
    );
}

// HTML 태그 제거 함수
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
}

// 기사 상세 및 편집 모달
function ArticleDetailModal({
    article,
    onClose,
    onProcess,
    onSave
}: {
    article: RawArticle | null;
    onClose: () => void;
    onProcess: () => void;
    onSave: (updated: RawArticle) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedContent, setEditedContent] = useState('');
    const [editedSummary, setEditedSummary] = useState('');

    // 기사가 변경되면 편집 상태 초기화
    useEffect(() => {
        if (article) {
            setEditedTitle(article.title);
            setEditedContent(article.content ? stripHtml(article.content) : '');
            setEditedSummary(article.summary ? stripHtml(article.summary) : '');
            setIsEditing(false);
        }
    }, [article]);

    if (!article) return null;

    const cleanContent = article.content ? stripHtml(article.content) : null;
    const cleanSummary = article.summary ? stripHtml(article.summary) : null;

    const handleSave = () => {
        onSave({
            ...article,
            title: editedTitle,
            content: editedContent,
            summary: editedSummary
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedTitle(article.title);
        setEditedContent(cleanContent || '');
        setEditedSummary(cleanSummary || '');
        setIsEditing(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* 헤더 */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">{article.source_name}</span>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                    title="수정하기"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                className="w-full text-lg font-bold text-gray-900 border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        ) : (
                            <h2 className="text-lg font-bold text-gray-900 line-clamp-2">{article.title}</h2>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 본문 영역 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* 메타 정보 */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        {article.author && (
                            <span>작성자: {article.author}</span>
                        )}
                        {article.published_at && (
                            <span>발행: {new Date(article.published_at).toLocaleString('ko-KR')}</span>
                        )}
                        <span>수집: {new Date(article.collected_at).toLocaleString('ko-KR')}</span>
                    </div>

                    {/* 원문 링크 */}
                    <a
                        href={article.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                    >
                        원문 보기 <ExternalLink className="w-3 h-3" />
                    </a>

                    {/* 썸네일 */}
                    {article.thumbnail_url && (
                        <div className="rounded-lg overflow-hidden bg-gray-100">
                            <img
                                src={article.thumbnail_url}
                                alt=""
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    {/* 요약 */}
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                        <h4 className="text-sm font-medium text-amber-800 mb-2">요약</h4>
                        {isEditing ? (
                            <textarea
                                value={editedSummary}
                                onChange={(e) => setEditedSummary(e.target.value)}
                                placeholder="요약을 입력하세요..."
                                className="w-full text-sm text-gray-700 bg-white border border-amber-200 rounded-lg px-3 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        ) : (
                            <p className="text-sm text-gray-600">
                                {cleanSummary || <span className="text-gray-400 italic">요약 없음</span>}
                            </p>
                        )}
                    </div>

                    {/* 본문 */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">본문 (원문)</h4>
                        {isEditing ? (
                            <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                placeholder="본문을 입력하세요..."
                                className="w-full text-sm text-gray-700 bg-white border border-gray-300 rounded-lg px-3 py-2 min-h-[300px] focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        ) : (
                            <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg">
                                {cleanContent ? (
                                    <>
                                        {cleanContent.substring(0, 5000)}
                                        {cleanContent.length > 5000 && '...'}
                                    </>
                                ) : (
                                    <span className="text-gray-400 italic">본문 없음</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 상태 */}
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">처리 상태:</span>
                            <StatusBadge status={article.status} />
                        </div>
                        {article.error_message && (
                            <p className="text-sm text-red-600 mt-2">{article.error_message}</p>
                        )}
                    </div>
                </div>

                {/* 하단 버튼 */}
                <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
                    <div>
                        {isEditing && (
                            <span className="text-sm text-amber-600">편집 모드</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    저장
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    닫기
                                </button>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    수정
                                </button>
                                {article.status === 'pending' && (
                                    <button
                                        onClick={onProcess}
                                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        AI 가공
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function RawArticlesContent() {
    const { showSuccess, showError } = useToast();
    const { confirm } = useConfirm();
    const searchParams = useSearchParams();
    const urlSource = searchParams.get('source');

    const [articles, setArticles] = useState<RawArticle[]>([]);
    const [sources, setSources] = useState<AISource[]>([]);
    const [loading, setLoading] = useState(true);
    const [collecting, setCollecting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | RawArticle['status']>('all');
    const [filterSource, setFilterSource] = useState<string>(urlSource || 'all');
    const [selectedArticle, setSelectedArticle] = useState<RawArticle | null>(null);

    // URL 파라미터 변경 시 필터 업데이트
    useEffect(() => {
        setFilterSource(urlSource || 'all');
    }, [urlSource]);

    // 데이터 로드
    const loadArticles = useCallback(async () => {
        try {
            const res = await fetch('/api/idea/collect');
            const data = await res.json();
            if (data.success) {
                setArticles(data.articles || []);
                setSources(data.sources || []);
            }
        } catch (error) {
            console.error('Failed to load articles:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadArticles();
    }, [loadArticles]);

    // 새로 수집
    const handleCollect = async () => {
        setCollecting(true);
        try {
            const res = await fetch('/api/idea/collect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await res.json();

            if (data.success) {
                showSuccess(`${data.totalCollected}개의 새 기사를 수집했습니다.`);
                loadArticles();
            } else {
                showError(data.message || '수집 실패');
            }
        } catch (error) {
            console.error('Collect failed:', error);
            showError('수집 중 오류가 발생했습니다.');
        } finally {
            setCollecting(false);
        }
    };

    // 전체 삭제
    const handleClearAll = async () => {
        const confirmed = await confirm({ message: '모든 수집된 기사를 삭제하시겠습니까?' });
        if (!confirmed) return;

        try {
            await fetch('/api/idea/collect', { method: 'DELETE' });
            setArticles([]);
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    // 고유 소스 목록
    const uniqueSources = Array.from(new Set(articles.map(a => a.source_code)));

    // 필터링
    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || article.status === filterStatus;
        const matchesSource = filterSource === 'all' || article.source_code === filterSource;
        return matchesSearch && matchesStatus && matchesSource;
    });

    // 통계
    const stats = {
        total: articles.length,
        pending: articles.filter(a => a.status === 'pending').length,
        processing: articles.filter(a => a.status === 'processing').length,
        done: articles.filter(a => a.status === 'done').length,
        error: articles.filter(a => a.status === 'error').length
    };

    // AI 가공 시작
    const handleProcess = (id: string) => {
        setArticles(articles.map(a =>
            a.id === id ? { ...a, status: 'processing' as const } : a
        ));
        setSelectedArticle(null);

        // 실제로는 AI API 호출
        setTimeout(() => {
            setArticles(prev => prev.map(a =>
                a.id === id ? { ...a, status: 'done' as const } : a
            ));
        }, 2000);
    };

    // 기사 수정 저장
    const handleSaveArticle = (updated: RawArticle) => {
        setArticles(articles.map(a =>
            a.id === updated.id ? updated : a
        ));
        setSelectedArticle(updated);
        // TODO: API 호출로 서버에 저장
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    // 현재 선택된 수집처 이름
    const currentSourceName = filterSource === 'all'
        ? null
        : sources.find(s => s.code === filterSource)?.name || filterSource;

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                        <Rss className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            수집된 원문
                            {currentSourceName && (
                                <span className="ml-2 text-lg font-medium text-amber-600">
                                    - {currentSourceName}
                                </span>
                            )}
                        </h1>
                        <p className="text-gray-500">
                            {currentSourceName
                                ? `${currentSourceName}에서 수집한 기사 목록`
                                : '해외 AI 뉴스 매체에서 수집한 원문 기사 목록'
                            }
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {articles.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            전체 삭제
                        </button>
                    )}
                    <button
                        onClick={handleCollect}
                        disabled={collecting}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {collecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        {collecting ? '수집 중...' : '새로 수집'}
                    </button>
                </div>
            </div>

            {/* 활성 수집처 안내 */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>활성 수집처:</strong>{' '}
                    {sources.filter(s => s.enabled).map(s => s.name).join(', ') || '없음'}
                </p>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-5 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-500">전체</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                    <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                    <p className="text-xs text-yellow-600">대기</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-2xl font-bold text-blue-700">{stats.processing}</p>
                    <p className="text-xs text-blue-600">처리중</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                    <p className="text-2xl font-bold text-emerald-700">{stats.done}</p>
                    <p className="text-xs text-emerald-600">완료</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <p className="text-2xl font-bold text-red-700">{stats.error}</p>
                    <p className="text-xs text-red-600">오류</p>
                </div>
            </div>

            {/* 필터 */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="기사 제목 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                </div>
                <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                    <option value="all">모든 소스</option>
                    {uniqueSources.map(source => (
                        <option key={source} value={source}>{source}</option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | RawArticle['status'])}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                    <option value="all">모든 상태</option>
                    <option value="pending">대기</option>
                    <option value="processing">처리중</option>
                    <option value="done">완료</option>
                    <option value="error">오류</option>
                </select>
            </div>

            {/* 기사 목록 */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">기사</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">소스</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">발행일</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">상태</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">작업</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredArticles.map((article) => (
                            <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="max-w-lg">
                                        <a
                                            href={article.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-gray-900 truncate text-left hover:text-amber-600 hover:underline transition-colors cursor-pointer max-w-full block"
                                            title="원문 보기 (새 탭)"
                                        >
                                            {article.title}
                                        </a>
                                        {article.author && (
                                            <p className="text-xs text-gray-400 mt-0.5">by {article.author}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-sm text-gray-600">{article.source_name}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-sm text-gray-500">
                                        {article.published_at
                                            ? new Date(article.published_at).toLocaleDateString('ko-KR')
                                            : '-'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <StatusBadge status={article.status} />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => setSelectedArticle(article)}
                                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                            title="수정하기"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        {article.status === 'pending' && (
                                            <button
                                                onClick={() => handleProcess(article.id)}
                                                className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="AI 가공"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredArticles.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Rss className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>수집된 기사가 없습니다</p>
                        <button
                            onClick={handleCollect}
                            disabled={collecting}
                            className="mt-4 text-amber-600 hover:underline font-medium"
                        >
                            지금 수집하기
                        </button>
                    </div>
                )}
            </div>

            {/* 상세 및 편집 모달 */}
            <ArticleDetailModal
                article={selectedArticle}
                onClose={() => setSelectedArticle(null)}
                onProcess={() => selectedArticle && handleProcess(selectedArticle.id)}
                onSave={handleSaveArticle}
            />
        </div>
    );
}

// Next.js 15: useSearchParams는 Suspense로 감싸야 함
export default function RawArticlesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>}>
            <RawArticlesContent />
        </Suspense>
    );
}
