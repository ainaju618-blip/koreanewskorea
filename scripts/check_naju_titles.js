const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkNajuTitles() {
  console.log('=== 나주시 기사 제목 분석 ===\n');

  // Get naju articles
  const { data: articles, error } = await supabase
    .from('posts')
    .select('id, title, original_link, source, ai_processed, created_at, content')
    .eq('region', 'naju')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log(`나주시 최근 기사 ${articles?.length}건\n`);

  let withNewTag = 0;
  let withoutNewTag = 0;

  articles?.forEach((a, i) => {
    const hasNewTag = a.title?.includes('새로운글');
    const contentHasTag = a.content?.includes('새로운글');

    if (hasNewTag) withNewTag++;
    else withoutNewTag++;

    console.log(`${i + 1}. ${hasNewTag ? '⚠️' : '✅'} 제목: ${a.title}`);
    console.log(`   AI처리: ${a.ai_processed ? 'Yes' : 'No'}`);
    console.log(`   본문에 "새로운글": ${contentHasTag ? 'YES' : 'NO'}`);
    console.log(`   출처: ${a.source || 'N/A'}`);
    console.log(`   원본링크: ${a.original_link?.substring(0, 70) || 'N/A'}`);
    console.log('');
  });

  console.log(`=== 통계 ===`);
  console.log(`"새로운글" 포함: ${withNewTag}건`);
  console.log(`정상: ${withoutNewTag}건`);

  // Check where "새로운글" comes from
  if (withNewTag > 0) {
    console.log('\n=== "새로운글" 패턴 분석 ===');
    const problematic = articles.filter(a => a.title?.includes('새로운글'));

    problematic.forEach(a => {
      // Check if it's at the end of title
      const titleEnd = a.title?.slice(-10);
      console.log(`제목 끝 10자: "${titleEnd}"`);
    });
  }
}

checkNajuTitles().catch(console.error);
