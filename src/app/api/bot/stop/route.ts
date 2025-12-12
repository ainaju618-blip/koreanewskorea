import { NextRequest, NextResponse } from 'next/server';
import { spawn, exec } from 'child_process';

export async function POST(req: NextRequest) {
    try {
        // Windows에서 Python 프로세스 종료
        const killCommand = process.platform === 'win32'
            ? 'taskkill /f /im python.exe 2>nul || echo No python processes'
            : 'pkill -f python || echo No python processes';

        return new Promise((resolve) => {
            exec(killCommand, (error, stdout, stderr) => {
                if (error && !stderr.includes('not found')) {
                    console.error('Kill command error:', error);
                }

                console.log('[API] Bot stop executed:', stdout);

                resolve(NextResponse.json({
                    success: true,
                    message: '모든 스크래퍼가 중지되었습니다.',
                    output: stdout
                }));
            });
        });

    } catch (error: any) {
        console.error('[API] Stop error:', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}
