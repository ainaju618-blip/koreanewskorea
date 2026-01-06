const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('=== tour_spots 테이블 - 나주 데이터 확인 ===');

  const { data, count, error } = await supabase
    .from('tour_spots')
    .select('id, title, content_type_name, region_key, region_name, image_url', { count: 'exact' })
    .eq('region_key', 'naju')
    .limit(10);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('나주 데이터 개수:', count);
  console.log('샘플 데이터:', JSON.stringify(data, null, 2));
}

check();
