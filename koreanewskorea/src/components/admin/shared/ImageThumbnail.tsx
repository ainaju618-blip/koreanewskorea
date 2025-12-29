/**
 * ImageThumbnail 컴포넌트
 * 
 * 기사 썸네일 이미지를 미리보기 형태로 표시합니다.
 * 클릭 시 원본 이미지를 새 탭에서 볼 수 있습니다.
 * 
 * @example
 * <ImageThumbnail 
 *   src={article.thumbnail_url} 
 *   alt="기사 썸네일"
 *   showStatus={true}
 * />
 */

import React from "react";

export interface ImageThumbnailProps {
    /** 이미지 URL */
    src: string | null | undefined;
    /** 이미지 alt 텍스트 */
    alt?: string;
    /** 섹션 라벨 (기본값: "📷 기사 이미지") */
    label?: string;
    /** Cloudinary 최적화 상태 표시 여부 */
    showStatus?: boolean;
    /** 이미지가 없을 때도 placeholder 표시 여부 (기본값: true) */
    showPlaceholder?: boolean;
    /** 이미지 높이 클래스 (기본값: "h-48") */
    heightClass?: string;
    /** 추가 CSS 클래스 */
    className?: string;
}

export function ImageThumbnail({
    src,
    alt = "썸네일 이미지",
    label = "📷 기사 이미지",
    showStatus = true,
    showPlaceholder = true,
    heightClass = "h-48",
    className = "",
}: ImageThumbnailProps) {
    // 이미지가 없고 placeholder도 표시하지 않으면 렌더링하지 않음
    if (!src && !showPlaceholder) return null;

    const isCloudinary = src?.includes('res.cloudinary.com');

    // 이미지가 없을 때 placeholder 표시
    if (!src) {
        return (
            <div className={`p-3 bg-[#161b22] rounded-lg border border-[#30363d] ${className}`}>
                {label && (
                    <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                        {label}
                    </label>
                )}
                <div className={`w-full min-w-[400px] ${heightClass} flex flex-col items-center justify-center bg-[#0d1117] rounded-lg border-2 border-dashed border-[#30363d]`}>
                    <svg className="w-12 h-12 text-[#30363d] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-[#8b949e] font-medium">이미지 없음</p>
                    <p className="text-xs text-[#6e7681] mt-1">스크래퍼가 이미지를 추출하지 못했습니다</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-3 bg-[#161b22] rounded-lg border border-[#30363d] ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                    {label}
                </label>
            )}
            <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="block group"
            >
                <div className="relative overflow-hidden rounded-lg border border-[#30363d] bg-[#0d1117] shadow-sm hover:shadow-md transition-shadow">
                    <img
                        src={src}
                        alt={alt}
                        className={`w-full ${heightClass} object-cover group-hover:scale-105 transition-transform duration-300`}
                        onError={(e) => {
                            // 이미지 로딩 실패 시 placeholder 표시
                            (e.target as HTMLImageElement).style.display = 'none';
                            const placeholder = (e.target as HTMLImageElement).nextElementSibling;
                            if (placeholder) {
                                placeholder.classList.remove('hidden');
                            }
                        }}
                    />
                    <div className="hidden absolute inset-0 flex items-center justify-center bg-[#0d1117] text-[#8b949e] text-sm">
                        이미지를 불러올 수 없습니다
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white bg-black/50 px-3 py-1 rounded-full text-xs font-medium">
                            클릭하여 원본 보기
                        </span>
                    </div>
                </div>
            </a>
            {showStatus && (
                <p className="mt-2 text-xs text-[#8b949e] truncate" title={src}>
                    {isCloudinary
                        ? 'Cloudinary 최적화 완료'
                        : '외부 이미지 (승인 시 자동 최적화)'}
                </p>
            )}
        </div>
    );
}
