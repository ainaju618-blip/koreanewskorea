"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    Edit,
    Save,
    Send,
    ArrowLeft,
    Loader2,
    Image as ImageIcon,
    X,
    CheckCircle,
    Clock,
    FileText,
    XCircle,
    Eye,
} from "lucide-react";
import Link from "next/link";

interface Article {
    id: string;
    title: string;
    content: string;
    category: string;
    source: string;
    thumbnail_url: string | null;
    status: string;
    published_at: string;
    author_id: string | null;
}

interface Reporter {
    id: string;
    region: string;
    access_level: number;
}

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [article, setArticle] = useState<Article | null>(null);
    const [reporter, setReporter] = useState<Reporter | null>(null);
    const [canEdit, setCanEdit] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("");
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const res = await fetch(`/api/reporter/articles/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setArticle(data.article);
                    setReporter(data.reporter);
                    setCanEdit(data.canEdit);

                    // 폼 초기화
                    setTitle(data.article.title);
                    setContent(data.article.content);
                    setCategory(data.article.category);
                    setThumbnailUrl(data.article.thumbnail_url || "");
                    setStatus(data.article.status);
                } else {
                    const data = await res.json();
                    setError(data.message || "기사를 불러올 수 없습니다.");
                }
            } catch (err) {
                console.error("Failed to fetch article:", err);
                setError("서버 연결에 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchArticle();
    }, [id]);

    const handleSave = async (newStatus?: string) => {
        if (!title.trim()) {
            setError("제목을 입력해주세요.");
            return;
        }
        if (!content.trim()) {
            setError("내용을 입력해주세요.");
            return;
        }

        setError("");
        setIsSaving(true);

        try {
            const res = await fetch(`/api/reporter/articles/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    content,
                    category,
                    thumbnail_url: thumbnailUrl || null,
                    status: newStatus || status,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "기사 수정에 실패했습니다.");
                return;
            }

            // 성공 시 기사 목록으로 이동
            router.push("/reporter/articles");
        } catch (err) {
            setError("서버 연결에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusBadge = (statusValue: string) => {
        switch (statusValue) {
            case "published":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-sm rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        게시됨
                    </span>
                );
            case "pending":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-lg">
                        <Clock className="w-4 h-4" />
                        승인대기
                    </span>
                );
            case "draft":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-lg">
                        <FileText className="w-4 h-4" />
                        임시저장
                    </span>
                );
            case "rejected":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-sm rounded-lg">
                        <XCircle className="w-4 h-4" />
                        반려
                    </span>
                );
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
            </div>
        );
    }

    if (error && !article) {
        return (
            <div className="space-y-6">
                <Link
                    href="/reporter/articles"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-4 h-4" />
                    기사 목록으로
                </Link>
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4">
                    {error}
                </div>
            </div>
        );
    }

    if (!canEdit) {
        return (
            <div className="space-y-6">
                <Link
                    href="/reporter/articles"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-4 h-4" />
                    기사 목록으로
                </Link>
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg p-4">
                    이 기사에 대한 편집 권한이 없습니다.
                </div>
                {article && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">{article.title}</h1>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-sm text-gray-500">{article.source}</span>
                            {getStatusBadge(article.status)}
                        </div>
                        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                            {article.content}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/reporter/articles"
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Edit className="w-7 h-7 text-blue-600" />
                            기사 편집
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-500">{article?.source}</span>
                            {getStatusBadge(status)}
                        </div>
                    </div>
                </div>
                <Link
                    href={`/news/${id}`}
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                    <Eye className="w-4 h-4" />
                    미리보기
                </Link>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                    {error}
                </div>
            )}

            {/* Form */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="기사 제목을 입력하세요"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        disabled={isSaving}
                    />
                </div>

                {/* Category & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            카테고리
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            disabled={isSaving}
                        >
                            <option value="전남">전남</option>
                            <option value="광주">광주</option>
                            <option value="사회">사회</option>
                            <option value="경제">경제</option>
                            <option value="문화">문화</option>
                            <option value="스포츠">스포츠</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            상태
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            disabled={isSaving}
                        >
                            <option value="draft">임시저장</option>
                            <option value="pending">승인대기</option>
                            <option value="published">게시됨</option>
                            <option value="rejected">반려</option>
                        </select>
                    </div>
                </div>

                {/* Thumbnail URL */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        썸네일 이미지 URL
                    </label>
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="url"
                                value={thumbnailUrl}
                                onChange={(e) => setThumbnailUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                disabled={isSaving}
                            />
                        </div>
                        {thumbnailUrl && (
                            <button
                                type="button"
                                onClick={() => setThumbnailUrl("")}
                                className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    {thumbnailUrl && (
                        <div className="mt-2">
                            <img
                                src={thumbnailUrl}
                                alt="썸네일 미리보기"
                                className="h-32 object-cover rounded-lg"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        내용 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="기사 내용을 입력하세요..."
                        rows={15}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-y"
                        disabled={isSaving}
                    />
                    <p className="text-sm text-gray-400 mt-1 text-right">
                        {content.length.toLocaleString()}자
                    </p>
                </div>

                {/* Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                    <p><strong>지역:</strong> {article?.source}</p>
                    <p className="mt-1"><strong>게시일:</strong> {article?.published_at ? new Date(article.published_at).toLocaleString("ko-KR") : "-"}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <Link
                        href="/reporter/articles"
                        className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                        취소
                    </Link>
                    <button
                        onClick={() => handleSave()}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
}
