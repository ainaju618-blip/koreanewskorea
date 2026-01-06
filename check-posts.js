const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ebagdrupjfwkawbwqjjg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYWdkcnVwamZ3a2F3YndxampnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk5OTg2NSwiZXhwIjoyMDgxNTc1ODY1fQ.-VkZPHzBtsvLKKu3rv4-ORi5UIW_oPHJgqUguaqi94s'
);

async function check() {
  // Get all posts
  const { data: all, error } = await supabase
    .from('posts')
    .select('id, status, title, created_at, region')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('=== DB 기사 현황 ===');
  console.log('Total posts found:', all.length);

  // Group by status
  const byStatus = {};
  all.forEach(p => {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
  });
  console.log('\nBy status:', JSON.stringify(byStatus, null, 2));

  // Group by region
  const byRegion = {};
  all.forEach(p => {
    const r = p.region || 'null';
    byRegion[r] = (byRegion[r] || 0) + 1;
  });
  console.log('\nBy region:', JSON.stringify(byRegion, null, 2));

  // Show draft posts
  const drafts = all.filter(p => p.status === 'draft');
  console.log('\n=== Draft 기사 (' + drafts.length + '개) ===');
  drafts.slice(0, 10).forEach(p => {
    console.log('- [' + p.region + '] ' + (p.title || '').substring(0, 50));
  });

  // Show published posts
  const published = all.filter(p => p.status === 'published');
  console.log('\n=== Published 기사 (' + published.length + '개) ===');
  published.slice(0, 10).forEach(p => {
    console.log('- [' + p.region + '] ' + (p.title || '').substring(0, 50));
  });

  // Show other status
  const other = all.filter(p => p.status !== 'draft' && p.status !== 'published');
  if (other.length > 0) {
    console.log('\n=== 기타 상태 기사 (' + other.length + '개) ===');
    other.forEach(p => {
      console.log('- [' + p.status + '] ' + (p.title || '').substring(0, 50));
    });
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
