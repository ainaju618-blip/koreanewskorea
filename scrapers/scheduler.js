/**
 * 코리아뉴스 스마트 스케줄러 v3.0 (초기화 버전)
 * ================================================
 * 
 * 핵심 원칙: 단순함 + 절대 죽지 않음
 * 
 * 기능:
 *   1. 스크래핑: 1시간마다 (Fire-and-Forget)
 *   2. AI 가공: 2분마다
 *   3. Slack 보고: 15분, 45분
 *   4. 일일 보고: 22:15
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ============================================================
// 전역 에러 핸들러 (절대 죽지 않음)
// ============================================================
process.on('uncaughtException', (err) => {
    console.error(`[FATAL] Uncaught Exception: ${err.message}`);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
    console.error(`[FATAL] Unhandled Rejection: ${reason}`);
});

// ============================================================
// 설정
// ============================================================
const CONFIG = {
    SCRAPE_INTERVAL_MS: 60 * 60 * 1000,   // 1시간
    PROCESS_INTERVAL_MS: 20 * 1000,       // 20초 (고속 모드)
    ACTIVE_START_HOUR: 9,
    ACTIVE_END_HOUR: 22,
    LOG_DIR: 'd:/cbt/batch-logs',
    ALL_REGIONS: [
        'gwangju', 'jeonnam', 'gwangju_edu', 'jeonnam_edu', 'jeonnam_edu_org', 'jeonnam_edu_school',
        'naju_council', 'jindo_council',
        'mokpo', 'yeosu', 'suncheon', 'naju', 'gwangyang', 'damyang', 'gokseong', 'gurye',
        'goheung', 'boseong', 'hwasun', 'jangheung', 'gangjin', 'haenam', 'yeongam', 'muan',
        'hampyeong', 'yeonggwang', 'jangseong', 'wando', 'jindo', 'shinan'
    ]
};

// ============================================================
// 상태 추적 (최소화)
// ============================================================
let processedToday = 0;
let lastResetDate = new Date().toDateString();
let intervalStats = { scrapedCount: 0, processedSuccess: 0, processedFail: 0 };

// ============================================================
// 로깅
// ============================================================
function log(msg, level = 'INFO') {
    const time = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const line = `[${time}] [${level}] ${msg}`;
    console.log(line);

    if (!fs.existsSync(CONFIG.LOG_DIR)) {
        fs.mkdirSync(CONFIG.LOG_DIR, { recursive: true });
    }

    // [FIX] KST 기준으로 날짜 파일 생성 (기존 toISOString은 UTC라 0~9시에 날짜 꼬임)
    const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
    const kstDate = new Date(new Date().getTime() + KR_TIME_DIFF);
    const dateStr = kstDate.toISOString().split('T')[0];

    const logPath = path.join(CONFIG.LOG_DIR, `${dateStr}.log`);
    fs.appendFileSync(logPath, line + '\n');
}

function isActiveHours() {
    const hour = new Date().getHours();
    return hour >= CONFIG.ACTIVE_START_HOUR && hour < CONFIG.ACTIVE_END_HOUR;
}

// ============================================================
// 스크래핑 실행 (Fire-and-Forget - 절대 블로킹 안 함)
// ============================================================
function runScraping() {
    if (!isActiveHours()) {
        log(`비활성 시간. 스크래핑 건너뜀.`);
        return;
    }

    log('========== 스크래핑 시작 (Fire-and-Forget) ==========');

    const regionList = CONFIG.ALL_REGIONS.join(',');

    const proc = spawn('node', [
        'scrapers/batch_daily.js',
        '--mode=scrape-direct',
        `--regions=${regionList}`
    ], {
        cwd: path.join(__dirname, '..'),
        detached: true,
        stdio: 'ignore'  // 완전히 분리
    });

    proc.unref();  // 자식 프로세스 완전 분리

    intervalStats.scrapedCount++;
    log('스크래핑 프로세스 시작됨 (백그라운드)');
}

// ============================================================
// AI 가공 실행 (2분마다 1건)
// ============================================================
async function runSingleProcess() {
    // 날짜 변경 시 카운터 리셋
    const todayStr = new Date().toDateString();
    if (todayStr !== lastResetDate) {
        processedToday = 0;
        lastResetDate = todayStr;
        log('일일 카운터 리셋');
    }

    try {
        const { callAI, getStatus } = require('./ai_provider');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        const response = await fetch(
            `${supabaseUrl}/rest/v1/posts?ai_processed=eq.false&status=eq.draft&order=created_at.asc&limit=1`,
            {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                }
            }
        );

        if (!response.ok) {
            log(`Supabase 조회 실패: ${response.status}`, 'ERROR');
            return;
        }

        const articles = await response.json();
        if (articles.length === 0) {
            return; // 조용히 대기
        }

        const article = articles[0];
        const status = getStatus();

        log(`[AI] 가공 시작: ${article.title?.slice(0, 30)}... (${status.currentProvider})`);

        const prompt = `당신은 대한민국 지역 뉴스 전문 편집자입니다. 제공된 보도자료를 뉴스 기사로 변환하고 검증하십시오.

[작업 규칙]
1. 뉴스 스타일 변환: 오직 한국어만 사용하여 정중하고 객관적인 뉴스 문체("~했다", "~밝혔다")로 다듬으십시오.
2. 내용 보존 (매우 중요): 보도자료의 모든 문단과 세부 내용을 빠짐없이 포함하십시오. 절대 내용을 요약하거나 줄이지 마십시오.
3. 순수 본문 출력: 본문 시작 부분에 "본문:", "내용:", "[본문]" 같은 접두사를 절대 붙이지 마십시오.
4. 팩트체크 및 등급: 원본과 대조하여 사실관계 일치 여부를 판별하고 등급(A/B/C/D)을 부여하십시오.

[출력 형식]
반드시 아래 구조의 JSON 객체 하나만 출력하십시오:
{
  "title": "가공된 뉴스 제목",
  "subtitle": "25자 내외의 명확한 부제목",
  "content": "순수 본문 내용 (요약 금지, 접두사 금지)",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "grade": "A",
  "verify": "팩트 검증 결과 요약"
}

===== 원본 보도자료 =====
제목: ${article.title}
본문: ${article.content?.slice(0, 4000)}`;

        const systemPrompt = 'You are a JSON generator. You must output ONLY valid JSON without any text before or after.';
        const aiRaw = await callAI(systemPrompt, prompt);

        const jsonMatch = aiRaw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            log(`[AI] JSON 형식을 찾을 수 없음`, 'ERROR');
            intervalStats.processedFail++;
            return;
        }

        let result = JSON.parse(jsonMatch[0]);

        // 후처리
        if (result.content) {
            result.content = result.content
                .replace(/\[제목:[^\]]*\]/g, '')
                .replace(/\[부제목:[^\]]*\]/g, '')
                .replace(/^제목\s*:.*?\n+/g, '')
                .replace(/^부제목\s*:.*?\n+/g, '')
                .replace(/^본문\s*:.*?\n+/g, '')
                .replace(/^내용\s*:.*?\n+/g, '')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
        }

        const articleStatus = (result.grade === 'A' || result.grade === 'B') ? 'published' : 'draft';

        const updateData = {
            title: result.title,
            subtitle: result.subtitle,
            content: result.content,
            tags: result.tags,
            ai_processed: true,
            status: articleStatus,
            published_at: articleStatus === 'published' ? new Date().toISOString() : null
        };

        const updateRes = await fetch(`${supabaseUrl}/rest/v1/posts?id=eq.${article.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(updateData)
        });

        if (updateRes.ok) {
            processedToday++;
            intervalStats.processedSuccess++;
            log(`[AI] OK: ${result.title?.slice(0, 25)}... (${result.grade}, 오늘 ${processedToday}건)`);
        } else {
            intervalStats.processedFail++;
            log(`[AI] FAIL: ${await updateRes.text()}`, 'ERROR');
        }

    } catch (e) {
        log(`[AI] 오류: ${e.message}`, 'ERROR');
        intervalStats.processedFail++;
    }
}

// ============================================================
// Slack 보고 (30분 정기)
// ============================================================
async function sendPeriodicReport() {
    const slackUrl = process.env.SLACK_WEBHOOK_URL;
    if (!slackUrl) {
        log('Slack URL 없음', 'WARN');
        return;
    }

    const hour = new Date().getHours();
    if (hour < 9 || hour >= 22) return;

    const { getStatus } = require('./ai_provider');
    const status = getStatus();
    const time = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    const message = {
        text: `[정기 보고] ${time}\n` +
            `- 스크래핑: ${intervalStats.scrapedCount}회\n` +
            `- AI 가공: 성공 ${intervalStats.processedSuccess} / 실패 ${intervalStats.processedFail}\n` +
            `- API: ${status.currentProvider}\n` +
            `- 오늘 누적: ${processedToday}건`
    };

    try {
        await fetch(slackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        });
        log('Slack 정기 보고 전송 완료');

        // 통계 리셋
        intervalStats = { scrapedCount: 0, processedSuccess: 0, processedFail: 0 };
    } catch (e) {
        log(`Slack 전송 실패: ${e.message}`, 'ERROR');
    }
}

// ============================================================
// 일일 보고 (22:15)
// ============================================================
async function sendDailyReport() {
    const slackUrl = process.env.SLACK_WEBHOOK_URL;
    if (!slackUrl) return;

    const message = {
        text: `[일일 종합] ${new Date().toISOString().split('T')[0]}\n` +
            `- 오늘 총 AI 가공: ${processedToday}건\n` +
            `- 스케줄러 v3.0 정상 동작 중`
    };

    try {
        await fetch(slackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        });
        log('일일 보고 전송 완료');
    } catch (e) {
        log(`일일 보고 실패: ${e.message}`, 'ERROR');
    }
}

// ============================================================
// 시간 체크 (1분마다)
// ============================================================
function checkReportTime() {
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();

    // 22:15 → 일일 보고
    if (hour === 22 && min === 15) {
        sendDailyReport().catch(e => log(`일일 보고 에러: ${e.message}`, 'ERROR'));
        return;
    }

    // 15분, 45분 → 정기 보고
    if (min === 15 || min === 45) {
        sendPeriodicReport().catch(e => log(`정기 보고 에러: ${e.message}`, 'ERROR'));
    }
}

// ============================================================
// 메인 실행
// ============================================================
function main() {
    log('========================================');
    log('코리아뉴스 스케줄러 v3.0 (초기화 버전)');
    log('========================================');
    log(`스크래핑: 1시간마다 (Fire-and-Forget)`);
    log(`AI 가공: 2분마다`);
    log(`Slack 보고: 15분, 45분 / 일일: 22:15`);
    log(`활성 시간: ${CONFIG.ACTIVE_START_HOUR}:00 ~ ${CONFIG.ACTIVE_END_HOUR}:00`);
    log('========================================');

    // 환경 변수 체크
    log(`SLACK_WEBHOOK_URL: ${process.env.SLACK_WEBHOOK_URL ? 'OK' : 'MISSING'}`);
    log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'OK' : 'MISSING'}`);

    // ============================================================
    // 핵심: 모든 스케줄 독립적으로 등록
    // ============================================================
    setInterval(runScraping, CONFIG.SCRAPE_INTERVAL_MS);
    setInterval(runSingleProcess, CONFIG.PROCESS_INTERVAL_MS);
    setInterval(checkReportTime, 60 * 1000);

    log('스케줄러 등록 완료');

    // 즉시 Slack 테스트
    sendPeriodicReport().catch(e => log(`즉시 보고 실패: ${e.message}`, 'ERROR'));

    // 첫 스크래핑 (비동기, 블로킹 없음)
    runScraping();

    log('스케줄러 가동 중... (Ctrl+C 종료)');
}

main();
