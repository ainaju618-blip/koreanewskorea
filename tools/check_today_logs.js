const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  // Today 3 AM
  const today3am = new Date();
  today3am.setHours(3, 0, 0, 0);

  const { data, error } = await supabase
    .from('bot_logs')
    .select('*')
    .gte('started_at', today3am.toISOString())
    .order('started_at', { ascending: true });

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log('=== 오늘 새벽 3시 이후 봇 로그 ===');
  console.log('시작시간      | 지역         | 상태    | 기사수 | 메시지');
  console.log('-------------------------------------------------------------------');

  data.forEach(log => {
    const time = new Date(log.started_at).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const region = (log.region || '').padEnd(12);
    const status = (log.status || '').padEnd(10);
    const articles = String(log.articles_count || 0).padStart(4);
    const msg = (log.log_message || '').substring(0, 40);
    console.log(`${time}  | ${region} | ${status} | ${articles} | ${msg}`);
  });

  console.log(`\n총 ${data.length}개 로그`);
}

check();
