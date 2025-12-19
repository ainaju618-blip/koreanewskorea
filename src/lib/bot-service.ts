
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const ALL_REGIONS = [
    "gwangju", "jeonnam", "naju", "mokpo", "yeosu", "suncheon", "gwangyang",
    "damyang", "gokseong", "gurye", "goheung", "boseong", "hwasun", "jangheung",
    "gangjin", "haenam", "yeongam", "muan", "hampyeong", "yeonggwang",
    "jangseong", "wando", "jindo", "shinan",
    "gwangju_edu", "jeonnam_edu"
];

/**
 * 실행 중인 스크래퍼 프로세스 관리
 * - Key: jobId (logId)
 * - Value: ChildProcess
 */
const runningProcesses = new Map<number, ChildProcess>();

// Process timeout: 30 minutes max execution time
const PROCESS_TIMEOUT_MS = 30 * 60 * 1000;
// Max stdout/stderr buffer size: 500KB to prevent memory leak
const MAX_BUFFER_SIZE = 500 * 1024;

/**
 * 실행 중인 프로세스 목록 조회
 */
export function getRunningProcesses(): number[] {
    return Array.from(runningProcesses.keys());
}

/**
 * 특정 프로세스 중지 (개별 중지)
 * @returns true if process was killed, false if not found
 */
export function killProcess(jobId: number): boolean {
    const proc = runningProcesses.get(jobId);
    if (proc) {
        console.log(`[bot-service] Killing process for jobId=${jobId}`);
        proc.kill('SIGTERM');
        runningProcesses.delete(jobId);
        return true;
    }
    console.log(`[bot-service] Process not found for jobId=${jobId}`);
    return false;
}

/**
 * 모든 프로세스 중지 (전체 중지)
 * @returns 중지된 프로세스 수
 */
export function killAllProcesses(): number {
    const count = runningProcesses.size;
    console.log(`[bot-service] Killing all ${count} processes`);

    for (const [jobId, proc] of runningProcesses) {
        try {
            proc.kill('SIGTERM');
            console.log(`[bot-service] Killed process jobId=${jobId}`);
        } catch (e) {
            console.error(`[bot-service] Failed to kill jobId=${jobId}:`, e);
        }
    }
    runningProcesses.clear();
    return count;
}

/**
 * 봇 실행 로그를 먼저 생성하고 ID를 반환합니다.
 */
export async function createBotLog(region: string, days: number, dryRun: boolean) {
    try {
        const { data, error } = await supabaseAdmin
            .from('bot_logs')
            .insert({
                region: region,
                status: 'running',
                log_message: `스크래퍼 시작 대기 (기간: ${days}일, DryRun: ${dryRun})`,
                metadata: { dry_run: dryRun, days: days }
            })
            .select('id')
            .single();

        if (error) {
            console.error(`[${region}] 로그 생성 실패:`, error);
            return null;
        }
        return data?.id;
    } catch (e) {
        console.error(`[${region}] 로그 생성 중 예외:`, e);
        return null;
    }
}

/**
 * 실제 Python 스크래퍼를 실행하고 로그를 업데이트합니다.
 * @param logId - 로그 ID (Python 환경변수로 전달)
 * @param region - 지역 코드
 * @param startDate - 수집 시작 날짜 (YYYY-MM-DD)
 * @param endDate - 수집 종료 날짜 (YYYY-MM-DD)
 * @param dryRun - 테스트 모드 여부
 */
