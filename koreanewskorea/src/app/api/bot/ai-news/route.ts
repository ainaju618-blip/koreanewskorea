/**
 * AI 뉴스 스크래퍼 API 엔드포인트
 * POST: AI 뉴스 수집 실행
 * GET: 최근 로그 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAiNewsLog, executeAiNewsScraper, AI_NEWS_FEEDS } from '@/lib/ai-news-service';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST: AI 뉴스 수집 실행
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { feed = 'techcrunch', maxArticles = 3, apiKey } = body;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Groq API 키가 필요합니다' },
                { status: 400 }
            );
        }

        // 유효한 피드인지 확인
        const validFeed = AI_NEWS_FEEDS.find(f => f.key === feed);
        if (!validFeed) {
            return NextResponse.json(
                { error: `유효하지 않은 피드: ${feed}` },
                { status: 400 }
            );
        }

        // 로그 생성
        const logId = await createAiNewsLog(feed, maxArticles, apiKey);
        if (!logId) {
            return NextResponse.json(
                { error: '로그 생성 실패' },
                { status: 500 }
            );
        }

        // 비동기로 스크래퍼 실행 (응답은 바로 반환)
        executeAiNewsScraper(logId, feed, maxArticles, apiKey)
            .then(result => {
                console.log(`[AI News] 완료: ${result.message}`);
            })
            .catch(err => {
                console.error(`[AI News] 에러:`, err);
            });

        return NextResponse.json({
            success: true,
            message: 'AI 뉴스 수집 시작됨',
            logId: logId,
            feed: validFeed.name
        });

    } catch (error) {
        console.error('[AI News API] 에러:', error);
        return NextResponse.json(
            { error: '서버 에러' },
            { status: 500 }
        );
    }
}

// GET: 최근 로그 조회
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('bot_logs')
            .select('*')
            .like('region', 'ai_news_%')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            feeds: AI_NEWS_FEEDS,
            logs: data || []
        });

    } catch (error) {
        console.error('[AI News API] 조회 에러:', error);
        return NextResponse.json(
            { error: '서버 에러' },
            { status: 500 }
        );
    }
}
