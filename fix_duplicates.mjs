import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://xdcxfaoucvzfrryhczmy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkY3hmYW91Y3Z6ZnJyeWhjem15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg2MDkyMCwiZXhwIjoyMDgwNDM2OTIwfQ.ALK_bfbSmeSUxSjWLLk1kfTCMbqgUuyBb4yUXxzYRps'
);

async function fixDuplicates() {
    console.log('=== FIXING DUPLICATES ===\n');

    // Step 1: Find all duplicates
    console.log('Step 1: Finding duplicates...');
    const { data: posts } = await supabase
        .from('posts')
        .select('id, original_link, created_at, status')
        .neq('status', 'trash')
        .order('created_at', { ascending: true });

    const urlMap = new Map();
    const duplicatesToDelete = [];

    posts.forEach(p => {
        if (urlMap.has(p.original_link)) {
            // Keep the first one (older), delete the duplicate (newer)
            duplicatesToDelete.push({
                id: p.id,
                url: p.original_link,
                keepId: urlMap.get(p.original_link).id
            });
        } else {
            urlMap.set(p.original_link, p);
        }
    });

    console.log('Duplicates to remove:', duplicatesToDelete.length);

    // Step 2: Delete duplicates (move to trash)
    if (duplicatesToDelete.length > 0) {
        console.log('\nStep 2: Moving duplicates to trash...');
        for (const dup of duplicatesToDelete) {
            const { error } = await supabase
                .from('posts')
                .update({ status: 'trash' })
                .eq('id', dup.id);

            if (error) {
                console.log('  Error moving to trash:', dup.id, error.message);
            } else {
                console.log('  Moved to trash:', dup.id);
                console.log('    Keeping:', dup.keepId);
            }
        }
    }

    // Step 3: Try to create unique index
    console.log('\nStep 3: Creating unique index...');
    console.log('Note: This requires direct SQL execution which may need manual action.');
    console.log('');
    console.log('Run this SQL in Supabase SQL Editor:');
    console.log('----------------------------------------');
    console.log(`
-- Create unique partial index on original_link for non-trash posts
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_original_link_active
ON posts (original_link)
WHERE status != 'trash';

-- Optional: Also create index for title+date duplicate check
CREATE INDEX IF NOT EXISTS idx_posts_title_date
ON posts (title, published_at)
WHERE status != 'trash';
    `);
    console.log('----------------------------------------');

    // Step 4: Verify cleanup
    console.log('\nStep 4: Verifying cleanup...');
    const { data: verifyPosts } = await supabase
        .from('posts')
        .select('original_link')
        .neq('status', 'trash');

    const verifyMap = new Map();
    let remainingDups = 0;
    verifyPosts.forEach(p => {
        if (verifyMap.has(p.original_link)) {
            remainingDups++;
        } else {
            verifyMap.set(p.original_link, true);
        }
    });

    console.log('Remaining duplicates:', remainingDups);
    console.log('\n=== DONE ===');
}

fixDuplicates().catch(console.error);
