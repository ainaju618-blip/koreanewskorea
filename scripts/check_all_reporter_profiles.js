const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllReporterProfiles() {
  console.log('=== 모든 기자 프로필 상태 확인 ===\n');

  // Get all reporters with user_id
  const { data: reporters, error } = await supabase
    .from('reporters')
    .select('id, name, position, region, user_id, email')
    .not('user_id', 'is', null);

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log(`user_id가 있는 기자: ${reporters?.length}명\n`);

  const missing = [];
  const ok = [];

  for (const r of reporters || []) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', r.user_id)
      .single();

    if (!profile) {
      missing.push(r);
    } else {
      ok.push(r);
    }
  }

  console.log(`✅ 프로필 있음: ${ok.length}명`);
  console.log(`❌ 프로필 없음: ${missing.length}명\n`);

  if (missing.length > 0) {
    console.log('=== 프로필 누락된 기자 목록 ===');
    missing.forEach(r => {
      console.log(`- ${r.name} (${r.position}, ${r.region})`);
      console.log(`  user_id: ${r.user_id}`);
      console.log(`  email: ${r.email || 'N/A'}`);
    });
  }
}

checkAllReporterProfiles().catch(console.error);
