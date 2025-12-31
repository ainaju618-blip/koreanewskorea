const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixNajuTitles() {
  console.log('=== Naju Article Title Cleanup ===\n');

  // Find articles with "새로운글" in title
  const { data: articles, error } = await supabase
    .from('posts')
    .select('id, title')
    .like('title', '%새로운글%');

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log(`Found ${articles?.length || 0} articles with "새로운글" in title\n`);

  if (!articles || articles.length === 0) {
    console.log('No articles to fix.');
    return;
  }

  let fixedCount = 0;
  let failedCount = 0;

  for (const article of articles) {
    // Remove "새로운글" and extra whitespace
    const cleanedTitle = article.title
      .replace(/\s*새로운글\s*/g, '')
      .trim();

    console.log(`Fixing: "${article.title.substring(0, 40)}..."`);
    console.log(`     -> "${cleanedTitle.substring(0, 40)}..."`);

    const { error: updateError } = await supabase
      .from('posts')
      .update({ title: cleanedTitle })
      .eq('id', article.id);

    if (updateError) {
      console.log(`   [FAIL] ${updateError.message}`);
      failedCount++;
    } else {
      console.log(`   [OK] Fixed`);
      fixedCount++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Fixed: ${fixedCount}`);
  console.log(`Failed: ${failedCount}`);
}

fixNajuTitles().catch(console.error);
