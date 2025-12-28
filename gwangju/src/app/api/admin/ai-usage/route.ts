import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/ai-usage
 * AI 사용량 통계 조회
 */
export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const monthStart = new Date();
        monthStart.setDate(1);
        const monthStartStr = monthStart.toISOString().split('T')[0];

        // 오늘 사용량
        const { data: todayData, error: todayError } = await supabaseAdmin
            .from("ai_usage_logs")
            .select("call_count, input_tokens, output_tokens")
            .eq("date", today);

        if (todayError) {
            console.error("Today usage query error:", todayError);
        }

        const todayStats = {
            callCount: todayData?.reduce((sum, row) => sum + (row.call_count || 0), 0) || 0,
            inputTokens: todayData?.reduce((sum, row) => sum + (row.input_tokens || 0), 0) || 0,
            outputTokens: todayData?.reduce((sum, row) => sum + (row.output_tokens || 0), 0) || 0,
        };

        // 이번 달 사용량
        const { data: monthData, error: monthError } = await supabaseAdmin
            .from("ai_usage_logs")
            .select("call_count, input_tokens, output_tokens")
            .gte("date", monthStartStr)
            .lte("date", today);

        if (monthError) {
            console.error("Month usage query error:", monthError);
        }

        const monthStats = {
            callCount: monthData?.reduce((sum, row) => sum + (row.call_count || 0), 0) || 0,
            inputTokens: monthData?.reduce((sum, row) => sum + (row.input_tokens || 0), 0) || 0,
            outputTokens: monthData?.reduce((sum, row) => sum + (row.output_tokens || 0), 0) || 0,
            totalTokens: monthData?.reduce((sum, row) => sum + (row.input_tokens || 0) + (row.output_tokens || 0), 0) || 0,
        };

        // 지역별 사용량 (이번 달)
        const { data: regionData, error: regionError } = await supabaseAdmin
            .from("ai_usage_logs")
            .select("region, call_count, input_tokens, output_tokens")
            .gte("date", monthStartStr)
            .lte("date", today);

        if (regionError) {
            console.error("Region usage query error:", regionError);
        }

        const regionStats: Record<string, { callCount: number; tokens: number }> = {};
        if (regionData) {
            for (const row of regionData) {
                const region = row.region || "unknown";
                if (!regionStats[region]) {
                    regionStats[region] = { callCount: 0, tokens: 0 };
                }
                regionStats[region].callCount += row.call_count || 0;
                regionStats[region].tokens += (row.input_tokens || 0) + (row.output_tokens || 0);
            }
        }

        // 프로바이더별 사용량 (이번 달)
        const { data: providerData, error: providerError } = await supabaseAdmin
            .from("ai_usage_logs")
            .select("provider, call_count, input_tokens, output_tokens")
            .gte("date", monthStartStr)
            .lte("date", today);

        if (providerError) {
            console.error("Provider usage query error:", providerError);
        }

        const providerStats: Record<string, { callCount: number; tokens: number }> = {};
        if (providerData) {
            for (const row of providerData) {
                const provider = row.provider || "unknown";
                if (!providerStats[provider]) {
                    providerStats[provider] = { callCount: 0, tokens: 0 };
                }
                providerStats[provider].callCount += row.call_count || 0;
                providerStats[provider].tokens += (row.input_tokens || 0) + (row.output_tokens || 0);
            }
        }

        return NextResponse.json({
            today: todayStats,
            month: monthStats,
            byRegion: regionStats,
            byProvider: providerStats,
            fetchedAt: new Date().toISOString()
        });

    } catch (error: unknown) {
        console.error("AI Usage API Error:", error);
        const message = error instanceof Error ? error.message : "Server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
