import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
    try {
        const { text, style = 'news' } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'text 필드가 필요합니다.' }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            // API 키가 없으면 원본 반환 (개발용)
            return NextResponse.json({
                rewritten: text,
                note: 'OpenAI API 키가 설정되지 않아 원본을 반환합니다.'
            });
        }

        const openai = new OpenAI({ apiKey });

        const stylePrompt = style === 'news'
            ? '한국 신문 기사 스타일로 재작성하세요. 객관적이고 격식있는 어조를 사용하고, 중요한 정보를 앞에 배치하는 역피라미드 구조로 작성합니다.'
            : style === 'summary'
                ? '핵심 내용을 3문장 이내로 요약하세요.'
                : '자연스럽고 읽기 쉽게 다시 작성하세요.';

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `당신은 숙련된 뉴스 편집자입니다. ${stylePrompt}
HTML 태그가 있다면 유지하고, 텍스트 내용만 수정합니다.
원본의 핵심 정보와 사실은 그대로 유지하면서 문장을 다듬으세요.`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.5,
        });

        const rewritten = response.choices[0]?.message?.content || text;

        return NextResponse.json({ rewritten });

    } catch (error: any) {
        console.error('Rewrite Error:', error);
        return NextResponse.json(
            { error: error.message || '재작성 중 오류 발생' },
            { status: 500 }
        );
    }
}
