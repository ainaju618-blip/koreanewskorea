import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);
const isWindows = os.platform() === 'win32';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// Find Ollama-related process PIDs on Windows
async function findOllamaPids(): Promise<string[]> {
    try {
        // Use tasklist to find all ollama-related processes
        const { stdout } = await execAsync('tasklist /FO CSV /NH');
        const pids: string[] = [];

        // Parse CSV output to find ollama processes
        const lines = stdout.split('\n');
        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            // Match any process containing 'ollama' in the name
            if (lowerLine.includes('ollama')) {
                // CSV format: "process_name","PID","Session Name","Session#","Mem Usage"
                const match = line.match(/"[^"]*","(\d+)"/);
                if (match && match[1]) {
                    pids.push(match[1]);
                    console.log(`[stop-ollama] Found Ollama process: ${line.trim()}`);
                }
            }
        }

        return pids;
    } catch (error) {
        console.error('[stop-ollama] Error finding PIDs:', error);
        return [];
    }
}

// Kill process by PID on Windows
async function killByPid(pid: string): Promise<boolean> {
    try {
        await execAsync(`taskkill /F /PID ${pid}`);
        console.log(`[stop-ollama] Killed PID ${pid}`);
        return true;
    } catch (error) {
        console.error(`[stop-ollama] Failed to kill PID ${pid}:`, error);
        return false;
    }
}

// Verify Ollama is stopped by checking API endpoint
async function verifyOllamaStopped(): Promise<boolean> {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            signal: AbortSignal.timeout(2000)
        });
        return !response.ok; // If response is OK, Ollama is still running
    } catch {
        // Connection refused = Ollama is stopped (expected)
        return true;
    }
}

// Stop Ollama service
export async function POST() {
    console.log('[stop-ollama] Stopping Ollama service...');

    try {
        if (isWindows) {
            // Step 1: Find all Ollama-related PIDs
            const pids = await findOllamaPids();

            if (pids.length === 0) {
                console.log('[stop-ollama] No Ollama processes found');
                // Double check via API
                if (await verifyOllamaStopped()) {
                    return NextResponse.json({
                        success: true,
                        message: 'Ollama is already stopped'
                    });
                }
            }

            // Step 2: Kill each PID
            console.log(`[stop-ollama] Killing ${pids.length} Ollama processes...`);
            const results = await Promise.all(pids.map(killByPid));
            const successCount = results.filter(r => r).length;
            console.log(`[stop-ollama] Killed ${successCount}/${pids.length} processes`);

            // Step 3: Wait for processes to fully terminate
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Step 4: Verify via API
            const isStopped = await verifyOllamaStopped();

            if (!isStopped) {
                // Retry with name-based kill as fallback
                console.log('[stop-ollama] PID kill failed, trying name-based fallback...');
                try {
                    await execAsync('taskkill /F /IM ollama.exe');
                } catch { /* ignore */ }
                try {
                    await execAsync('taskkill /F /IM ollama_llama_server.exe');
                } catch { /* ignore */ }
                try {
                    await execAsync('taskkill /F /IM ollama_runner.exe');
                } catch { /* ignore */ }

                await new Promise(resolve => setTimeout(resolve, 1500));

                if (!(await verifyOllamaStopped())) {
                    console.log('[stop-ollama] Warning: Ollama still responding after all kill attempts');
                    return NextResponse.json({
                        success: false,
                        message: 'Failed to stop Ollama (may require admin privileges)'
                    });
                }
            }

            console.log('[stop-ollama] Ollama stopped successfully');
            return NextResponse.json({
                success: true,
                message: `Ollama stopped (${successCount} processes terminated)`
            });

        } else {
            // Linux/Mac - use pkill
            try {
                await execAsync('pkill -f ollama');
            } catch {
                // pkill returns non-zero if no process matched
            }

            await new Promise(resolve => setTimeout(resolve, 2000));

            if (!(await verifyOllamaStopped())) {
                return NextResponse.json({
                    success: false,
                    message: 'Failed to stop Ollama'
                });
            }

            console.log('[stop-ollama] Ollama stopped successfully');
            return NextResponse.json({
                success: true,
                message: 'Ollama stopped'
            });
        }

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[stop-ollama] Error:', message);
        return NextResponse.json({
            success: false,
            message
        }, { status: 500 });
    }
}
