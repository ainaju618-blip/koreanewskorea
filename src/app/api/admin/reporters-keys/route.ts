import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface ApiKeys {
    gemini: string;
    claude: string;
    grok: string;
}

interface AISettings {
    enabled: boolean;
    provider: string;
    api_keys: ApiKeys;
}

interface ReporterWithKeys {
    id: string;
    name: string;
    position: string;
    region: string;
    ai_settings: AISettings | null;
}

/**
 * GET /api/admin/reporters-keys
 * 기자 목록과 API 키(마스킹) 조회 - 관리자 전용
 */
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from("reporters")
            .select("id, name, position, region, ai_settings")
            .eq("status", "Active")
            .order("name", { ascending: true });

        if (error) {
            console.error("Reporters query error:", error);
            throw error;
        }

        // API 키 마스킹 처리
        const reporters = (data as ReporterWithKeys[]).map((r) => {
            const keys = r.ai_settings?.api_keys;
            return {
                id: r.id,
                name: r.name,
                position: r.position,
                region: r.region,
                hasGemini: !!keys?.gemini,
                hasClaude: !!keys?.claude,
                hasGrok: !!keys?.grok,
                // 마스킹된 키 (앞 4자 + *** + 뒤 4자)
                maskedKeys: {
                    gemini: keys?.gemini ? maskKey(keys.gemini) : null,
                    claude: keys?.claude ? maskKey(keys.claude) : null,
                    grok: keys?.grok ? maskKey(keys.grok) : null,
                },
                // 실제 키 (보안: 프론트에서 직접 사용)
                apiKeys: keys || { gemini: "", claude: "", grok: "" },
            };
        });

        return NextResponse.json({ reporters });
    } catch (error: unknown) {
        console.error("GET /api/admin/reporters-keys error:", error);
        const message = error instanceof Error ? error.message : "Server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

function maskKey(key: string): string {
    if (!key || key.length < 12) return "***";
    return key.slice(0, 4) + "***" + key.slice(-4);
}
