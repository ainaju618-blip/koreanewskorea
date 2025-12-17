import { supabaseAdmin } from '@/lib/supabase-admin';

interface ArticleHistoryEntry {
    article_id: string;
    editor_id: string;
    editor_name: string;
    action: 'created' | 'edited' | 'approved' | 'rejected' | 'assigned' | 'status_changed';
    previous_title?: string;
    previous_content?: string;
    previous_status?: string;
    new_title?: string;
    new_content?: string;
    new_status?: string;
    change_summary?: string;
}

/**
 * Record article edit history
 */
export async function recordArticleHistory(entry: ArticleHistoryEntry): Promise<void> {
    try {
        await supabaseAdmin
            .from('article_history')
            .insert({
                article_id: entry.article_id,
                editor_id: entry.editor_id,
                editor_name: entry.editor_name,
                action: entry.action,
                previous_title: entry.previous_title,
                previous_content: entry.previous_content,
                previous_status: entry.previous_status,
                new_title: entry.new_title,
                new_content: entry.new_content,
                new_status: entry.new_status,
                change_summary: entry.change_summary,
            });
    } catch (error) {
        console.error('Failed to record article history:', error);
        // Don't throw - history recording should not block main operation
    }
}

interface NotificationData {
    recipient_id: string;
    type: 'article_approved' | 'article_rejected' | 'article_assigned' | 'article_edited' | 'mention' | 'system';
    title: string;
    message?: string;
    article_id?: string;
    actor_id?: string;
    actor_name?: string;
}

/**
 * Create notification for reporter
 */
export async function createNotification(data: NotificationData): Promise<void> {
    try {
        await supabaseAdmin
            .from('notifications')
            .insert({
                recipient_id: data.recipient_id,
                type: data.type,
                title: data.title,
                message: data.message,
                article_id: data.article_id,
                actor_id: data.actor_id,
                actor_name: data.actor_name,
            });
    } catch (error) {
        console.error('Failed to create notification:', error);
        // Don't throw - notification creation should not block main operation
    }
}

/**
 * Generate change summary for article edits
 */
export function generateChangeSummary(
    oldArticle: { title?: string; content?: string; status?: string },
    newData: { title?: string; content?: string; status?: string }
): string {
    const changes: string[] = [];

    if (newData.title !== undefined && newData.title !== oldArticle.title) {
        changes.push('title changed');
    }
    if (newData.content !== undefined && newData.content !== oldArticle.content) {
        const oldLength = oldArticle.content?.length || 0;
        const newLength = newData.content.length;
        const diff = newLength - oldLength;
        changes.push(`content ${diff > 0 ? `+${diff}` : diff} chars`);
    }
    if (newData.status !== undefined && newData.status !== oldArticle.status) {
        changes.push(`status: ${oldArticle.status} -> ${newData.status}`);
    }

    return changes.join(', ') || 'no changes';
}
