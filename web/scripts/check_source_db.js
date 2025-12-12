const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBySource() {
    console.log("Checking articles by source '광주시교육청'...");

    const { data, error } = await supabase
        .from('posts')
        .select('id, title, category, region, source')
        .eq('source', '광주시교육청')
        .limit(5);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Found:", data);
    }
}

checkBySource();
