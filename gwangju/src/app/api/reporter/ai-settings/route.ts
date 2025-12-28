import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface AISettings {
    enabled: boolean;
    provider: "gemini" | "claude" | "grok";
    api_keys: {
        gemini?: string;
        claude?: string;
        grok?: string;
    };
}

/**
 * GET /api/reporter/ai-settings
 * 현재 로그인한 기자의 AI 설정 조회
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            );
        }

        const { data: reporter, error } = await supabaseAdmin
            .from("reporters")
            .select("id, name, ai_settings")
            .eq("user_id", user.id)
            .single();

        if (error || !reporter) {
            return NextResponse.json(
                { error: "기자 정보를 찾을 수 없습니다." },
                { status: 404 }
            );
        }

        // API 키 마스킹
        const settings = reporter.ai_settings as AISettings | null;
        const maskedSettings = settings ? {
            ...settings,
            api_keys: {
                gemini: settings.api_keys?.gemini ? "***" + settings.api_keys.gemini.slice(-4) : null,
                claude: settings.api_keys?.claude ? "***" + settings.api_keys.claude.slice(-4) : null,
                grok: settings.api_keys?.grok ? "***" + settings.api_keys.grok.slice(-4) : null,
            }
        } : null;

        return NextResponse.json({
            reporterId: reporter.id,
            reporterName: reporter.name,
            settings: maskedSettings
        });

    } catch (error: unknown) {
        console.error("GET /api/reporter/ai-settings error:", error);
        const message = error instanceof Error ? error.message : "서버 오류";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * POST /api/reporter/ai-settings
 * 기자 AI 설정 저장
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            );
        }

        // 기존 기자 정보 조회
        const { data: reporter, error: fetchError } = await supabaseAdmin
            .from("reporters")
            .select("id, ai_settings")
            .eq("user_id", user.id)
            .single();

        if (fetchError || !reporter) {
            return NextResponse.json(
                { error: "기자 정보를 찾을 수 없습니다." },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { enabled, provider, apiKey, clearKey } = body;

        // 기존 설정 가져오기
        const currentSettings = (reporter.ai_settings as AISettings) || {
            enabled: false,
            provider: "gemini",
            api_keys: {}
        };

        // 새 설정 구성
        const newSettings: AISettings = {
            enabled: enabled !== undefined ? enabled : currentSettings.enabled,
            provider: provider || currentSettings.provider,
            api_keys: { ...currentSettings.api_keys }
        };

        // API 키 업데이트
        if (apiKey && provider) {
            newSettings.api_keys[provider as keyof typeof newSettings.api_keys] = apiKey;
        }

        // API 키 삭제
        if (clearKey) {
            delete newSettings.api_keys[clearKey as keyof typeof newSettings.api_keys];
        }

        // 저장
        const { error: updateError } = await supabaseAdmin
            .from("reporters")
            .update({ ai_settings: newSettings })
            .eq("id", reporter.id);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            message: "AI 설정이 저장되었습니다."
        });

    } catch (error: unknown) {
        console.error("POST /api/reporter/ai-settings error:", error);
        const message = error instanceof Error ? error.message : "저장 실패";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
