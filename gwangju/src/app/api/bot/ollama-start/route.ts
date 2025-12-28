import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// Check if Ollama is already running
async function isOllamaRunning(): Promise<boolean> {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });
        return response.ok;
    } catch {
        return false;
    }
}

// Wait for Ollama to start
async function waitForOllama(maxWaitMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 1000; // Check every 1 second

    while (Date.now() - startTime < maxWaitMs) {
        if (await isOllamaRunning()) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    return false;
}

// POST: Start Ollama if not running
export async function POST() {
    try {
        // Check if already running
        if (await isOllamaRunning()) {
            return NextResponse.json({
                success: true,
                message: 'Ollama is already running',
                alreadyRunning: true
            });
        }

        console.log('[ollama-start] Starting Ollama...');

        // Start Ollama in background (Windows)
        const ollamaProcess = spawn('ollama', ['serve'], {
            detached: true,
            stdio: 'ignore',
            shell: true,
            windowsHide: true
        });

        // Unref to allow parent process to exit independently
        ollamaProcess.unref();

        console.log('[ollama-start] Ollama process spawned, waiting for startup...');

        // Wait for Ollama to be ready (max 30 seconds)
        const isReady = await waitForOllama(30000);

        if (isReady) {
            console.log('[ollama-start] Ollama is now running');
            return NextResponse.json({
                success: true,
                message: 'Ollama started successfully',
                alreadyRunning: false
            });
        } else {
            console.error('[ollama-start] Ollama failed to start within timeout');
            return NextResponse.json({
                success: false,
                error: 'Ollama failed to start within 30 seconds'
            }, { status: 500 });
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[ollama-start] Error:', errorMessage);

        return NextResponse.json({
            success: false,
            error: errorMessage,
            hint: 'Make sure Ollama is installed. Download from https://ollama.ai'
        }, { status: 500 });
    }
}
