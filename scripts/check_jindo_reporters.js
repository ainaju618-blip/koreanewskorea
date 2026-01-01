const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkJindoReporters() {
  console.log('=== 진도군 기자 확인 ===\n');

  // Get all reporters for 진도군
  const { data: reporters, error } = await supabase
    .from('reporters')
    .select('*')
    .eq('region', '진도군');

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log(`진도군 기자 수: ${reporters?.length}\n`);

  for (const r of reporters || []) {
    console.log(`이름: ${r.name}`);
    console.log(`  position: ${r.position}`);
    console.log(`  user_id: ${r.user_id}`);

    // Check if user_id exists in profiles
    if (r.user_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', r.user_id)
        .single();

      if (profileError || !profile) {
        console.log(`  profiles 테이블: ❌ 없음`);
      } else {
        console.log(`  profiles 테이블: ✅ 있음 (${profile.full_name || profile.email})`);
      }
    } else {
      console.log(`  profiles 테이블: ❌ user_id가 NULL`);
    }
    console.log('---');
  }
}

checkJindoReporters().catch(console.error);
