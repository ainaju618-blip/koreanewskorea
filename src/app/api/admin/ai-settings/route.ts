import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { encryptApiKeys, decryptApiKeys } from "@/lib/encryption";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// AI Settings Keys
const AI_SETTINGS_KEYS = [
    "ai_rewrite_enabled",
    "ai_default_provider",
    "ai_global_keys",
    "ai_system_prompt",
    "ai_saved_prompts",
    "ai_saved_key_profiles",
    "ai_enabled_regions",
    "ai_daily_limit",
    "ai_monthly_token_limit",
    "ai_max_input_length"
];

// GET: AI 설정 조회
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from("site_settings")
            .select("key, value")
            .in("key", AI_SETTINGS_KEYS);

        if (error) {
            console.error("AI 설정 조회 오류:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const settings: {
            enabled: boolean;
            defaultProvider: string;
            apiKeys: { gemini: string; claude: string; grok: string };
            systemPrompt: string;
            savedPrompts: { id: string; name: string; content: string }[];
            savedKeyProfiles: { id: string; name: string; apiKeys: { gemini: string; claude: string; grok: string } }[];
            enabledRegions: string[];
            dailyLimit: number;
            monthlyTokenLimit: number;
            maxInputLength: number;
        } = {
            enabled: false,
            defaultProvider: "gemini",
            apiKeys: {
                gemini: "",
                claude: "",
                grok: "",
            },
            systemPrompt: "",
            savedPrompts: [],
            savedKeyProfiles: [],
            enabledRegions: [],
            dailyLimit: 100,
            monthlyTokenLimit: 1000000,
            maxInputLength: 5000
        };

        if (data) {
            for (const row of data) {
                if (row.key === "ai_rewrite_enabled") {
                    settings.enabled = row.value === true || row.value === "true";
                } else if (row.key === "ai_default_provider") {
                    settings.defaultProvider = String(row.value).replace(/"/g, "") || "gemini";
                } else if (row.key === "ai_global_keys") {
                    const keys = typeof row.value === "object" ? row.value : {};
                    // Decrypt API keys for client display
                    const decryptedKeys = decryptApiKeys(keys);
                    // Fallback to .env values if DB keys are empty
                    settings.apiKeys = {
                        gemini: decryptedKeys.gemini || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
                        claude: decryptedKeys.claude || process.env.ANTHROPIC_API_KEY || "",
                        grok: decryptedKeys.grok || process.env.XAI_API_KEY || "",
                    };
                } else if (row.key === "ai_system_prompt") {
                    settings.systemPrompt = String(row.value) || "";
                } else if (row.key === "ai_saved_prompts") {
                    settings.savedPrompts = Array.isArray(row.value) ? row.value : [];
                } else if (row.key === "ai_saved_key_profiles") {
                    settings.savedKeyProfiles = Array.isArray(row.value) ? row.value : [];
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

        return NextResponse.json({ settings });
    } catch (error: unknown) {
        console.error("API 오류:", error);
        const message = error instanceof Error ? error.message : "서버 오류";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// PATCH: AI 설정 저장
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            enabled, defaultProvider, apiKeys, systemPrompt, savedPrompts, savedKeyProfiles,
            enabledRegions, dailyLimit, monthlyTokenLimit, maxInputLength
        } = body;

        // Upsert 설정
        const updates = [
            {
                key: "ai_rewrite_enabled",
                value: enabled,
                description: "AI 기사 재가공 전역 활성화"
            },
            {
                key: "ai_default_provider",
                value: defaultProvider,
                description: "기본 AI 제공자 (gemini/claude/grok)"
            },
            {
                key: "ai_global_keys",
                // Encrypt API keys before storing
                value: encryptApiKeys(apiKeys),
                description: "Global AI API Keys (encrypted)"
            },
            {
                key: "ai_system_prompt",
                value: systemPrompt || "",
                description: "AI System Prompt for article rewriting"
            },
            {
                key: "ai_saved_prompts",
                value: savedPrompts || [],
                description: "Saved prompt templates"
            },
            {
                key: "ai_saved_key_profiles",
                value: savedKeyProfiles || [],
                description: "Saved API key profiles"
            },
            {
                key: "ai_enabled_regions",
                value: enabledRegions || [],
                description: "AI Rewrite enabled regions"
            },
            {
                key: "ai_daily_limit",
                value: dailyLimit ?? 100,
                description: "Daily AI call limit"
            },
            {
                key: "ai_monthly_token_limit",
                value: monthlyTokenLimit ?? 1000000,
                description: "Monthly token limit"
            },
            {
                key: "ai_max_input_length",
                value: maxInputLength ?? 5000,
                description: "Max input length in characters"
            },
        ];

        for (const update of updates) {
            const { error } = await supabaseAdmin
                .from("site_settings")
                .upsert(
                    {
                        key: update.key,
                        value: update.value,
                        description: update.description,
                        updated_at: new Date().toISOString()
                    },
                    { onConflict: "key" }
                );

            if (error) {
                console.error(`설정 저장 오류 (${update.key}):`, error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true, message: "AI 설정이 저장되었습니다." });
    } catch (error: unknown) {
        console.error("API 오류:", error);
        const message = error instanceof Error ? error.message : "서버 오류";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
