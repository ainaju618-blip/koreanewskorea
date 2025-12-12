/**
 * 나주시 기사 본문 확인 스크립트
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkContent() {
    console.log('📋 나주시 기사 본문 확인...\n');

    const { data: posts, error } = await supabase
        .from('posts')
        .select('id, title, content, thumbnail_url')
        .eq('region', 'naju')
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.log('❌ 에러:', error.message);
        return;
    }

    posts.forEach((p, i) => {
        console.log(`\n[${i + 1}] ${p.title?.slice(0, 40)}...`);
        console.log(`    이미지: ${p.thumbnail_url ? '✅ 있음' : '❌ 없음'}`);

        const contentLen = p.content?.length || 0;
        const hasRealContent = contentLen > 100 && !p.content?.includes('본문 내용을 가져올 수 없습니다');

        console.log(`    본문: ${hasRealContent ? '✅ 있음' : '❌ 없음'} (${contentLen}자)`);

        if (hasRealContent) {
            console.log(`    미리보기: ${p.content?.slice(0, 80)}...`);
        } else if (p.content) {
            console.log(`    내용: ${p.content?.slice(0, 80)}...`);
        }
    });
}

checkContent().catch(console.error);
