import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createXai } from "@ai-sdk/xai";

type AIProvider = "gemini" | "claude" | "grok";

// POST: AI API 연결 테스트
export async function POST(request: NextRequest) {
    try {
        const { provider, apiKey } = await request.json() as {
            provider: AIProvider;
            apiKey: string;
        };

        if (!provider || !apiKey) {
            return NextResponse.json(
                { error: "provider와 apiKey가 필요합니다." },
                { status: 400 }
            );
        }

        // 테스트 프롬프트
        const testPrompt = "Hello, respond with 'OK' if you can read this.";

        let model;
        switch (provider) {
            case "gemini": {
                const google = createGoogleGenerativeAI({ apiKey });
                // gemini-2.5-flash: Latest stable model
                model = google("gemini-2.5-flash");
                break;
            }
            case "claude": {
                const anthropic = createAnthropic({ apiKey });
                model = anthropic("claude-3-5-sonnet-20241022");
                break;
            }
            case "grok": {
                const xai = createXai({ apiKey });
                model = xai("grok-2-1212");
                break;
            }
            default:
                return NextResponse.json(
                    { error: "지원하지 않는 provider입니다." },
                    { status: 400 }
                );
        }

        const { text } = await generateText({
            model,
            prompt: testPrompt,
        });

        if (text) {
            return NextResponse.json({
                success: true,
                message: `${provider} 연결 성공`,
                response: text.substring(0, 50)
            });
        } else {
            return NextResponse.json({
                success: false,
                error: "응답이 없습니다."
            }, { status: 500 });
        }

    } catch (error: unknown) {
        console.error("AI 테스트 오류:", error);
        const message = error instanceof Error ? error.message : "연결 테스트 실패";
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
