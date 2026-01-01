const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRegions() {
  // posts.region 값들 확인
  const { data: postRegions } = await supabase
    .from('posts')
    .select('region')
    .not('region', 'is', null)
    .limit(500);

  const uniquePostRegions = [...new Set(postRegions?.map(p => p.region))];
  console.log('=== posts.region 값들 ===');
  console.log(uniquePostRegions);

  // reporters.region 값들 확인
  const { data: reporters } = await supabase
    .from('reporters')
    .select('id, region, name, position, user_id')
    .eq('is_active', true);

  console.log('\n=== 활성 기자 목록 ===');
  reporters?.forEach(r => console.log(`[${r.region}] ${r.name} (${r.position}) - user_id: ${r.user_id}`));

  // author_id가 NULL인 기사 중 region별 분포
  const { data: nullAuthors } = await supabase
    .from('posts')
    .select('region')
    .is('author_id', null)
    .eq('status', 'published');

  const regionCounts = {};
  nullAuthors?.forEach(p => {
    regionCounts[p.region] = (regionCounts[p.region] || 0) + 1;
  });

  console.log('\n=== author_id NULL인 기사 region별 분포 ===');
  Object.entries(regionCounts).sort((a, b) => b[1] - a[1]).forEach(([region, count]) => {
    console.log(`${region}: ${count}건`);
  });
}

checkRegions().catch(console.error);
