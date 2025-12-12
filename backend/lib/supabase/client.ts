import { createClient } from '@supabase/supabase-js';

// Supabase 환경 변수
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client Component에서 사용할 Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 유틸리티 함수: 클라이언트 인스턴스 반환
export function getSupabaseClient() {
    return supabase;
}
