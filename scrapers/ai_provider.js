/**
 * AI Provider 모듈 - Z.ai (GLM) 통합
 * ==========================================
 * 
 * 기능:
 *   - 기본 API: Z.ai GLM-4 (Anthropic Compatible)
 *   - 키 환경변수: ANTHROPIC_API_KEY
 *   - Base URL: ANTHROPIC_BASE_URL
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ============================================================
// API 프로바이더 설정
// ============================================================
const providers = {
    zai_primary: {
        name: 'Z.ai GLM-4',
        // .env의 ANTHROPIC_BASE_URL이 'https://api.z.ai/api/anthropic' 라면
        // 실제 호출 포인트는 '/v1/messages'를 붙여야 함
        keyEnv: 'ANTHROPIC_API_KEY',
        baseUrlEnv: 'ANTHROPIC_BASE_URL',
        dailyLimit: 5000,
        usedToday: 0,
        blockedUntil: null
    }
};

let currentProvider = 'zai_primary';
let lastResetDate = new Date().toDateString();

// ============================================================
// 프로바이더 관리 함수
// ============================================================

function getActiveProvider() {
    const now = Date.now();
    const todayStr = new Date().toDateString();

    if (todayStr !== lastResetDate) {
        resetDailyCounters();
        lastResetDate = todayStr;
    }

    const provider = providers[currentProvider];
    const apiKey = process.env[provider.keyEnv];
    const baseUrl = process.env[provider.baseUrlEnv];

    if (!apiKey || !baseUrl) {
        console.error(`[AI Provider] API 키 또는 Base URL 부족`);
        return { provider: null, error: 'Z.ai API 설정이 없습니다.' };
    }

    // 간단하게 URL 조립 (Trailing Slash 처리)
    let endpoint = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    endpoint += 'v1/messages';

    return {
        provider,
        name: currentProvider,
        apiKey,
        endpoint
    };
}

function incrementUsage(providerName) {
    if (providers[providerName]) {
        providers[providerName].usedToday++;
    }
}

function resetDailyCounters() {
    for (const key in providers) {
        providers[key].usedToday = 0;
    }
    console.log('[AI Provider] 일일 카운터 리셋 완료');
}

function getStatus() {
    return {
        currentProvider: currentProvider,
        providers: Object.values(providers).map(p => ({
            name: p.name,
            usedToday: p.usedToday
        }))
    };
}

// ============================================================
// AI 호출 로직 (Anthropic Style)
// ============================================================

async function callAI(systemPrompt, userPrompt) {
    const { provider, name, apiKey, endpoint, error } = getActiveProvider();

    if (error) throw new Error(error);

    try {
        const result = await callZai(endpoint, apiKey, systemPrompt, userPrompt);
        incrementUsage(name);
        return result;
    } catch (e) {
        console.error(`[AI Provider] 호출 실패: ${e.message}`);
        throw e;
    }
}

async function callZai(endpoint, apiKey, systemPrompt, userPrompt) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022", // Z.ai 호환 모델명
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
                { role: "user", content: userPrompt }
            ]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Z.ai API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
}

module.exports = {
    callAI,
    getActiveProvider,
    getStatus,
    // 호환성 유지용 더미 함수
    markProviderBlocked: () => { }
};
