"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save, Loader2, User, Mail, Phone, MapPin, Briefcase, FileText } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import Image from "next/image";

interface Reporter {
    id: string;
    name: string;
    email: string;
    phone: string;
    position: string;
    region: string;
    bio: string;
    profile_image: string;
    status: string;
}

const POSITION_OPTIONS = [
    { value: "editor_in_chief", label: "주필" },
    { value: "branch_manager", label: "지사장" },
    { value: "editor_chief", label: "편집국장" },
    { value: "news_chief", label: "취재부장" },
    { value: "senior_reporter", label: "수석기자" },
    { value: "reporter", label: "기자" },
    { value: "intern_reporter", label: "수습기자" },
    { value: "citizen_reporter", label: "시민기자" },
    { value: "opinion_writer", label: "오피니언" },
    { value: "advisor", label: "고문" },
    { value: "consultant", label: "자문위원" },
    { value: "ambassador", label: "홍보대사" },
    { value: "seoul_correspondent", label: "서울특파원" },
    { value: "foreign_correspondent", label: "해외특파원" },
];

export default function ReporterProfilePage() {
    const router = useRouter();
    const [reporter, setReporter] = useState<Reporter | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showSuccess, showError } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        position: "",
        region: "",
        bio: "",
        profile_image: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/auth/me");
            if (res.ok) {
                const data = await res.json();
                const r = data.reporter;
                setReporter(r);
                setFormData({
                    name: r.name || "",
                    email: r.email || "",
                    phone: r.phone || "",
                    position: r.position || "reporter",
                    region: r.region || "",
                    bio: r.bio || "",
                    profile_image: r.profile_image || "",
                });
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
            showError("프로필을 불러오는데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 이미지 타입 체크만 (용량은 Cloudinary에서 자동 압축)
        if (!file.type.startsWith("image/")) {
            showError("이미지 파일만 업로드 가능합니다.");
            return;
        }

        setIsUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);
            formDataUpload.append("folder", "reporters");

            // Cloudinary API 사용 (자동 400x400 리사이즈 및 압축)
            const res = await fetch("/api/upload/image", {
                method: "POST",
                body: formDataUpload,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "업로드 실패");
            }

            const data = await res.json();
            setFormData(prev => ({ ...prev, profile_image: data.url }));
            showSuccess("프로필 사진이 업로드되었습니다.");
        } catch (err) {
            console.error("Upload error:", err);
            showError(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reporter) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/users/reporters/${reporter.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "저장 실패");
            }

            showSuccess("프로필이 저장되었습니다.");
            fetchProfile(); // 폼 데이터 새로고침
            router.refresh(); // 사이드바 새로고침
        } catch (err) {
            console.error("Save error:", err);
            showError(err instanceof Error ? err.message : "프로필 저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!reporter) {
        return (
            <div className="text-center py-12 text-gray-500">
                프로필 정보를 찾을 수 없습니다.
            </div>
        );
    }

    const positionLabel = POSITION_OPTIONS.find(p => p.value === formData.position)?.label || formData.position;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">내 프로필</h1>
                <p className="text-gray-500 mt-1">프로필 정보를 수정하고 저장할 수 있습니다.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Image Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">프로필 사진</h2>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div
                                onClick={handleImageClick}
                                className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg cursor-pointer hover:opacity-80 transition relative"
                            >
                                {formData.profile_image ? (
                                    <Image
                                        src={formData.profile_image}
                                        alt="프로필 사진"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-16 h-16 text-gray-300" />
                                    </div>
                                )}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={handleImageClick}
                                className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-2">
                                클릭하여 프로필 사진을 업로드하세요.
                            </p>
                            <p className="text-xs text-gray-400">
                                권장 크기: 400x400px / 최대 5MB / JPG, PNG 형식
                            </p>
                        </div>
                    </div>
                </div>

                {/* Basic Info Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 이름 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <User className="w-4 h-4 inline mr-1" />
                                이름 *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="이름을 입력하세요"
                            />
                        </div>

                        {/* 이메일 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Mail className="w-4 h-4 inline mr-1" />
                                이메일
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="이메일을 입력하세요"
                            />
                        </div>

                        {/* 전화번호 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Phone className="w-4 h-4 inline mr-1" />
                                전화번호
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="010-0000-0000"
                            />
                        </div>

                        {/* 담당 지역 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                담당 지역
                            </label>
                            <input
                                type="text"
                                name="region"
                                value={formData.region}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="담당 지역"
                            />
                        </div>

                        {/* 직위 */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Briefcase className="w-4 h-4 inline mr-1" />
                                직위
                            </label>
                            <select
                                name="position"
                                value={formData.position}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                            >
                                {POSITION_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Bio Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        <FileText className="w-5 h-5 inline mr-1" />
                        약력 / 자기소개
                    </h2>
                    <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                        placeholder="약력이나 자기소개를 입력하세요. (예: 학력, 경력, 수상 이력, 전문 분야 등)"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                        * 이 정보는 기자 프로필 페이지에 공개됩니다.
                    </p>
                </div>

                {/* Preview Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">프로필 미리보기</h2>
                    <div className="bg-white rounded-lg p-4 flex items-start gap-4 shadow-sm">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                            {formData.profile_image ? (
                                <Image
                                    src={formData.profile_image}
                                    alt="프로필"
                                    width={80}
                                    height={80}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <User className="w-10 h-10 text-gray-300" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900">{formData.name || "이름"}</h3>
                            <p className="text-sm text-blue-600 font-medium">
                                {positionLabel} | {formData.region || "지역"}
                            </p>
                            {formData.bio && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{formData.bio}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {isSaving ? "저장 중..." : "프로필 저장"}
                    </button>
                </div>
            </form>
        </div>
    );
}
