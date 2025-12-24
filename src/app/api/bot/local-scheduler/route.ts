import { NextRequest, NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Check if local scheduler is running
async function isSchedulerRunning(): Promise<boolean> {
    try {
        const { stdout } = await execAsync(
            'tasklist /fi "IMAGENAME eq pythonw.exe" /fo csv /nh',
            { encoding: 'utf-8' }
        );
        return stdout.includes('pythonw.exe');
    } catch {
        return false;
    }
}

// GET: Check scheduler status
export async function GET() {
    try {
        const isRunning = await isSchedulerRunning();

        return NextResponse.json({
            running: isRunning,
            message: isRunning ? 'Scheduler is running' : 'Scheduler is stopped'
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to check scheduler status' },
            { status: 500 }
        );
    }
}

// POST: Start or stop scheduler
export async function POST(req: NextRequest) {
    try {
        const { action } = await req.json();

        if (action === 'start') {
            const isRunning = await isSchedulerRunning();
            if (isRunning) {
                return NextResponse.json({
                    success: false,
                    message: 'Scheduler is already running'
                });
            }

            // Start scheduler using pythonw (no window)
            const projectRoot = path.resolve(process.cwd());
            const scriptPath = path.join(projectRoot, 'scripts', 'local_scheduler.py');

            // Use spawn with detached option to run in background
            const child = spawn('pythonw', [scriptPath], {
                cwd: projectRoot,
                detached: true,
                stdio: 'ignore'
            });
            child.unref();

            // Wait a moment and check if it started
            await new Promise(resolve => setTimeout(resolve, 1000));
            const nowRunning = await isSchedulerRunning();

            return NextResponse.json({
                success: nowRunning,
                message: nowRunning ? 'Scheduler started successfully' : 'Failed to start scheduler'
            });

        } else if (action === 'stop') {
            // Kill all pythonw processes (scheduler)
            try {
                await execAsync('taskkill /f /im pythonw.exe');
            } catch {
                // Process might not exist
            }

            // Wait and verify
            await new Promise(resolve => setTimeout(resolve, 500));
            const stillRunning = await isSchedulerRunning();

            return NextResponse.json({
                success: !stillRunning,
                message: stillRunning ? 'Failed to stop scheduler' : 'Scheduler stopped successfully'
            });

        } else {
            return NextResponse.json(
                { error: 'Invalid action. Use "start" or "stop"' },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('Scheduler control error:', error);
        return NextResponse.json(
            { error: 'Failed to control scheduler' },
            { status: 500 }
        );
    }
}
