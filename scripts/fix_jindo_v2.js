const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixJindo() {
  console.log('=== 진도군 기사 수정 (한결 기자 할당) ===\n');

  const hangyeolUserId = 'eb40e16a-6a13-4d9a-92cd-e3f70cfc287b';

  // Get jindo articles with NULL author_id
  const { data: jindoArticles, error: fetchError } = await supabase
    .from('posts')
    .select('id, title')
    .eq('region', 'jindo')
    .is('author_id', null);

  if (fetchError) {
    console.log('Error fetching:', fetchError);
    return;
  }

  console.log(`진도군 미할당 기사: ${jindoArticles?.length}건\n`);

  if (!jindoArticles || jindoArticles.length === 0) {
    console.log('No articles to fix.');
    return;
  }

  // Update
  const { error: updateError } = await supabase
    .from('posts')
    .update({
      author_id: hangyeolUserId,
      author_name: '한결',
      approved_at: new Date().toISOString()
    })
    .eq('region', 'jindo')
    .is('author_id', null);

  if (updateError) {
    console.log('❌ Error:', updateError);
  } else {
    console.log(`✅ ${jindoArticles.length}건 → 한결 기자 할당 완료`);
  }

  // Final count
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .is('author_id', null)
    .eq('status', 'published');

  console.log(`\n남은 미할당 기사: ${count}건`);
}

fixJindo().catch(console.error);
