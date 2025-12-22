/**
 * AI Guard - AI 재가공 사용 제한 및 로깅
 * 
 * 1. 마스터 스위치 체크
 * 2. 지역별 활성화 체크
 * 3. 일일 호출 제한 체크
 * 4. 월별 토큰 한도 체크
 * 5. 입력 길이 제한 체크
 * 6. 사용량 로깅
 */

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// AI Settings 캐시 (5분 TTL)
let settingsCache: AISettings | null = null;
let settingsCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5분

interface AISettings {
    enabled: boolean;
    enabledRegions: string[];
    dailyLimit: number;
    monthlyTokenLimit: number;
    maxInputLength: number;
}

interface CanProcessResult {
    allowed: boolean;
    reason?: string;
    code?: 'DISABLED' | 'REGION_NOT_ENABLED' | 'DAILY_LIMIT_EXCEEDED' | 'MONTHLY_LIMIT_EXCEEDED' | 'INPUT_TOO_LONG';
}

/**
 * AI 설정 조회 (캐시 사용)
 */
async function getAISettings(): Promise<AISettings> {
    const now = Date.now();

    // 캐시가 유효하면 반환
    if (settingsCache && (now - settingsCacheTime) < CACHE_TTL) {
        return settingsCache;
    }

    const { data } = await supabaseAdmin
        .from("site_settings")
        .select("key, value")
        .in("key", [
            "ai_rewrite_enabled",
            "ai_enabled_regions",
            "ai_daily_limit",
            "ai_monthly_token_limit",
            "ai_max_input_length"
        ]);

    const settings: AISettings = {
        enabled: false,
        enabledRegions: [],
        dailyLimit: 100,
        monthlyTokenLimit: 1000000,
        maxInputLength: 5000
    };

    if (data) {
        for (const row of data) {
            if (row.key === "ai_rewrite_enabled") {
                settings.enabled = row.value === true || row.value === "true";
            } else if (row.key === "ai_enabled_regions") {
                settings.enabledRegions = Array.isArray(row.value) ? row.value : [];
            } else if (row.key === "ai_daily_limit") {
                settings.dailyLimit = typeof row.value === "number" ? row.value : 100;
            } else if (row.key === "ai_monthly_token_limit") {
                settings.monthlyTokenLimit = typeof row.value === "number" ? row.value : 1000000;
            } else if (row.key === "ai_max_input_length") {
                settings.maxInputLength = typeof row.value === "number" ? row.value : 5000;
            }
        }
    }

    // 캐시 갱신
    settingsCache = settings;
    settingsCacheTime = now;

    return settings;
}

/**
 * 오늘 호출 횟수 조회
 */
async function getTodayCallCount(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabaseAdmin
        .from("ai_usage_logs")
        .select("call_count")
        .eq("date", today);

    if (!data) return 0;
    return data.reduce((sum, row) => sum + (row.call_count || 0), 0);
}

/**
 * 이번 달 토큰 사용량 조회
 */
async function getMonthlyTokenUsage(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const { data } = await supabaseAdmin
        .from("ai_usage_logs")
        .select("input_tokens, output_tokens")
        .gte("date", monthStartStr)
        .lte("date", today);

    if (!data) return 0;
    return data.reduce((sum, row) => sum + (row.input_tokens || 0) + (row.output_tokens || 0), 0);
}

/**
 * 기사에 AI 재가공 적용 가능 여부 체크
 */
export async function canProcessArticle(
    region: string,
    inputLength?: number
): Promise<CanProcessResult> {
    try {
        const settings = await getAISettings();

        // 1. 마스터 스위치 체크
        if (!settings.enabled) {
            return {
                allowed: false,
                reason: "AI 재가공이 비활성화되어 있습니다.",
                code: 'DISABLED'
            };
        }

        // 2. 지역 체크 (빈 배열이면 전체 허용)
        if (settings.enabledRegions.length > 0 && !settings.enabledRegions.includes(region)) {
            return {
                allowed: false,
                reason: `${region} 지역은 AI 재가공 대상이 아닙니다.`,
                code: 'REGION_NOT_ENABLED'
            };
        }

        // 3. 입력 길이 체크
        if (inputLength && inputLength > settings.maxInputLength) {
            return {
                allowed: false,
                reason: `입력 길이(${inputLength}자)가 제한(${settings.maxInputLength}자)을 초과했습니다.`,
                code: 'INPUT_TOO_LONG'
            };
        }

        // 4. 일일 호출 제한 체크
        const todayCount = await getTodayCallCount();
        if (todayCount >= settings.dailyLimit) {
            return {
                allowed: false,
                reason: `일일 호출 한도(${settings.dailyLimit}회)를 초과했습니다.`,
                code: 'DAILY_LIMIT_EXCEEDED'
            };
        }

        // 5. 월별 토큰 한도 체크
        const monthlyTokens = await getMonthlyTokenUsage();
        if (monthlyTokens >= settings.monthlyTokenLimit) {
            return {
                allowed: false,
                reason: `월별 토큰 한도(${settings.monthlyTokenLimit.toLocaleString()})를 초과했습니다.`,
                code: 'MONTHLY_LIMIT_EXCEEDED'
            };
        }

        return { allowed: true };

    } catch (error) {
        console.error("[ai-guard] Error checking process eligibility:", error);
        // 에러 시에도 허용 (fail-open)
        return { allowed: true };
    }
}

/**
 * AI 사용량 로깅
 */
export async function logAIUsage(
    region: string,
    provider: string,
    inputTokens: number,
    outputTokens: number,
    articleId?: string
): Promise<void> {
    try {
        const today = new Date().toISOString().split('T')[0];

        await supabaseAdmin
            .from("ai_usage_logs")
            .insert({
                date: today,
                region: region || null,
                provider,
                call_count: 1,
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                article_id: articleId || null
            });

    } catch (error) {
        console.error("[ai-guard] Error logging usage:", error);
        // 로깅 실패해도 계속 진행
    }
}

/**
 * 캐시 무효화 (설정 변경 시 호출)
 */
export function invalidateSettingsCache(): void {
    settingsCache = null;
    settingsCacheTime = 0;
}

/**
 * 현재 사용량 요약 조회
 */
export async function getUsageSummary(): Promise<{
    todayCount: number;
    dailyLimit: number;
    monthlyTokens: number;
    monthlyLimit: number;
}> {
    const settings = await getAISettings();
    const todayCount = await getTodayCallCount();
    const monthlyTokens = await getMonthlyTokenUsage();

    return {
        todayCount,
        dailyLimit: settings.dailyLimit,
        monthlyTokens,
        monthlyLimit: settings.monthlyTokenLimit
    };
}
