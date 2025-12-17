import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary 설정
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
    try {
        // 환경변수 체크
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
            return NextResponse.json(
                { error: 'Cloudinary 설정이 필요합니다. .env 파일을 확인하세요.' },
                { status: 500 }
            );
        }

        // FormData에서 파일 추출
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = formData.get('folder') as string || 'koreanews';

        if (!file) {
            return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
        }

        // 파일을 Base64로 변환
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

        // 폴더별 변환 설정
        const transformations = folder === 'reporters'
            ? [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' }]
            : [{ width: 800, height: 600, crop: 'limit', quality: 'auto:good' }];

        // Cloudinary에 업로드 (자동 리사이즈 및 압축)
        const result = await cloudinary.uploader.upload(base64, {
            folder: `koreanews/${folder}`,
            transformation: transformations,
            format: 'webp',  // WebP로 자동 변환 (용량 50% 감소)
        });

        return NextResponse.json({
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
        });

    } catch (error: any) {
        console.error('Cloudinary Upload Error:', error);
        return NextResponse.json(
            { error: error.message || '업로드 실패' },
            { status: 500 }
        );
    }
}
