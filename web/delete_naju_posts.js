/**
 * 나주시 기사 삭제 스크립트
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteNajuPosts() {
    console.log('🗑️ 나주시(naju) 기사 삭제 시작...\n');

    // 1. 삭제 전 개수 확인
    const { data: before } = await supabase
        .from('posts')
        .select('id')
        .eq('region', 'naju');

    console.log(`   삭제 대상: ${before?.length || 0}개`);

    if (!before || before.length === 0) {
        console.log('   삭제할 기사가 없습니다.');
        return;
    }

    // 2. 삭제 실행
    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('region', 'naju');

    if (error) {
        console.log('❌ 삭제 실패:', error.message);
    } else {
        console.log(`✅ ${before.length}개 기사 삭제 완료!`);
    }
}

deleteNajuPosts().catch(console.error);
