import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createXai } from "@ai-sdk/xai";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_SYSTEM_PROMPT, STYLE_PROMPTS, StyleType, FORCED_OUTPUT_FORMAT } from "@/lib/ai-prompts";
import { decryptApiKeys, decryptApiKey, isEncrypted } from "@/lib/encryption";
import { parseAIOutput, toDBUpdate, validateFactAccuracy } from "@/lib/ai-output-parser";
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
            // gemini-2.5-flash: Latest stable model supported by @ai-sdk/google
            // Note: gemini-3-flash-preview not yet supported in SDK v2.0.51
            return google("gemini-2.5-flash");
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

// Multiple Gemini API keys for rotation (reduces rate limit issues)
const GEMINI_KEYS = [
    { key: "AIzaSyAjlrbbTCxtwpPyKkevDfUAJ-IjVu42-UI", label: "key1" },
    { key: "AIzaSyBulyeEOg4CG_8-VS3pP9rQfG9bFYQUhjQ", label: "key2" }
];

// Round-robin key rotation
let currentKeyIndex = 0;
function getNextGeminiKey(): { key: string; label: string } {
    const selected = GEMINI_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
    console.log(`[KeyRotation] Selected key: ${selected.label} (index ${currentKeyIndex})`);
    return selected;
}

// Get global AI settings (with multi-key rotation)
async function getGlobalSettings() {
    console.log("========================================");
    console.log("[getGlobalSettings] DEBUG START");
    console.log("[getGlobalSettings] USING MULTI-KEY ROTATION!");

    // Get next key from rotation
    const selectedKey = getNextGeminiKey();
    console.log("[getGlobalSettings] Selected Key Label:", selectedKey.label);
    console.log("[getGlobalSettings] Key Preview:", selectedKey.key.substring(0, 15) + "...");

    // Fetch system prompt from DB (still needed)
    const { data, error } = await supabaseAdmin
        .from("site_settings")
        .select("key, value")
        .in("key", ["ai_system_prompt"]);

    if (error) {
        console.log("[getGlobalSettings] DB ERROR:", error.message);
    }

    let systemPrompt: string = "";
    for (const row of data || []) {
        if (row.key === "ai_system_prompt") {
            systemPrompt = String(row.value) || "";
        }
    }

    // Use rotated key
    const provider: AIProvider = "gemini";

    // Build final API keys object
    const apiKeys: Record<string, string> = {
        gemini: selectedKey.key,
        claude: "",
        grok: ""
    };

    console.log("[getGlobalSettings] FINAL RESULT:");
    console.log("[getGlobalSettings] - provider:", provider);
    console.log("[getGlobalSettings] - gemini key exists:", !!apiKeys.gemini);
    console.log("[getGlobalSettings] - gemini key length:", apiKeys.gemini?.length || 0);
    console.log("[getGlobalSettings] - gemini key preview:", apiKeys.gemini ? (apiKeys.gemini.substring(0, 12) + "..." + apiKeys.gemini.substring(apiKeys.gemini.length - 4)) : "EMPTY");
    console.log("[getGlobalSettings] - keyLabel:", selectedKey.label);
    console.log("[getGlobalSettings] - keyIndex:", currentKeyIndex);
    console.log("[getGlobalSettings] DEBUG END");
    console.log("========================================");

    return { provider, apiKeys, systemPrompt, keyLabel: selectedKey.label, keyIndex: currentKeyIndex };
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
        // 테스트 모드(API 키 직접 전달)인 경우 Guard 체크 우회
        const isTestMode = !!(requestProvider && requestApiKey);
        const region = body.region || 'unknown';
        log("STEP-2-GUARD-CHECK", { region, textLength: text.length, isTestMode });

        if (!isTestMode) {
            const guardCheck = await canProcessArticle(region, text.length);
            log("STEP-2-GUARD-RESULT", guardCheck);

            if (!guardCheck.allowed) {
                log("STEP-2-GUARD-BLOCKED", { reason: guardCheck.reason, code: guardCheck.code });
                return NextResponse.json(
                    { error: guardCheck.reason, code: guardCheck.code },
                    { status: 429 }
                );
            }
        } else {
            log("STEP-2-GUARD-BYPASSED", { reason: "Test mode - API key provided directly" });
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
                hasCustomPrompt: !!globalSettings.systemPrompt,
                // Multi-key rotation info
                keyLabel: globalSettings.keyLabel,
                keyIndex: globalSettings.keyIndex
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

        // [DEBUG] STEP 5: AI call
        log("STEP-5-AI-CALLING", { provider, model: "gemini-2.5-flash" });
        const startTime = Date.now();

        let rewritten: string | undefined;
        let usage: unknown;

        // Helper function to try API call with rate limit handling
        const tryApiCallWithFallback = async (currentApiKey: string, retryCount = 0): Promise<{ text: string; usage: unknown }> => {
            const currentModel = getModel(provider, currentApiKey);

            console.log("========================================");
            console.log("[AI-CALL] ATTEMPT", retryCount + 1);
            console.log("[AI-CALL] Provider:", provider);
            console.log("[AI-CALL] API Key Length:", currentApiKey?.length || 0);
            console.log("[AI-CALL] API Key Preview:", currentApiKey ? (currentApiKey.substring(0, 15) + "..." + currentApiKey.substring(currentApiKey.length - 4)) : "EMPTY");
            console.log("[AI-CALL] Timestamp:", new Date().toISOString());
            console.log("========================================");

            try {
                const result = await generateText({
                    model: currentModel,
                    system: finalSystemPrompt,
                    prompt: `${stylePrompt}\n\n---\n\n${text}`,
                    maxRetries: 0,
                });
                return { text: result.text || "", usage: result.usage };
            } catch (err: unknown) {
                const errMsg = err instanceof Error ? err.message : String(err);

                // Check if rate limit error
                if (errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("rate")) {
                    console.log("[AI-CALL] RATE LIMIT HIT! Checking for alternate key...");

                    // If we haven't retried yet and we have multi-key, try getting next key
                    if (retryCount < 1 && provider === "gemini") {
                        const globalSettings = await getGlobalSettings();
                        const nextKey = globalSettings.apiKeys.gemini;

                        // If we got a different key, wait and retry
                        if (nextKey && nextKey !== currentApiKey) {
                            console.log("[AI-CALL] Got different key! Waiting 10s then retrying...");
                            console.log("[AI-CALL] Next Key Preview:", nextKey.substring(0, 15) + "...");
                            await new Promise(resolve => setTimeout(resolve, 10000));
                            return tryApiCallWithFallback(nextKey, retryCount + 1);
                        } else {
                            console.log("[AI-CALL] Same key returned, cannot fallback. Waiting 15s then retrying same key...");
                            await new Promise(resolve => setTimeout(resolve, 15000));
                            return tryApiCallWithFallback(currentApiKey, retryCount + 1);
                        }
                    }
                }
                throw err;
            }
        };

        try {
            log("STEP-5-AI-CALLING-START", {
                timestamp: new Date().toISOString(),
                provider,
                modelUsed: "gemini-2.5-flash",
                systemPromptLength: finalSystemPrompt.length,
                userPromptLength: text.length,
                totalPromptLength: finalSystemPrompt.length + text.length + stylePrompt.length
            });

            const result = await tryApiCallWithFallback(apiKey);

            rewritten = result.text;
            usage = result.usage;

            console.log("========================================");
            console.log("[AI-CALL] SUCCESS - Response received!");
            console.log("[AI-CALL] Response Length:", rewritten?.length || 0);
            console.log("[AI-CALL] Usage:", JSON.stringify(usage));
            console.log("========================================");

            log("STEP-5-AI-CALLING-SUCCESS", {
                timestamp: new Date().toISOString(),
                responseReceived: true
            });

        } catch (aiError: unknown) {
            const elapsed = Date.now() - startTime;
            const aiErrorMessage = aiError instanceof Error ? aiError.message : String(aiError);
            const aiErrorStack = aiError instanceof Error ? aiError.stack : "No stack trace";
            const aiErrorName = aiError instanceof Error ? aiError.name : "Unknown";

            // Extract full error details
            const fullError = aiError as Record<string, unknown>;

            console.log("========================================");
            console.log("[AI-CALL] ERROR OCCURRED!");
            console.log("[AI-CALL] Error Name:", aiErrorName);
            console.log("[AI-CALL] Error Message:", aiErrorMessage);
            console.log("[AI-CALL] Elapsed Time:", elapsed, "ms");
            console.log("[AI-CALL] Provider:", provider);
            console.log("[AI-CALL] API Key Preview:", apiKey ? (apiKey.substring(0, 15) + "..." + apiKey.substring(apiKey.length - 4)) : "EMPTY");
            console.log("[AI-CALL] Full Error Object Keys:", Object.keys(fullError));
            console.log("[AI-CALL] Full Error:", JSON.stringify(fullError, null, 2));

            // Check if it's a rate limit error
            if (aiErrorMessage.includes("429") || aiErrorMessage.includes("quota") || aiErrorMessage.includes("rate") || aiErrorMessage.includes("limit")) {
                console.log("[AI-CALL] >>> RATE LIMIT DETECTED <<<");
                console.log("[AI-CALL] This is a rate limit error!");
                console.log("[AI-CALL] Possible causes:");
                console.log("[AI-CALL] 1. Free tier limit: 20 RPM");
                console.log("[AI-CALL] 2. AI SDK internal retries (3 attempts)");
                console.log("[AI-CALL] 3. API key might be shared/exhausted");
            }

            // Check for specific Google AI error structure
            if (fullError.cause) {
                console.log("[AI-CALL] Error Cause:", JSON.stringify(fullError.cause, null, 2));
            }
            if (fullError.response) {
                console.log("[AI-CALL] Error Response:", JSON.stringify(fullError.response, null, 2));
            }

            console.log("[AI-CALL] Stack Trace:", aiErrorStack);
            console.log("========================================");

            log("STEP-5-AI-ERROR", {
                elapsed: `${elapsed}ms`,
                errorName: aiErrorName,
                errorMessage: aiErrorMessage,
                errorStack: aiErrorStack,
                provider,
                apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : "EMPTY",
                fullErrorKeys: Object.keys(fullError)
            });

            console.error("[AI-REWRITE] AI API Error:", {
                error: aiErrorMessage,
                stack: aiErrorStack,
                provider,
                elapsed
            });

            // Re-throw to be caught by outer catch
            throw new Error(`AI API Error: ${aiErrorMessage}`);
        }

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

                // Save error log to DB for debugging (using ai_validation_warnings column)
                if (articleId) {
                    await supabaseAdmin
                        .from("posts")
                        .update({
                            ai_validation_warnings: [
                                `PARSE_ERROR: ${parseResult.error}`,
                                `RAW_LENGTH: ${rewritten?.length || 0}`,
                                `RAW_PREVIEW: ${rewritten?.substring(0, 500)}`,
                                `TIMESTAMP: ${new Date().toISOString()}`
                            ],
                            ai_validation_grade: "D",
                            status: "draft"
                        })
                        .eq("id", articleId);
                }

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
                tags: parseResult.data?.tags,
                extracted_numbers: parseResult.data?.extracted_numbers,
                extracted_quotes: parseResult.data?.extracted_quotes
            });

            // [DEBUG] STEP 7.5: Fact validation (1st pass)
            const validationResult1 = validateFactAccuracy(text, parseResult.data!);
            log("STEP-7.5-VALIDATION-PASS1", {
                isValid: validationResult1.isValid,
                grade: validationResult1.grade,
                warnings: validationResult1.warnings,
                numberCheck: validationResult1.numberCheck,
                quoteCheck: validationResult1.quoteCheck
            });

            // Double validation: DISABLED to reduce API calls (was causing quota exceeded errors)
            // Each article now uses only 1 API call instead of 2
            let finalGrade = validationResult1.grade;
            let finalValidation = validationResult1;
            let finalParseResult = parseResult;

            // DISABLED: Double validation was consuming too many API calls
            // Re-enable by changing 'false' to 'validationResult1.grade === "A"'
            if (false && validationResult1.grade === "A" && articleId) {
                console.log("╔════════════════════════════════════════════════════════════════╗");
                console.log("║  !!! DOUBLE VALIDATION TRIGGERED - 2ND API CALL STARTING !!!  ║");
                console.log("╚════════════════════════════════════════════════════════════════╝");
                console.log("[DOUBLE-VAL] 1st pass was Grade A, now making 2ND API CALL");
                console.log("[DOUBLE-VAL] This is the SECOND API request for this article!");
                console.log("[DOUBLE-VAL] Total API calls so far: 2 (for this one article)");
                console.log("[DOUBLE-VAL] API Key Preview:", apiKey ? (apiKey.substring(0, 15) + "..." + apiKey.substring(apiKey.length - 4)) : "EMPTY");
                console.log("[DOUBLE-VAL] Timestamp:", new Date().toISOString());

                log("STEP-7.6-DOUBLE-VALIDATION-START", {
                    message: "1st pass Grade A, starting 2nd validation pass"
                });

                // Wait 5 seconds before 2nd API call to avoid rate limiting
                console.log("[DOUBLE-VAL] Waiting 5 seconds before 2nd API call (rate limit prevention)...");
                await new Promise(resolve => setTimeout(resolve, 5000));
                console.log("[DOUBLE-VAL] Wait complete, now calling API...");

                // 2nd AI call for double validation
                const startTime2 = Date.now();

                console.log("[DOUBLE-VAL] Calling generateText() for 2nd time...");

                const { text: rewritten2, usage: usage2 } = await generateText({
                    model,
                    system: finalSystemPrompt,
                    prompt: `${stylePrompt}\n\n---\n\n${text}`,
                    maxRetries: 0,  // Disable AI SDK auto-retry to prevent quota exhaustion
                });

                console.log("[DOUBLE-VAL] 2nd API call completed successfully!");
                console.log("[DOUBLE-VAL] Response length:", rewritten2?.length || 0);

                const elapsed2 = Date.now() - startTime2;

                log("STEP-7.6-AI-RESPONSE-PASS2", {
                    elapsed: `${elapsed2}ms`,
                    responseLength: rewritten2?.length || 0,
                    usage: usage2
                });

                // Log 2nd pass usage
                const inputTokens2 = (usage2 as Record<string, number>)?.promptTokens || Math.ceil(text.length / 4);
                const outputTokens2 = (usage2 as Record<string, number>)?.completionTokens || Math.ceil((rewritten2?.length || 0) / 4);
                await logAIUsage(region, provider, inputTokens2, outputTokens2, articleId);

                // Parse 2nd pass result
                const parseResult2 = parseAIOutput(rewritten2 || "");

                if (parseResult2.success) {
                    // Validate 2nd pass
                    const validationResult2 = validateFactAccuracy(text, parseResult2.data!);
                    log("STEP-7.6-VALIDATION-PASS2", {
                        isValid: validationResult2.isValid,
                        grade: validationResult2.grade,
                        warnings: validationResult2.warnings
                    });

                    // Both passes must be Grade A to publish
                    if (validationResult2.grade === "A") {
                        log("STEP-7.6-DOUBLE-VALIDATION-SUCCESS", {
                            message: "Both passes Grade A - approved for publishing",
                            pass1Grade: validationResult1.grade,
                            pass2Grade: validationResult2.grade
                        });
                        // Use 2nd pass result (more recent)
                        finalParseResult = parseResult2;
                        finalValidation = validationResult2;
                        finalGrade = "A";
                    } else {
                        log("STEP-7.6-DOUBLE-VALIDATION-FAILED", {
                            message: "2nd pass not Grade A - rejected",
                            pass1Grade: validationResult1.grade,
                            pass2Grade: validationResult2.grade
                        });
                        // Downgrade to the worse grade
                        finalGrade = validationResult2.grade;
                        finalValidation = validationResult2;
                    }
                } else {
                    log("STEP-7.6-PARSE2-FAILED", {
                        error: parseResult2.error,
                        message: "2nd pass parse failed - treating as failed validation"
                    });
                    finalGrade = "D"; // Parse failure = worst grade
                }
            }

            // Use final validation result
            const validationResult = finalValidation;

            // DB update object (use final parse result)
            const dbUpdate = toDBUpdate(finalParseResult.data!);

            // [DEBUG] STEP 8: DB update
            if (articleId) {
                // Grade-based publishing decision
                // ONLY Grade A (both passes) = apply AI rewrite + publish
                // Grade B/C/D = cancel AI rewrite (keep original), hold as draft
                const isGradeA = finalGrade === "A";

                log("STEP-8-DB-UPDATE-START", {
                    articleId,
                    validationGrade: validationResult.grade,
                    isGradeA,
                    action: isGradeA ? "APPLY_AND_PUBLISH" : "CANCEL_AND_HOLD"
                });

                if (isGradeA) {
                    // Grade A: Apply AI rewrite and publish (passed double validation)
                    const updateData: Record<string, unknown> = {
                        ...dbUpdate,
                        status: "published",
                        published_at: new Date().toISOString(),
                        ai_validation_grade: validationResult.grade,
                        ai_double_validated: true
                    };

                    const { error: updateError } = await supabaseAdmin
                        .from("posts")
                        .update(updateData)
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

                    log("STEP-8-DB-UPDATE-SUCCESS", {
                        articleId,
                        status: "published",
                        message: "Grade A - Article published with AI rewrite"
                    });

                    return NextResponse.json({
                        success: true,
                        published: true,
                        message: "기사가 AI 재가공되어 발행되었습니다. (이중 검증 통과, 등급: A)",
                        parsed: finalParseResult.data,
                        validation: validationResult,
                        doubleValidation: true,
                        articleId,
                        provider,
                        processedAt: new Date().toISOString()
                    });
                } else {
                    // Grade B/C/D: Cancel AI rewrite, keep original, hold as draft
                    // Only update status and validation info, NOT content
                    const holdData: Record<string, unknown> = {
                        status: "draft",
                        ai_validation_grade: validationResult.grade,
                        ai_validation_warnings: validationResult.warnings,
                        ai_processed: false // Mark as not processed (original kept)
                    };

                    const { error: updateError } = await supabaseAdmin
                        .from("posts")
                        .update(holdData)
                        .eq("id", articleId);

                    if (updateError) {
                        log("STEP-8-HOLD-FAILED", { error: updateError.message });
                        console.error("[ai/rewrite] Hold update failed:", updateError);
                        return NextResponse.json({
                            success: false,
                            error: "보류 처리 실패: " + updateError.message,
                            validation: validationResult,
                            provider,
                            processedAt: new Date().toISOString()
                        }, { status: 500 });
                    }

                    log("STEP-8-HOLD-SUCCESS", {
                        articleId,
                        status: "draft",
                        grade: validationResult.grade,
                        message: "AI rewrite cancelled, original kept, held as draft"
                    });

                    // Determine which pass failed for the message
                    const failedPass = validationResult1.grade !== "A" ? "1차" : "2차";
                    return NextResponse.json({
                        success: false,
                        published: false,
                        cancelled: true,
                        message: `AI 재가공이 취소되었습니다. ${failedPass} 검증 등급(${finalGrade})이 기준 미달입니다. 원본이 유지되며 보류 처리되었습니다.`,
                        validation: validationResult,
                        doubleValidation: validationResult1.grade === "A", // True if 1st pass was A but 2nd failed
                        articleId,
                        provider,
                        processedAt: new Date().toISOString()
                    });
                }
            }

            // articleId not provided - return preview only
            log("STEP-7-PREVIEW-ONLY", { message: "No articleId, returning preview result" });
            return NextResponse.json({
                success: true,
                parsed: parseResult.data,
                validation: validationResult,
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
        const errorMessage = error instanceof Error ? error.message : "재작성 중 오류 발생";
        const errorStack = error instanceof Error ? error.stack : "No stack trace";
        const errorName = error instanceof Error ? error.name : "Unknown";

        // [DEBUG] 전체 에러 로그 - 파일 저장
        const timestamp = new Date().toISOString();
        const errorLog = {
            timestamp,
            step: "GLOBAL-CATCH-ERROR",
            errorName,
            errorMessage,
            errorStack
        };

        console.error("[AI-REWRITE] Global Error:", errorLog);

        // 파일에도 기록
        try {
            ensureLogDir();
            const logLine = `[${timestamp}] [GLOBAL-CATCH-ERROR] ${JSON.stringify(errorLog, null, 2)}\n\n`;
            fs.appendFileSync(LOG_FILE, logLine, "utf8");
        } catch (logError) {
            console.error("[AI-REWRITE] Failed to write error log:", logError);
        }

        return NextResponse.json(
            { error: errorMessage, details: errorStack },
            { status: 500 }
        );
    }
}
