import { NextResponse } from 'next/server';

// Import processing stats from parent route
// Note: This shares the same global state as the main route

// Global state reference (same variables as parent)
declare const processingStats: {
    total: number;
    processed: number;
    published: number;
    held: number;
    failed: number;
    startedAt: string | null;
};

declare const isProcessingActive: boolean;

// SSE endpoint for real-time progress updates
export async function GET() {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // Send initial status
            const sendUpdate = () => {
                try {
                    // Fetch current status from main API
                    const data = {
                        isActive: global.isProcessingActive || false,
                        stats: global.processingStats || {
                            total: 0,
                            processed: 0,
                            published: 0,
                            held: 0,
                            failed: 0,
                            startedAt: null
                        },
                        timestamp: new Date().toISOString()
                    };

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                    return data.isActive;
                } catch {
                    return false;
                }
            };

            // Send updates every 2 seconds
            let isActive = sendUpdate();
            const intervalId = setInterval(() => {
                isActive = sendUpdate();
                if (!isActive) {
                    clearInterval(intervalId);
                    controller.close();
                }
            }, 2000);

            // Timeout after 10 minutes
            setTimeout(() => {
                clearInterval(intervalId);
                controller.close();
            }, 600000);
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
