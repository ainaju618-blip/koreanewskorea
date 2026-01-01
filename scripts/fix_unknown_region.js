const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUnknown() {
  console.log('=== Unknown Region 기사 수정 ===\n');

  // Get unknown articles
  const { data: articles } = await supabase
    .from('posts')
    .select('id, title, region')
    .eq('status', 'published')
    .is('author_id', null);

  console.log(`미할당 기사: ${articles?.length}건\n`);

  // Get 무안군 reporter (김옥순)
  const muanUserId = '8f00b8cb-4088-4926-98f0-dde4957e39f3';
  const muanReporter = '김옥순';

  for (const article of articles || []) {
    console.log(`기사: ${article.title?.substring(0, 40)}...`);
    console.log(`  현재 region: ${article.region || 'NULL'}`);

    // Determine region based on content
    let newRegion = 'muan'; // Default to muan for 무안공항 articles

    if (article.title?.includes('무안')) {
      newRegion = 'muan';
    } else if (article.title?.includes('광주')) {
      newRegion = 'gwangju';
    }

    // Update
    const { error } = await supabase
      .from('posts')
      .update({
        region: newRegion,
        author_id: muanUserId,
        author_name: muanReporter,
        approved_at: new Date().toISOString()
      })
      .eq('id', article.id);

    if (error) {
      console.log(`  ❌ 실패: ${error.message}`);
    } else {
      console.log(`  ✅ 수정됨: region=${newRegion}, 기자=${muanReporter}`);
    }
  }

  // Final count
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .is('author_id', null);

  console.log(`\n남은 미할당: ${count}건`);
}

fixUnknown().catch(console.error);
