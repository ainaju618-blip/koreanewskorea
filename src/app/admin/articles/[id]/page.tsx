'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Edit, Trash2, Send, Clock, CheckCircle,
  Loader2, User, Calendar, Eye
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  category: string;
  source: string;
  status: 'draft' | 'published';
  thumbnail_url: string | null;
  view_count: number;
  created_at: string;
  published_at: string | null;
  reporters: {
    id: string;
    name: string;
    email: string;
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

export default function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/admin/articles/${id}`);
        const data = await res.json();
        if (res.ok) {
          setArticle(data.article);
        } else {
          alert('기사를 찾을 수 없습니다.');
          router.push('/admin/articles');
        }
      } catch (error) {
        console.error('Failed to fetch article:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id, router]);

  const handlePublish = async () => {
    if (!article) return;

    const newStatus = article.status === 'published' ? 'draft' : 'published';
    const confirmMessage = newStatus === 'published'
      ? '기사를 게시하시겠습니까?'
      : '기사를 비공개로 변경하시겠습니까?';

    if (!confirm(confirmMessage)) return;

    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          content: article.content,
          status: newStatus
        }),
      });

      if (res.ok) {
        setArticle((prev) => prev ? { ...prev, status: newStatus } : null);
        alert(newStatus === 'published' ? '게시되었습니다.' : '비공개로 변경되었습니다.');
      } else {
        alert('상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Publish error:', error);
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('삭제되었습니다.');
        router.push('/admin/articles');
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">기사를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/articles"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">기사 미리보기</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePublish}
            disabled={publishing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
              article.status === 'published'
                ? 'border border-gray-200 hover:bg-gray-50'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : article.status === 'published' ? (
              <>
                <Clock className="w-4 h-4" />
                비공개로 변경
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                게시하기
              </>
            )}
          </button>
          <Link
            href={`/admin/articles/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            수정
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            삭제
          </button>
        </div>
      </div>

      {/* 상태 배지 */}
      <div className="flex items-center gap-3 mb-6">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
          article.status === 'published'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {article.status === 'published' ? (
            <>
              <CheckCircle className="w-4 h-4" />
              게시됨
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              임시저장
            </>
          )}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          categoryLabels[article.category]?.color || 'bg-gray-100 text-gray-700'
        }`}>
          {categoryLabels[article.category]?.label || article.category}
        </span>
        <span className="flex items-center gap-1 text-sm text-gray-500">
          <Eye className="w-4 h-4" />
          {article.view_count} 조회
        </span>
      </div>

      {/* 기사 미리보기 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {article.thumbnail_url && (
          <div className="aspect-video relative">
            <Image
              src={article.thumbnail_url}
              alt={article.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="text-lg text-gray-600 mb-4">{article.subtitle}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {article.reporters?.name || '기자 미지정'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(article.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      </div>
    </div>
  );
}
