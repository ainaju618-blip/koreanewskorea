/**
 * AI 뉴스 스크래퍼 서비스
 * - 해외 AI 뉴스 RSS 수집 + Groq 번역
 * - Python 스크래퍼 실행
 */

import { spawn } from 'child_process';
import path from 'path';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const AI_NEWS_FEEDS = [
    { key: 'techcrunch', name: 'TechCrunch AI', category: 'AI' },
    { key: 'venturebeat', name: 'VentureBeat AI', category: 'AI' },
    { key: 'mit', name: 'MIT News AI', category: 'AI' }
];

/**
 * AI 뉴스 스크래핑 로그 생성
 */
export async function createAiNewsLog(feed: string, maxArticles: number, apiKey: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('bot_logs')
            .insert({
                region: `ai_news_${feed}`,
                status: 'running',
                log_message: `AI 뉴스 수집 시작 (${feed}, 최대 ${maxArticles}개)`,
                metadata: {
                    feed: feed,
                    max_articles: maxArticles,
                    type: 'ai_news'
                }
            })
            .select('id')
            .single();

        if (error) {
            console.error(`[AI News] 로그 생성 실패:`, error);
            return null;
        }
        return data?.id;
    } catch (e) {
        console.error(`[AI News] 로그 생성 중 예외:`, e);
        return null;
    }
}

/**
 * AI 뉴스 스크래퍼 실행
 */
export async function executeAiNewsScraper(
    logId: number,
    feed: string,
    maxArticles: number,
    apiKey: string
): Promise<{ success: boolean; articlesCount: number; message: string }> {
    const scrapersDir = path.join(process.cwd(), 'scrapers');
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

    const scraperFile = 'ai_news/ai_news_scraper.py';
    const args = [
        scraperFile,
        '--feed', feed,
        '--max-articles', String(maxArticles),
        '--api-key', apiKey
    ];

    console.log(`[AI News] 실행: ${pythonCommand} ${args.join(' ')}`);

    // 시작 상태 업데이트
    try {
        await supabaseAdmin
            .from('bot_logs')
            .update({
                log_message: 'AI 뉴스 스크랩 시작',
                metadata: { started_at: new Date().toISOString(), feed, max_articles: maxArticles }
            })
            .eq('id', logId);
    } catch (e) {
        console.error(`[AI News] 시작 상태 업데이트 실패:`, e);
    }

    const child = spawn(pythonCommand, args, {
        cwd: scrapersDir,
        env: {
            ...process.env,
            PYTHONIOENCODING: 'utf-8',
            BOT_LOG_ID: String(logId)
        }
    });

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        stdoutData += text;
        console.log(`[AI News STDOUT]`, text.trim());
    });

    child.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        stderrData += text;
        console.error(`[AI News STDERR]`, text.trim());
    });

    return new Promise((resolve) => {
        child.on('close', async (code: number | null) => {
            console.log(`[AI News] 프로세스 종료 (Exit Code: ${code})`);

            const isSuccess = code === 0;
            let articlesCount = 0;

            // "총 N개 기사 처리 완료" 패턴 파싱
            try {
                const match = stdoutData.match(/총\s+(\d+)개\s+기사/);
                if (match) {
                    articlesCount = parseInt(match[1], 10);
                }
            } catch (e) { }

            const finalMessage = isSuccess
                ? (articlesCount > 0 ? `${articlesCount}건 수집 완료` : '수집된 기사 없음')
                : `에러 (Code ${code})`;

            const fullLog = stdoutData + (stderrData ? `\n[STDERR]\n${stderrData}` : '');

            try {
                await supabaseAdmin
                    .from('bot_logs')
                    .update({
                        status: isSuccess ? 'success' : 'failed',
                        ended_at: new Date().toISOString(),
                        articles_count: articlesCount,
                        log_message: finalMessage,
                        metadata: { full_log: fullLog.slice(0, 5000), type: 'ai_news' }
                    })
                    .eq('id', logId);
            } catch (err) {
                console.error(`[AI News] 로그 업데이트 실패:`, err);
            }

            resolve({ success: isSuccess, articlesCount, message: finalMessage });
        });

        child.on('error', (err) => {
            resolve({ success: false, articlesCount: 0, message: err.message });
        });
    });
}
