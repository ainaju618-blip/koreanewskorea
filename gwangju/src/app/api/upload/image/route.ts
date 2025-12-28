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
        console.log("[Upload API] Starting...");

        // Check env vars
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
            console.log("[Upload API] Missing Cloudinary config");
            return NextResponse.json(
                { error: 'Cloudinary config missing' },
                { status: 500 }
            );
        }

        // Get file from FormData
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = formData.get('folder') as string || 'koreanews';

        console.log("[Upload API] File received:", file?.name, file?.size, file?.type);

        if (!file) {
            return NextResponse.json({ error: 'No file' }, { status: 400 });
        }

        // Size check (Vercel limit: 4.5MB)
        if (file.size > 4.5 * 1024 * 1024) {
            console.log("[Upload API] File too large:", file.size);
            return NextResponse.json(
                { error: 'File too large (max 4.5MB)' },
                { status: 413 }
            );
        }

        // Convert to Base64
        console.log("[Upload API] Converting to base64...");
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

        // Transformation settings by folder
        const transformations = folder === 'reporters'
            ? [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' }]
            : [{ width: 800, height: 600, crop: 'limit', quality: 'auto:good' }];

        // Upload to Cloudinary
        console.log("[Upload API] Uploading to Cloudinary...", folder);
        const result = await cloudinary.uploader.upload(base64, {
            folder: `koreanews/${folder}`,
            transformation: transformations,
            format: 'webp',
        });

        console.log("[Upload API] Success:", result.secure_url);
        return NextResponse.json({
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
        });

    } catch (error: unknown) {
        console.error('[Upload API] Error:', error);

        // Return detailed error for debugging
        let errorDetail = 'Unknown error';
        if (error instanceof Error) {
            errorDetail = `${error.name}: ${error.message}`;
        } else if (typeof error === 'object' && error !== null) {
            errorDetail = JSON.stringify(error);
        }

        return NextResponse.json({
            error: 'Upload failed',
            detail: errorDetail,
            cloudinaryConfigured: !!process.env.CLOUDINARY_CLOUD_NAME
        }, { status: 500 });
    }
}
