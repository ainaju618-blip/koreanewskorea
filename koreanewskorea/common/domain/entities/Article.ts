/**
 * Article Entity
 * Core domain type - no external dependencies
 */

export interface Article {
    id: string;
    title: string;
    content?: string;
    ai_summary?: string;
    thumbnail_url?: string;
    region: string;
    category?: string;
    source?: string;
    source_url?: string;
    published_at: string;
    created_at?: string;
    author_name?: string;
}
