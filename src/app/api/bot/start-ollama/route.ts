import { NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);
const isWindows = os.platform() === 'win32';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// Find Ollama executable path on Windows
async function findOllamaPath(): Promise<string | null> {
    if (!isWindows) return 'ollama';

    try {
        // Method 1: Use where command
        const { stdout } = await execAsync('where ollama');
        const path = stdout.trim().split('\n')[0];
        if (path) {
            console.log(`[start-ollama] Found ollama at: ${path}`);
            return path;
        }
    } catch {
        console.log('[start-ollama] where command failed, trying common paths...');
    }

    // Method 2: Check common installation paths
    const commonPaths = [
        `${process.env.LOCALAPPDATA}\\Programs\\Ollama\\ollama.exe`,
        'C:\\Program Files\\Ollama\\ollama.exe',
        `${process.env.USERPROFILE}\\AppData\\Local\\Programs\\Ollama\\ollama.exe`,
    ];

    for (const testPath of commonPaths) {
        try {
            await execAsync(`if exist "${testPath}" echo found`);
            console.log(`[start-ollama] Found ollama at common path: ${testPath}`);
            return testPath;
        } catch {
            // Path doesn't exist
        }
    }

    return null;
}

// Stop existing Ollama processes (reuse stop-ollama logic)
async function stopExistingProcesses(): Promise<void> {
    if (!isWindows) {
        try {
            await execAsync('pkill -f ollama');
        } catch { /* ignore */ }
        return;
    }

    try {
        // Find and kill all ollama processes
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
                console.log(`[start-ollama] Killed existing process PID ${pid}`);
            } catch { /* ignore */ }
        }

        if (pids.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch {
        console.log('[start-ollama] No existing processes to clean up');
    }
}

// Verify Ollama is running via API
async function verifyOllamaRunning(): Promise<boolean> {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            signal: AbortSignal.timeout(2000)
        });
        return response.ok;
    } catch {
        return false;
    }
}

// Start Ollama service
export async function POST() {
    console.log('[start-ollama] Starting Ollama service...');

    try {
        // Check if already running
        if (await verifyOllamaRunning()) {
            console.log('[start-ollama] Ollama is already running');
            return NextResponse.json({
                success: true,
                message: 'Ollama is already running'
            });
        }

        // Stop any existing processes first
        await stopExistingProcesses();
        await new Promise(resolve => setTimeout(resolve, 500));

        if (isWindows) {
            // Find Ollama executable path
            const ollamaPath = await findOllamaPath();

            if (!ollamaPath) {
                console.error('[start-ollama] Could not find ollama executable');
                return NextResponse.json({
                    success: false,
                    message: 'Ollama executable not found. Please ensure Ollama is installed.'
                }, { status: 500 });
            }

            console.log(`[start-ollama] Starting ollama from: ${ollamaPath}`);

            // Spawn with stdio: 'pipe' to capture output (key fix from consultation)
            let startupLog = '';
            let errorLog = '';

            const child = spawn(ollamaPath, ['serve'], {
                stdio: 'pipe',           // Changed from 'ignore' to 'pipe'
                windowsHide: true,
                detached: true
            });

            // Capture stdout/stderr for debugging
            child.stdout?.on('data', (chunk) => {
                const text = chunk.toString();
                startupLog += text;
                console.log('[start-ollama] stdout:', text.trim());
            });

            child.stderr?.on('data', (chunk) => {
                const text = chunk.toString();
                errorLog += text;
                console.log('[start-ollama] stderr:', text.trim());
            });

            child.on('error', (err) => {
                console.error('[start-ollama] Process error:', err.message);
                errorLog += err.message;
            });

            child.unref(); // Allow Node.js to exit while ollama runs

            // Poll for readiness with both API check and log detection
            const maxWaitTime = 30000; // 30 seconds (increased for safety)
            const startTime = Date.now();
            let lastError = '';

            while (Date.now() - startTime < maxWaitTime) {
                // Check API endpoint
                try {
                    const healthCheck = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
                        signal: AbortSignal.timeout(2000)
                    });
                    if (healthCheck.ok) {
                        console.log('[start-ollama] Ollama is ready!');
                        return NextResponse.json({
                            success: true,
                            message: 'Ollama started successfully',
                            startupLog: startupLog.slice(0, 500)
                        });
                    }
                    lastError = `HTTP ${healthCheck.status}`;
                } catch (e) {
                    lastError = e instanceof Error ? e.message : 'Connection refused';
                }

                // Early detection via log
                if (startupLog.toLowerCase().includes('listening') ||
                    startupLog.toLowerCase().includes('ready')) {
                    // Double-check with API
                    await new Promise(resolve => setTimeout(resolve, 500));
                    if (await verifyOllamaRunning()) {
                        console.log('[start-ollama] Detected ready via log');
                        return NextResponse.json({
                            success: true,
                            message: 'Ollama started successfully (detected via log)',
                            startupLog: startupLog.slice(0, 500)
                        });
                    }
                }

                // Check for errors in stderr
                if (errorLog.includes('address already in use') ||
                    errorLog.includes('bind: address already in use')) {
                    // Another instance might be starting
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    if (await verifyOllamaRunning()) {
                        return NextResponse.json({
                            success: true,
                            message: 'Ollama is running (port was busy)'
                        });
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Timeout - return detailed error info
            console.log(`[start-ollama] Timeout after ${maxWaitTime/1000}s. Last error: ${lastError}`);
            console.log(`[start-ollama] Startup log: ${startupLog.slice(-300)}`);
            console.log(`[start-ollama] Error log: ${errorLog.slice(-300)}`);

            return NextResponse.json({
                success: false,
                message: `Ollama failed to start within ${maxWaitTime/1000} seconds`,
                lastError,
                startupLog: startupLog.slice(-300),
                errorLog: errorLog.slice(-300)
            }, { status: 503 });

        } else {
            // Linux/Mac
            const child = spawn('ollama', ['serve'], {
                stdio: 'pipe',
                detached: true
            });

            child.stdout?.on('data', (chunk) => {
                console.log('[start-ollama] stdout:', chunk.toString().trim());
            });

            child.stderr?.on('data', (chunk) => {
                console.log('[start-ollama] stderr:', chunk.toString().trim());
            });

            child.unref();

            // Wait for startup
            const maxWaitTime = 20000;
            const startTime = Date.now();

            while (Date.now() - startTime < maxWaitTime) {
                if (await verifyOllamaRunning()) {
                    console.log('[start-ollama] Ollama is ready!');
                    return NextResponse.json({
                        success: true,
                        message: 'Ollama started successfully'
                    });
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            return NextResponse.json({
                success: false,
                message: 'Ollama failed to start within 20 seconds'
            }, { status: 503 });
        }

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[start-ollama] Error:', message);
        return NextResponse.json({
            success: false,
            message
        }, { status: 500 });
    }
}
