/**
 * Supabase 테이블/스키마 확인 스크립트
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    console.log('🔍 Supabase 연결 확인...\n');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    // 1. posts 테이블에서 나주 데이터 조회
    console.log('\n📋 나주시(naju) 기사 조회...');
    const { data: najuPosts, error: najuError } = await supabase
        .from('posts')
        .select('id, title, region, created_at')
        .eq('region', 'naju')
        .limit(5);

    if (najuError) {
        console.log('❌ 에러:', najuError.message);
    } else {
        console.log(`✅ 나주 기사 수: ${najuPosts?.length || 0}개`);
        if (najuPosts && najuPosts.length > 0) {
            najuPosts.forEach(p => {
                console.log(`   - [${p.id}] ${p.title?.slice(0, 40)}...`);
            });
        }
    }

    // 2. 전체 posts 개수
    console.log('\n📊 전체 통계...');
    const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

    console.log(`   전체 게시글: ${count || 0}개`);
}

checkSchema().catch(console.error);
