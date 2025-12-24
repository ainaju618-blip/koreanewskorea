const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkScrapingStatus() {
  // Yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const yesterdayStr = yesterday.toISOString();

  // Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  // Yesterday's data
  const { data: yesterdayData, error: err1 } = await supabase
    .from('posts')
    .select('source, status, created_at, ai_processed')
    .gte('created_at', yesterdayStr)
    .lt('created_at', todayStr)
    .order('source');

  if (err1) {
    console.log('Error (yesterday):', err1);
    return;
  }

  // Today's data
  const { data: todayData, error: err2 } = await supabase
    .from('posts')
    .select('source, status, created_at, ai_processed')
    .gte('created_at', todayStr)
    .order('source');

  if (err2) {
    console.log('Error (today):', err2);
    return;
  }

  function summarize(data) {
    const bySource = {};
    data.forEach(article => {
      const src = article.source || '(unknown)';
      if (!bySource[src]) {
        bySource[src] = { total: 0, published: 0, pending: 0, aiProcessed: 0 };
      }
      bySource[src].total++;
      if (article.status === 'published') bySource[src].published++;
      else bySource[src].pending++;
      if (article.ai_processed) bySource[src].aiProcessed++;
    });
    return bySource;
  }

  function printTable(title, bySource, data) {
    console.log('\n' + title);
    console.log('지역                 | 총수집 | 발행 | AI처리 | 대기');
    console.log('-----------------------------------------------------');

    Object.keys(bySource).sort().forEach(source => {
      const s = bySource[source];
      console.log(source.padEnd(20) + ' | ' + String(s.total).padStart(4) + ' | ' + String(s.published).padStart(4) + ' | ' + String(s.aiProcessed).padStart(5) + ' | ' + String(s.pending).padStart(4));
    });

    const total = data.length;
    const published = data.filter(a => a.status === 'published').length;
    const aiProcessed = data.filter(a => a.ai_processed).length;
    console.log('-----------------------------------------------------');
    console.log('합계                 | ' + String(total).padStart(4) + ' | ' + String(published).padStart(4) + ' | ' + String(aiProcessed).padStart(5) + ' | ' + String(total - published).padStart(4));
  }

  console.log('현재 시각: ' + new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));

  printTable('=== 어제 (12/24) 스크래핑 현황 ===', summarize(yesterdayData), yesterdayData);
  printTable('=== 오늘 (12/25) 스크래핑 현황 ===', summarize(todayData), todayData);
}

checkScrapingStatus();
