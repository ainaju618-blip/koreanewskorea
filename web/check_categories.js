const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCategories() {
    console.log('Checking categories in posts table...');

    console.log('\n--- Detail Check for PUBLISHED posts (thumbnail_url vs image_url) ---');
    // Check published_at and thumbnail_url quality
    const { data: publishedPosts, error: pubError } = await supabase
        .from('posts')
        .select('id, title, status, published_at, thumbnail_url, image_url, created_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(20);

    if (pubError) {
        console.error('Error fetching published posts:', pubError);
    } else {
        console.table(publishedPosts.map(p => ({
            id: p.id.substring(0, 8) + '...',
            title: p.title.substring(0, 15) + '...',
            thumb: !!(p.thumbnail_url && p.thumbnail_url.length > 5),
            img_url: !!(p.image_url && p.image_url.length > 5),
            thumb_val: p.thumbnail_url ? p.thumbnail_url.substring(0, 10) + '...' : 'null',
            img_val: p.image_url ? p.image_url.substring(0, 10) + '...' : 'null'
        })));
    }
}

checkCategories();
