import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * POST /api/upload
 * 이미지 파일 업로드 (로컬 저장)
 * - 저장 위치: /public/images/uploads/
 * - 반환: 웹 접근 가능한 URL
 */
export async function POST(req: NextRequest) {
    try {
        // 인증 확인
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: '파일이 없습니다.' },
                { status: 400 }
            );
        }

        // 파일 타입 검증
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: '지원하지 않는 파일 형식입니다. (JPG, PNG, GIF, WebP만 가능)' },
                { status: 400 }
            );
        }

        // 파일 크기 제한 (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: '파일 크기가 5MB를 초과합니다.' },
                { status: 400 }
            );
        }

        // 파일명 생성 (해시 + 확장자)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const hash = crypto.createHash('md5').update(buffer).digest('hex');
        const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
        const filename = `${hash}.${ext}`;

        // 저장 경로 설정
        const uploadDir = path.join(process.cwd(), 'public', 'images', 'uploads');
        const filePath = path.join(uploadDir, filename);

        // 디렉토리 생성
        await mkdir(uploadDir, { recursive: true });

        // 파일 저장
        await writeFile(filePath, buffer);

        // 웹 접근 URL 반환
        const url = `/images/uploads/${filename}`;

        return NextResponse.json({
            success: true,
            url: url,
            filename: filename,
            size: file.size,
        });

    } catch (error: unknown) {
        console.error('POST /api/upload error:', error);
        const message = error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
