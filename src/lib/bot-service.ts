
import { spawn } from 'child_process';
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
 */
export async function executeScraper(logId: number, region: string, days: number, dryRun: boolean) {
    const scrapersDir = path.join(process.cwd(), '../scrapers');
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

    const args = [scraperFile];
    if (useRegionArg) {
        args.push('--region', region);
    }
    args.push('--days', String(days));
    if (dryRun) args.push('--dry-run');

    console.log(`[${region}] 실행 명령: ${pythonCommand} ${args.join(' ')}`);

    // ★ 스크래퍼 시작 전 상태 업데이트 (실시간 진행 표시용)
    try {
        await supabaseAdmin
            .from('bot_logs')
            .update({
                log_message: '스크랩 시작',
                metadata: { started_at: new Date().toISOString() }
            })
            .eq('id', logId);
    } catch (e) {
        console.error(`[${region}] 시작 상태 업데이트 실패:`, e);
    }

    // 인코딩 문제 해결을 위해 PYTHONIOENCODING 설정 추가 및 cwd 설정
    const child = spawn(pythonCommand, args, {
        cwd: scrapersDir,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        stdoutData += text;
        console.log(`[${region} STDOUT]`, text.trim());
    });

    child.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        stderrData += text;
        console.error(`[${region} STDERR]`, text.trim());
    });

    child.on('error', (err: Error) => {
        console.error(`[${region}] 프로세스 스폰 에러:`, err.message);
        stderrData += `\n[SPAWN ERROR] ${err.message}`;
    });

    return new Promise<void>((resolve) => {
        child.on('close', async (code: number | null) => {
            console.log(`[${region}] 프로세스 종료 (Exit Code: ${code})`);

            const isSuccess = code === 0;
            let status = isSuccess ? 'success' : 'failed';
            let articlesCount = 0;

            try {
                // "📊 결과: 신규 5, 중복 0, 실패 0" 패턴 파싱
                const match = stdoutData.match(/신규\s+(\d+),\s+중복/);
                if (match) {
                    articlesCount = parseInt(match[1], 10);
                }
            } catch (e) { }

            const finalMessage = isSuccess
                ? (articlesCount > 0 ? `${articlesCount}건 수집 완료` : '수집된 기사 없음')
                : `프로세스 에러 (Code ${code})`;

            const fullLog = stdoutData + (stderrData ? `\n[STDERR]\n${stderrData}` : '');

            try {
                // 기존 로그 레코드 업데이트
                await supabaseAdmin
                    .from('bot_logs')
                    .update({
                        status: status,
                        ended_at: new Date().toISOString(),
                        articles_count: articlesCount,
                        log_message: finalMessage,
                        metadata: { full_log: fullLog.slice(0, 5000) }
                    })
                    .eq('id', logId);
            } catch (err) {
                console.error(`[${region}] 로그 업데이트 실패:`, err);
            }

            resolve();
        });

        child.on('error', () => resolve()); // 에러 시에도 resolve 호출하여 다음 작업 진행
    });
}
