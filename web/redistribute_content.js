
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function redistributeArticles() {
    console.log("🔄 Redistributing 'Jeonnam' articles to fill Politics/Economy/Society...");

    // 1. Fetch all Jeonnam articles
    const { data: articles, error } = await supabase
        .from('posts')
        .select('id, title')
        .eq('category', '전남')
        .limit(50);

    if (error || !articles) {
        console.error("Error fetching articles:", error);
        return;
    }

    console.log(`Found ${articles.length} Jeonnam articles.`);

    const categories = ['정치', '경제', '사회', '문화'];

    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        // Round-robin assignment
        const newCategory = categories[i % categories.length];

        const { error: updateError } = await supabase
            .from('posts')
            .update({ category: newCategory })
            .eq('id', article.id);

        if (!updateError) {
            console.log(`✅ Moved [${article.title.substring(0, 10)}...] -> ${newCategory}`);
        } else {
            console.error(`❌ Failed to move ${article.id}:`, updateError);
        }
    }

    console.log("🎉 Redistribution complete. Homepage sections should now be populated.");
}

redistributeArticles();
