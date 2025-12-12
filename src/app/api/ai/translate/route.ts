import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
    try {
        const { text, targetLang = 'ko' } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'text 필드가 필요합니다.' }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            // API 키가 없으면 원본 반환 (개발용)
            return NextResponse.json({
                translated: text,
                note: 'OpenAI API 키가 설정되지 않아 원본을 반환합니다.'
            });
        }

        const openai = new OpenAI({ apiKey });

        const langName = targetLang === 'ko' ? '한국어' : targetLang === 'en' ? '영어' : targetLang;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `당신은 전문 번역가입니다. 주어진 텍스트를 ${langName}로 자연스럽게 번역하세요.
HTML 태그가 있다면 유지하고, 텍스트 내용만 번역합니다.
뉴스 기사 스타일에 맞게 격식체로 번역하세요.`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.3,
        });

        const translated = response.choices[0]?.message?.content || text;

        return NextResponse.json({ translated });

    } catch (error: any) {
        console.error('Translation Error:', error);
        return NextResponse.json(
            { error: error.message || '번역 중 오류 발생' },
            { status: 500 }
        );
    }
}
