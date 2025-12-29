import { NextResponse } from 'next/server';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// GET: Check if Ollama is running
export async function GET() {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (response.ok) {
            const data = await response.json();
            const models = data.models || [];
            const hasQwen = models.some((m: { name: string }) =>
                m.name.includes('qwen3') || m.name.includes('qwen2')
            );

            return NextResponse.json({
                online: true,
                models: models.map((m: { name: string }) => m.name),
                hasQwen,
                baseUrl: OLLAMA_BASE_URL
            });
        }

        return NextResponse.json({
            online: false,
            error: 'Ollama not responding'
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            online: false,
            error: errorMessage,
            hint: 'Run "ollama serve" to start Ollama'
        });
    }
}
