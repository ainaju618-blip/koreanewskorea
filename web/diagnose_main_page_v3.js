
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMainPageData() {
    console.log("🔍 Checking Main Page Data Candidates...");

    // 1. Check ALL recent posts to see their status
    console.log("\n[1] Recent Posts (Latest 20):");
    const { data: recentPosts, error: recentError } = await supabase
        .from('posts')
        .select('id, title, status, thumbnail_url, created_at, published_at, category, region')
        .order('created_at', { ascending: false })
        .limit(20);

    if (recentError) {
        console.error("Error fetching recent posts:", recentError);
    } else {
        console.log(`Found ${recentPosts?.length} recent posts.`);
        recentPosts?.forEach((p, i) => {
            const hasImg = p.thumbnail_url && p.thumbnail_url.length > 5;
            console.log(`  ${i + 1}. [${p.category}/${p.region || 'no-region'}] ${p.title.substring(0, 30)}...`);
            console.log(`     - Status: ${p.status} (Created: ${p.created_at})`);
            console.log(`     - Published: ${p.published_at}`);
            console.log(`     - Image: ${hasImg ? '✅ ' + p.thumbnail_url.substring(0, 30) + '...' : '❌'}`);
        });
    }

    // 2. Check explicitly 'published' posts (What HomeHero currently sees)
    console.log("\n[2] Currently 'Published' Posts (HomeHero Visibility):");
    const { data: pubPosts, error: pubError } = await supabase
        .from('posts')
        .select('id, title, status, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(5);

    if (pubPosts) {
        pubPosts?.forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.title.substring(0, 30)}... (${p.published_at})`);
        });
    }
}

checkMainPageData();
