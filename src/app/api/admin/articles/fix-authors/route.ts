import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/admin/articles/fix-authors
 * 기존 기사의 author_name을 author_id 기반으로 일괄 업데이트
 * posts.author_id -> profiles.id -> reporters.user_id 관계 사용
 */
export async function POST(request: NextRequest) {
  try {
    // 1. author_id가 있지만 author_name이 없거나 기본값인 기사 조회
    const { data: articles, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id, author_id, author_name')
      .not('author_id', 'is', null)
      .or('author_name.is.null,author_name.eq.코리아NEWS 취재팀,author_name.eq.');

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        { error: '기사 조회 실패', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: '업데이트할 기사가 없습니다.',
        updated: 0,
      });
    }

    // 2. 모든 기자 정보 조회 (user_id 기준)
    const authorIds = [...new Set(articles.map(a => a.author_id).filter(Boolean))];

    const { data: reporters, error: reporterError } = await supabaseAdmin
      .from('reporters')
      .select('id, name, user_id')
      .in('user_id', authorIds);

    if (reporterError) {
      console.error('Reporter fetch error:', reporterError);
      return NextResponse.json(
        { error: '기자 정보 조회 실패', details: reporterError.message },
        { status: 500 }
      );
    }

    // user_id → 기자 정보 맵 (author_id = profiles.id = reporters.user_id)
    const reporterMap = new Map(reporters?.map(r => [r.user_id, r]) || []);

    // 3. 각 기사 업데이트
    let updatedCount = 0;
    const errors: string[] = [];

    for (const article of articles) {
      const reporter = reporterMap.get(article.author_id);

      if (!reporter) {
        errors.push(`기사 ${article.id}: author_id ${article.author_id}에 해당하는 기자 없음`);
        continue;
      }

      const { error: updateError } = await supabaseAdmin
        .from('posts')
        .update({
          author_name: reporter.name,
        })
        .eq('id', article.id);

      if (updateError) {
        errors.push(`기사 ${article.id}: ${updateError.message}`);
      } else {
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${updatedCount}개 기사의 기자 정보가 업데이트되었습니다.`,
      updated: updatedCount,
      total: articles.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Fix authors error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/articles/fix-authors
 * 업데이트 대상 기사 미리보기
 */
export async function GET() {
  try {
    const { data: articles, error } = await supabaseAdmin
      .from('posts')
      .select('id, title, author_id, author_name, created_at')
      .not('author_id', 'is', null)
      .or('author_name.is.null,author_name.eq.코리아NEWS 취재팀,author_name.eq.')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { error: '조회 실패', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      count: articles?.length || 0,
      articles: articles || [],
    });
  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
