import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://xdcxfaoucvzfrryhczmy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkY3hmYW91Y3Z6ZnJyeWhjem15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg2MDkyMCwiZXhwIjoyMDgwNDM2OTIwfQ.ALK_bfbSmeSUxSjWLLk1kfTCMbqgUuyBb4yUXxzYRps'
);

async function addUniqueIndex() {
    console.log('=== ADDING UNIQUE INDEX ===\n');

    // Try using Supabase's SQL execution via RPC
    // Note: This requires a custom RPC function or direct database access

    // Alternative: Use fetch to hit Supabase's SQL endpoint directly
    const SUPABASE_URL = 'https://xdcxfaoucvzfrryhczmy.supabase.co';
    const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkY3hmYW91Y3Z6ZnJyeWhjem15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg2MDkyMCwiZXhwIjoyMDgwNDM2OTIwfQ.ALK_bfbSmeSUxSjWLLk1kfTCMbqgUuyBb4yUXxzYRps';

    const sql = `
        CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_original_link_active
        ON posts (original_link)
        WHERE status != 'trash';
    `;

    try {
        // Method 1: Try using rpc with exec_sql if it exists
        const { data, error } = await supabase.rpc('exec_sql', { query: sql });

        if (error) {
            console.log('RPC method not available, trying alternative...');
            console.log('Error:', error.message);
        } else {
            console.log('Index created via RPC!');
            return;
        }
    } catch (e) {
        console.log('RPC not available');
    }

    // Method 2: Check if index already exists
    console.log('\nChecking for existing indexes...');
    const { data: indexes } = await supabase
        .from('pg_indexes')
        .select('indexname')
        .eq('tablename', 'posts');

    if (indexes) {
        console.log('Existing indexes on posts table:');
        indexes.forEach(idx => console.log('  -', idx.indexname));
    }

    console.log('\n========================================');
    console.log('MANUAL ACTION REQUIRED:');
    console.log('========================================');
    console.log('Please run this SQL in Supabase Dashboard > SQL Editor:');
    console.log('');
    console.log('CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_original_link_active');
    console.log('ON posts (original_link)');
    console.log("WHERE status != 'trash';");
    console.log('');
    console.log('Dashboard URL: https://supabase.com/dashboard/project/xdcxfaoucvzfrryhczmy/sql');
    console.log('========================================');
}

addUniqueIndex().catch(console.error);
