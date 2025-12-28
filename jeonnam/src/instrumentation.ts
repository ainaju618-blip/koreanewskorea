
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        try {
            // 동적 임포트로 순환 참조 방지 및 실행 시점 제어
            const { initScheduler } = await import('./lib/scheduler');
            initScheduler();
        } catch (e) {
            console.error('[Instrumentation] Scheduler init failed:', e);
        }
    }
}
