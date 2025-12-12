const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 부모 디렉토리의 .env 파싱 (d:\cbt\koreanews\.env)
const envPath = path.resolve(process.cwd(), '../.env');
console.log('Loading env from:', envPath);

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
    console.error('Error: Env vars missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const region = process.argv[2];
if (!region) {
    console.error('Please provide region code. Usage: node reset_region_data.js mokpo');
    process.exit(1);
}

async function reset() {
    console.log(`🗑️ Deleting all articles for region: ${region}...`);

    // 먼저 개수 확인
    const { count, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('region', region);

    if (countError) {
        console.error('Error checking count:', countError);
        return;
    }

    console.log(`Found ${count} articles.`);

    if (count === 0) {
        console.log('Nothing to delete.');
        return;
    }

    // 삭제 실행
    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('region', region);

    if (error) {
        console.error('Delete error:', error);
    } else {
        console.log(`✅ Successfully deleted articles for ${region}.`);
        console.log('Now you can run the scraper again to test "Draft" status.');
    }
}

reset();
