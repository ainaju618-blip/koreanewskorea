"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Loader2,
    X,
    Upload,
    Link as LinkIcon,
    Eye,
    Zap,
    Save,
    Send,
    Bold,
    Italic,
    Link2,
    Image as ImageIcon,
    List,
    CheckCircle,
    Info,
    Megaphone,
} from "lucide-react";
import Link from "next/link";
import { getCategoriesForRegion } from "@/components/author/ReporterAuthSection";

interface Reporter {
    id: string;
    name: string;
    region: string;
    position?: string;
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
    const [tags, setTags] = useState("");
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [imageCaption, setImageCaption] = useState("");
    const [isBreakingNews, setIsBreakingNews] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // 자동 저장 상태
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved">("unsaved");

    // 모달 상태
    const [showPreview, setShowPreview] = useState(false);
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);

    // DB에서 가져온 카테고리 목록
    const [dbCategories, setDbCategories] = useState<string[]>([]);

    const categories = dbCategories.length > 0
        ? dbCategories
        : (reporter ? getCategoriesForRegion(reporter.region) : []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [meRes, catRes] = await Promise.all([
                    fetch("/api/auth/me"),
                    fetch("/api/categories?gnb=true")
                ]);

                if (meRes.ok) {
                    const meData = await meRes.json();
                    setReporter(meData.reporter);
                }

                if (catRes.ok) {
                    const catData = await catRes.json();
                    const categoryNames = extractCategoryNames(catData.categories || []);
                    setDbCategories(categoryNames);

                    if (categoryNames.length > 0) {
                        setCategory(categoryNames[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const extractCategoryNames = (categories: DBCategory[]): string[] => {
        const names: string[] = [];
        categories.forEach(cat => {
            names.push(cat.name);
            if (cat.children && cat.children.length > 0) {
                cat.children.forEach(child => {
                    names.push(child.name);
                });
            }
        });
        return [...new Set(names)];
    };

    // 자동 저장 (디바운스)
    const autoSave = useCallback(async () => {
        if (!title.trim() || isSaving) return;

        setAutoSaveStatus("saving");
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
                    image_caption: imageCaption || null,
                    tags: tags || null,
                    is_breaking: isBreakingNews,
                    status: "draft",
                }),
            });

            if (res.ok) {
                setLastSaved(new Date());
                setAutoSaveStatus("saved");
            }
        } catch {
            setAutoSaveStatus("unsaved");
        }
    }, [title, subtitle, content, category, thumbnailUrl, imageCaption, tags, isBreakingNews, isSaving]);

    // 자동 저장 타이머
    useEffect(() => {
        if (!title.trim()) return;

        setAutoSaveStatus("unsaved");
        const timer = setTimeout(() => {
            autoSave();
        }, 30000); // 30초마다 자동 저장

        return () => clearTimeout(timer);
    }, [title, subtitle, content, category, thumbnailUrl, autoSave]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 4.5 * 1024 * 1024) {
            setError("이미지 크기는 4.5MB 이하여야 합니다.");
            return;
        }

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
        } catch {
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
                    image_caption: imageCaption || null,
                    tags: tags || null,
                    is_breaking: isBreakingNews,
                    status,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "기사 작성에 실패했습니다.");
                return;
            }

            const messages = {
                draft: "임시저장 되었습니다.",
                pending: "승인요청이 완료되었습니다.",
                published: "기사가 발행되었습니다!"
            };
            setSuccessMessage(messages[status]);

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

    // 서식 버튼 핸들러 (간단한 래핑)
    const insertFormat = (format: string) => {
        const textarea = document.getElementById("content-editor") as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);

        let newText = "";
        switch (format) {
            case "bold":
                newText = `**${selectedText}**`;
                break;
            case "italic":
                newText = `*${selectedText}*`;
                break;
            case "link":
                newText = `[${selectedText}](url)`;
                break;
            case "list":
                newText = `\n- ${selectedText}`;
                break;
            default:
                newText = selectedText;
        }

        const newContent = content.substring(0, start) + newText + content.substring(end);
        setContent(newContent);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#f6f6f8]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="text-gray-500">로딩 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f6f8]">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
                <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/reporter/articles"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 text-blue-600">
                                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" fill="currentColor"></path>
                                </svg>
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-gray-900">새 기사 작성</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-gray-900">{reporter?.name}</p>
                            <p className="text-xs text-gray-500">{reporter?.region} / 기사작성 중</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold ring-2 ring-blue-100">
                            {reporter?.name?.charAt(0) || "기"}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-[1280px] mx-auto px-6 py-8 pb-32">
                <div className="max-w-[1000px] mx-auto space-y-6">

                    {/* Success/Error Messages */}
                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{successMessage}</span>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-3">
                            <X className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {/* Main Content Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-8 space-y-8">

                            {/* Title Section */}
                            <div className="space-y-4">
                                <label className="block">
                                    <span className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">
                                        제목 (필수)
                                    </span>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="기사 제목을 입력하세요"
                                        className="w-full text-3xl font-black border-none focus:ring-0 placeholder:text-gray-300 p-0 bg-transparent outline-none"
                                        disabled={isSaving}
                                    />
                                </label>
                                <div className="h-px bg-gray-100"></div>
                                <label className="block">
                                    <span className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">
                                        부제목
                                    </span>
                                    <input
                                        type="text"
                                        value={subtitle}
                                        onChange={(e) => setSubtitle(e.target.value)}
                                        placeholder="기사의 부제목이나 요약 문구를 입력하세요"
                                        className="w-full text-xl font-medium border-none focus:ring-0 placeholder:text-gray-300 p-0 bg-transparent outline-none"
                                        disabled={isSaving}
                                    />
                                </label>
                            </div>

                            {/* Category & Tags Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">카테고리</p>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 px-4 outline-none transition"
                                        disabled={isSaving}
                                    >
                                        <option value="">카테고리 선택</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">취재 태그</p>
                                    <input
                                        type="text"
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        placeholder="콤마(,)로 태그를 구분하세요"
                                        className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-12 px-4 outline-none transition"
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>

                            {/* Image Upload Section */}
                            <div className="space-y-4 pt-4">
                                <p className="text-sm font-medium text-gray-700">대표 이미지</p>

                                {/* Image Preview */}
                                {thumbnailUrl && (
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 group">
                                        <img
                                            src={thumbnailUrl}
                                            alt="썸네일 미리보기"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = "none";
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setThumbnailUrl("")}
                                            className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition backdrop-blur-sm"
                                            disabled={isSaving}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        {/* Caption Overlay */}
                                        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                                            <input
                                                type="text"
                                                value={imageCaption}
                                                onChange={(e) => setImageCaption(e.target.value)}
                                                placeholder="이미지 캡션을 입력하세요"
                                                className="w-full bg-transparent border-none text-white text-sm placeholder:text-gray-300 focus:ring-0 p-0 outline-none"
                                                disabled={isSaving}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Upload Area */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    <label className={`flex-1 border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer group ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={isSaving || isUploading}
                                        />
                                        {isUploading ? (
                                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                <p className="text-sm text-gray-500 group-hover:text-blue-600">이미지 클릭하여 업로드</p>
                                                <p className="text-xs text-gray-400">PNG, JPG, GIF (최대 4.5MB)</p>
                                            </>
                                        )}
                                    </label>
                                    <div className="flex-1 space-y-3">
                                        <label className="block">
                                            <span className="text-xs text-gray-400">이미지 URL 주소</span>
                                            <div className="relative mt-1">
                                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="url"
                                                    value={thumbnailUrl}
                                                    onChange={(e) => setThumbnailUrl(e.target.value)}
                                                    placeholder="https://..."
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-sm"
                                                    disabled={isSaving || isUploading}
                                                />
                                            </div>
                                        </label>
                                        <label className="block">
                                            <span className="text-xs text-gray-400">이미지 캡션(설명)</span>
                                            <input
                                                type="text"
                                                value={imageCaption}
                                                onChange={(e) => setImageCaption(e.target.value)}
                                                placeholder="사진에 대한 설명을 입력하세요"
                                                className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-sm"
                                                disabled={isSaving}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* WYSIWYG Editor */}
                            <div className="space-y-2 pt-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-700">본문 내용</p>
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => insertFormat("bold")}
                                            className="p-2 hover:bg-gray-100 rounded transition"
                                            title="굵게"
                                        >
                                            <Bold className="w-4 h-4 text-gray-500" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertFormat("italic")}
                                            className="p-2 hover:bg-gray-100 rounded transition"
                                            title="기울임"
                                        >
                                            <Italic className="w-4 h-4 text-gray-500" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertFormat("link")}
                                            className="p-2 hover:bg-gray-100 rounded transition"
                                            title="링크"
                                        >
                                            <Link2 className="w-4 h-4 text-gray-500" />
                                        </button>
                                        <button
                                            type="button"
                                            className="p-2 hover:bg-gray-100 rounded transition"
                                            title="이미지"
                                        >
                                            <ImageIcon className="w-4 h-4 text-gray-500" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertFormat("list")}
                                            className="p-2 hover:bg-gray-100 rounded transition"
                                            title="목록"
                                        >
                                            <List className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>
                                </div>
                                <div className="relative">
                                    <textarea
                                        id="content-editor"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="심층 취재 내용을 여기에 작성하십시오..."
                                        rows={18}
                                        className="w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-6 text-lg leading-relaxed resize-none outline-none transition"
                                        disabled={isSaving}
                                    />
                                    <div className="absolute bottom-4 right-4 text-xs font-mono text-gray-400 bg-white/80 px-2 py-1 rounded">
                                        {content.length.toLocaleString()} / 5,000 characters
                                    </div>
                                </div>
                            </div>

                            {/* Breaking News Toggle */}
                            <label className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl cursor-pointer hover:bg-red-100 transition">
                                <div className="flex items-center gap-3">
                                    <Megaphone className="w-5 h-5 text-red-500" />
                                    <span className="text-sm font-semibold text-red-700">속보로 지정</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={isBreakingNews}
                                    onChange={(e) => setIsBreakingNews(e.target.checked)}
                                    className="w-5 h-5 rounded text-red-500 border-red-300 focus:ring-red-500"
                                    disabled={isSaving}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Guidelines Link */}
                    <div className="flex justify-center">
                        <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors py-2">
                            <Info className="w-4 h-4" />
                            취재 가이드라인 및 준수사항 보기
                        </button>
                    </div>
                </div>
            </main>

            {/* Bottom Action Bar */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-50">
                <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Left: Auto-save Status */}
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        {autoSaveStatus === "saved" && lastSaved && (
                            <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>자동 저장됨 ({lastSaved.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })})</span>
                            </>
                        )}
                        {autoSaveStatus === "saving" && (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                <span>저장 중...</span>
                            </>
                        )}
                        {autoSaveStatus === "unsaved" && title.trim() && (
                            <>
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span>저장되지 않은 변경사항</span>
                            </>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setShowPreview(true)}
                            disabled={isSaving || !title.trim()}
                            className="flex-1 md:flex-none h-11 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            미리보기
                        </button>
                        <button
                            onClick={() => handleSubmit("draft")}
                            disabled={isSaving}
                            className="flex-1 md:flex-none h-11 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            임시저장
                        </button>
                        <div className="hidden md:block h-8 w-px bg-gray-200 mx-1"></div>
                        <button
                            onClick={() => handleSubmit("pending")}
                            disabled={isSaving}
                            className="flex-1 md:flex-none h-11 px-8 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            승인요청
                        </button>
                        <button
                            onClick={() => setShowPublishConfirm(true)}
                            disabled={isSaving}
                            className="flex-1 md:flex-none h-11 px-8 rounded-lg bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            승인없이 기사게시
                        </button>
                    </div>
                </div>
            </footer>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[768px] max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                        {/* Modal Header */}
                        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <Eye className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-bold text-gray-900">미리보기</h2>
                            </div>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </header>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Hero Image */}
                            {thumbnailUrl && (
                                <div
                                    className="w-full h-[400px] bg-cover bg-center bg-gray-100"
                                    style={{ backgroundImage: `url("${thumbnailUrl}")` }}
                                />
                            )}

                            <div className="px-8 py-8">
                                {/* Category Badge */}
                                <div className="flex mb-4">
                                    <span className="h-7 px-3 bg-blue-600 text-white text-xs font-bold rounded-md flex items-center">
                                        {category || "카테고리"}
                                    </span>
                                    {isBreakingNews && (
                                        <span className="ml-2 h-7 px-3 bg-red-600 text-white text-xs font-bold rounded-md flex items-center">
                                            속보
                                        </span>
                                    )}
                                </div>

                                {/* Headline */}
                                <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
                                    {title || "제목 없음"}
                                </h1>

                                {/* Subtitle */}
                                {subtitle && (
                                    <h2 className="text-lg text-gray-600 font-medium leading-relaxed mb-6">
                                        {subtitle}
                                    </h2>
                                )}

                                {/* Author Metadata */}
                                <div className="flex items-center gap-2 text-gray-500 text-sm mb-8 border-b border-gray-100 pb-6">
                                    <span className="font-semibold text-gray-700">{reporter?.name} 기자</span>
                                    <span className="text-gray-300">|</span>
                                    <span>{new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Seoul" })}</span>
                                </div>

                                {/* Image Caption */}
                                {thumbnailUrl && imageCaption && (
                                    <p className="text-sm text-gray-500 italic mb-6 -mt-4">
                                        {imageCaption}
                                    </p>
                                )}

                                {/* Article Body */}
                                <article className="prose prose-slate max-w-none">
                                    <div className="text-gray-800 text-[17px] leading-[1.8] whitespace-pre-wrap">
                                        {content || "내용 없음"}
                                    </div>
                                </article>

                                {/* Tags */}
                                {tags && (
                                    <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100">
                                        {tags.split(",").map((tag, i) => (
                                            <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                                                #{tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <footer className="flex items-center justify-end border-t border-gray-100 px-6 py-4 bg-gray-50">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="min-w-[100px] h-11 px-6 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition shadow-sm"
                            >
                                닫기
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* Publish Confirmation Modal */}
            {showPublishConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="w-full max-w-[400px] bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="flex flex-col items-center p-8">
                            {/* Orange Zap Icon Circle */}
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30">
                                    <Zap className="w-8 h-8" />
                                </div>
                            </div>

                            {/* Headline */}
                            <h1 className="text-gray-900 text-2xl font-bold leading-tight text-center pb-3">
                                정말로 발행하시겠습니까?
                            </h1>

                            {/* Body Text */}
                            <p className="text-gray-500 text-sm font-normal leading-relaxed text-center px-2">
                                발행 시 즉시 독자들에게 기사가 노출되며,<br />
                                수정 시 수정 이력이 남을 수 있습니다.
                            </p>

                            {/* Button Group */}
                            <div className="mt-8 flex w-full gap-3">
                                <button
                                    onClick={() => setShowPublishConfirm(false)}
                                    disabled={isSaving}
                                    className="flex-1 h-12 px-4 rounded-lg border border-gray-300 bg-transparent text-gray-900 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={() => handleSubmit("published")}
                                    disabled={isSaving}
                                    className="flex-1 h-12 px-4 rounded-lg bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
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

                        {/* Subtle Footer */}
                        <div className="bg-gray-50 px-8 py-4 flex justify-center">
                            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-medium">
                                Jungang News Publishing System
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
