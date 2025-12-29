const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findAndResetEnglishArticles() {
  console.log('Fetching published articles...');

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, content')
    .eq('status', 'published')
    .eq('ai_processed', true)
    .limit(1000);

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Detect English content (more than 30% ASCII letters vs Korean)
  const hasEnglish = (text) => {
    if (!text) return false;
    const asciiLetters = (text.match(/[a-zA-Z]/g) || []).length;
    const koreanChars = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
    const ratio = asciiLetters / (koreanChars + 1);
    return ratio > 0.3;
  };

  const englishPosts = posts.filter(p => hasEnglish(p.content));

  console.log('Total published articles:', posts.length);
  console.log('English content detected:', englishPosts.length);

  if (englishPosts.length === 0) {
    console.log('No English articles found.');
    return;
  }

  // Show sample
  console.log('\nSample English articles:');
  englishPosts.slice(0, 3).forEach(p => {
    console.log(`- ${p.id}: ${p.title.substring(0, 50)}...`);
  });

  // Reset ai_processed to false for reprocessing
  const ids = englishPosts.map(p => p.id);
  console.log(`\nResetting ${ids.length} articles for reprocessing...`);

  const { error: updateError } = await supabase
    .from('posts')
    .update({ ai_processed: false })
    .in('id', ids);

  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('Done! Articles will be reprocessed with Korean-only model.');
  }
}

findAndResetEnglishArticles();
