/**
 * 나주시 기사 본문 상태 확인 v2
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkContent() {
    const { data: posts } = await supabase
        .from('posts')
        .select('title, content')
        .eq('region', 'naju')
        .order('created_at', { ascending: false })
        .limit(3);

    posts.forEach((p, i) => {
        const hasError = p.content?.includes('본문 내용을 가져올 수 없습니다');
        console.log(`[${i + 1}] ${p.title?.slice(0, 35)}...`);
        console.log(`    상태: ${hasError ? '❌ 추출 실패' : '✅ 추출 성공'}`);
        console.log(`    길이: ${p.content?.length || 0}자`);
        console.log(`    내용: ${p.content?.slice(0, 100)}...`);
        console.log('');
    });
}

checkContent();
