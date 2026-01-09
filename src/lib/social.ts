/**
 * Social Media Auto-Share Service
 *
 * Currently supported:
 * - Telegram Channel (free, easy API)
 *
 * Future:
 * - Facebook Page (Graph API)
 * - Kakao Channel
 */

// ============================================================================
// Telegram Bot Service
// ============================================================================

interface TelegramSendResult {
    success: boolean;
    messageId?: number;
    error?: string;
}

/**
 * Send message to Telegram channel
 *
 * Setup:
 * 1. Create bot via @BotFather on Telegram
 * 2. Create channel and add bot as admin
 * 3. Set environment variables:
 *    - TELEGRAM_BOT_TOKEN: Bot token from BotFather
 *    - TELEGRAM_CHANNEL_ID: @channel_name or -100xxxxxxxxx
 */
export async function sendToTelegram(
    title: string,
    url: string,
    summary?: string,
    region?: string
): Promise<TelegramSendResult> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const channelId = process.env.TELEGRAM_CHANNEL_ID;

    if (!botToken || !channelId) {
        console.log('[Telegram] Skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID not set');
        return { success: false, error: 'Telegram not configured' };
    }

    try {
        // Format message
        const regionTag = region ? `#${region.replace(/\s/g, '')} ` : '';
        const summaryText = summary ? `\n\n${summary}` : '';

        const message = `📰 ${title}${summaryText}\n\n${regionTag}#코리아뉴스 #전남 #광주\n\n👉 ${url}`;

        const response = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: channelId,
                    text: message,
                    parse_mode: 'HTML',
                    disable_web_page_preview: false  // Show link preview
                })
            }
        );

        const data = await response.json();

        if (data.ok) {
            console.log(`[Telegram] Sent: ${title.substring(0, 30)}... (msgId: ${data.result.message_id})`);
            return { success: true, messageId: data.result.message_id };
        } else {
            console.error(`[Telegram] Failed: ${data.description}`);
            return { success: false, error: data.description };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Telegram] Error: ${errorMessage}`);
        return { success: false, error: errorMessage };
    }
}

// ============================================================================
// Social Share Orchestrator
// ============================================================================

interface SocialShareResult {
    telegram?: TelegramSendResult;
    // Future: facebook, kakao, etc.
}

/**
 * Share article to all configured social platforms
 */
export async function shareToSocialMedia(
    articleId: string,
    title: string,
    summary?: string,
    region?: string
): Promise<SocialShareResult> {
    // Build article URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koreanewskorea.com';
    const articleUrl = `${baseUrl}/news/${articleId}`;

    const result: SocialShareResult = {};

    // Telegram
    result.telegram = await sendToTelegram(title, articleUrl, summary, region);

    // Future: Add more platforms here
    // result.facebook = await sendToFacebook(...)
    // result.kakao = await sendToKakao(...)

    return result;
}

// ============================================================================
// Utility: Test Telegram Connection
// ============================================================================

export async function testTelegramConnection(): Promise<{
    connected: boolean;
    botName?: string;
    error?: string;
}> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
        return { connected: false, error: 'TELEGRAM_BOT_TOKEN not set' };
    }

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${botToken}/getMe`
        );
        const data = await response.json();

        if (data.ok) {
            return { connected: true, botName: data.result.username };
        } else {
            return { connected: false, error: data.description };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { connected: false, error: errorMessage };
    }
}
