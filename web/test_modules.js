
try {
    require('openai');
    console.log('OpenAI module found');
} catch (e) {
    console.error('OpenAI module NOT found:', e.message);
}

try {
    require('rss-parser');
    console.log('rss-parser module found');
} catch (e) {
    console.error('rss-parser module NOT found:', e.message);
}

try {
    require('@supabase/supabase-js');
    console.log('Supabase module found');
} catch (e) {
    console.error('Supabase module NOT found:', e.message);
}