export async function executeScraper(
    logId: number,
    region: string,
    startDate: string,
    endDate: string,
    dryRun: boolean
) {
    const scrapersDir = path.join(process.cwd(), 'scrapers');
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

    // cwd가 scrapers 디렉토리이므로 상대 경로 사용
    let scraperFile = 'universal_scraper.py';
    let useRegionArg = true;

    const fs = require('fs');

    // 1. 폴더 구조 스크래퍼 우선 체크 (gwangju/gwangju_scraper.py)
    const folderScraperPath = path.join(scrapersDir, region, `${region}_scraper.py`);
    // 2. 루트 스크래퍼 fallback (기존 호환성)
    const rootScraperPath = path.join(scrapersDir, `${region}_scraper.py`);

    if (fs.existsSync(folderScraperPath)) {
        scraperFile = `${region}/${region}_scraper.py`;
        useRegionArg = false;
        console.log(`[${region}] 폴더 스크래퍼 사용: ${scraperFile}`);
    } else if (fs.existsSync(rootScraperPath)) {
        scraperFile = `${region}_scraper.py`;
        useRegionArg = false;
        console.log(`[${region}] 루트 스크래퍼 사용: ${scraperFile}`);
    } else {
        console.log(`[${region}] 공용 스크래퍼 사용: ${scraperFile}`);
    }

    // 날짜 차이 계산 (기존 --days 인자 호환성)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const args = [scraperFile];
    if (useRegionArg) {
        args.push('--region', region);
    }
    // Phase 2: startDate/endDate 직접 전달 (스크래퍼가 지원하면 사용)
    args.push('--start-date', startDate);
    args.push('--end-date', endDate);
    // 기존 --days 인자도 호환성을 위해 유지
    args.push('--days', String(diffDays));
    args.push('--max-articles', '30');  // 최대 수집 기사 수 제한
    if (dryRun) args.push('--dry-run');

    console.log(`[${region}] 실행 명령: ${pythonCommand} ${args.join(' ')}`);

    // ★ 스크래퍼 시작 전 상태 업데이트 (실시간 진행 표시용)
    try {
        await supabaseAdmin
            .from('bot_logs')
            .update({
                log_message: '스크랩 시작',
                metadata: { started_at: new Date().toISOString(), startDate, endDate }
            })
            .eq('id', logId);
    } catch (e) {
        console.error(`[${region}] 시작 상태 업데이트 실패:`, e);
    }

    // Phase 3: logId를 환경변수로 전달하여 Python에서 사용 가능
    const child = spawn(pythonCommand, args, {
        cwd: scrapersDir,
        env: {
            ...process.env,
            PYTHONIOENCODING: 'utf-8',
            BOT_LOG_ID: String(logId)  // Python에서 os.getenv('BOT_LOG_ID')로 접근 가능
        }
    });

    // ★ 프로세스를 글로벌 Map에 저장 (중지 기능용)
    runningProcesses.set(logId, child);
    console.log(`[${region}] Process registered: jobId=${logId}, total running=${runningProcesses.size}`);

    let stdoutData = '';
    let stderrData = '';
    let lastLogUpdate = Date.now();
    const LOG_UPDATE_INTERVAL = 1000; // 1초마다 DB 업데이트

    // ★ 실시간 로그 업데이트 함수 (debounced)
    const updateLogRealtime = async (message: string) => {
        const now = Date.now();
        if (now - lastLogUpdate < LOG_UPDATE_INTERVAL) return; // throttle
        lastLogUpdate = now;

        try {
            // 마지막 3줄만 표시 (실시간 모니터링용)
            const lines = message.trim().split('\n');
            const recentLines = lines.slice(-3).join('\n');

            await supabaseAdmin
                .from('bot_logs')
                .update({ log_message: recentLines || 'Processing...' })
                .eq('id', logId);
        } catch (e) {
            // Silently ignore update errors to not interrupt scraping
        }
    };

    child.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        // Buffer size limit to prevent memory leak
        if (stdoutData.length < MAX_BUFFER_SIZE) {
            stdoutData += text.slice(0, MAX_BUFFER_SIZE - stdoutData.length);
        }
        console.log(`[${region} STDOUT]`, text.trim());

        // ★ 실시간 로그 업데이트
        updateLogRealtime(stdoutData);
    });

    child.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        // Buffer size limit to prevent memory leak
        if (stderrData.length < MAX_BUFFER_SIZE) {
            stderrData += text.slice(0, MAX_BUFFER_SIZE - stderrData.length);
        }
        console.error(`[${region} STDERR]`, text.trim());
    });

    child.on('error', (err: Error) => {
        console.error(`[${region}] 프로세스 스폰 에러:`, err.message);
        if (stderrData.length < MAX_BUFFER_SIZE) {
            stderrData += `\n[SPAWN ERROR] ${err.message}`;
        }
    });

    // Process timeout handler (30 minutes)
    const timeoutId = setTimeout(() => {
        if (runningProcesses.has(logId)) {
            console.log(`[${region}] Process timeout after ${PROCESS_TIMEOUT_MS / 1000}s, killing...`);
            child.kill('SIGTERM');

            // Force kill after 5 seconds if still alive
            setTimeout(() => {
                if (!child.killed && runningProcesses.has(logId)) {
                    console.log(`[${region}] Force killing process (SIGKILL)`);
                    child.kill('SIGKILL');
                }
            }, 5000);
        }
    }, PROCESS_TIMEOUT_MS);

    return new Promise<void>((resolve) => {
        child.on('close', async (code: number | null, signal: string | null) => {
            // Clear timeout on process close
            clearTimeout(timeoutId);
            // 프로세스 종료 시 Map에서 제거
            runningProcesses.delete(logId);
            console.log(`[${region}] 프로세스 종료 (Exit Code: ${code}, Signal: ${signal}), remaining=${runningProcesses.size}`);

            const isKilled = signal === 'SIGTERM' || signal === 'SIGKILL';
            const isSuccess = code === 0 && !isKilled;
            let status = isKilled ? 'stopped' : (isSuccess ? 'success' : 'failed');
            let articlesCount = 0;

            // Parse detailed stats JSON if available
            let detailedStats: any = null;
            let skippedCount = 0;
            try {
                // Look for detailed stats JSON between markers
                const statsMatch = stdoutData.match(/===DETAILED_STATS_START===\s*([\s\S]*?)\s*===DETAILED_STATS_END===/);
                if (statsMatch && statsMatch[1]) {
                    detailedStats = JSON.parse(statsMatch[1].trim());
                    articlesCount = detailedStats.summary?.total_created || 0;
                    skippedCount = detailedStats.summary?.total_skipped || 0;
                }
            } catch (e) {
                console.log(`[${region}] Could not parse detailed stats, falling back to regex`);
            }

            // Fallback: legacy regex pattern
            if (!detailedStats) {
                try {
                    const match = stdoutData.match(/신규\s+(\d+),\s+중복\s*(\d*)/);
                    if (match) {
                        articlesCount = parseInt(match[1], 10);
                        skippedCount = match[2] ? parseInt(match[2], 10) : 0;
                    }
                } catch (e) { }
            }

            // Build final message with more detail
            let finalMessage: string;
            if (isKilled) {
                finalMessage = '사용자에 의해 중지됨';
            } else if (isSuccess) {
                if (articlesCount > 0) {
                    finalMessage = skippedCount > 0
                        ? `${articlesCount}건 수집 완료 (중복 ${skippedCount}건 제외)`
                        : `${articlesCount}건 수집 완료`;
                } else if (skippedCount > 0) {
                    finalMessage = `중복 ${skippedCount}건 (신규 기사 없음)`;
                } else {
                    finalMessage = '수집된 기사 없음';
                }
            } else {
                finalMessage = `프로세스 에러 (Code ${code})`;
            }

            const fullLog = stdoutData + (stderrData ? `\n[STDERR]\n${stderrData}` : '');

            // Build metadata with detailed stats
            const metadata: any = {
                full_log: fullLog.slice(0, 5000),
                skipped_count: skippedCount
            };

            // Add detailed breakdown if available
            if (detailedStats) {
                metadata.detailed_stats = {
                    summary: detailedStats.summary,
                    date_breakdown: detailedStats.date_breakdown,
                    duration_seconds: detailedStats.duration_seconds,
                    errors: detailedStats.errors
                };
            }

            // Update log record with completion status
            const { error: updateError } = await supabaseAdmin
                .from('bot_logs')
                .update({
                    status: status,
                    ended_at: new Date().toISOString(),
                    articles_count: articlesCount,
                    log_message: finalMessage,
                    metadata: metadata
                })
                .eq('id', logId);

            if (updateError) {
                console.error(`[${region}] Log update failed for logId=${logId}:`, updateError.message);
            } else {
                console.log(`[${region}] Log updated: status=${status}, articles=${articlesCount}`);
            }

            resolve();
        });

        child.on('error', () => resolve()); // 에러 시에도 resolve 호출하여 다음 작업 진행
    });
}
