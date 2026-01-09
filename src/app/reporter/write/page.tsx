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
    Upload,
    Link as LinkIcon,
    Eye,
    Zap,
} from "lucide-react";
import Link from "next/link";
// ⚠️ DB에서 카테고리를 가져오되, fallback으로 하드코딩 사용
import { getCategoriesForRegion } from "@/components/author/ReporterAuthSection";

interface Reporter {
    id: string;
    name: string;
    region: string;
}

interface DBCategory {
    id: string;
    name: string;
    slug: string;
    depth: number;
    parent_id: string | null;
    children?: DBCategory[];
}

export default function WriteArticlePage() {
    const router = useRouter();
    const [reporter, setReporter] = useState<Reporter | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("");
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // 모달 상태
    const [showPreview, setShowPreview] = useState(false);
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);

    // DB에서 가져온 카테고리 목록 (메인 네비게이션과 동기화)
    const [dbCategories, setDbCategories] = useState<string[]>([]);

    // DB 카테고리 우선, fallback으로 하드코딩 사용
    const categories = dbCategories.length > 0
        ? dbCategories
        : (reporter ? getCategoriesForRegion(reporter.region) : []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 기자 정보와 카테고리를 병렬로 가져오기
                const [meRes, catRes] = await Promise.all([
                    fetch("/api/auth/me"),
                    fetch("/api/categories?gnb=true")
                ]);

                // 기자 정보 처리
                if (meRes.ok) {
                    const meData = await meRes.json();
                    setReporter(meData.reporter);
                }

                // DB 카테고리 처리 - 메인 네비게이션과 동일한 소스
                if (catRes.ok) {
                    const catData = await catRes.json();
                    const categoryNames = extractCategoryNames(catData.categories || []);
                    setDbCategories(categoryNames);

                    // 첫 번째 카테고리를 기본값으로 설정
                    if (categoryNames.length > 0) {
                        setCategory(categoryNames[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
                // fallback: 하드코딩된 카테고리 사용
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // DB 카테고리 트리에서 이름만 추출 (1depth + 2depth 서브카테고리)
    const extractCategoryNames = (categories: DBCategory[]): string[] => {
        const names: string[] = [];

        categories.forEach(cat => {
            // 1depth 카테고리 이름 추가
            names.push(cat.name);

            // 2depth 서브카테고리가 있으면 추가
            if (cat.children && cat.children.length > 0) {
                cat.children.forEach(child => {
                    names.push(child.name);
                });
            }
        });

        // 중복 제거
        return [...new Set(names)];
    };

    // 이미지 업로드 핸들러
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 파일 크기 체크 (4.5MB)
        if (file.size > 4.5 * 1024 * 1024) {
            setError("이미지 크기는 4.5MB 이하여야 합니다.");
            return;
        }

        // 파일 타입 체크
        if (!file.type.startsWith("image/")) {
            setError("이미지 파일만 업로드할 수 있습니다.");
            return;
        }

        setIsUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", "articles");

            const res = await fetch("/api/upload/image", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "이미지 업로드에 실패했습니다.");
                return;
            }

            setThumbnailUrl(data.url);
        } catch (err) {
            setError("이미지 업로드 중 오류가 발생했습니다.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (status: "draft" | "pending" | "published") => {
        if (!title.trim()) {
            setError("제목을 입력해주세요.");
            return;
        }
        if (!content.trim()) {
            setError("내용을 입력해주세요.");
            return;
        }

        setError("");
        setSuccessMessage("");
        setIsSaving(true);
        setShowPublishConfirm(false);

        try {
            const res = await fetch("/api/reporter/write", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    subtitle: subtitle || null,
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

            // 성공 메시지
            const messages = {
                draft: "임시저장 되었습니다.",
                pending: "승인요청이 완료되었습니다.",
                published: "기사가 발행되었습니다!"
            };
            setSuccessMessage(messages[status]);

            // 발행 성공 시 기사 관리 페이지로 이동
            setTimeout(() => {
                router.push("/reporter/articles");
            }, 1500);
        } catch (err) {
            console.error("Write error:", err);
            setError(err instanceof Error ? err.message : "서버 연결에 실패했습니다.");
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

            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-600 text-sm rounded-lg p-3">
                    {successMessage}
                </div>
            )}

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

                {/* Subtitle */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        부제목
                    </label>
                    <input
                        type="text"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="부제목을 입력하세요 (선택)"
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
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        대표 이미지
                    </label>

                    {/* 이미지 미리보기 */}
                    {thumbnailUrl && (
                        <div className="relative inline-block mb-3">
                            <img
                                src={thumbnailUrl}
                                alt="썸네일 미리보기"
                                className="h-40 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setThumbnailUrl("")}
                                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-md"
                                disabled={isSaving}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* 파일 업로드 + URL 입력 */}
                    <div className="flex gap-3 items-start">
                        <label className={`flex flex-col items-center justify-center w-32 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition flex-shrink-0 ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={isSaving || isUploading}
                            />
                            {isUploading ? (
                                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                            ) : (
                                <>
                                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                    <span className="text-xs text-gray-500">파일 선택</span>
                                </>
                            )}
                        </label>

                        {/* URL 입력 */}
                        <div className="flex-1">
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="url"
                                    value={thumbnailUrl}
                                    onChange={(e) => setThumbnailUrl(e.target.value)}
                                    placeholder="또는 이미지 URL 입력"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                                    disabled={isSaving || isUploading}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">파일 업로드 또는 URL 직접 입력</p>
                        </div>
                    </div>
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
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
                    {/* 왼쪽: 미리보기 */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowPreview(true)}
                            disabled={isSaving || !title.trim()}
                            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            미리보기
                        </button>
                    </div>

                    {/* 오른쪽: 액션 버튼들 */}
                    <div className="flex items-center gap-2">
                        <Link
                            href="/reporter/articles"
                            className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                            취소
                        </Link>
                        <button
                            onClick={() => handleSubmit("draft")}
                            disabled={isSaving}
                            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
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
                            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            승인요청
                        </button>
                        <button
                            onClick={() => setShowPublishConfirm(true)}
                            disabled={isSaving}
                            className="px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Zap className="w-4 h-4" />
                            )}
                            승인없이 기사게시
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-blue-600" />
                                미리보기
                            </h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {thumbnailUrl && (
                                <img
                                    src={thumbnailUrl}
                                    alt="썸네일"
                                    className="w-full h-64 object-cover rounded-lg mb-4"
                                />
                            )}
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded mb-3">
                                {category}
                            </span>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                {title || "제목 없음"}
                            </h1>
                            {subtitle && (
                                <p className="text-lg text-gray-600 mb-4">{subtitle}</p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 pb-4 border-b">
                                <span>{reporter?.name} 기자</span>
                                <span>·</span>
                                <span>{new Date().toLocaleDateString("ko-KR")}</span>
                            </div>
                            <div className="prose prose-gray max-w-none whitespace-pre-wrap">
                                {content || "내용 없음"}
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="w-full py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Publish Confirmation Modal */}
            {showPublishConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-8 h-8 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                정말로 발행하시겠습니까?
                            </h3>
                            <p className="text-gray-500 mb-6">
                                승인 없이 바로 기사가 게시됩니다.<br />
                                발행 후에는 홈페이지에 즉시 노출됩니다.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPublishConfirm(false)}
                                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                    disabled={isSaving}
                                >
                                    취소
                                </button>
                                <button
                                    onClick={() => handleSubmit("published")}
                                    className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium flex items-center justify-center gap-2"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Zap className="w-4 h-4" />
                                    )}
                                    발행하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
