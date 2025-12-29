import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import crypto from 'crypto';

// RSS 파서 설정
const parser = new Parser({
    customFields: {
        item: [
            ['dc:creator', 'creator'],
            ['content:encoded', 'contentEncoded'],
            ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
            ['media:content', 'mediaContent', { keepArray: false }],
        ]
    }
});

// 수집처 설정
interface AISource {
    code: string;
    name: string;
    type: 'rss' | 'scraping';
    feed_url?: string;
    enabled: boolean;
    category?: 'ai_media' | 'korea_major' | 'foreign';  // 카테고리 분류
    keywords?: string[];  // AI 키워드 필터 (있으면 필터링 적용)
}

// AI 키워드 필터
const AI_KEYWORDS = [
    // 한글 키워드
    '인공지능', 'AI', '생성형', '챗GPT', '챗봇', 'LLM',
    '머신러닝', '딥러닝', '자율주행', '로봇',
    // 영문 키워드
    'GPT', 'OpenAI', 'Claude', 'Gemini', 'ChatGPT',
    'artificial intelligence', 'machine learning', 'deep learning',
    // 기업/서비스
    '앤트로픽', '오픈AI', '구글AI', '메타AI', '네이버클로바',
    'Anthropic', 'Microsoft Copilot', 'Midjourney', 'DALL-E'
];

// AI 관련 기사인지 확인
function isAIRelated(title: string, content?: string): boolean {
    const text = `${title} ${content || ''}`.toLowerCase();
    return AI_KEYWORDS.some(keyword =>
        text.toLowerCase().includes(keyword.toLowerCase())
    );
}

// 기본 수집처 목록
const AI_SOURCES: AISource[] = [
    // ===== 국내 AI 전문 매체 =====
    {
        code: 'aitimes',
        name: 'AI타임스',
        type: 'rss',
        feed_url: 'https://www.aitimes.com/rss/allArticle.xml',
        enabled: true,
        category: 'ai_media'
    },

    // ===== 국내 중앙일간지 (AI 키워드 필터링) =====
    {
        code: 'donga',
        name: '동아일보',
        type: 'rss',
        feed_url: 'https://rss.donga.com/it.xml',
        enabled: true,
        category: 'korea_major',
        keywords: AI_KEYWORDS
    },
    {
        code: 'chosun',
        name: '조선일보',
        type: 'rss',
        feed_url: 'https://www.chosun.com/arc/outboundfeeds/rss/category/economy/?outputType=xml',
        enabled: true,
        category: 'korea_major',
        keywords: AI_KEYWORDS
    },
    {
        code: 'joongang',
        name: '중앙일보',
        type: 'rss',
        feed_url: 'https://rss.joins.com/joins_it_list.xml',
        enabled: true,
        category: 'korea_major',
        keywords: AI_KEYWORDS
    },
    {
        code: 'hani',
        name: '한겨레',
        type: 'rss',
        feed_url: 'https://www.hani.co.kr/rss/science/',
        enabled: true,
        category: 'korea_major',
        keywords: AI_KEYWORDS
    },
    {
        code: 'khan',
        name: '경향신문',
        type: 'rss',
        feed_url: 'https://www.khan.co.kr/rss/rssdata/kh_it.xml',
        enabled: true,
        category: 'korea_major',
        keywords: AI_KEYWORDS
    },
    {
        code: 'hankyung',
        name: '한국경제',
        type: 'rss',
        feed_url: 'https://www.hankyung.com/feed/it',
        enabled: true,
        category: 'korea_major',
        keywords: AI_KEYWORDS
    },
    {
        code: 'mk',
        name: '매일경제',
        type: 'rss',
        feed_url: 'https://www.mk.co.kr/rss/30000001/',
        enabled: true,
        category: 'korea_major',
        keywords: AI_KEYWORDS
    },

    // ===== 해외 AI 뉴스 =====
    {
        code: 'techcrunch',
        name: 'TechCrunch AI',
        type: 'rss',
        feed_url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
        enabled: true,
        category: 'foreign'
    },
    {
        code: 'theverge',
        name: 'The Verge AI',
        type: 'rss',
        feed_url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
        enabled: true,
        category: 'foreign'
    },
    {
        code: 'venturebeat',
        name: 'VentureBeat AI',
        type: 'rss',
        feed_url: 'https://venturebeat.com/category/ai/feed/',
        enabled: true,
        category: 'foreign'
    },
    {
        code: 'wired',
        name: 'Wired AI',
        type: 'rss',
        feed_url: 'https://www.wired.com/feed/tag/ai/latest/rss',
        enabled: true,
        category: 'foreign'
    },
    {
        code: 'arstechnica',
        name: 'Ars Technica',
        type: 'rss',
        feed_url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
        enabled: false,
        category: 'foreign'
    }
];

