import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createXai } from "@ai-sdk/xai";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_SYSTEM_PROMPT, STYLE_PROMPTS, StyleType, FORCED_OUTPUT_FORMAT } from "@/lib/ai-prompts";
import { decryptApiKeys } from "@/lib/encryption";
import { parseAIOutput, toDBUpdate } from "@/lib/ai-output-parser";
import { canProcessArticle, logAIUsage } from "@/lib/ai-guard";
import fs from "fs";
import path from "path";

type AIProvider = "gemini" | "claude" | "grok";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 로그 파일 경로
const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "ai-rewrite.log");

// 로그 파일 초기화 (디렉토리 생성)
function ensureLogDir() {
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
}

// AI 모델 가져오기
function getModel(provider: AIProvider, apiKey: string) {
    switch (provider) {
        case "gemini": {
            const google = createGoogleGenerativeAI({ apiKey });
            // gemini-3-flash-preview: Released Dec 17, 2025 - Google's latest fastest model
            // Frontier intelligence at lower cost, available via Gemini API
            return google("gemini-3-flash-preview");
        }
        case "claude": {
            const anthropic = createAnthropic({ apiKey });
            // claude-sonnet-4-5-20250929: Input $3/M, Output $15/M (2025.12)
            return anthropic("claude-sonnet-4-5-20250929");
        }
        case "grok": {
            const xai = createXai({ apiKey });
            // grok-4-latest: xAI latest model (2025.12)
            return xai("grok-4-latest");
        }
        default:
            throw new Error(`지원하지 않는 AI 제공자: ${provider}`);
    }
}

