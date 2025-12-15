'use client';

/**
 * 최적화된 Cloudinary 이미지 컴포넌트
 * - Cloudinary URL: CldImage로 자동 최적화 (WebP, 압축, 지연 로딩)
 * - 일반 URL: 기본 img 태그 사용
 * - 이미지 없음: No Image 플레이스홀더
 */

import { CldImage } from 'next-cloudinary';
import { extractPublicId, isCloudinaryUrl } from '@/lib/cloudinary-utils';

interface OptimizedImageProps {
    src: string | null | undefined;
    alt: string;
    width: number;
    height: number;
    className?: string;
    priority?: boolean;  // 첫 화면 이미지는 priority 사용
}

export default function OptimizedImage({
    src,
    alt,
    width,
    height,
    className = '',
    priority = false,
}: OptimizedImageProps) {
    // 이미지가 없는 경우
    if (!src) {
        return (
            <div
                className={`bg-slate-200 flex items-center justify-center text-slate-400 text-xs ${className}`}
                style={{ width, height }}
            >
                No Image
            </div>
        );
    }

    // Cloudinary URL인 경우 - 최적화된 CldImage 사용
    if (isCloudinaryUrl(src)) {
        const publicId = extractPublicId(src);

        if (publicId) {
            return (
                <CldImage
                    src={publicId}
                    alt={alt}
                    width={width}
                    height={height}
                    className={className}
                    loading={priority ? 'eager' : 'lazy'}
                    format="auto"
                    quality="auto"
                />
            );
        }
    }

    // 일반 URL인 경우 - 기본 img 태그 사용
    return (
        <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={className}
            loading={priority ? 'eager' : 'lazy'}
        />
    );
}
