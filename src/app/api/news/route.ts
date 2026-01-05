import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Category 매핑
const CATEGORY_MAP: Record<string, string[]> = {
  all: [],
  politics: ['정치', '경제', '국회', '청와대', '기획재정부'],
  education: ['교육', '문화', '예술', '교육부', '문화체육관광부'],
  society: ['사회', '복지', '보건', '보건복지부', '고용노동부'],
  tech: ['AI', '과학', '기술', '과학기술정보통신부', '산업통상자원부'],
  region: ['지역', '광주', '전남', '전북'],
  trending: [],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const limit = parseInt(searchParams.get('limit') || '6', 10);

    let query = supabase
      .from('posts')
      .select('id, title, ai_summary, thumbnail_url, category, published_at, view_count')
      .eq('status', 'published');

    // 카테고리 필터링
    if (category === 'trending') {
      query = query.order('view_count', { ascending: false, nullsFirst: false });
    } else if (category !== 'all' && CATEGORY_MAP[category]?.length > 0) {
      const keywords = CATEGORY_MAP[category];
      query = query.or(keywords.map(k => `category.ilike.%${k}%`).join(','));
    }

    query = query.order('published_at', { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ articles: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ articles: data || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ articles: [], error: 'Internal server error' }, { status: 500 });
  }
}
