"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    Rss,
    Search,
    ExternalLink,
    Clock,
    CheckCircle,
    AlertCircle,
    Eye,
    Sparkles,
    RefreshCw,
    X,
    Trash2,
    Loader2
} from 'lucide-react';
import { PageHeader } from '@/components/admin/shared/PageHeader';
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

// 기사 상세 모달
function ArticleDetailModal({
    article,
    onClose,
    onProcess
}: {
    article: RawArticle | null;
    onClose: () => void;
    onProcess: () => void;
}) {
    if (!article) return null;

    const cleanContent = article.content ? stripHtml(article.content) : null;
    const cleanSummary = article.summary ? stripHtml(article.summary) : null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex-1 min-w-0 pr-4">
                        <span className="text-xs text-gray-500">{article.source_name}</span>
                        <h2 className="text-lg font-bold text-gray-900 mt-1 line-clamp-2">{article.title}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                        <X className="w-5 h-5" />
                    </button>
                </div>

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
                    {cleanSummary && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">요약</h4>
                            <p className="text-sm text-gray-600">{cleanSummary}</p>
                        </div>
                    )}

                    {/* 본문 */}
                    {cleanContent && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">본문 (원문)</h4>
                            <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg">
                                {cleanContent.substring(0, 3000)}
                                {cleanContent.length > 3000 && '...'}
                            </div>
                        </div>
                    )}

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

                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        닫기
                    </button>
                    {article.status === 'pending' && (
                        <button
                            onClick={onProcess}
                            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            AI 가공 시작
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function RawArticlesPage() {
    const { showSuccess, showError } = useToast();
    const { confirm } = useConfirm();
    const [articles, setArticles] = useState<RawArticle[]>([]);
    const [sources, setSources] = useState<AISource[]>([]);
    const [loading, setLoading] = useState(true);
    const [collecting, setCollecting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | RawArticle['status']>('all');
    const [filterSource, setFilterSource] = useState<string>('all');
    const [selectedArticle, setSelectedArticle] = useState<RawArticle | null>(null);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <PageHeader
                title="수집된 원문"
                description="해외 AI 뉴스 매체에서 수집한 원문 기사 목록"
                icon={Rss}
                iconBgColor="bg-purple-500"
                actions={
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
                }
            />

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
                                        <p className="font-medium text-gray-900 truncate">{article.title}</p>
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
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="상세 보기"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <a
                                            href={article.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="원문 보기"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
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

            {/* 상세 모달 */}
            <ArticleDetailModal
                article={selectedArticle}
                onClose={() => setSelectedArticle(null)}
                onProcess={() => selectedArticle && handleProcess(selectedArticle.id)}
            />
        </div>
    );
}
