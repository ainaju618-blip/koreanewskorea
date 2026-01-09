import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { POSITION_LABELS } from '@/lib/reporter-utils';

// 카테고리 → source 매핑
const categorySourceMap: Record<string, string> = {
  government: '나주시',
  council: '나주시의회',
  education: '나주교육지원청',
  fire: '나주소방서',
  business: '나주상공회의소',
  opinion: '코리아뉴스 나주',
};

/**
 * GET /api/admin/articles
 * 기사 목록 조회 (페이지네이션)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // draft, published, all
    const category = searchParams.get('category');

    const offset = (page - 1) * limit;

    // 기본 쿼리: 나주 지역 기사
    let query = supabaseAdmin
      .from('posts')
      .select('id, title, subtitle, content, category, source, thumbnail_url, author_name, author_id, status, view_count, created_at, published_at', { count: 'exact' })
      .eq('region', 'naju')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 상태 필터
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 카테고리 필터
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: articles, error, count } = await query;

    if (error) {
      console.error('Articles query error:', error);
      return NextResponse.json(
        { error: '기사 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      articles: articles || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Articles API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/articles
 * 새 기사 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      subtitle,
      content,
      category,
      thumbnail_url,
      reporter_id,
      status = 'draft',
    } = body;

    // 필수 필드 검증
    if (!title?.trim()) {
      return NextResponse.json(
        { error: '제목을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!content?.trim()) {
      return NextResponse.json(
        { error: '본문을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: '카테고리를 선택해주세요.' },
        { status: 400 }
      );
    }

    if (!reporter_id) {
      return NextResponse.json(
        { error: '기자를 선택해주세요.' },
        { status: 400 }
      );
    }

    // 기자 정보 조회 (이름과 직위를 author_name에 저장하기 위해)
    const { data: reporter } = await supabaseAdmin
      .from('reporters')
      .select('id, name, user_id, position')
      .eq('id', reporter_id)
      .single();

    if (!reporter) {
      return NextResponse.json(
        { error: '기자 정보를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }

    // 직위 한글 변환 (예: national_chief_director → 전국총괄본부장)
    const positionLabel = reporter.position
      ? POSITION_LABELS[reporter.position] || '기자'
      : '기자';

    // 본문 줄바꿈 처리 (빈 줄은 문단 구분)
    const processedContent = content
      .split(/\n\n+/)
      .map((p: string) => p.trim())
      .filter((p: string) => p)
      .map((p: string) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('\n');

    // source 결정
    const source = categorySourceMap[category] || '코리아뉴스 나주';

    const articleData = {
      title: title.trim(),
      subtitle: subtitle?.trim() || null,
      content: processedContent,
      category,
      source,
      region: 'naju',
      thumbnail_url: thumbnail_url || null,
      author_name: `${reporter.name} ${positionLabel}`,  // 기자 이름 + 직위 저장 (예: "허철호 전국총괄본부장")
      author_id: reporter.user_id || null,  // profiles.id와 연결
      status,
      view_count: 0,
      published_at: status === 'published' ? new Date().toISOString() : null,
    };

    const { data: article, error } = await supabaseAdmin
      .from('posts')
      .insert(articleData)
      .select('*')
      .single();

    if (error) {
      console.error('Article insert error:', error);
      return NextResponse.json(
        { error: '기사 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      article,
      message: status === 'published' ? '기사가 게시되었습니다.' : '임시저장 되었습니다.',
    });
  } catch (error) {
    console.error('Article create error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
