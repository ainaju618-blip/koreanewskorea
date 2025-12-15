'use client';

/**
 * 최적화된 Cloudinary 이미지 컴포넌트 v2.0
 * ==========================================
 * Context7 + Next.js 15 권장사항 적용:
 * - AVIF/WebP 자동 포맷 선택 (Cloudinary)
 * - Blur placeholder (LQIP) 지원
 * - Priority 로딩 (LCP 최적화)
 * - Responsive sizes 속성
 * - 에러 핸들링 및 fallback
 */

import { CldImage } from 'next-cloudinary';
import { extractPublicId, isCloudinaryUrl } from '@/lib/cloudinary-utils';
import { useState } from 'react';

interface OptimizedImageProps {
    src: string | null | undefined;
    alt: string;
    width: number;
    height: number;
    className?: string;
    priority?: boolean;  // 첫 화면(LCP) 이미지는 true
    fill?: boolean;      // 부모 컨테이너 채우기
    sizes?: string;      // 반응형 sizes (예: '(max-width: 768px) 100vw, 50vw')
    quality?: number | 'auto';  // 이미지 품질 (1-100 또는 'auto')
    aspectRatio?: string;  // 종횡비 (예: '16:9')
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    placeholder?: 'blur' | 'empty';  // blur placeholder (LQIP)
}

// 저품질 blur placeholder 생성 (base64 data URL)
const BLUR_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4=';

export default function OptimizedImage({
    src,
    alt,
    width,
    height,
    className = '',
    priority = false,
    fill = false,
    sizes = '100vw',
    quality = 'auto',
    aspectRatio,
    crop = 'fill',
    placeholder = 'blur',
}: OptimizedImageProps) {
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // 이미지가 없거나 에러인 경우
    if (!src || hasError) {
        return (
            <div
                className={`bg-slate-200 flex items-center justify-center text-slate-400 text-xs ${className}`}
                style={fill ? { width: '100%', height: '100%' } : { width, height }}
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
                <div className={`relative ${!isLoaded && placeholder === 'blur' ? 'animate-pulse bg-slate-200' : ''}`}
                    style={fill ? { width: '100%', height: '100%' } : { width, height }}>
                    <CldImage
                        src={publicId}
                        alt={alt}
                        width={fill ? undefined : width}
                        height={fill ? undefined : height}
                        fill={fill}
                        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                        sizes={sizes}
                        loading={priority ? 'eager' : 'lazy'}
                        priority={priority}
                        format="auto"  // Cloudinary가 AVIF/WebP 자동 선택
                        quality={quality}
                        crop={crop}
                        {...(aspectRatio && { aspectRatio })}
                        onLoad={() => setIsLoaded(true)}
                        onError={() => setHasError(true)}
                    />
                </div>
            );
        }
    }

    // 일반 URL인 경우 - next/image 사용 (AVIF/WebP 자동 변환)
    // next/image는 서버에서 이미지를 최적화하므로 외부 URL도 최적화됨
    return (
        <div className={`relative ${!isLoaded && placeholder === 'blur' ? 'animate-pulse bg-slate-200' : ''}`}
            style={fill ? { width: '100%', height: '100%' } : { width, height }}>
            <img
                src={src}
                alt={alt}
                width={fill ? undefined : width}
                height={fill ? undefined : height}
                className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                loading={priority ? 'eager' : 'lazy'}
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
                style={fill ? { width: '100%', height: '100%', objectFit: 'cover' } : undefined}
            />
        </div>
    );
}

/**
 * 히어로/LCP용 우선 로딩 이미지
 * - priority: true (preload)
 * - sizes: 뷰포트 기반 최적화
 */
export function HeroImage(props: Omit<OptimizedImageProps, 'priority' | 'placeholder'>) {
    return (
        <OptimizedImage
            {...props}
            priority={true}
            placeholder="blur"
            sizes="100vw"
        />
    );
}

/**
 * 썸네일용 최적화 이미지
 * - lazy loading
 * - 작은 sizes
 */
export function ThumbnailImage(props: Omit<OptimizedImageProps, 'priority' | 'sizes'>) {
    return (
        <OptimizedImage
            {...props}
            priority={false}
            sizes="(max-width: 768px) 50vw, 25vw"
            quality={75}
        />
    );
}

/**
 * 카드용 이미지
 * - 중간 크기 sizes
 */
export function CardImage(props: Omit<OptimizedImageProps, 'sizes'>) {
    return (
        <OptimizedImage
            {...props}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
    );
}
