import { NextRequest, NextResponse } from 'next/server';

// 운영서버(koreanewskorea.com)에서 뉴스 데이터 가져오기
const PRODUCTION_API = 'https://www.koreanewskorea.com';

/**
 * GET /api/region/naju/news
 * 나주 지역 뉴스 데이터 조회 (운영서버 프록시)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = searchParams.get('limit') || '50';

    // 운영서버에서 뉴스 가져오기
    const res = await fetch(`${PRODUCTION_API}/api/region/naju/news?limit=${limit}`, {
      next: { revalidate: 60 }, // 1분 캐시
    });

    if (!res.ok) {
      return NextResponse.json({ articles: [], count: 0 });
    }

    const data = await res.json();
    let articles = data.articles || [];

    // 카테고리 필터링
    if (category && category !== 'all') {
      articles = articles.filter((article: { category?: string; source?: string; title?: string }) => {
        const articleCategory = article.category?.toLowerCase() || '';
        const source = article.source?.toLowerCase() || '';
        const title = article.title?.toLowerCase() || '';

        switch (category) {
          case 'government':
            return articleCategory === 'government' ||
                   source.includes('시청') ||
                   source.includes('나주시') ||
                   title.includes('나주시') ||
                   title.includes('시장') ||
                   title.includes('시청');
          case 'council':
            return articleCategory === 'council' ||
                   source.includes('의회') ||
                   source.includes('의원') ||
                   title.includes('의회') ||
                   title.includes('의원');
          case 'education':
            return articleCategory === 'education' ||
                   source.includes('교육') ||
                   source.includes('학교') ||
                   title.includes('교육') ||
                   title.includes('학교') ||
                   title.includes('학생');
          case 'fire':
            return articleCategory === 'fire' ||
                   source.includes('소방') ||
                   source.includes('119') ||
                   title.includes('소방') ||
                   title.includes('화재') ||
                   title.includes('구급');
          case 'business':
            return articleCategory === 'business' ||
                   source.includes('기업') ||
                   source.includes('산업') ||
                   source.includes('에너지') ||
                   title.includes('기업') ||
                   title.includes('에너지') ||
                   title.includes('산업');
          default:
            return true;
        }
      });
    }

    return NextResponse.json({
      articles,
      count: articles.length
    });
  } catch (error: unknown) {
    console.error('News API error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ articles: [], count: 0 });
  }
}
