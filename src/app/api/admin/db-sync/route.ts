/**
 * 운영 DB 동기화 API
 * ==================
 * POST: 동기화 실행
 * GET: 동기화 상태 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createProductionClient, SYNC_TABLES, type SyncTableKey } from '@/lib/supabase-production';

// 동기화 요청 타입
interface SyncRequest {
  tables: SyncTableKey[];
  dateRange: '1day' | '2days' | '3days' | '5days' | 'week' | 'month' | 'all';
  mode: 'merge' | 'overwrite';
}

// 동기화 결과 타입
interface SyncResult {
  table: string;
  success: boolean;
  count: number;
  error?: string;
}

// POST: 동기화 실행
export async function POST(request: NextRequest) {
  try {
    const body: SyncRequest = await request.json();
    const { tables, dateRange, mode } = body;

    // 환경변수 확인
    if (!process.env.PROD_SUPABASE_URL || !process.env.PROD_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        {
          error: '운영 DB 환경변수가 설정되지 않았습니다.',
          hint: 'PROD_SUPABASE_URL과 PROD_SUPABASE_ANON_KEY를 .env.local에 추가하세요.'
        },
        { status: 500 }
      );
    }

    const prodClient = createProductionClient();
    const results: SyncResult[] = [];

    // 날짜 필터 계산
    const dateFilter = getDateFilter(dateRange);

    for (const tableKey of tables) {
      const tableConfig = SYNC_TABLES[tableKey];
      if (!tableConfig) continue;

      try {
        // 1. 운영 DB에서 데이터 조회
        let query = prodClient.from(tableConfig.name).select('*');

        // 날짜 필터 적용 (posts 테이블만)
        if (tableKey === 'posts' && dateFilter) {
          query = query.gte('created_at', dateFilter);
        }

        const { data: prodData, error: fetchError } = await query;

        if (fetchError) {
          results.push({
            table: tableConfig.label,
            success: false,
            count: 0,
            error: fetchError.message,
          });
          continue;
        }

        if (!prodData || prodData.length === 0) {
          results.push({
            table: tableConfig.label,
            success: true,
            count: 0,
          });
          continue;
        }

        // 2. 제외 컬럼 처리 (기자 정보 등)
        const cleanedData = prodData.map((row) => {
          const cleaned = { ...row };
          tableConfig.excludeColumns.forEach((col) => {
            cleaned[col] = null;
          });
          // 동기화 메타데이터 추가
          if (tableKey === 'posts') {
            cleaned.sync_status = 'pending'; // 기자 배정 대기
            cleaned.synced_at = new Date().toISOString();
            cleaned.synced_from = 'production';
          }
          return cleaned;
        });

        // 3. 개발 DB에 저장
        if (mode === 'overwrite' && tableKey !== 'posts') {
          // 덮어쓰기 모드: 기존 데이터 삭제 후 삽입 (posts는 보호)
          await supabaseAdmin.from(tableConfig.name).delete().neq('id', '');
        }

        const { error: insertError } = await supabaseAdmin
          .from(tableConfig.name)
          .upsert(cleanedData, { onConflict: 'id' });

        if (insertError) {
          results.push({
            table: tableConfig.label,
            success: false,
            count: 0,
            error: insertError.message,
          });
        } else {
          results.push({
            table: tableConfig.label,
            success: true,
            count: cleanedData.length,
          });
        }
      } catch (err) {
        results.push({
          table: tableConfig.label,
          success: false,
          count: 0,
          error: err instanceof Error ? err.message : '알 수 없는 오류',
        });
      }
    }

    // 동기화 기록 저장
    const totalCount = results.reduce((sum, r) => sum + r.count, 0);
    const allSuccess = results.every((r) => r.success);

    return NextResponse.json({
      success: allSuccess,
      results,
      summary: {
        totalSynced: totalCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('DB Sync Error:', error);
    return NextResponse.json(
      { error: '동기화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 마지막 동기화 상태 및 미배정 기사 수 조회
export async function GET() {
  try {
    // 미배정 기사 수 조회
    const { count: pendingCount } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('sync_status', 'pending');

    // 최근 동기화된 기사 수
    const { count: syncedCount } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .not('synced_from', 'is', null);

    return NextResponse.json({
      pendingAssignment: pendingCount || 0,
      totalSynced: syncedCount || 0,
    });
  } catch (error) {
    console.error('DB Sync Status Error:', error);
    return NextResponse.json(
      { error: '상태 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 날짜 필터 계산
function getDateFilter(range: '1day' | '2days' | '3days' | '5days' | 'week' | 'month' | 'all'): string | null {
  if (range === 'all') return null;

  const now = new Date();
  const daysMap: Record<string, number> = {
    '1day': 1,
    '2days': 2,
    '3days': 3,
    '5days': 5,
    'week': 7,
    'month': 30,
  };

  const days = daysMap[range];
  if (days) {
    now.setDate(now.getDate() - days);
  }
  return now.toISOString();
}
