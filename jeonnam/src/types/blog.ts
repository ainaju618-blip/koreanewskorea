// ============================================
// CosmicPulse Blog Types
// ============================================

// Blog Post Status
export type BlogPostStatus = 'draft' | 'review' | 'published' | 'archived' | 'trash';

// Blog Source Type
export type BlogSourceType = 'reddit' | 'rss' | 'api' | 'website';

// AI Log Status
export type BlogAILogStatus = 'pending' | 'success' | 'failed';

// ============================================
// Blog Post
// ============================================
export interface BlogPost {
    id: string;

    // Content
    title: string;
    slug: string;
    content: string;
    excerpt?: string;

    // Categorization
    category: string;
    tags: string[];

    // Media
    thumbnail_url?: string;
    thumbnail_alt?: string;

    // SEO
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string[];

    // Source & AI
    source_url?: string;
    source_name?: string;
    ai_generated: boolean;
    ai_model?: string;
    ai_prompt?: string;

    // WordPress Sync
    wordpress_id?: number;
    wordpress_url?: string;
    wordpress_synced_at?: string;

    // Status & Publishing
    status: BlogPostStatus;
    published_at?: string;

    // Metrics
    view_count: number;
    like_count: number;
    share_count: number;

    // Author
    author_id?: string;
    author_name: string;

    // Timestamps
    created_at: string;
    updated_at: string;
}

// Create/Update DTO
export interface BlogPostInput {
    title: string;
    content: string;
    excerpt?: string;
    category?: string;
    tags?: string[];
    thumbnail_url?: string;
    seo_title?: string;
    seo_description?: string;
    status?: BlogPostStatus;
    published_at?: string;
    ai_generated?: boolean;
    source_url?: string;
}

// ============================================
// Blog Category
// ============================================
export interface BlogCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color: string;
    parent_id?: string;
    sort_order: number;
    post_count: number;
    created_at: string;
}

// ============================================
// Blog Source (Crawling)
// ============================================
export interface BlogSource {
    id: string;
    name: string;
    url: string;
    type: BlogSourceType;
    enabled: boolean;
    crawl_interval: number;
    selectors?: Record<string, string>;
    api_key?: string;
    last_crawled_at?: string;
    last_error?: string;
    success_count: number;
    error_count: number;
    created_at: string;
    updated_at: string;
}

// ============================================
// Blog AI Log
// ============================================
export interface BlogAILog {
    id: string;
    post_id?: string;
    source_id?: string;
    model: string;
    prompt: string;
    response_preview?: string;
    tokens_input?: number;
    tokens_output?: number;
    tokens_total?: number;
    cost_usd?: number;
    duration_ms?: number;
    status: BlogAILogStatus;
    error_message?: string;
    created_at: string;
}

// ============================================
// Blog Settings
// ============================================
export interface BlogSettings {
    site_name: string;
    site_tagline: string;
    posts_per_page: number;
    auto_publish: boolean;
    wordpress_enabled: boolean;
    wordpress_url?: string;
    wordpress_username?: string;
    wordpress_app_password?: string;
    ai_model: string;
    default_author: string;
}

// ============================================
// Trending Topic
// ============================================
export interface BlogTrendingTopic {
    id: string;
    topic: string;
    keywords: string[];
    source: string;
    score: number;
    mentions: number;
    used: boolean;
    post_id?: string;
    discovered_at: string;
    expires_at: string;
}

// ============================================
// Dashboard Stats
// ============================================
export interface BlogDashboardStats {
    total_posts: number;
    published_posts: number;
    draft_posts: number;
    ai_generated_posts: number;
    total_views: number;
    today_views: number;
    active_sources: number;
    pending_topics: number;
    recent_posts: BlogPost[];
    top_posts: BlogPost[];
    ai_usage: {
        tokens_today: number;
        cost_today: number;
        posts_generated_today: number;
    };
}

// ============================================
// API Response Types
// ============================================
export interface BlogPostListResponse {
    posts: BlogPost[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface BlogAIGenerateRequest {
    topic: string;
    source_url?: string;
    category?: string;
    style?: 'informative' | 'entertaining' | 'analytical';
    length?: 'short' | 'medium' | 'long';
    auto_publish?: boolean;
}

export interface BlogAIGenerateResponse {
    success: boolean;
    post?: BlogPost;
    ai_log?: BlogAILog;
    error?: string;
}
