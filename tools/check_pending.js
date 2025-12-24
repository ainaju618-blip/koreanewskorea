const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/cbt/koreanews/.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('posts')
    .select('id, ai_status, source, title, created_at')
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('=== Pending Articles Status ===');
  console.log('Total:', data ? data.length : 0);

  if (data) {
    const pending = data.filter(x => !x.ai_status || x.ai_status === 'pending').length;
    const processing = data.filter(x => x.ai_status === 'processing').length;
    const completed = data.filter(x => x.ai_status === 'completed').length;
    const failed = data.filter(x => x.ai_status === 'failed').length;

    console.log('\nAI Status Breakdown:');
    console.log('  - Pending:', pending);
    console.log('  - Processing:', processing);
    console.log('  - Completed:', completed);
    console.log('  - Failed:', failed);

    console.log('\nRecent 5 articles:');
    data.slice(0, 5).forEach((d, i) => {
      const title = (d.title || 'No title').substring(0, 35);
      console.log(`${i+1}. [${d.ai_status || 'null'}] ${d.source} - ${title}`);
    });
  }
}

check().catch(console.error);
