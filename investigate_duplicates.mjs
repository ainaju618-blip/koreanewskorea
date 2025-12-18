import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://xdcxfaoucvzfrryhczmy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkY3hmYW91Y3Z6ZnJyeWhjem15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg2MDkyMCwiZXhwIjoyMDgwNDM2OTIwfQ.ALK_bfbSmeSUxSjWLLk1kfTCMbqgUuyBb4yUXxzYRps'
);

async function investigate() {
    console.log('=== INVESTIGATING DUPLICATE ENTRIES ===\n');

    // Get the duplicate pairs
    const duplicateIds = [
        '26bcef7d-2575-4bd7-8917-979b400d1b12',
        '818f6220-d4ad-46a8-b8e7-e41956903dd1',
        '2bc7c663-497c-4b24-8adc-dee420945a58',
        '206faa99-10f1-4516-b13e-1b8c46641266'
    ];

    const { data: duplicates } = await supabase
        .from('posts')
        .select('id, title, original_link, created_at, status, source')
        .in('id', duplicateIds)
        .order('created_at', { ascending: true });

    console.log('--- Duplicate Entry Details ---\n');

    // Group by URL
    const byUrl = {};
    duplicates.forEach(d => {
        if (!byUrl[d.original_link]) {
            byUrl[d.original_link] = [];
        }
        byUrl[d.original_link].push(d);
    });

    Object.entries(byUrl).forEach(([url, entries]) => {
        console.log('URL:', url);
        console.log('Title:', entries[0].title);
        entries.forEach((e, i) => {
            console.log('  Entry', i + 1 + ':');
            console.log('    ID:', e.id);
            console.log('    Created:', e.created_at);
            console.log('    Status:', e.status);
        });

        // Calculate time difference
        if (entries.length >= 2) {
            const t1 = new Date(entries[0].created_at);
            const t2 = new Date(entries[1].created_at);
            const diffMs = Math.abs(t2 - t1);
            const diffSec = diffMs / 1000;
            console.log('  Time Gap:', diffSec, 'seconds');
        }
        console.log('');
    });

    // Now test the API
    console.log('\n=== TESTING DUPLICATE CHECK API ===\n');

    // Test 1: Try to insert an existing URL
    const existingPost = duplicates[0];
    console.log('Test 1: Inserting existing URL...');
    console.log('URL:', existingPost.original_link);

    const testPayload = {
        title: existingPost.title,
        original_link: existingPost.original_link,
        content: 'Test content for duplicate check',
        source: existingPost.source,
        published_at: '2025-12-14T00:00:00'
    };

    try {
        const response = await fetch('https://koreanewsone.vercel.app/api/bot/ingest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer korea-news-bot-secret-2024'
            },
            body: JSON.stringify(testPayload)
        });
        const result = await response.json();
        console.log('Response status:', response.status);
        console.log('Response:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.log('Error:', e.message);
    }

    // Test 2: Try same title + date with different URL
    console.log('\nTest 2: Same title+date, different URL...');
    const testPayload2 = {
        title: existingPost.title,
        original_link: 'https://example.com/test-duplicate-' + Date.now(),
        content: 'Test content for duplicate check',
        source: existingPost.source,
        published_at: '2025-12-14T00:00:00'
    };

    try {
        const response = await fetch('https://koreanewsone.vercel.app/api/bot/ingest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer korea-news-bot-secret-2024'
            },
            body: JSON.stringify(testPayload2)
        });
        const result = await response.json();
        console.log('Response status:', response.status);
        console.log('Response:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.log('Error:', e.message);
    }

    // Test 3: Completely new article (should succeed)
    console.log('\nTest 3: New article (should succeed)...');
    const testPayload3 = {
        title: 'TEST ARTICLE - DELETE ME - ' + Date.now(),
        original_link: 'https://example.com/test-new-' + Date.now(),
        content: 'This is a test article for verifying the duplicate check algorithm. It should be inserted successfully as a new article.',
        source: 'Test',
        published_at: new Date().toISOString()
    };

    try {
        const response = await fetch('https://koreanewsone.vercel.app/api/bot/ingest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer korea-news-bot-secret-2024'
            },
            body: JSON.stringify(testPayload3)
        });
        const result = await response.json();
        console.log('Response status:', response.status);
        console.log('Response:', JSON.stringify(result, null, 2));

        // Clean up - delete the test article
        if (result.id) {
            console.log('\nCleaning up test article...');
            await supabase.from('posts').delete().eq('id', result.id);
            console.log('Deleted test article:', result.id);
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
}

investigate().catch(console.error);
