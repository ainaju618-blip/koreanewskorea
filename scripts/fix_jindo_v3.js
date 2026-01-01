const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixJindo() {
  console.log('=== 진도군 기사 수정 (2명 랜덤 할당) ===\n');

  const reporters = [
    {
      name: '한결',
      user_id: 'eb40e16a-6a13-4d9a-92cd-e3f70cfc287b',
      position: 'reporter'
    },
    {
      name: '허현희',
      user_id: '925d5be2-24c3-4181-acd2-fa7b907041fc',
      position: 'branch_manager'
    }
  ];

  // Step 1: Create profile for 허현희 if not exists
  console.log('Step 1: 허현희 프로필 생성 확인...');

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', reporters[1].user_id)
    .single();

  if (!existingProfile) {
    const { error: createError } = await supabase
      .from('profiles')
      .insert({
        id: reporters[1].user_id,
        full_name: '허현희',
        role: 'reporter',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (createError) {
      console.log('❌ 프로필 생성 실패:', createError);
      return;
    }
    console.log('✅ 허현희 프로필 생성 완료');
  } else {
    console.log('✅ 허현희 프로필 이미 존재');
  }

  // Step 2: Get jindo articles
  console.log('\nStep 2: 진도군 기사 조회...');

  const { data: jindoArticles, error: fetchError } = await supabase
    .from('posts')
    .select('id, title')
    .eq('region', 'jindo')
    .is('author_id', null);

  if (fetchError) {
    console.log('Error:', fetchError);
    return;
  }

  console.log(`진도군 미할당 기사: ${jindoArticles?.length}건`);

  if (!jindoArticles || jindoArticles.length === 0) {
    console.log('No articles to fix.');
    return;
  }

  // Step 3: Randomly assign
  console.log('\nStep 3: 랜덤 할당 시작...');

  let hangyeolCount = 0;
  let heoCount = 0;

  for (const article of jindoArticles) {
    // Random selection (50/50)
    const reporter = reporters[Math.floor(Math.random() * reporters.length)];

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        author_id: reporter.user_id,
        author_name: reporter.name,
        approved_at: new Date().toISOString()
      })
      .eq('id', article.id);

    if (updateError) {
      console.log(`❌ ${article.id}: ${updateError.message}`);
    } else {
      if (reporter.name === '한결') hangyeolCount++;
      else heoCount++;
    }
  }

  console.log(`\n=== 할당 결과 ===`);
  console.log(`한결: ${hangyeolCount}건`);
  console.log(`허현희: ${heoCount}건`);

  // Final count
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .is('author_id', null)
    .eq('status', 'published');

  console.log(`\n남은 미할당 기사: ${count}건`);
}

fixJindo().catch(console.error);
