const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let lastLogCount = 0;
let lastArticleCount = 0;
let startTime = new Date();

async function monitor() {
  const now = new Date();
  const elapsed = Math.floor((now - startTime) / 1000);

  // Get recent bot_logs (last 5 minutes)
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const { data: logs, error: logError } = await supabase
    .from('bot_logs')
    .select('region, status, articles_count, started_at, log_message')
    .gte('started_at', fiveMinAgo.toISOString())
    .order('started_at', { ascending: false })
    .limit(30);

  // Get today's articles
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: articles, error: artError } = await supabase
    .from('posts')
    .select('id, source, status, ai_processed, created_at')
    .gte('created_at', today.toISOString());

  // Clear screen and show status
  console.clear();
  console.log('='.repeat(70));
  console.log(`  LIVE MONITOR | ${now.toLocaleTimeString('ko-KR')} | Elapsed: ${elapsed}s`);
  console.log('='.repeat(70));

  // Bot logs summary
  const running = logs?.filter(l => l.status === 'running').length || 0;
  const completed = logs?.filter(l => l.status === 'completed').length || 0;
  const failed = logs?.filter(l => l.status === 'failed').length || 0;

  console.log(`\n[BOT LOGS] Last 5 min: ${logs?.length || 0} entries`);
  console.log(`  Running: ${running} | Completed: ${completed} | Failed: ${failed}`);

  if (logs && logs.length > 0 && logs.length !== lastLogCount) {
    console.log('\n  Recent activity:');
    logs.slice(0, 5).forEach(log => {
      const time = new Date(log.started_at).toLocaleTimeString('ko-KR');
      const region = (log.region || '').padEnd(12);
      const status = log.status?.padEnd(10) || '';
      const count = log.articles_count || 0;
      console.log(`    ${time} | ${region} | ${status} | ${count} articles`);
    });
  }
  lastLogCount = logs?.length || 0;

  // Articles summary
  const totalArticles = articles?.length || 0;
  const published = articles?.filter(a => a.status === 'published').length || 0;
  const aiProcessed = articles?.filter(a => a.ai_processed).length || 0;
  const pending = totalArticles - published;

  console.log(`\n[TODAY ARTICLES] Total: ${totalArticles}`);
  console.log(`  Published: ${published} | AI Processed: ${aiProcessed} | Pending: ${pending}`);

  if (totalArticles !== lastArticleCount) {
    // New articles detected
    const newCount = totalArticles - lastArticleCount;
    if (lastArticleCount > 0 && newCount > 0) {
      console.log(`\n  >>> NEW: +${newCount} articles detected!`);
    }

    // Show by source
    const bySource = {};
    articles?.forEach(a => {
      const src = a.source || 'unknown';
      if (!bySource[src]) bySource[src] = { total: 0, published: 0 };
      bySource[src].total++;
      if (a.status === 'published') bySource[src].published++;
    });

    console.log('\n  By source:');
    Object.entries(bySource).sort((a, b) => b[1].total - a[1].total).slice(0, 10).forEach(([src, data]) => {
      console.log(`    ${src.padEnd(15)} | ${data.total} total | ${data.published} published`);
    });
  }
  lastArticleCount = totalArticles;

  console.log('\n' + '-'.repeat(70));
  console.log('Press Ctrl+C to stop monitoring');
}

console.log('Starting live monitor...');
console.log('Waiting for 3:30 AM scheduled run...\n');

// Run every 5 seconds
setInterval(monitor, 5000);
monitor(); // Initial run
