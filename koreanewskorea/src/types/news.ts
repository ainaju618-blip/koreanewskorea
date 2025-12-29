export type NewsItem = {
    id: string
    title: string
    content: string
    ai_summary: string
    published_at: string
    source: string
    original_link: string
    status: 'draft' | 'review' | 'published' | 'rejected' | 'archived'
    thumbnail_url?: string | null
    author_id?: string
    author_name?: string  // DB 컬럼명 (reporter_name에서 변경)
    rejected_reason?: string
    view_count?: number
    category?: string | null
    subtitle?: string | null
    is_focus?: boolean
}
