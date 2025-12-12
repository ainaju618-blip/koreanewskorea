
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn("Warning: .env.local not defined or not found at " + envPath);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log("Starting migration...");

    // 1. Get 'jeonnam' category
    const { data: jeonnam, error: jeonnamError } = await supabase.from('categories').select('*').eq('slug', 'jeonnam').single();
    if (jeonnamError || !jeonnam) {
        console.error("Error: Jeonnam category not found", jeonnamError);
        return;
    }
    console.log(`Found 'jeonnam': ${jeonnam.id}`);

    // 2. Create or Get 'region' category
    let regionId;
    const { data: region } = await supabase.from('categories').select('*').eq('slug', 'region').single();

    if (!region) {
        console.log("Creating 'region' category...");
        const { data: newRegion, error: createError } = await supabase.from('categories').insert({
            name: '지역',
            slug: 'region',
            show_in_gnb: true,
            is_active: true,
            order_index: jeonnam.order_index + 1, // Place immediately after Jeonnam
            depth: 0,
            path: 'region',
            color: jeonnam.color,
            description: '지역별 뉴스'
        }).select().single();

        if (createError) {
            console.error("Error creating region:", createError);
            return;
        }
        regionId = newRegion.id;
        console.log(`Created 'region': ${regionId}`);
    } else {
        console.log(`'region' already exists: ${region.id}`);
        regionId = region.id;
    }

    // 3. Move all children of Jeonnam to Region
    console.log("Moving children from Jeonnam to Region...");

    // Get all children
    const { data: children, error: childrenError } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', jeonnam.id);

    if (childrenError) {
        console.error("Error fetching children:", childrenError);
        return;
    }

    console.log(`Found ${children.length} sub-categories under Jeonnam.`);

    for (const child of children) {
        console.log(`Moving ${child.name} (${child.slug})...`);
        const { error: moveError } = await supabase
            .from('categories')
            .update({
                parent_id: regionId,
                path: `region/${child.slug}`
            })
            .eq('id', child.id);

        if (moveError) {
            console.error(`Failed to move ${child.name}:`, moveError);
        }
    }

    // 4. Update order_index of other categories to accommodate the new one
    // This is optional if we don't care about strict ordering, but good for consistency
    // However, simplest way is just setting region's order.

    console.log("Migration completed successfully.");
}

migrate();
