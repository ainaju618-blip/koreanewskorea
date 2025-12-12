const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id');

    if (error) {
        console.error("Error fetching categories:", error);
        return;
    }

    console.log("Categories:");
    data.forEach(c => {
        console.log(`- ${c.name}: ${c.slug} (ID: ${c.id})`);
    });
}

listCategories();
