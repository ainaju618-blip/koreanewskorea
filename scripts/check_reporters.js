const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkReporters() {
  // 모든 기자 확인 (is_active 조건 없이)
  const { data: allReporters, error } = await supabase
    .from('reporters')
    .select('*');

  console.log('=== 전체 기자 수 ===');
  console.log('Count:', allReporters?.length);

  if (error) {
    console.log('Error:', error);
  }

  if (allReporters?.length > 0) {
    console.log('\n=== 모든 기자 목록 ===');
    allReporters?.forEach(r => {
      console.log(`ID: ${r.id}`);
      console.log(`  name: ${r.name}`);
      console.log(`  position: ${r.position}`);
      console.log(`  region: ${r.region}`);
      console.log(`  user_id: ${r.user_id}`);
      console.log(`  is_active: ${r.is_active}`);
      console.log('---');
    });
  } else {
    console.log('No reporters found in the table!');

    // 테이블 구조 확인
    const { data: sample, error: sampleError } = await supabase
      .from('reporters')
      .select('*')
      .limit(1);

    console.log('\nTable sample:', sample);
    console.log('Sample error:', sampleError);
  }
}

checkReporters().catch(console.error);
