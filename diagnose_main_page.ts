
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, 'web', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMainPageData() {
    console.log("🔍 Checking Main Page Data Candidates...");

    // 1. Check 'published' posts (HomeHero target)
    console.log("\n[1] Published Posts (Target for HomeHero):");
    const { data: publishedPosts, error: pubError } = await supabase
        .from('posts')
        .select('id, title, status, thumbnail_url, published_at, category')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(20);

    if (pubError) {
        console.error("Error fetching published posts:", pubError);
    } else {
        console.log(`Found ${publishedPosts?.length} published posts.`);
        publishedPosts?.forEach((p, i) => {
            const hasImg = p.thumbnail_url && p.thumbnail_url.length > 5;
            console.log(`  ${i + 1}. [${p.category}] ${p.title.substring(0, 30)}...`);
            console.log(`     - Status: ${p.status}, Published: ${p.published_at}`);
            console.log(`     - Image: ${hasImg ? '✅ ' + p.thumbnail_url.substring(0, 30) + '...' : '❌ (No Image)'}`);
        });
    }

    // 2. Check 'approved' posts (Might be missing 'published' status)
    console.log("\n[2] Approved but NOT Published (Target for NewsGrid?):");
    const { data: approvedPosts, error: appError } = await supabase
        .from('posts')
        .select('id, title, status, thumbnail_url, created_at')
        .eq('status', 'approved')
        .neq('status', 'published') // Exclude if overlap, though enum usually mutually exclusive
        .order('created_at', { ascending: false })
        .limit(10);

    if (appError) {
        console.error("Error fetching approved posts:", appError);
    } else {
        console.log(`Found ${approvedPosts?.length} approved posts.`);
        approvedPosts?.forEach((p, i) => {
            const hasImg = p.thumbnail_url && p.thumbnail_url.length > 5;
            console.log(`  ${i + 1}. ${p.title.substring(0, 30)}... (Status: ${p.status})`);
            console.log(`     - Image: ${hasImg ? '✅' : '❌'}`);
        });
    }
}

checkMainPageData();
