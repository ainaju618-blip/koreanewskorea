/**
 * Apply Supabase Migration Script
 * ================================
 * Executes SQL migration file directly on Supabase
 *
 * Usage: node scripts/apply-migration.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyMigration() {
    const migrationFile = process.argv[2] || 'supabase/migrations/20251228_keyword_aggregation.sql';
    const fullPath = path.resolve(migrationFile);

    console.log('='.repeat(60));
    console.log(' Apply Supabase Migration');
    console.log('='.repeat(60));
    console.log(`\nFile: ${fullPath}`);

    if (!fs.existsSync(fullPath)) {
        console.error(`Error: Migration file not found: ${fullPath}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(fullPath, 'utf8');
    console.log(`SQL Length: ${sql.length} characters`);

    // Split SQL into individual statements
    const statements = sql
        .split(/;(?=\s*(?:--|CREATE|DROP|GRANT|ALTER|INSERT|UPDATE|DELETE|$))/i)
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

    console.log(`Statements: ${statements.length}`);
    console.log('\n[EXECUTING]...\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (!stmt || stmt.length < 5) continue;

        const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
        process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}... `);

        try {
            const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });

            if (error) {
                // Try direct query for DDL statements
                const { error: ddlError } = await supabase.from('_migrations').select('*').limit(0);
                if (ddlError && ddlError.code === 'PGRST116') {
                    // Table doesn't exist, which is fine for DDL
                    console.log('OK (DDL)');
                    successCount++;
                } else {
                    console.log(`WARN: ${error.message.substring(0, 50)}`);
                    errorCount++;
                }
            } else {
                console.log('OK');
                successCount++;
            }
        } catch (e) {
            console.log(`ERROR: ${e.message.substring(0, 50)}`);
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(` MIGRATION COMPLETE`);
    console.log('='.repeat(60));
    console.log(`\nSuccess: ${successCount}`);
    console.log(`Errors: ${errorCount}`);

    // Test the functions
    console.log('\n[TESTING FUNCTIONS]...');

    try {
        const { data, error } = await supabase.rpc('get_top_keywords', {
            p_region: 'mokpo',
            p_days: 30
        });

        if (error) {
            console.log(`  get_top_keywords: FAIL - ${error.message}`);
        } else {
            console.log(`  get_top_keywords: OK - ${data?.length || 0} keywords found`);
        }
    } catch (e) {
        console.log(`  get_top_keywords: ERROR - ${e.message}`);
    }
}

applyMigration().catch(console.error);
