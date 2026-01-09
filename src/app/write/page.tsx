'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus, Search, Filter, Eye, Edit2, Trash2,
    Calendar, User, Tag, Loader2, AlertCircle,
    CheckCircle, Clock, FileText
} from 'lucide-react';

interface Article {
    id: string;
    title: string;
    category: string;
    status: string;
    reporter_name: string;
    created_at: string;
    view_count: number;
}

const categoryLabels: Record<string, string> = {
    'government': '나주시소식',
    'council': '의회소식',
    'education': '교육소식',
    'fire': '소방서소식',
    'business': '기업소식',
    'opinion': '오피니언',
};

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
    'draft': { label: '임시저장', color: 'bg-gray-100 text-gray-600', icon: Clock },
    'pending': { label: '검토대기', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
    'published': { label: '게시됨', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

export default function WriteListPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');

    useEffect(() => {
        fetchArticles();
    }, [statusFilter, categoryFilter]);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (categoryFilter !== 'all') params.append('category', categoryFilter);

            const res = await fetch(`/api/admin/articles?${params}`);
            const data = await res.json();

            if (data.articles) {
                setArticles(data.articles);
            }
        } catch (error) {
            console.error('Failed to fetch articles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('이 기사를 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/admin/articles/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setArticles(articles.filter(a => a.id !== id));
            } else {
                alert('삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    const filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Seoul'
        });
    };

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">내 기사 목록</h1>
                    <p className="text-gray-500 mt-1">작성한 기사를 관리하세요</p>
                </div>
                <Link
                    href="/write/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    새 기사 작성
                </Link>
            </div>

            {/* 필터 & 검색 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* 검색 */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="제목으로 검색..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* 상태 필터 */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="all">모든 상태</option>
                            <option value="draft">임시저장</option>
                            <option value="pending">검토대기</option>
                            <option value="published">게시됨</option>
                        </select>
                    </div>

                    {/* 카테고리 필터 */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">모든 카테고리</option>
                        {Object.entries(categoryLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 기사 목록 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <FileText className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-lg font-medium">등록된 기사가 없습니다</p>
                        <p className="text-sm mt-1">새 기사를 작성해보세요</p>
                        <Link
                            href="/write/new"
                            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                        >
                            <Plus className="w-5 h-5" />
                            새 기사 작성
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredArticles.map((article) => {
                            const status = statusLabels[article.status] || statusLabels['draft'];
                            const StatusIcon = status.icon;

                            return (
                                <div
                                    key={article.id}
                                    className="p-5 hover:bg-gray-50 transition group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {status.label}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                                                    <Tag className="w-3.5 h-3.5" />
                                                    {categoryLabels[article.category] || article.category}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                                                {article.title || '(제목 없음)'}
                                            </h3>

                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1.5">
                                                    <User className="w-4 h-4" />
                                                    {article.reporter_name || '미지정'}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(article.created_at)}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Eye className="w-4 h-4" />
                                                    {article.view_count || 0}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                            <Link
                                                href={`/write/${article.id}`}
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="보기"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>
                                            <Link
                                                href={`/write/${article.id}/edit`}
                                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                                                title="수정"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(article.id)}
                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="삭제"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
