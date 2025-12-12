
import { NextRequest, NextResponse } from 'next/server';
import { getConfig, saveConfig } from '@/lib/scheduler';

export async function GET() {
    try {
        const config = getConfig();
        return NextResponse.json(config);
    } catch (e: any) {
        return NextResponse.json({ message: '설정 로드 실패' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        // 유효성 검사 (간단히)
        if (typeof body.enabled !== 'boolean' || !body.cronExpression) {
            return NextResponse.json({ message: '잘못된 요청입니다.' }, { status: 400 });
        }

        saveConfig({
            enabled: body.enabled,
            cronExpression: body.cronExpression
        });

        return NextResponse.json({ success: true, config: getConfig() });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message }, { status: 500 });
    }
}
