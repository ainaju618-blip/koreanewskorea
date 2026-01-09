// PageSpeed Insights Auto-Check API
// Calls Google PageSpeed API and saves results to DB

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// PageSpeed API URL
const PSI_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

interface PageSpeedResult {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  fcp: number;
  lcp: number;
  tbt: number;
  cls: number;
  si: number;
}

async function runPageSpeedTest(url: string, strategy: 'mobile' | 'desktop'): Promise<PageSpeedResult | null> {
  try {
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY || '';
    const params = new URLSearchParams();
    params.append('url', url);
    params.append('strategy', strategy);
    params.append('category', 'performance');
    params.append('category', 'accessibility');
    params.append('category', 'best-practices');
    params.append('category', 'seo');

    // Add API key if available
    if (apiKey) {
      params.append('key', apiKey);
    }

    const response = await fetch(`${PSI_API_URL}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('PageSpeed API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();

    // Extract scores (0-1 scale, convert to 0-100)
    const categories = data.lighthouseResult?.categories || {};
    const audits = data.lighthouseResult?.audits || {};

    return {
      performance: Math.round((categories.performance?.score || 0) * 100),
      accessibility: Math.round((categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
      seo: Math.round((categories.seo?.score || 0) * 100),
      fcp: audits['first-contentful-paint']?.numericValue || 0,
      lcp: audits['largest-contentful-paint']?.numericValue || 0,
      tbt: audits['total-blocking-time']?.numericValue || 0,
      cls: audits['cumulative-layout-shift']?.numericValue || 0,
      si: audits['speed-index']?.numericValue || 0,
    };
  } catch (error) {
    console.error('PageSpeed test error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if auto-check is enabled
    const { data: settings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'pagespeed_auto')
      .single();

    const config = settings?.value || { enabled: true };

    // Get URL to test (default to production site)
    const body = await request.json().catch(() => ({}));
    const targetUrl = body.url || 'https://www.koreanewskorea.com/';
    const source = body.source || 'manual'; // 'manual' | 'cron'

    // Run mobile test (primary)
    console.log(`Running PageSpeed test for ${targetUrl}...`);
    const mobileResult = await runPageSpeedTest(targetUrl, 'mobile');

    if (!mobileResult) {
      return NextResponse.json(
        { success: false, error: 'PageSpeed API call failed' },
        { status: 500 }
      );
    }

    // Save to database
    const logEntry = {
      measured_at: new Date().toISOString(),
      performance: mobileResult.performance,
      accessibility: mobileResult.accessibility,
      best_practices: mobileResult.bestPractices,
      seo: mobileResult.seo,
      lcp_ms: Math.round(mobileResult.lcp),
      fcp_ms: Math.round(mobileResult.fcp),
      tbt_ms: Math.round(mobileResult.tbt),
      cls: mobileResult.cls,
      si_ms: Math.round(mobileResult.si),
      notes: `Auto-check (${source}) - Mobile`,
      created_by: 'auto',
    };

    const { data: inserted, error: insertError } = await supabase
      .from('performance_logs')
      .insert(logEntry)
      .select()
      .single();

    if (insertError) {
      console.error('DB insert error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to save results' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: inserted,
      scores: {
        performance: mobileResult.performance,
        accessibility: mobileResult.accessibility,
        bestPractices: mobileResult.bestPractices,
        seo: mobileResult.seo,
      },
      metrics: {
        lcp: `${(mobileResult.lcp / 1000).toFixed(1)}s`,
        fcp: `${(mobileResult.fcp / 1000).toFixed(1)}s`,
        tbt: `${Math.round(mobileResult.tbt)}ms`,
        cls: mobileResult.cls.toFixed(3),
      },
    });
  } catch (error) {
    console.error('PageSpeed check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - For cron job calls
export async function GET(request: NextRequest) {
  // Verify cron secret (optional security)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow without auth for now, but log warning
    console.warn('Cron call without proper authorization');
  }

  // Check if auto-check is enabled
  const { data: settings } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'pagespeed_auto')
    .single();

  const config = settings?.value || { enabled: true };

  if (!config.enabled) {
    return NextResponse.json({
      success: true,
      message: 'Auto-check is disabled',
      skipped: true,
    });
  }

  // Run the test
  const targetUrl = 'https://www.koreanewskorea.com/';
  const mobileResult = await runPageSpeedTest(targetUrl, 'mobile');

  if (!mobileResult) {
    return NextResponse.json(
      { success: false, error: 'PageSpeed API call failed' },
      { status: 500 }
    );
  }

  // Save to database
  const logEntry = {
    measured_at: new Date().toISOString(),
    performance: mobileResult.performance,
    accessibility: mobileResult.accessibility,
    best_practices: mobileResult.bestPractices,
    seo: mobileResult.seo,
    lcp_ms: Math.round(mobileResult.lcp),
    fcp_ms: Math.round(mobileResult.fcp),
    tbt_ms: Math.round(mobileResult.tbt),
    cls: mobileResult.cls,
    si_ms: Math.round(mobileResult.si),
    notes: 'Auto-check (cron) - Mobile',
    created_by: 'auto',
  };

  const { error: insertError } = await supabase
    .from('performance_logs')
    .insert(logEntry);

  if (insertError) {
    console.error('DB insert error:', insertError);
    return NextResponse.json(
      { success: false, error: 'Failed to save results' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'PageSpeed check completed',
    scores: {
      performance: mobileResult.performance,
      accessibility: mobileResult.accessibility,
      bestPractices: mobileResult.bestPractices,
      seo: mobileResult.seo,
    },
  });
}
