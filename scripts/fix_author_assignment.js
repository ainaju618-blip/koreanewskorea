/**
 * Reporter Auto-Assignment Fix Script
 *
 * Problem: posts.region (English) != reporters.region (Korean)
 * Solution: Map region codes and assign appropriate reporters
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Region Code Mapping: posts.region (English) -> reporters.region (Korean)
const REGION_MAPPING = {
  // Cities (시)
  'naju': '나주시',
  'mokpo': '목포시',
  'yeosu': '여수시',
  'suncheon': '순천시',
  'gwangyang': '광양시',

  // Counties (군)
  'damyang': '담양군',
  'gokseong': '곡성군',
  'gurye': '구례군',
  'goheung': '고흥군',
  'boseong': '보성군',
  'hwasun': '화순군',
  'jangheung': '장흥군',
  'gangjin': '강진군',
  'haenam': '해남군',
  'yeongam': '영암군',
  'muan': '무안군',
  'hampyeong': '함평군',
  'yeonggwang': '영광군',
  'jangseong': '장성군',
  'wando': '완도군',
  'jindo': '진도군',
  'shinan': '신안군',

  // Metro & Province
  'gwangju': '광주광역시',
  'jeonnam': '전라남도',

  // Education
  'gwangju_edu': '광주시교육청',
  'jeonnam_edu': '전라남도교육청',
  'jeonnam_edu_org': '전라남도교육청',
  'jeonnam_edu_school': '전라남도교육청',

  // National (use fallback)
  'korea_kr': '전체',
};

// Position priority for selecting representative reporter
const POSITION_PRIORITY = [
  'chief_director',    // 총괄본부장
  'editor_in_chief',   // 주필
  'branch_manager',    // 지사장
  'editor_chief',      // 편집국장
  'news_chief',        // 취재부장
  'senior_reporter',   // 수석기자
  'reporter',          // 기자
  'citizen_reporter',  // 시민기자
];

async function getReporterForRegion(koreanRegion) {
  // Get all reporters for this region
  const { data: reporters } = await supabase
    .from('reporters')
    .select('id, name, position, user_id, region')
    .eq('region', koreanRegion)
    .not('user_id', 'is', null);

  if (!reporters || reporters.length === 0) {
    // Try fallback to '전체' (general assignment)
    const { data: fallbackReporters } = await supabase
      .from('reporters')
      .select('id, name, position, user_id, region')
      .eq('region', '전체')
      .not('user_id', 'is', null);

    if (!fallbackReporters || fallbackReporters.length === 0) {
      return null;
    }
    reporters.push(...fallbackReporters);
  }

  // Sort by position priority
  reporters.sort((a, b) => {
    const priorityA = POSITION_PRIORITY.indexOf(a.position);
    const priorityB = POSITION_PRIORITY.indexOf(b.position);
    // Lower index = higher priority, -1 means not found (lowest priority)
    const scoreA = priorityA === -1 ? 999 : priorityA;
    const scoreB = priorityB === -1 ? 999 : priorityB;
    return scoreA - scoreB;
  });

  return reporters[0];
}

async function verifyUserInProfiles(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  return !error && data;
}

async function fixAuthorAssignment() {
  console.log('=== Reporter Auto-Assignment Fix ===\n');

  // Step 1: Get all articles with NULL author_id
  const { data: articles, error: fetchError } = await supabase
    .from('posts')
    .select('id, title, region, author_id, author_name, status')
    .is('author_id', null)
    .eq('status', 'published');

  if (fetchError) {
    console.error('Error fetching articles:', fetchError);
    return;
  }

  console.log(`Found ${articles.length} articles with NULL author_id\n`);

  // Step 2: Group by region
  const byRegion = {};
  articles.forEach(article => {
    const region = article.region || 'unknown';
    if (!byRegion[region]) byRegion[region] = [];
    byRegion[region].push(article);
  });

  console.log('=== Articles by Region ===');
  Object.entries(byRegion).forEach(([region, arts]) => {
    const koreanRegion = REGION_MAPPING[region] || 'NOT MAPPED';
    console.log(`${region} (${koreanRegion}): ${arts.length} articles`);
  });
  console.log('');

  // Step 3: Process each region
  let successCount = 0;
  let failCount = 0;
  const results = [];

  for (const [englishRegion, regionArticles] of Object.entries(byRegion)) {
    const koreanRegion = REGION_MAPPING[englishRegion];

    if (!koreanRegion) {
      console.log(`⚠️  No mapping for region: ${englishRegion} (${regionArticles.length} articles)`);
      failCount += regionArticles.length;
      continue;
    }

    // Find reporter for this region
    const reporter = await getReporterForRegion(koreanRegion);

    if (!reporter) {
      console.log(`⚠️  No reporter found for: ${koreanRegion} (${regionArticles.length} articles)`);
      failCount += regionArticles.length;
      continue;
    }

    // Verify user_id exists in profiles (FK constraint)
    const profileExists = await verifyUserInProfiles(reporter.user_id);

    if (!profileExists) {
      console.log(`⚠️  Reporter ${reporter.name}'s user_id not in profiles (${regionArticles.length} articles)`);
      failCount += regionArticles.length;
      continue;
    }

    // Update all articles for this region
    const articleIds = regionArticles.map(a => a.id);

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        author_id: reporter.user_id,
        author_name: reporter.name,
        approved_at: new Date().toISOString()
      })
      .in('id', articleIds);

    if (updateError) {
      console.log(`❌ Error updating ${englishRegion}: ${updateError.message}`);
      failCount += regionArticles.length;
    } else {
      console.log(`✅ ${englishRegion} → ${reporter.name} (${reporter.position}): ${regionArticles.length} articles`);
      successCount += regionArticles.length;
      results.push({
        region: englishRegion,
        koreanRegion: koreanRegion,
        reporter: reporter.name,
        position: reporter.position,
        count: regionArticles.length
      });
    }
  }

  console.log('\n=== Summary ===');
  console.log(`✅ Success: ${successCount} articles`);
  console.log(`❌ Failed: ${failCount} articles`);
  console.log(`📊 Total: ${articles.length} articles`);

  // Verify the problem article
  console.log('\n=== Verifying Problem Article ===');
  const { data: problemArticle } = await supabase
    .from('posts')
    .select('id, title, region, author_id, author_name, approved_at')
    .eq('id', 'f4c64ca7-88f1-4f2d-93c4-00ca79ecf7cd')
    .single();

  if (problemArticle) {
    console.log('Problem Article Status:');
    console.log(`  ID: ${problemArticle.id}`);
    console.log(`  Title: ${problemArticle.title?.substring(0, 50)}...`);
    console.log(`  Region: ${problemArticle.region}`);
    console.log(`  Author ID: ${problemArticle.author_id}`);
    console.log(`  Author Name: ${problemArticle.author_name}`);
    console.log(`  Approved At: ${problemArticle.approved_at}`);
  }

  return results;
}

// Run the fix
fixAuthorAssignment()
  .then(results => {
    console.log('\n=== Done ===');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
