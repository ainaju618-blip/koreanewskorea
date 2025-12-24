const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  // Get gangjin articles from last 3 days
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { data, error } = await supabase
    .from('posts')
    .select('id, title, source, created_at, published_at, status')
    .eq('source', 'gangjin')
    .gte('created_at', threeDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log('=== 강진군 최근 기사 목록 ===');
  console.log('수집시각              | 발행시각              | 상태     | 제목');
  console.log('--------------------------------------------------------------------------------');

  data.forEach(article => {
    const created = new Date(article.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const published = article.published_at ? new Date(article.published_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '-';
    const status = (article.status || '').padEnd(10);
    const title = (article.title || '').substring(0, 35);
    console.log(`${created.padEnd(22)}| ${published.padEnd(22)}| ${status}| ${title}`);
  });

  console.log('');
  console.log('Total: ' + data.length + ' articles');

  // Group by date
  const byDate = {};
  data.forEach(article => {
    const date = new Date(article.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
    if (!byDate[date]) byDate[date] = 0;
    byDate[date]++;
  });

  console.log('');
  console.log('=== Date breakdown ===');
  Object.entries(byDate).forEach(([date, count]) => {
    console.log(`${date}: ${count} articles`);
  });
}

check();
