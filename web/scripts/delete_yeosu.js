// 여수 기사 삭제 스크립트
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteYeosuArticles() {
    const { data, error } = await supabase
        .from('posts')
        .delete()
        .eq('region', 'yeosu')
        .select();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Deleted ${data.length} yeosu articles`);
    }
}

deleteYeosuArticles();
