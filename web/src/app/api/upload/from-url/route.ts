import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary 설정
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * 외부 URL에서 이미지를 다운로드하여 Cloudinary에 업로드
 * - 서버에서 먼저 다운로드 (핫링크 방지 우회)
 * - 800px 기준 리사이즈 (비율 유지)
 * - WebP 포맷으로 변환 (용량 최적화)
 */
export async function POST(request: Request) {
    try {
        // 환경변수 체크
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
            console.error('[Cloudinary] 환경변수 미설정');
            return NextResponse.json(
                { error: 'Cloudinary 설정이 필요합니다.', cloudinaryUrl: null },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { imageUrl, referer } = body;

        if (!imageUrl) {
            return NextResponse.json({ error: '이미지 URL이 필요합니다.', cloudinaryUrl: null }, { status: 400 });
        }

        // 이미 Cloudinary URL이면 그대로 반환
        if (imageUrl.includes('res.cloudinary.com')) {
            return NextResponse.json({
                cloudinaryUrl: imageUrl,
                skipped: true,
                message: '이미 Cloudinary URL입니다.'
            });
        }

        console.log(`[Cloudinary] 프록시 다운로드 시작: ${imageUrl.substring(0, 80)}...`);

        // 1. 서버에서 먼저 이미지 다운로드 (핫링크 방지 우회)
        const imageResponse = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Referer': referer || imageUrl,  // 원본 사이트를 Referer로 설정
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            },
        });

        if (!imageResponse.ok) {
            throw new Error(`이미지 다운로드 실패: ${imageResponse.status} ${imageResponse.statusText}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = `data:image/jpeg;base64,${Buffer.from(imageBuffer).toString('base64')}`;

        console.log(`[Cloudinary] 다운로드 완료, 업로드 시작 (${Math.round(imageBuffer.byteLength / 1024)}KB)`);

        // 2. Cloudinary에 Base64로 업로드
        const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'koreanews/articles',
            transformation: [
                {
                    width: 800,
                    crop: 'limit',  // 800px 이하면 그대로, 이상이면 800px로 축소 (비율 유지)
                    quality: 'auto:good'
                }
            ],
            resource_type: 'image',
            format: 'webp',  // WebP로 변환
            unique_filename: true,
            overwrite: false,
        });

        console.log(`[Cloudinary] 업로드 완료: ${result.secure_url}`);

        return NextResponse.json({
            cloudinaryUrl: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
            originalUrl: imageUrl,
        });

    } catch (error: any) {
        console.error('[Cloudinary] Upload Error:', error.message || error);

        // 에러 발생 시 원본 URL 반환 (graceful degradation)
        try {
            const bodyClone = await request.clone().json();
            return NextResponse.json({
                cloudinaryUrl: bodyClone.imageUrl || null,
                error: error.message || '업로드 실패',
                fallback: true
            });
        } catch {
            return NextResponse.json({
                cloudinaryUrl: null,
                error: error.message || '업로드 실패',
                fallback: true
            });
        }
    }
}
