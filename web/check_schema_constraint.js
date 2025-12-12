const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 부모 디렉토리의 .env 파싱
const envPath = path.resolve(process.cwd(), '../.env');
let env = {};
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });
}

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraint() {
    console.log('--- Checking DB Constraints ---');

    // 1. 테스트 기사 생성
    const { data: post, error: createError } = await supabase
        .from('posts')
        .insert({ title: 'Constraint Test', original_link: 'test_' + Date.now() })
        .select()
        .single();

    if (createError) {
        console.error('Create failed:', createError.message);
        return;
    }
    console.log('Test post created:', post.id);

    // 2. 'rejected' 업데이트 시도
    const { error: rejectError } = await supabase
        .from('posts')
        .update({ status: 'rejected' })
        .eq('id', post.id);

    console.log("'rejected' update:", rejectError ? `FAILED (${rejectError.message})` : "SUCCESS");

    // 3. 'trash' 업데이트 시도
    const { error: trashError } = await supabase
        .from('posts')
        .update({ status: 'trash' })
        .eq('id', post.id);

    console.log("'trash' update:", trashError ? `FAILED (${trashError.message})` : "SUCCESS");

    // 4. 테스트 기사 삭제
    await supabase.from('posts').delete().eq('id', post.id);
    console.log('Cleanup done.');
}

checkConstraint();
