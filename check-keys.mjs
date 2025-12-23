import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

// Load .env manually (Supabase vars are in .env, not .env.local)
const envContent = readFileSync('.env', 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
    // Remove carriage return (Windows line ending)
    const cleanLine = line.replace(/\r/g, '');
    const match = cleanLine.match(/^([^=]+)=(.*)$/);
    if (match) {
        const envKey = match[1].trim();
        const envValue = match[2].trim().replace(/^["']|["']$/g, '');
        envVars[envKey] = envValue;
    }
}

const url = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const serviceKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

console.log('URL exists:', !!url);
console.log('Key exists:', !!serviceKey);
console.log('URL value:', url ? url.substring(0, 30) + '...' : 'EMPTY');

const supabase = createClient(url, serviceKey);

const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['ai_default_provider', 'ai_global_keys']);

if (error) {
    console.error('Error:', error);
    process.exit(1);
}

console.log('\nAI Settings in DB:');
for (const row of data || []) {
    console.log('\n--- ' + row.key + ' ---');
    if (typeof row.value === 'object') {
        console.log(JSON.stringify(row.value, null, 2));
    } else {
        console.log(row.value);
    }
}
