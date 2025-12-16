/**
 * Update Cosmos category to open in new tab
 * Run with: npx tsx scripts/update-cosmos-category.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateCosmosCategory() {
    console.log('Searching for Cosmos category...');

    // Find cosmos category (might be named differently)
    const { data: categories, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .or('name.ilike.%cosmos%,name.ilike.%Cosmos%,name.ilike.%COSMOS%,slug.ilike.%cosmos%');

    if (fetchError) {
        console.error('Error fetching categories:', fetchError);
        return;
    }

    if (!categories || categories.length === 0) {
        console.log('No Cosmos category found. Listing all categories...');

        const { data: allCats } = await supabase
            .from('categories')
            .select('id, name, slug, custom_url, link_target')
            .order('order_index');

        console.log('Available categories:');
        allCats?.forEach(cat => {
            console.log(`  - ${cat.name} (slug: ${cat.slug}, url: ${cat.custom_url || 'default'})`);
        });
        return;
    }

    console.log('Found categories:', categories.map(c => c.name));

    for (const cat of categories) {
        console.log(`Updating "${cat.name}" to open /blog in new tab...`);

        const { error: updateError } = await supabase
            .from('categories')
            .update({
                custom_url: '/blog',
                link_target: '_blank'
            })
            .eq('id', cat.id);

        if (updateError) {
            console.error(`Error updating ${cat.name}:`, updateError);
        } else {
            console.log(`Successfully updated ${cat.name}!`);
        }
    }

    console.log('Done!');
}

updateCosmosCategory();
