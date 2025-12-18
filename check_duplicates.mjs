import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://xdcxfaoucvzfrryhczmy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkY3hmYW91Y3Z6ZnJyeWhjem15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg2MDkyMCwiZXhwIjoyMDgwNDM2OTIwfQ.ALK_bfbSmeSUxSjWLLk1kfTCMbqgUuyBb4yUXxzYRps'
);

async function checkDuplicates() {
    console.log('=== DATABASE DUPLICATE ANALYSIS ===\n');

    // 1. Total posts count
    const { count: totalCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });
    console.log('Total posts:', totalCount);

    // 2. Get recent posts
    const { data: posts } = await supabase
        .from('posts')
        .select('original_link, title, published_at, status, id')
        .neq('status', 'trash')
        .order('created_at', { ascending: false })
        .limit(1000);

    // Check for duplicate URLs
    const urlMap = new Map();
    const urlDups = [];
    posts.forEach(p => {
        if (urlMap.has(p.original_link)) {
            urlDups.push({
                url: p.original_link,
                ids: [urlMap.get(p.original_link).id, p.id],
                titles: [urlMap.get(p.original_link).title, p.title]
            });
        } else {
            urlMap.set(p.original_link, p);
        }
    });
    console.log('\n--- Duplicate URLs (Level 1 failures) ---');
    console.log('Found:', urlDups.length);
    if (urlDups.length > 0) {
        urlDups.slice(0, 5).forEach(d => {
            console.log('  URL:', d.url ? d.url.substring(0, 60) : 'null');
            console.log('  IDs:', d.ids.join(', '));
        });
    }

    // Check for duplicate title+date
    const titleDateMap = new Map();
    const titleDateDups = [];
    posts.forEach(p => {
        const dateOnly = p.published_at ? p.published_at.split('T')[0] : 'unknown';
        const key = p.title + '|' + dateOnly;
        if (titleDateMap.has(key)) {
            titleDateDups.push({
                title: p.title,
                date: dateOnly,
                ids: [titleDateMap.get(key).id, p.id],
                urls: [titleDateMap.get(key).original_link, p.original_link]
            });
        } else {
            titleDateMap.set(key, p);
        }
    });
    console.log('\n--- Duplicate Title+Date (Level 2 failures) ---');
    console.log('Found:', titleDateDups.length);
    if (titleDateDups.length > 0) {
        titleDateDups.slice(0, 5).forEach(d => {
            console.log('  Title:', d.title ? d.title.substring(0, 50) : 'null');
            console.log('  Date:', d.date);
            console.log('  IDs:', d.ids.join(', '));
            console.log('  URL1:', d.urls[0] ? d.urls[0].substring(0, 60) : 'null');
            console.log('  URL2:', d.urls[1] ? d.urls[1].substring(0, 60) : 'null');
            console.log('');
        });
    }

    // Check posts by status
    const statusCounts = {};
    posts.forEach(p => {
        statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });
    console.log('\n--- Posts by Status ---');
    Object.entries(statusCounts).forEach(([status, count]) => {
        console.log('  ' + status + ':', count);
    });

    // Get a sample post for testing
    const { data: samplePost } = await supabase
        .from('posts')
        .select('id, title, original_link, published_at, source')
        .neq('status', 'trash')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    console.log('\n--- Sample Post for API Testing ---');
    console.log(JSON.stringify(samplePost, null, 2));
}

checkDuplicates().catch(console.error);
