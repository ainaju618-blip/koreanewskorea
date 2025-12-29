
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    console.log("🔄 Redistributing 'Jeonnam' articles via API...");

    // 1. Fetch all Jeonnam articles
    const { data: articles, error } = await supabase
        .from('posts')
        .select('id, title')
        .eq('category', '전남')
        .limit(50);

    if (error || !articles) {
        return NextResponse.json({ error: error?.message }, { status: 500 });
    }

    const categories = ['정치', '경제', '사회', '문화'];
    let updatedCount = 0;

    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const newCategory = categories[i % categories.length];

        const { error: updateError } = await supabase
            .from('posts')
            .update({ category: newCategory })
            .eq('id', article.id);

        if (!updateError) updatedCount++;
    }

    return NextResponse.json({
        message: `Redistributed ${updatedCount} articles`,
        total: articles.length
    });
}
