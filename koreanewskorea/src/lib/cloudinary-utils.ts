/**
 * Cloudinary 유틸리티 함수
 * - URL에서 public_id 추출
 * - CldImage 컴포넌트에서 사용
 */

/**
 * Cloudinary URL에서 public_id를 추출합니다.
 * 
 * @param cloudinaryUrl - Cloudinary 이미지 URL
 * @returns public_id 또는 null
 * 
 * @example
 * extractPublicId("https://res.cloudinary.com/xxx/image/upload/v123/news/image.jpg")
 * // => "news/image"
 */
export function extractPublicId(cloudinaryUrl: string | null | undefined): string | null {
    if (!cloudinaryUrl) return null;

    // Cloudinary URL이 아니면 null 반환
    if (!cloudinaryUrl.includes('cloudinary.com')) {
        return null;
    }

    try {
        // https://res.cloudinary.com/cloud_name/image/upload/v123456/folder/image.jpg
        // => folder/image
        const match = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

/**
 * Cloudinary URL인지 확인합니다.
 */
export function isCloudinaryUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.includes('res.cloudinary.com');
}
