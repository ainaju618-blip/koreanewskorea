const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixJindo() {
  console.log('=== Fixing Jindo (진도군) Articles ===\n');

  // Check 한결's profile
  const hangyeolUserId = 'eb40e16a-6a13-4d9a-92cd-e3f70cfc287b';

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', hangyeolUserId)
    .single();

  if (profileError || !profile) {
    console.log('❌ 한결 reporter user_id not in profiles');
    console.log('Checking 허현희...');

    // Check if 허현희's profile needs to be created
    const { data: reporter } = await supabase
      .from('reporters')
      .select('*')
      .eq('region', '진도군')
      .not('user_id', 'is', null);

    console.log('진도군 reporters:', reporter);
    return;
  }

  console.log('✅ 한결 profile found:', profile);

  // Update jindo articles
  const { data: jindoArticles, error: fetchError } = await supabase
    .from('posts')
    .select('id')
    .eq('region', 'jindo')
    .is('author_id', null);

  if (fetchError) {
    console.log('Error fetching jindo articles:', fetchError);
    return;
  }

  console.log(`Found ${jindoArticles?.length} jindo articles with NULL author_id`);

  if (jindoArticles && jindoArticles.length > 0) {
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        author_id: hangyeolUserId,
        author_name: '한결',
        approved_at: new Date().toISOString()
      })
      .eq('region', 'jindo')
      .is('author_id', null);

    if (updateError) {
      console.log('❌ Error updating:', updateError);
    } else {
      console.log(`✅ Updated ${jindoArticles.length} jindo articles to 한결`);
    }
  }

  // Final verification
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .is('author_id', null)
    .eq('status', 'published');

  console.log(`\nRemaining articles with NULL author_id: ${count}`);
}

fixJindo().catch(console.error);
