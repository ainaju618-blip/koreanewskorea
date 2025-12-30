import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import os from 'os';

const isWindows = os.platform() === 'win32';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// Start Ollama service
export async function POST() {
    console.log('[start-ollama] Starting Ollama service...');

    try {
        // First, kill any existing Ollama process
        if (isWindows) {
            await new Promise<void>((resolve) => {
                const kill = spawn('powershell', [
                    '-WindowStyle', 'Hidden',
                    '-Command', 'Stop-Process -Name ollama -Force -ErrorAction SilentlyContinue'
                ], {
                    detached: true,
                    stdio: 'ignore',
                    windowsHide: true
                });
                kill.on('close', () => resolve());
                kill.on('error', () => resolve());
                setTimeout(() => resolve(), 2000);
            });
        } else {
            await new Promise<void>((resolve) => {
                const kill = spawn('pkill', ['-f', 'ollama'], {
                    shell: true,
                    detached: true,
                    stdio: 'ignore'
                });
                kill.on('close', () => resolve());
                kill.on('error', () => resolve());
                setTimeout(() => resolve(), 2000);
            });
        }

        // Wait for process to terminate
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Start Ollama serve
        console.log('[start-ollama] Spawning ollama serve...');
        let ollamaProcess;
        if (isWindows) {
            ollamaProcess = spawn('powershell', [
                '-WindowStyle', 'Hidden',
                '-Command', 'Start-Process -FilePath ollama -ArgumentList serve -WindowStyle Hidden'
            ], {
                detached: true,
                stdio: 'ignore',
                windowsHide: true
            });
        } else {
            ollamaProcess = spawn('ollama', ['serve'], {
                shell: true,
                detached: true,
                stdio: 'ignore'
            });
        }

        ollamaProcess.unref();

        // Wait for Ollama to be ready (poll health endpoint)
        const maxWaitTime = 20000; // 20 seconds (increased for slower systems)
        const startTime = Date.now();
        let lastError = '';

        while (Date.now() - startTime < maxWaitTime) {
            try {
                const healthCheck = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
                    signal: AbortSignal.timeout(3000)
                });
                if (healthCheck.ok) {
                    console.log('[start-ollama] Ollama is ready!');
                    return NextResponse.json({
                        success: true,
                        message: 'Ollama started successfully'
                    });
                }
                lastError = `HTTP ${healthCheck.status}`;
            } catch (e) {
                lastError = e instanceof Error ? e.message : 'Connection refused';
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`[start-ollama] Timeout. Last error: ${lastError}`);
        return NextResponse.json({
            success: false,
            message: `Ollama failed to start within 20 seconds (${lastError})`
        }, { status: 503 });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[start-ollama] Error:', message);
        return NextResponse.json({
            success: false,
            message
        }, { status: 500 });
    }
}
