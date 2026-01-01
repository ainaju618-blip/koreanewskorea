import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);
const isWindows = os.platform() === 'win32';

/**
 * POST /api/bot/kill-all
 * Force kill all running scraper and Ollama processes
 */
export async function POST() {
    console.log('[kill-all] Force killing all processes...');
    const results: string[] = [];

    try {
        // 1. Kill Python scraper processes
        if (isWindows) {
            try {
                // Kill all python processes (scrapers)
                await execAsync('taskkill /F /IM python.exe 2>nul');
                results.push('Python processes killed');
            } catch {
                results.push('No Python processes found');
            }
        } else {
            try {
                await execAsync('pkill -f "python.*scraper" 2>/dev/null');
                results.push('Python scrapers killed');
            } catch {
                results.push('No Python scrapers found');
            }
        }

        // 2. Kill Ollama processes
        if (isWindows) {
            try {
                const { stdout } = await execAsync('tasklist /FO CSV /NH');
                const pids: string[] = [];

                const lines = stdout.split('\n');
                for (const line of lines) {
                    if (line.toLowerCase().includes('ollama')) {
                        const match = line.match(/"[^"]*","(\d+)"/);
                        if (match && match[1]) {
                            pids.push(match[1]);
                        }
                    }
                }

                for (const pid of pids) {
                    try {
                        await execAsync(`taskkill /F /PID ${pid}`);
                        results.push(`Ollama PID ${pid} killed`);
                    } catch {
                        // Ignore
                    }
                }

                if (pids.length === 0) {
                    results.push('No Ollama processes found');
                }
            } catch {
                results.push('Ollama check failed');
            }
        } else {
            try {
                await execAsync('pkill -f ollama 2>/dev/null');
                results.push('Ollama processes killed');
            } catch {
                results.push('No Ollama processes found');
            }
        }

        console.log('[kill-all] Results:', results);

        return NextResponse.json({
            success: true,
            message: 'All processes killed',
            details: results
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[kill-all] Error:', message);
        return NextResponse.json({
            success: false,
            message,
            details: results
        }, { status: 500 });
    }
}
