"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save, Loader2, User, Mail, Phone, MapPin, Briefcase, FileText, X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import Image from "next/image";
import Cropper, { Area } from "react-easy-crop";
import imageCompression from "browser-image-compression";

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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showSuccess, showError } = useToast();

    // Image state - stored in MEMORY until save
    const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
    const [pendingImagePreview, setPendingImagePreview] = useState<string>("");
    const [compressionInfo, setCompressionInfo] = useState<{original: number; compressed: number} | null>(null);

    // Crop modal state
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [rawImageSrc, setRawImageSrc] = useState<string>("");
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [originalFileSize, setOriginalFileSize] = useState(0);

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

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            if (pendingImagePreview && pendingImagePreview.startsWith("blob:")) {
                URL.revokeObjectURL(pendingImagePreview);
            }
            if (rawImageSrc && rawImageSrc.startsWith("blob:")) {
                URL.revokeObjectURL(rawImageSrc);
            }
        };
    }, [pendingImagePreview, rawImageSrc]);

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
            showError("Failed to load profile");
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

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    // Crop image and return as File
    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area,
        rotation = 0
    ): Promise<File> => {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = document.createElement("img");
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = imageSrc;
        });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context failed");

        const maxSize = 800;
        const scale = Math.min(maxSize / pixelCrop.width, maxSize / pixelCrop.height, 1);
        const outputWidth = Math.round(pixelCrop.width * scale);
        const outputHeight = Math.round(pixelCrop.height * scale);

        canvas.width = outputWidth;
        canvas.height = outputHeight;

        if (rotation !== 0) {
            const tempCanvas = document.createElement("canvas");
            const tempCtx = tempCanvas.getContext("2d");
            if (!tempCtx) throw new Error("Temp canvas context failed");

            const radians = (rotation * Math.PI) / 180;
            const sin = Math.abs(Math.sin(radians));
            const cos = Math.abs(Math.cos(radians));
            const newWidth = image.width * cos + image.height * sin;
            const newHeight = image.width * sin + image.height * cos;

            tempCanvas.width = newWidth;
            tempCanvas.height = newHeight;

            tempCtx.translate(newWidth / 2, newHeight / 2);
            tempCtx.rotate(radians);
            tempCtx.drawImage(image, -image.width / 2, -image.height / 2);

            ctx.drawImage(
                tempCanvas,
                pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
                0, 0, outputWidth, outputHeight
            );
        } else {
            ctx.drawImage(
                image,
                pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
                0, 0, outputWidth, outputHeight
            );
        }

        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(new File([blob], "profile.jpg", { type: "image/jpeg" }));
                    } else {
                        reject(new Error("Canvas toBlob failed"));
                    }
                },
                "image/jpeg",
                0.92
            );
        });
    };

    // STEP 1: User selects image -> open crop modal (NO upload yet)
    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showError("Only image files allowed");
            return;
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        // Store original file size
        setOriginalFileSize(file.size);

        // Create object URL for crop modal (memory only)
        const objectUrl = URL.createObjectURL(file);
        setRawImageSrc(objectUrl);

        // Reset crop state
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setCroppedAreaPixels(null);

        // Open crop modal
        setCropModalOpen(true);
    };

    // STEP 2: User confirms crop -> compress and store in MEMORY (NO upload yet)
    const handleCropConfirm = async () => {
        if (!croppedAreaPixels || !rawImageSrc) return;

        try {
            // Crop the image
            const croppedFile = await getCroppedImg(rawImageSrc, croppedAreaPixels, rotation);

            // Compress the cropped image
            const compressedFile = await imageCompression(croppedFile, {
                maxSizeMB: 0.3,
                maxWidthOrHeight: 400,
                useWebWorker: true,
                fileType: "image/jpeg",
            });

            // Store compression info
            setCompressionInfo({
                original: originalFileSize,
                compressed: compressedFile.size,
            });

            // Store in memory (NOT uploaded yet)
            setPendingImageFile(compressedFile);

            // Create preview URL from memory
            if (pendingImagePreview) {
                URL.revokeObjectURL(pendingImagePreview);
            }
            const previewUrl = URL.createObjectURL(compressedFile);
            setPendingImagePreview(previewUrl);

            showSuccess(`Image ready! ${formatFileSize(originalFileSize)} -> ${formatFileSize(compressedFile.size)}`);
        } catch (err) {
            console.error("Crop error:", err);
            showError("Failed to process image");
        } finally {
            // Close modal and cleanup
            setCropModalOpen(false);
            if (rawImageSrc) {
                URL.revokeObjectURL(rawImageSrc);
            }
            setRawImageSrc("");
        }
    };

    const handleCropCancel = () => {
        setCropModalOpen(false);
        if (rawImageSrc) {
            URL.revokeObjectURL(rawImageSrc);
        }
        setRawImageSrc("");
    };

    // Remove pending image
    const handleRemovePendingImage = () => {
        if (pendingImagePreview) {
            URL.revokeObjectURL(pendingImagePreview);
        }
        setPendingImageFile(null);
        setPendingImagePreview("");
        setCompressionInfo(null);
    };

    // STEP 3: User clicks SAVE -> upload to Cloudinary + save to DB
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reporter) return;

        setIsSaving(true);

        try {
            let profileImageUrl = formData.profile_image;

            // If there's a pending image, upload it NOW
            if (pendingImageFile) {
                console.log("Uploading image to Cloudinary...");

                const uploadFormData = new FormData();
                uploadFormData.append("file", pendingImageFile, "profile.jpg");
                uploadFormData.append("folder", "reporters");

                const uploadRes = await fetch("/api/upload/image", {
                    method: "POST",
                    body: uploadFormData,
                });

                if (!uploadRes.ok) {
                    const errorText = await uploadRes.text();
                    console.error("Upload failed:", errorText);
                    throw new Error("Image upload failed");
                }

                const uploadData = await uploadRes.json();
                profileImageUrl = uploadData.url;
                console.log("Upload success:", profileImageUrl);
            }

            // Save profile to DB
            const res = await fetch(`/api/users/reporters/${reporter.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    profile_image: profileImageUrl,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Save failed");
            }

            // Clear pending image state
            handleRemovePendingImage();

            // Update form with new URL
            setFormData(prev => ({ ...prev, profile_image: profileImageUrl }));

            showSuccess("Profile saved!");
            // Redirect to dashboard after successful save
            router.push('/reporter');
        } catch (err) {
            console.error("Save error:", err);
            showError(err instanceof Error ? err.message : "Failed to save profile");
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
                Profile not found
            </div>
        );
    }

    // Determine which image to show in preview
    const displayImage = pendingImagePreview || formData.profile_image;
    const hasPendingImage = !!pendingImageFile;
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
                                {displayImage ? (
                                    <Image
                                        src={displayImage}
                                        alt="Profile"
                                        fill
                                        className="object-cover"
                                        unoptimized={displayImage.startsWith("blob:")}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-16 h-16 text-gray-300" />
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
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-2">
                                클릭하여 프로필 사진을 업로드하세요.
                            </p>
                            <p className="text-xs text-gray-400 mb-2">
                                권장 크기: 400x400px / JPG, PNG 형식
                            </p>
                            <p className="text-xs text-blue-600">
                                큰 파일은 자동으로 압축됩니다.
                            </p>

                            {/* Pending Image Info */}
                            {hasPendingImage && compressionInfo && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-amber-800 font-medium">
                                                New image ready
                                            </p>
                                            <p className="text-xs text-amber-600">
                                                {formatFileSize(compressionInfo.original)} → {formatFileSize(compressionInfo.compressed)}
                                                <span className="ml-2 text-green-600 font-medium">
                                                    ({Math.round((1 - compressionInfo.compressed / compressionInfo.original) * 100)}% reduced)
                                                </span>
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemovePendingImage}
                                            className="p-1 hover:bg-amber-100 rounded"
                                        >
                                            <X className="w-4 h-4 text-amber-600" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Save Button - right below image section */}
                    {hasPendingImage && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                {isSaving ? "Uploading..." : "Save Profile Image"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Basic Info Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
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
                                placeholder="Name"
                            />
                        </div>

                        {/* Email */}
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
                                placeholder="Email"
                            />
                        </div>

                        {/* Phone */}
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

                        {/* Region */}
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
                                placeholder="Region"
                            />
                        </div>

                        {/* Position */}
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
                            {displayImage ? (
                                <Image
                                    src={displayImage}
                                    alt="Profile"
                                    width={80}
                                    height={80}
                                    className="object-cover w-full h-full"
                                    unoptimized={displayImage.startsWith("blob:")}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <User className="w-10 h-10 text-gray-300" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900">{formData.name || "Name"}</h3>
                            <p className="text-sm text-blue-600 font-medium">
                                {positionLabel} | {formData.region || "Region"}
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

            {/* Image Crop Modal */}
            {cropModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-bold text-gray-900">프로필 사진 편집</h3>
                            <button
                                onClick={handleCropCancel}
                                className="p-2 hover:bg-gray-100 rounded-full transition"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Crop Area */}
                        <div className="relative h-80 bg-gray-900">
                            <Cropper
                                image={rawImageSrc}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onRotationChange={setRotation}
                                onCropComplete={onCropComplete}
                            />
                        </div>

                        {/* Controls */}
                        <div className="px-6 py-4 space-y-4 bg-gray-50">
                            {/* Zoom Control */}
                            <div className="flex items-center gap-3">
                                <ZoomOut className="w-5 h-5 text-gray-400" />
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <ZoomIn className="w-5 h-5 text-gray-400" />
                            </div>

                            {/* Rotation Control */}
                            <div className="flex items-center gap-3">
                                <RotateCw className="w-5 h-5 text-gray-400" />
                                <input
                                    type="range"
                                    value={rotation}
                                    min={0}
                                    max={360}
                                    step={1}
                                    onChange={(e) => setRotation(Number(e.target.value))}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <span className="text-sm text-gray-500 w-12">{rotation}</span>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-3 px-6 py-4 border-t">
                            <button
                                onClick={handleCropCancel}
                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleCropConfirm}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                            >
                                적용하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
