'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Filter, Edit, Trash2, Eye, Loader2,
  FileText, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  subtitle: string | null;
  category: string;
  status: 'draft' | 'published';
  created_at: string;
  published_at: string | null;
  thumbnail_url: string | null;
  reporters: {
    name: string;
    profile_image: string | null;
  } | null;
}

const categoryLabels: Record<string, { label: string; color: string }> = {
  government: { label: '나주시소식', color: 'bg-emerald-100 text-emerald-700' },
  council: { label: '의회소식', color: 'bg-blue-100 text-blue-700' },
  education: { label: '교육소식', color: 'bg-indigo-100 text-indigo-700' },
  fire: { label: '소방서소식', color: 'bg-red-100 text-red-700' },
  business: { label: '기업소식', color: 'bg-amber-100 text-amber-700' },
  opinion: { label: '오피니언', color: 'bg-purple-100 text-purple-700' },
};

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: statusFilter,
        category: categoryFilter,
      });

      const res = await fetch(`/api/admin/articles?${params}`);
      const data = await res.json();

      if (res.ok) {
        setArticles(data.articles);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, statusFilter, categoryFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
        setTotal((prev) => prev - 1);
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">기사 관리</h1>
          <p className="text-gray-500 mt-1">수동 작성한 기사를 관리합니다.</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          새 기사 작성
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 상태</option>
            <option value="published">게시됨</option>
            <option value="draft">임시저장</option>
          </select>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">전체 카테고리</option>
          {Object.entries(categoryLabels).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <div className="ml-auto text-sm text-gray-500">
          총 {total}개의 기사
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">작성된 기사가 없습니다.</p>
            <Link
              href="/admin/articles/new"
              className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:underline"
            >
              <Plus className="w-4 h-4" />
              새 기사 작성하기
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">제목</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">카테고리</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">기자</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">작성일</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="max-w-md">
                      <p className="font-medium text-gray-900 truncate">{article.title}</p>
                      {article.subtitle && (
                        <p className="text-sm text-gray-500 truncate">{article.subtitle}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${categoryLabels[article.category]?.color || 'bg-gray-100 text-gray-700'}`}>
                      {categoryLabels[article.category]?.label || article.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {article.reporters?.name || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {article.status === 'published' ? (
                      <span className="inline-flex items-center gap-1 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        게시됨
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        임시저장
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(article.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="미리보기"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="수정"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(article.id)}
                        disabled={deleting === article.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="삭제"
                      >
                        {deleting === article.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
