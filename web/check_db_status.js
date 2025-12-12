const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 부모 디렉토리의 .env 파싱 (d:\cbt\koreanews\.env)
const envPath = path.resolve(process.cwd(), '../.env');
let env = {};
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Recent Articles Check ---');
    const { data, error } = await supabase
        .from('posts')
        .select('id, title, status, region, created_at')
        .in('region', ['mokpo', 'suncheon'])
        .order('published_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
    } else {
        data.forEach(p => {
            console.log(`[${p.status}] ${p.region} | ${p.title} (${p.created_at})`);
        });
        if (data.length === 0) console.log('No articles found.');
    }
}

check();
