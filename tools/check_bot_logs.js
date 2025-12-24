const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBotLogs() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const { data, error } = await supabase
    .from('bot_logs')
    .select('*')
    .gte('started_at', todayStr)
    .order('started_at', { ascending: false })
    .limit(30);

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log('=== 오늘 봇 로그 (최근 30건) ===');
  console.log('시작시간      | 지역         | 상태    | 기사수 | 메시지');
  console.log('-------------------------------------------------------------------');

  data.forEach(log => {
    const time = new Date(log.started_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const region = (log.region || '').padEnd(12);
    const status = (log.status || '').padEnd(7);
    const articles = String(log.articles_count || 0).padStart(4);
    const msg = (log.log_message || '').substring(0, 30);
    console.log(`${time}  | ${region} | ${status} | ${articles} | ${msg}`);
  });

  // Summary by status
  const byStatus = {};
  data.forEach(log => {
    const s = log.status || 'unknown';
    if (!byStatus[s]) byStatus[s] = 0;
    byStatus[s]++;
  });

  console.log('\n상태별 요약:');
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}건`);
  });
}

checkBotLogs();
