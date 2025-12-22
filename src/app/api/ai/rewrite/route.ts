import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createXai } from "@ai-sdk/xai";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_SYSTEM_PROMPT, STYLE_PROMPTS, StyleType, FORCED_OUTPUT_FORMAT } from "@/lib/ai-prompts";
import { decryptApiKeys } from "@/lib/encryption";
import { parseAIOutput, toDBUpdate } from "@/lib/ai-output-parser";

type AIProvider = "gemini" | "claude" | "grok";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// AI 모델 가져오기
function getModel(provider: AIProvider, apiKey: string) {
    switch (provider) {
        case "gemini": {
            const google = createGoogleGenerativeAI({ apiKey });
            // gemini-2.5-flash: Input FREE~$0.08/M, Output $0.30/M (2025.12)
            // gemini-3-flash: Input $0.50/M, Output $3.00/M (Preview)
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

        if (!text) {
            return NextResponse.json(
                { error: "text 필드가 필요합니다." },
                { status: 400 }
            );
        }

        let provider: AIProvider;
        let apiKey: string;
        let customPrompt: string = "";

        // 1. 요청에 직접 전달된 경우
        if (requestProvider && requestApiKey) {
            provider = requestProvider;
            apiKey = requestApiKey;
        }
        // 2. 기자 ID가 있으면 기자 개인 설정 확인 (추후 구현)
        else if (reporterId) {
            const { data: reporter } = await supabaseAdmin
                .from("reporters")
                .select("ai_settings")
                .eq("id", reporterId)
                .single();

            if (reporter?.ai_settings?.enabled && reporter.ai_settings?.api_keys) {
                provider = reporter.ai_settings.provider || "gemini";
                apiKey = reporter.ai_settings.api_keys[provider] || "";
            } else {
                // 기자 설정 없으면 전역 설정 사용
                const globalSettings = await getGlobalSettings();
                provider = globalSettings.provider;
                apiKey = globalSettings.apiKeys[provider] || "";
                customPrompt = globalSettings.systemPrompt;
            }
        }
        // 3. 전역 설정 사용
        else {
            const globalSettings = await getGlobalSettings();
            provider = globalSettings.provider;
            apiKey = globalSettings.apiKeys[provider] || "";
            customPrompt = globalSettings.systemPrompt;
        }

        // Request-level override (for simulation/testing)
        if (requestSystemPrompt) {
            customPrompt = requestSystemPrompt;
        }

        // API 키 없으면 원본 반환
        if (!apiKey) {
            return NextResponse.json({
                rewritten: text,
                provider: null,
                note: "API 키가 설정되지 않아 원본을 반환합니다."
            });
        }

        // 스타일별 프롬프트 (STYLE_PROMPTS에서 가져옴)
        const styleKey = (style as StyleType) in STYLE_PROMPTS ? (style as StyleType) : "news";
        const stylePrompt = STYLE_PROMPTS[styleKey];

        const model = getModel(provider, apiKey);

        // Use custom prompt if available, otherwise use default
        const systemPromptToUse = customPrompt || DEFAULT_SYSTEM_PROMPT;

        // JSON 파싱 모드면 강제 출력 형식 추가
        const finalSystemPrompt = parseJson
            ? systemPromptToUse + FORCED_OUTPUT_FORMAT
            : systemPromptToUse;

        const { text: rewritten } = await generateText({
            model,
            system: finalSystemPrompt,
            prompt: `${stylePrompt}\n\n---\n\n${text}`,
        });

        // JSON 파싱 모드
        if (parseJson) {
            const parseResult = parseAIOutput(rewritten || "");

            if (!parseResult.success) {
                console.error("[ai/rewrite] Parse failed:", parseResult.error);
                return NextResponse.json({
                    success: false,
                    error: parseResult.error,
                    rawResponse: rewritten,
                    provider,
                    processedAt: new Date().toISOString()
                }, { status: 422 });
            }

            // DB 업데이트용 객체
            const dbUpdate = toDBUpdate(parseResult.data!);

            // articleId가 있으면 DB 업데이트
            if (articleId) {
                const { error: updateError } = await supabaseAdmin
                    .from("posts")
                    .update({
                        ...dbUpdate,
                        status: "published",
                        published_at: new Date().toISOString()
                    })
                    .eq("id", articleId);

                if (updateError) {
                    console.error("[ai/rewrite] DB update failed:", updateError);
                    return NextResponse.json({
                        success: false,
                        error: "DB 업데이트 실패: " + updateError.message,
                        parsed: parseResult.data,
                        provider,
                        processedAt: new Date().toISOString()
                    }, { status: 500 });
                }

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
            return NextResponse.json({
                success: true,
                parsed: parseResult.data,
                dbUpdate,
                provider,
                processedAt: new Date().toISOString()
            });
        }

        // 기존 텍스트 모드 (하위 호환)
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
