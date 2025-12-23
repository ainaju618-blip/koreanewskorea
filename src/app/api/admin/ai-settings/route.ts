import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { encryptApiKey, encryptApiKeys, decryptApiKeys, decryptApiKey, isEncrypted } from "@/lib/encryption";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Gemini multi-key entry type
interface GeminiKeyEntry {
    key: string;
    label: string;
    enabled?: boolean;
}

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
            geminiMultiKeys: GeminiKeyEntry[];
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
            geminiMultiKeys: [],
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

                    // Check if gemini is multi-key format (array)
                    if (Array.isArray(keys.gemini)) {
                        // Decrypt each key in the array and assign default labels
                        settings.geminiMultiKeys = keys.gemini.map((entry: GeminiKeyEntry, index: number) => ({
                            key: isEncrypted(entry.key) ? decryptApiKey(entry.key) : entry.key,
                            label: entry.label || String(index + 1), // Default: "1", "2", "3"...
                            enabled: entry.enabled !== false
                        }));
                        // Use first enabled key as the main gemini key
                        const firstEnabled = settings.geminiMultiKeys.find(k => k.enabled);
                        settings.apiKeys.gemini = firstEnabled?.key || "";
                    } else {
                        // Legacy single-key format
                        const decryptedKeys = decryptApiKeys(keys);
                        settings.apiKeys.gemini = decryptedKeys.gemini || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
                    }

                    // Decrypt claude and grok keys
                    const decryptedKeys = decryptApiKeys({
                        claude: keys.claude || "",
                        grok: keys.grok || ""
                    });
                    settings.apiKeys.claude = decryptedKeys.claude || process.env.ANTHROPIC_API_KEY || "";
                    settings.apiKeys.grok = decryptedKeys.grok || process.env.XAI_API_KEY || "";
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
            enabled, defaultProvider, apiKeys, geminiMultiKeys, systemPrompt, savedPrompts, savedKeyProfiles,
            enabledRegions, dailyLimit, monthlyTokenLimit, maxInputLength
        } = body;

        // Validate apiKeys format - must be an object, not an array
        if (apiKeys && (Array.isArray(apiKeys) || typeof apiKeys !== 'object')) {
            console.error('[AI Settings] Invalid apiKeys format:', typeof apiKeys, Array.isArray(apiKeys) ? '(Array)' : '');
            return NextResponse.json({ error: 'Invalid apiKeys format - must be an object' }, { status: 400 });
        }

        // Build the global keys object with multi-key support for Gemini
        let globalKeysValue: Record<string, unknown>;

        if (geminiMultiKeys && Array.isArray(geminiMultiKeys) && geminiMultiKeys.length > 0) {
            // Use multi-key format for Gemini
            const encryptedGeminiKeys = geminiMultiKeys.map((entry: GeminiKeyEntry, index: number) => ({
                key: isEncrypted(entry.key) ? entry.key : encryptApiKey(entry.key),
                label: entry.label || String(index + 1), // Default label: 1, 2, 3...
                enabled: entry.enabled !== false
            }));

            globalKeysValue = {
                gemini: encryptedGeminiKeys,
                claude: apiKeys?.claude ? (isEncrypted(apiKeys.claude) ? apiKeys.claude : encryptApiKey(apiKeys.claude)) : "",
                grok: apiKeys?.grok ? (isEncrypted(apiKeys.grok) ? apiKeys.grok : encryptApiKey(apiKeys.grok)) : ""
            };
        } else {
            // Legacy single-key format
            globalKeysValue = encryptApiKeys(apiKeys || {});
        }

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
                // Encrypt API keys before storing (with multi-key support)
                value: globalKeysValue,
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