// URL 해시 생성
function generateUrlHash(url: string): string {
    return crypto.createHash('sha256').update(url).digest('hex').substring(0, 16);
}

// 썸네일 추출
function extractThumbnail(item: any): string | null {
    // media:thumbnail
    if (item.mediaThumbnail?.$ ?.url) {
        return item.mediaThumbnail.$.url;
    }
    // media:content
    if (item.mediaContent?.$ ?.url) {
        return item.mediaContent.$.url;
    }
    // enclosure
    if (item.enclosure?.url) {
        return item.enclosure.url;
    }
    // description에서 이미지 추출
    if (item.content || item.contentEncoded) {
        const content = item.contentEncoded || item.content;
        const imgMatch = content?.match(/<img[^>]+src=["']([^"']+)["']/);
        if (imgMatch) {
            return imgMatch[1];
        }
    }
    return null;
}

// 날짜 파싱
function parseDate(dateStr: string | undefined): string | null {
    if (!dateStr) return null;
    try {
        return new Date(dateStr).toISOString();
    } catch {
        return null;
    }
}

// RSS 수집 함수
async function collectFromRSS(source: AISource): Promise<any[]> {
    if (!source.feed_url) return [];

    try {
        const feed = await parser.parseURL(source.feed_url);
        const articles = [];
        const needsKeywordFilter = source.keywords && source.keywords.length > 0;

        for (const item of feed.items.slice(0, 20)) { // 필터링 고려해 20개까지 확인
            const url = item.link || item.guid;
            if (!url) continue;

            const title = item.title || '제목 없음';
            const content = item.contentEncoded || item.content || null;
            const summary = item.contentSnippet || item.summary || null;

            // 키워드 필터가 있는 경우 AI 관련 기사만 수집
            if (needsKeywordFilter) {
                if (!isAIRelated(title, content || summary || '')) {
                    continue;  // AI 관련 아니면 스킵
                }
            }

            articles.push({
                source_code: source.code,
                source_name: source.name,
                source_url: url,
                url_hash: generateUrlHash(url),
                title,
                content,
                summary,
                author: item.creator || (item as any).author || null,
                thumbnail_url: extractThumbnail(item),
                published_at: parseDate(item.pubDate || item.isoDate),
                collected_at: new Date().toISOString(),
                status: 'pending',
                category: source.category  // 카테고리 정보 추가
            });

            // 최대 10개까지만
            if (articles.length >= 10) break;
        }

        console.log(`[${source.code}] ${articles.length}개 수집 (필터: ${needsKeywordFilter ? 'AI 키워드' : '없음'})`);
        return articles;
    } catch (error) {
        console.error(`[${source.code}] RSS 수집 실패:`, error);
        return [];
    }
}

// 메모리 저장소 (실제로는 Supabase 사용)
let collectedArticles: any[] = [];

// GET: 수집된 기사 조회
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source');
    const status = searchParams.get('status');

    let filtered = [...collectedArticles];

    if (source && source !== 'all') {
        filtered = filtered.filter(a => a.source_code === source);
    }
    if (status && status !== 'all') {
        filtered = filtered.filter(a => a.status === status);
    }

    // 최신순 정렬
    filtered.sort((a, b) =>
        new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime()
    );

    return NextResponse.json({
        success: true,
        articles: filtered,
        total: filtered.length,
        sources: AI_SOURCES
    });
}

// POST: 새로 수집
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { sourceCode } = body;

        const sourcesToCollect = sourceCode
            ? AI_SOURCES.filter(s => s.code === sourceCode && s.enabled)
            : AI_SOURCES.filter(s => s.enabled);

        if (sourcesToCollect.length === 0) {
            return NextResponse.json({
                success: false,
                message: '활성화된 수집처가 없습니다.'
            }, { status: 400 });
        }

        let totalCollected = 0;
        const results: { source: string; count: number; error?: string }[] = [];

        for (const source of sourcesToCollect) {
            if (source.type === 'rss') {
                const articles = await collectFromRSS(source);

                // 중복 제거 후 추가
                for (const article of articles) {
                    const exists = collectedArticles.some(a => a.url_hash === article.url_hash);
                    if (!exists) {
                        collectedArticles.push({
                            ...article,
                            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                        });
                        totalCollected++;
                    }
                }

                results.push({
                    source: source.name,
                    count: articles.length
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `${totalCollected}개의 새 기사를 수집했습니다.`,
            results,
            totalCollected
        });

    } catch (error: any) {
        console.error('[API] AI 뉴스 수집 오류:', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}

// DELETE: 기사 삭제
export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
        collectedArticles = collectedArticles.filter(a => a.id !== id);
    } else {
        // 전체 삭제
        collectedArticles = [];
    }

    return NextResponse.json({
        success: true,
        message: '삭제되었습니다.'
    });
}