// Get global AI settings
async function getGlobalSettings() {
    const { data, error } = await supabaseAdmin
        .from("site_settings")
        .select("key, value")
        .in("key", ["ai_default_provider", "ai_global_keys", "ai_system_prompt"]);

    if (error) throw error;

    let provider: AIProvider = "gemini";
    let apiKeys: Record<string, string> = {};
    let systemPrompt: string = "";

    for (const row of data || []) {
        if (row.key === "ai_default_provider") {
            provider = String(row.value).replace(/"/g, "") as AIProvider;
        } else if (row.key === "ai_global_keys") {
            const rawKeys = typeof row.value === "object" ? row.value : {};
            // Decrypt API keys from storage
            apiKeys = decryptApiKeys(rawKeys);
        } else if (row.key === "ai_system_prompt") {
            systemPrompt = String(row.value) || "";
        }
    }

    return { provider, apiKeys, systemPrompt };
}

// POST: AI 기사 재가공
export async function POST(request: NextRequest) {
    const DEBUG = true; // DEBUG 플래그

    // 로그 함수 - 콘솔 + 파일 동시 저장
    const log = (step: string, data: unknown) => {
        if (!DEBUG) return;

        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] [${step}] ${JSON.stringify(data, null, 2)}`;

        // 콘솔 출력
        console.log(`[AI-REWRITE] [${step}]`, JSON.stringify(data, null, 2));

        // 파일 저장
        try {
            ensureLogDir();
            fs.appendFileSync(LOG_FILE, logLine + "\n\n", "utf8");
        } catch (e) {
            console.error("[AI-REWRITE] Log file write error:", e);
        }
    };

    // 새 요청 시작 구분선
    log("=== NEW REQUEST ===", { timestamp: new Date().toISOString() });

    try {
        const body = await request.json();
        const {
            text,
            style = "news",
            provider: requestProvider,
            apiKey: requestApiKey,
            reporterId,
            systemPrompt: requestSystemPrompt, // Allow override for testing
            parseJson = false, // true: JSON 파싱 모드, false: 기존 텍스트 모드
            articleId // 기사 ID (DB 업데이트용)
        } = body;

        // [DEBUG] STEP 1: 입력 확인
        log("STEP-1-INPUT", {
            textLength: text?.length || 0,
            textPreview: text?.substring(0, 100) + "...",
            style,
            parseJson,
            articleId: articleId || "none",
            hasRequestProvider: !!requestProvider,
            hasRequestApiKey: !!requestApiKey,
            reporterId: reporterId || "none"
        });

        if (!text) {
            log("ERROR", { message: "text 필드 누락" });
            return NextResponse.json(
                { error: "text 필드가 필요합니다." },
                { status: 400 }
            );
        }

        // [DEBUG] STEP 2: AI Guard 체크
        const region = body.region || 'unknown';
        log("STEP-2-GUARD-CHECK", { region, textLength: text.length });

        const guardCheck = await canProcessArticle(region, text.length);
        log("STEP-2-GUARD-RESULT", guardCheck);

        if (!guardCheck.allowed) {
            log("STEP-2-GUARD-BLOCKED", { reason: guardCheck.reason, code: guardCheck.code });
            return NextResponse.json(
                { error: guardCheck.reason, code: guardCheck.code },
                { status: 429 }
            );
        }

        let provider: AIProvider;
        let apiKey: string;
        let customPrompt: string = "";
        let keySource: string = "";

        // [DEBUG] STEP 3: API 키 결정
        // 1. 요청에 직접 전달된 경우
        if (requestProvider && requestApiKey) {
            provider = requestProvider;
            apiKey = requestApiKey;
            keySource = "REQUEST_DIRECT";
        }
        // 2. 기자 ID가 있으면 기자 개인 설정 확인
        else if (reporterId) {
            const { data: reporter } = await supabaseAdmin
                .from("reporters")
                .select("ai_settings")
                .eq("id", reporterId)
                .single();

            log("STEP-3-REPORTER-SETTINGS", {
                reporterId,
                hasSettings: !!reporter?.ai_settings,
                enabled: reporter?.ai_settings?.enabled
            });

            if (reporter?.ai_settings?.enabled && reporter.ai_settings?.api_keys) {
                provider = reporter.ai_settings.provider || "gemini";
                apiKey = reporter.ai_settings.api_keys[provider] || "";
                keySource = "REPORTER_PERSONAL";
            } else {
                const globalSettings = await getGlobalSettings();
                provider = globalSettings.provider;
                apiKey = globalSettings.apiKeys[provider] || "";
                customPrompt = globalSettings.systemPrompt;
                keySource = "GLOBAL_FALLBACK";
            }
        }
        // 3. 전역 설정 사용
        else {
            const globalSettings = await getGlobalSettings();
            provider = globalSettings.provider;
            apiKey = globalSettings.apiKeys[provider] || "";
            customPrompt = globalSettings.systemPrompt;
            keySource = "GLOBAL_SETTINGS";

            log("STEP-3-GLOBAL-SETTINGS", {
                provider: globalSettings.provider,
                hasApiKey: !!globalSettings.apiKeys[provider],
                apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : "EMPTY",
                hasCustomPrompt: !!globalSettings.systemPrompt
            });
        }

        // Request-level override (for simulation/testing)
        if (requestSystemPrompt) {
            customPrompt = requestSystemPrompt;
            log("STEP-3-PROMPT-OVERRIDE", { promptLength: requestSystemPrompt.length });
        }

        log("STEP-3-KEY-DECISION", {
            provider,
            keySource,
            hasApiKey: !!apiKey,
            apiKeyLength: apiKey?.length || 0,
            apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : "EMPTY"
        });

        // API 키 없으면 원본 반환
        if (!apiKey) {
            log("STEP-3-NO-API-KEY", { message: "API 키 없음, 원본 반환" });
            return NextResponse.json({
                rewritten: text,
                provider: null,
                note: "API 키가 설정되지 않아 원본을 반환합니다."
            });
        }

        // [DEBUG] STEP 4: AI 모델 준비
        const styleKey = (style as StyleType) in STYLE_PROMPTS ? (style as StyleType) : "news";
        const stylePrompt = STYLE_PROMPTS[styleKey];

        log("STEP-4-MODEL-PREP", {
            provider,
            styleKey,
            stylePromptPreview: stylePrompt.substring(0, 50)
        });

        const model = getModel(provider, apiKey);

        // Use custom prompt if available, otherwise use default
        const systemPromptToUse = customPrompt || DEFAULT_SYSTEM_PROMPT;
        const finalSystemPrompt = parseJson
            ? systemPromptToUse + FORCED_OUTPUT_FORMAT
            : systemPromptToUse;

        log("STEP-4-PROMPT-READY", {
            usingCustomPrompt: !!customPrompt,
            parseJson,
            systemPromptLength: finalSystemPrompt.length,
            userPromptLength: text.length
        });

        // [DEBUG] STEP 5: AI 호출
        log("STEP-5-AI-CALLING", { provider, model: "gemini-3-flash-preview" });
        const startTime = Date.now();

        const { text: rewritten, usage } = await generateText({
            model,
            system: finalSystemPrompt,
            prompt: `${stylePrompt}\n\n---\n\n${text}`,
        });

        const elapsed = Date.now() - startTime;
        log("STEP-5-AI-RESPONSE", {
            elapsed: `${elapsed}ms`,
            responseLength: rewritten?.length || 0,
            responsePreview: rewritten?.substring(0, 200) + "...",
            usage
        });

        // [DEBUG] STEP 6: 사용량 로깅
        const inputTokens = (usage as Record<string, number>)?.promptTokens || Math.ceil(text.length / 4);
        const outputTokens = (usage as Record<string, number>)?.completionTokens || Math.ceil((rewritten?.length || 0) / 4);

        log("STEP-6-USAGE-LOG", { region, provider, inputTokens, outputTokens, articleId });
        await logAIUsage(region, provider, inputTokens, outputTokens, articleId);

        // [DEBUG] STEP 7: JSON 파싱 모드
        if (parseJson) {
            log("STEP-7-PARSE-START", { rawResponseLength: rewritten?.length || 0 });

            const parseResult = parseAIOutput(rewritten || "");

            if (!parseResult.success) {
                log("STEP-7-PARSE-FAILED", { error: parseResult.error });
                console.error("[ai/rewrite] Parse failed:", parseResult.error);
                return NextResponse.json({
                    success: false,
                    error: parseResult.error,
                    rawResponse: rewritten,
                    provider,
                    processedAt: new Date().toISOString()
                }, { status: 422 });
            }

            log("STEP-7-PARSE-SUCCESS", {
                title: parseResult.data?.title,
                slug: parseResult.data?.slug,
                contentLength: parseResult.data?.content?.length || 0,
                summary: parseResult.data?.summary?.substring(0, 50) + "...",
                keywords: parseResult.data?.keywords,
                tags: parseResult.data?.tags
            });

            // DB 업데이트용 객체
            const dbUpdate = toDBUpdate(parseResult.data!);

            // [DEBUG] STEP 8: DB 업데이트
            if (articleId) {
                log("STEP-8-DB-UPDATE-START", { articleId, dbUpdate });

                const { error: updateError } = await supabaseAdmin
                    .from("posts")
                    .update({
                        ...dbUpdate,
                        status: "published",
                        published_at: new Date().toISOString()
                    })
                    .eq("id", articleId);

                if (updateError) {
                    log("STEP-8-DB-UPDATE-FAILED", { error: updateError.message });
                    console.error("[ai/rewrite] DB update failed:", updateError);
                    return NextResponse.json({
                        success: false,
                        error: "DB 업데이트 실패: " + updateError.message,
                        parsed: parseResult.data,
                        provider,
                        processedAt: new Date().toISOString()
                    }, { status: 500 });
                }

                log("STEP-8-DB-UPDATE-SUCCESS", { articleId, message: "기사 발행 완료" });

                return NextResponse.json({
                    success: true,
                    message: "기사가 AI 재가공되어 발행되었습니다.",
                    parsed: parseResult.data,
                    articleId,
                    provider,
                    processedAt: new Date().toISOString()
                });
            }

            // articleId 없으면 파싱 결과만 반환 (미리보기용)
            log("STEP-7-PREVIEW-ONLY", { message: "articleId 없음, 미리보기 결과 반환" });
            return NextResponse.json({
                success: true,
                parsed: parseResult.data,
                dbUpdate,
                provider,
                processedAt: new Date().toISOString()
            });
        }

        // 기존 텍스트 모드 (하위 호환)
        log("STEP-FINAL-TEXT-MODE", { message: "텍스트 모드 반환", responseLength: rewritten?.length || 0 });
        return NextResponse.json({
            rewritten: rewritten || text,
            provider,
            processedAt: new Date().toISOString()
        });

    } catch (error: unknown) {
        console.error("Rewrite Error:", error);
        const message = error instanceof Error ? error.message : "재작성 중 오류 발생";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
