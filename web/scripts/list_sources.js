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

async function listSources() {
    console.log("Listing distinct sources...");

    // Fetch source column
    const { data, error } = await supabase
        .from('posts')
        .select('source');

    if (error) {
        console.error("Error:", error);
        return;
    }

    const sources = new Set(data.map(p => p.source));
    console.log("Sources found:", Array.from(sources));
}

listSources();
