import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.replace(/\\n/g, '').trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.replace(/\\n/g, '').trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.replace(/\\n/g, '').trim(),
});

/**
 * POST /api/admin/upload
 * 이미지 업로드 (가로 800px 고정, 세로 비율 유지)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다. (JPG, PNG, WebP, GIF만 가능)' },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '파일 크기가 10MB를 초과합니다.' },
        { status: 400 }
      );
    }

    // 파일을 base64로 변환
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Cloudinary에 업로드 (가로 800px 고정, 세로 비율 유지)
    const result = await cloudinary.uploader.upload(base64, {
      folder: 'koreanews-naju/articles',
      transformation: [
        {
          width: 800,
          crop: 'scale', // 비율 유지하면서 리사이즈
          quality: 'auto:good',
          format: 'webp',
        },
      ],
      resource_type: 'image',
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || '이미지 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}
