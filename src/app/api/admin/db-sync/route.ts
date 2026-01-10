/**
 * 운영 DB 동기화 API
 * ==================
 * POST: 동기화 실행
 * GET: 동기화 상태 조회
 *
 * 스키마 캐시 우회: PostgREST 스키마 캐시 문제를 자동으로 감지하고 우회
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createProductionClient, SYNC_TABLES, SYNC_SOURCES, type SyncTableKey, type SyncSource } from '@/lib/supabase-production';

// 동기화 요청 타입
interface SyncRequest {
  tables: SyncTableKey[];
  dateRange: '1day' | '2days' | '3days' | '5days' | 'week' | 'month' | 'all';
  mode: 'merge' | 'overwrite';
  sources?: SyncSource[];  // 소스 필터 (선택)
}

// 동기화 결과 타입
interface SyncResult {
  table: string;
  success: boolean;
  count: number;
  error?: string;
}

// 스키마 캐시 오류에서 문제 컬럼 추출
function extractProblemColumn(errorMessage: string): string | null {
  const match = errorMessage.match(/Could not find the '(\w+)' column/);
  return match ? match[1] : null;
}

// 데이터에서 특정 컬럼들 제거
function removeColumns(data: Record<string, unknown>[], columns: string[]): Record<string, unknown>[] {
  return data.map(row => {
    const filtered = { ...row };
    columns.forEach(col => delete filtered[col]);
    return filtered;
  });
}

// 스키마 캐시 문제를 우회하여 upsert 수행
async function safeUpsert(
  tableName: string,
  data: Record<string, unknown>[],
  removedColumns: string[] = []
): Promise<{ error: Error | null; removedColumns: string[] }> {
  try {
    // 먼저 일반 upsert 시도
    const { error } = await supabaseAdmin
      .from(tableName)
      .upsert(data, { onConflict: 'id' });

    if (error) {
      const problemColumn = extractProblemColumn(error.message);

      if (problemColumn) {
        console.log(`Schema cache issue detected, falling back to RPC for upsert '${tableName}'`);

        // RPC 함수로 대체 (PostgREST 스키마 캐시 우회)
        const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('upsert_sync_data', {
          table_name: tableName,
          data: data  // JSONB 타입은 직접 배열 전달
        });

        if (rpcError) {
          return { error: rpcError, removedColumns: [] };
        }

        console.log(`RPC upsert result:`, rpcResult);
        return { error: null, removedColumns: ['(RPC 사용)'] };
      }

      return { error, removedColumns };
    }

    return { error: null, removedColumns };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error(String(err)),
      removedColumns
    };
  }
}

// 운영 DB에서 안전하게 SELECT (스키마 캐시 오류 시 RPC 대체 사용, 소스 필터 지원)
async function safeSelect(
  prodClient: ReturnType<typeof createProductionClient>,
  tableName: string,
  dateFilter: string | null,
  sourceFilter?: string[]  // 소스 필터 추가
): Promise<{ data: Record<string, unknown>[] | null; error: Error | null }> {
  try {
    const allData: Record<string, unknown>[] = [];
    const pageSize = 1000;
    let offset = 0;
    let hasMore = true;

    // 페이지네이션으로 전체 데이터 가져오기
    console.log('[DB-SYNC] safeSelect:', { tableName, dateFilter, sourceFilter });

    while (hasMore) {
      let query = prodClient.from(tableName).select('*').range(offset, offset + pageSize - 1);

      if (tableName === 'posts') {
        if (dateFilter) {
          query = query.gte('created_at', dateFilter);
        }
        // 소스 필터 적용
        if (sourceFilter && sourceFilter.length > 0) {
          query = query.in('source', sourceFilter);
        }
      }

      const { data, error } = await query;
      console.log('[DB-SYNC] Query result:', { offset, dataLength: data?.length, error: error?.message });

      if (error) {
        const problemColumn = extractProblemColumn(error.message);
        if (problemColumn) {
          console.log(`Schema cache issue detected, falling back to RPC for table '${tableName}'`);

          // RPC 함수로 대체 (PostgREST 스키마 캐시 우회)
          const { data: rpcData, error: rpcError } = await prodClient.rpc('get_table_data', {
            table_name: tableName,
            date_filter: tableName === 'posts' ? dateFilter : null
          });

          if (rpcError) {
            return { data: null, error: rpcError };
          }

          // RPC 결과에 클라이언트 측 소스 필터 적용
          let filteredData = rpcData as Record<string, unknown>[];
          if (tableName === 'posts' && sourceFilter && sourceFilter.length > 0) {
            filteredData = filteredData.filter(row =>
              sourceFilter.includes(row.source as string)
            );
            console.log(`[DB-SYNC] RPC data filtered by source: ${rpcData?.length} -> ${filteredData.length}`);
          }

          return { data: filteredData, error: null };
        }
        return { data: null, error };
      }

      if (data && data.length > 0) {
        allData.push(...(data as Record<string, unknown>[]));
        offset += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    return { data: allData, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err))
    };
  }
}

// POST: 동기화 실행
export async function POST(request: NextRequest) {
  try {
    const body: SyncRequest = await request.json();
    const { tables, dateRange, mode, sources } = body;

    console.log('[DB-SYNC] Request:', { tables, dateRange, mode, sources });

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
        // 1. 운영 DB에서 데이터 조회 (스키마 캐시 우회 적용, 소스 필터)
        const { data: prodData, error: fetchError } = await safeSelect(
          prodClient,
          tableConfig.name,
          tableKey === 'posts' ? dateFilter : null,
          tableKey === 'posts' ? sources : undefined  // posts에만 소스 필터 적용
        );

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

        // 3. 개발 DB에 저장 (스키마 캐시 우회 적용)
        if (mode === 'overwrite' && tableKey !== 'posts') {
          // 덮어쓰기 모드: 기존 데이터 삭제 후 삽입 (posts는 보호)
          await supabaseAdmin.from(tableConfig.name).delete().neq('id', '');
        }

        // safeUpsert: 스키마 캐시 문제 발생 시 자동으로 문제 컬럼 제거 후 재시도
        const { error: insertError, removedColumns } = await safeUpsert(
          tableConfig.name,
          cleanedData as Record<string, unknown>[]
        );

        if (insertError) {
          results.push({
            table: tableConfig.label,
            success: false,
            count: 0,
            error: insertError.message,
          });
        } else {
          const warningMsg = removedColumns.length > 0
            ? ` (스키마 캐시 문제로 제외된 컬럼: ${removedColumns.join(', ')})`
            : '';
          results.push({
            table: tableConfig.label,
            success: true,
            count: cleanedData.length,
            error: warningMsg || undefined,
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
