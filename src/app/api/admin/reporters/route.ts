import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/admin/reporters
 * 나주 지역 기자 목록 조회
 */
export async function GET() {
  try {
    const { data: reporters, error } = await supabaseAdmin
      .from('reporters')
      .select('id, name, email, role, profile_image, region')
      .or('region.eq.naju,region.eq.전남,region.is.null')
      .order('name');

    if (error) {
      console.error('Reporters query error:', error);
      return NextResponse.json(
        { error: '기자 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reporters: reporters || [] });
  } catch (error) {
    console.error('Reporters API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
