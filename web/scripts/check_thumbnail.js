// 최근 기사의 thumbnail_url 확인
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkThumbnails() {
    // 최근 10개 기사의 thumbnail_url 확인
    const { data, error } = await supabase
        .from('posts')
        .select('id, title, thumbnail_url, source')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('\n=== 최근 10개 기사 thumbnail_url 현황 ===\n');
    data.forEach((post, i) => {
        const hasImage = post.thumbnail_url ? '✅' : '❌';
        console.log(`${i + 1}. ${hasImage} [${post.source}] ${post.title.substring(0, 30)}...`);
        if (post.thumbnail_url) {
            console.log(`   📷 ${post.thumbnail_url.substring(0, 60)}...`);
        }
        console.log('');
    });

    // 이미지가 있는 기사 카운트
    const withImage = data.filter(p => p.thumbnail_url).length;
    console.log(`\n📊 이미지 있음: ${withImage}/${data.length}`);
}

checkThumbnails();
