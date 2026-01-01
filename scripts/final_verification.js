const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  console.log('=== 최종 확인 ===\n');

  // 1. Problem article check
  console.log('1. 문제 기사 확인 (나주 기사)');
  const { data: problemArticle } = await supabase
    .from('posts')
    .select('id, title, region, author_id, author_name, approved_at, status')
    .eq('id', 'f4c64ca7-88f1-4f2d-93c4-00ca79ecf7cd')
    .single();

  if (problemArticle) {
    console.log(`   제목: ${problemArticle.title?.substring(0, 40)}...`);
    console.log(`   지역: ${problemArticle.region}`);
    console.log(`   기자: ${problemArticle.author_name || '없음'}`);
    console.log(`   author_id: ${problemArticle.author_id ? '✅ 설정됨' : '❌ NULL'}`);
    console.log(`   approved_at: ${problemArticle.approved_at ? '✅ 설정됨' : '❌ NULL'}`);
  }

  // 2. Overall stats
  console.log('\n2. 전체 통계');

  const { count: totalPublished } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  const { count: withAuthor } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .not('author_id', 'is', null);

  const { count: withoutAuthor } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .is('author_id', null);

  console.log(`   발행된 기사: ${totalPublished}건`);
  console.log(`   기자 할당됨: ${withAuthor}건 (${((withAuthor / totalPublished) * 100).toFixed(1)}%)`);
  console.log(`   기자 미할당: ${withoutAuthor}건`);

  // 3. Unassigned articles detail
  if (withoutAuthor > 0) {
    console.log('\n3. 미할당 기사 상세');

    const { data: unassigned } = await supabase
      .from('posts')
      .select('id, title, region')
      .eq('status', 'published')
      .is('author_id', null)
      .limit(10);

    unassigned?.forEach((a, i) => {
      console.log(`   ${i + 1}. [${a.region || 'unknown'}] ${a.title?.substring(0, 30)}...`);
    });
  }

  // 4. Reporter assignment distribution
  console.log('\n4. 기자별 할당 현황 (Top 10)');

  const { data: distribution } = await supabase
    .from('posts')
    .select('author_name')
    .eq('status', 'published')
    .not('author_name', 'is', null);

  const counts = {};
  distribution?.forEach(d => {
    counts[d.author_name] = (counts[d.author_name] || 0) + 1;
  });

  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([name, count], i) => {
      console.log(`   ${i + 1}. ${name}: ${count}건`);
    });
}

verify().catch(console.error);
