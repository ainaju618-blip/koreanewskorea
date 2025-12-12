"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    PenSquare,
    Save,
    Send,
    ArrowLeft,
    Loader2,
    Image as ImageIcon,
    X,
} from "lucide-react";
import Link from "next/link";

interface Reporter {
    id: string;
    name: string;
    region: string;
}

export default function WriteArticlePage() {
    const router = useRouter();
    const [reporter, setReporter] = useState<Reporter | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("전남");
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchReporter = async () => {
            try {
                const res = await fetch("/api/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    setReporter(data.reporter);
                }
            } catch (err) {
                console.error("Failed to fetch reporter:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReporter();
    }, []);

    const handleSubmit = async (status: "draft" | "pending") => {
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
            const res = await fetch("/api/reporter/write", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    content,
                    category,
                    thumbnail_url: thumbnailUrl || null,
                    status,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "기사 작성에 실패했습니다.");
                return;
            }

            // 성공 시 기사 목록으로 이동
            router.push("/reporter/articles?filter=my-articles");
        } catch (err) {
            setError("서버 연결에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
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
                            <PenSquare className="w-7 h-7 text-blue-600" />
                            새 기사 작성
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {reporter?.region} 지역 기사를 작성합니다
                        </p>
                    </div>
                </div>
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

                {/* Category */}
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
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                        <strong>작성자:</strong> {reporter?.name} ({reporter?.region})
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        임시저장 후 나중에 수정하거나, 바로 승인요청을 할 수 있습니다.
                    </p>
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
                        onClick={() => handleSubmit("draft")}
                        disabled={isSaving}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        임시저장
                    </button>
                    <button
                        onClick={() => handleSubmit("pending")}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        승인요청
                    </button>
                </div>
            </div>
        </div>
    );
}
