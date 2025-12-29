"use client";

import { useState } from 'react';
import {
    FileSearch,
    Search,
    Clock,
    CheckCircle,
    Edit2,
    Send
} from 'lucide-react';

// 가공된 기사 타입
interface ProcessedArticle {
    id: string;
    original_id: string;
    original_title: string;
    source_name: string;
    source_url: string;
    processed_title: string;
    processed_content: string;
    processed_summary: string;
    keywords: string[];
    category_suggestion: string;
    status: 'draft' | 'review' | 'approved' | 'published';
    processed_at: string;
    published_at?: string;
}

// 상태 배지
function StatusBadge({ status }: { status: ProcessedArticle['status'] }) {
    const config = {
        draft: { color: 'bg-gray-100 text-gray-700', label: '초안' },
        review: { color: 'bg-yellow-100 text-yellow-700', label: '검토중' },
        approved: { color: 'bg-blue-100 text-blue-700', label: '승인됨' },
        published: { color: 'bg-emerald-100 text-emerald-700', label: '발행됨' }
    };
    const { color, label } = config[status];

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
            {status === 'published' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {label}
        </span>
    );
}

export default function ProcessedArticlesPage() {
    const [articles] = useState<ProcessedArticle[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | ProcessedArticle['status']>('all');

    // 필터링
    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.processed_title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || article.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // 통계
    const stats = {
        total: articles.length,
        draft: articles.filter(a => a.status === 'draft').length,
        review: articles.filter(a => a.status === 'review').length,
        approved: articles.filter(a => a.status === 'approved').length,
        published: articles.filter(a => a.status === 'published').length
    };

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <FileSearch className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">가공된 기사</h1>
                        <p className="text-gray-500">AI로 재구성된 기사를 검토하고 발행합니다</p>
                    </div>
                </div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-5 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-500">전체</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-2xl font-bold text-gray-700">{stats.draft}</p>
                    <p className="text-xs text-gray-500">초안</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                    <p className="text-2xl font-bold text-yellow-700">{stats.review}</p>
                    <p className="text-xs text-yellow-600">검토중</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-2xl font-bold text-blue-700">{stats.approved}</p>
                    <p className="text-xs text-blue-600">승인됨</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                    <p className="text-2xl font-bold text-emerald-700">{stats.published}</p>
                    <p className="text-xs text-emerald-600">발행됨</p>
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
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | ProcessedArticle['status'])}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                    <option value="all">모든 상태</option>
                    <option value="draft">초안</option>
                    <option value="review">검토중</option>
                    <option value="approved">승인됨</option>
                    <option value="published">발행됨</option>
                </select>
            </div>

            {/* 기사 목록 */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {filteredArticles.length > 0 ? (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">기사</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">원본 소스</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">카테고리</th>
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
                                                className="font-medium text-gray-900 truncate hover:text-amber-600 hover:underline transition-colors block"
                                                title="원문 보기 (새 탭)"
                                            >
                                                {article.processed_title}
                                            </a>
                                            <p className="text-xs text-gray-400 mt-0.5 truncate">{article.processed_summary}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-gray-600">{article.source_name}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-gray-600">{article.category_suggestion}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={article.status} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="수정"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            {article.status === 'approved' && (
                                                <button
                                                    className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="발행"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-16 text-gray-500">
                        <FileSearch className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">가공된 기사가 없습니다</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            수집된 원문에서 AI 가공을 실행하면 여기에 표시됩니다.
                        </p>
                        <a
                            href="/idea/raw"
                            className="inline-flex items-center gap-2 text-amber-600 hover:underline font-medium"
                        >
                            수집된 원문 보기 →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
