/**
 * 기자 배정 API
 * ==============
 * POST: 기자 자동/수동 배정
 * GET: 미배정 기사 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// 자동 배정 규칙 타입
interface AssignmentRule {
  categoryId: string;
  reporterId: string;
}

// POST: 기자 배정 실행
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, rules, assignments } = body;

    if (mode === 'auto') {
      // 자동 배정: 카테고리별 규칙에 따라 배정
      const results = await autoAssign(rules as AssignmentRule[]);
      return NextResponse.json({ success: true, results });
    } else if (mode === 'manual') {
      // 수동 배정: 개별 기사에 기자 배정
      const results = await manualAssign(assignments as { postId: string; reporterId: string }[]);
      return NextResponse.json({ success: true, results });
    } else {
      return NextResponse.json({ error: '잘못된 배정 모드입니다.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Assignment Error:', error);
    return NextResponse.json(
      { error: '기자 배정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 미배정 기사 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 미배정 기사 조회 (sync_status = 'pending')
    const { data: posts, count, error } = await supabaseAdmin
      .from('posts')
      .select(`
        id,
        title,
        category_id,
        source,
        created_at,
        synced_at,
        categories (id, name)
      `, { count: 'exact' })
      .eq('sync_status', 'pending')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 카테고리별 그룹핑
    const categoryGroups: Record<string, { name: string; count: number }> = {};
    posts?.forEach((post) => {
      const catId = post.category_id || 'uncategorized';
      // categories는 단일 객체로 반환됨 (Supabase foreign key join)
      const catData = post.categories as unknown as { id: string; name: string } | null;
      const catName = catData?.name || '미분류';
      if (!categoryGroups[catId]) {
        categoryGroups[catId] = { name: catName, count: 0 };
      }
      categoryGroups[catId].count++;
    });

    return NextResponse.json({
      posts: posts || [],
      total: count || 0,
      page,
      limit,
      categoryGroups,
    });
  } catch (error) {
    console.error('Pending Posts Error:', error);
    return NextResponse.json(
      { error: '미배정 기사 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 자동 배정 함수
async function autoAssign(rules: AssignmentRule[]) {
  const results: { categoryId: string; assigned: number; error?: string }[] = [];

  for (const rule of rules) {
    try {
      // 해당 카테고리의 미배정 기사에 기자 배정
      const { data, error } = await supabaseAdmin
        .from('posts')
        .update({
          author_id: rule.reporterId,
          sync_status: 'assigned',
          assigned_at: new Date().toISOString(),
        })
        .eq('category_id', rule.categoryId)
        .eq('sync_status', 'pending')
        .select('id');

      if (error) {
        results.push({
          categoryId: rule.categoryId,
          assigned: 0,
          error: error.message,
        });
      } else {
        results.push({
          categoryId: rule.categoryId,
          assigned: data?.length || 0,
        });
      }
    } catch (err) {
      results.push({
        categoryId: rule.categoryId,
        assigned: 0,
        error: err instanceof Error ? err.message : '알 수 없는 오류',
      });
    }
  }

  return results;
}

// 수동 배정 함수
async function manualAssign(assignments: { postId: string; reporterId: string }[]) {
  const results: { postId: string; success: boolean; error?: string }[] = [];

  for (const assignment of assignments) {
    try {
      const { error } = await supabaseAdmin
        .from('posts')
        .update({
          author_id: assignment.reporterId,
          sync_status: 'assigned',
          assigned_at: new Date().toISOString(),
        })
        .eq('id', assignment.postId);

      if (error) {
        results.push({
          postId: assignment.postId,
          success: false,
          error: error.message,
        });
      } else {
        results.push({
          postId: assignment.postId,
          success: true,
        });
      }
    } catch (err) {
      results.push({
        postId: assignment.postId,
        success: false,
        error: err instanceof Error ? err.message : '알 수 없는 오류',
      });
    }
  }

  return results;
}
