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

async function fixKeduColumns() {
    console.log("Fixing KEDU columns (category & region)...");

    // source가 '광주시교육청'인 경우
    const { data, error } = await supabase
        .from('posts')
        .update({
            category: '광주교육청',
            region: 'kedu'
        })
        .eq('source', '광주시교육청')
        .select();

    if (error) {
        console.error("Error updating posts:", error);
    } else {
        console.log(`Updated ${data.length} posts (source='광주시교육청')`);
    }
}

fixKeduColumns();
