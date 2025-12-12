const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Try to load .env from web root
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} else {
    console.error(`Cannot find .env at ${envPath}`);
}

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

    console.log("Categories (Filtered):");
    data.forEach(c => {
        if (c.name.includes('교육') || c.slug.includes('edu')) {
            console.log(`[TARGET] - ${c.name}: ${c.slug} (ID: ${c.id})`);
        } else if (c.name === '광주' || c.name === '전남') {
            console.log(`[PARENT] - ${c.name}: ${c.slug}`);
        }
    });
}

listCategories();
