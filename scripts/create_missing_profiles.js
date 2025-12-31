const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createMissingProfiles() {
  console.log('=== 누락된 프로필 생성 ===\n');

  const missingReporters = [
    {
      user_id: '925d5be2-24c3-4181-acd2-fa7b907041fc',
      name: '허현희',
      email: 'hhh2648@koreanewsone.com'
    },
    {
      user_id: '662daeb1-1a33-4942-a75c-41fcbfa2175a',
      name: '우미옥',
      email: 'umo7384@koreanewsone.com'
    },
    {
      user_id: '1323547b-b779-4b83-8085-b516daf4605f',
      name: '한장숙',
      email: 'hanjs78@koreanewsone.com'
    }
  ];

  for (const reporter of missingReporters) {
    // Check if profile already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', reporter.user_id)
      .single();

    if (existing) {
      console.log(`✅ ${reporter.name}: 프로필 이미 존재`);
      continue;
    }

    // Create profile (minimal required fields)
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: reporter.user_id,
        full_name: reporter.name,
        role: 'reporter'
      });

    if (error) {
      console.log(`❌ ${reporter.name}: 생성 실패 - ${error.message}`);
    } else {
      console.log(`✅ ${reporter.name}: 프로필 생성 완료`);
    }
  }

  // Verify
  console.log('\n=== 확인 ===');
  for (const reporter of missingReporters) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', reporter.user_id)
      .single();

    if (data) {
      console.log(`✅ ${reporter.name}: ${data.full_name}`);
    } else {
      console.log(`❌ ${reporter.name}: 프로필 없음`);
    }
  }
}

createMissingProfiles().catch(console.error);
