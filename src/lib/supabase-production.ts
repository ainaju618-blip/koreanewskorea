/**
 * 운영 Supabase 클라이언트 (읽기 전용)
 * ====================================
 * 개발서버에서 운영DB 데이터를 가져올 때 사용
 *
 * 환경변수 필요:
 * - PROD_SUPABASE_URL
 * - PROD_SUPABASE_ANON_KEY (읽기 전용 키만!)
 */

import { createClient } from '@supabase/supabase-js';

// 운영 DB 연결 (읽기 전용)
export function createProductionClient() {
  const url = process.env.PROD_SUPABASE_URL;
  const key = process.env.PROD_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      '운영 DB 환경변수가 설정되지 않았습니다. ' +
      'PROD_SUPABASE_URL과 PROD_SUPABASE_ANON_KEY를 .env.local에 추가하세요.'
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// 동기화 가능한 테이블 목록
export const SYNC_TABLES = {
  posts: {
    name: 'posts',
    label: '기사',
    description: '보도자료, 뉴스 기사',
    excludeColumns: ['author_id'], // 기자 정보 제외
    required: true,
  },
  categories: {
    name: 'categories',
    label: '카테고리',
    description: '기사 분류 카테고리',
    excludeColumns: [],
    required: true,
  },
  sources: {
    name: 'sources',
    label: '출처',
    description: '기사 수집 출처 정보',
    excludeColumns: [],
    required: false,
  },
} as const;

export type SyncTableKey = keyof typeof SYNC_TABLES;

// 동기화 대상 소스 목록 (나주 지역)
export const SYNC_SOURCES = [
  { value: '나주시', label: '나주시' },
  { value: '나주시의회', label: '나주시의회' },
  { value: '전남교육청 학교', label: '전남교육청 학교' },
  { value: '전남교육청 기관', label: '전남교육청 기관' },
  { value: '전남교육청', label: '전남교육청' },
] as const;

export type SyncSource = typeof SYNC_SOURCES[number]['value'];
