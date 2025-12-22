/**
 * AI API Key Rotation System
 *
 * Supports multiple Gemini API keys with round-robin rotation
 * to handle high volume (300+ articles) efficiently.
 *
 * Created: 2025-12-23
 *
 * Key Structure:
 * - Single key (legacy): { gemini: "AIza...", claude: "sk-...", grok: "..." }
 * - Multi-key (new): { gemini: [{ key: "...", label: "main" }, ...], ... }
 */

import { createClient } from "@supabase/supabase-js";
import { decryptApiKey, isEncrypted } from "./encryption";

// Gemini key with metadata
export interface GeminiKeyEntry {
    key: string;        // API key (encrypted or plain)
    label: string;      // Account name/label (e.g., "main", "multi618", "naju")
    enabled?: boolean;  // Whether to use this key (default: true)
}

// Full API keys structure
export interface AIApiKeys {
    gemini: GeminiKeyEntry[] | string;  // Array for multi-key, string for legacy
    claude: string;
    grok: string;
}

// Rotation state (in-memory, resets on server restart)
let currentKeyIndex = 0;
let lastRotationDate = "";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get the next Gemini API key using round-robin rotation
 *
 * @param keys - API keys object from settings
 * @returns { key: decrypted API key, label: account label, index: key index }
 */
export function getNextGeminiKey(keys: AIApiKeys): { key: string; label: string; index: number } | null {
    const geminiKeys = keys.gemini;

    // Legacy single key format
    if (typeof geminiKeys === "string") {
        const decryptedKey = isEncrypted(geminiKeys) ? decryptApiKey(geminiKeys) : geminiKeys;
        return { key: decryptedKey, label: "default", index: 0 };
    }

    // Multi-key format
    if (!Array.isArray(geminiKeys) || geminiKeys.length === 0) {
        return null;
    }

    // Filter enabled keys
    const enabledKeys = geminiKeys.filter(k => k.enabled !== false && k.key);

    if (enabledKeys.length === 0) {
        return null;
    }

    // Reset index at start of new day (daily rotation reset)
    const today = new Date().toISOString().split("T")[0];
    if (lastRotationDate !== today) {
        currentKeyIndex = 0;
        lastRotationDate = today;
        console.log(`[KeyRotation] New day ${today}, reset index to 0`);
    }

    // Round-robin selection
    const index = currentKeyIndex % enabledKeys.length;
    const selectedEntry = enabledKeys[index];

    // Increment for next call
    currentKeyIndex++;

    // Decrypt if needed
    const decryptedKey = isEncrypted(selectedEntry.key)
        ? decryptApiKey(selectedEntry.key)
        : selectedEntry.key;

    console.log(`[KeyRotation] Selected key #${index + 1}/${enabledKeys.length} (${selectedEntry.label})`);

    return {
        key: decryptedKey,
        label: selectedEntry.label,
        index
    };
}

/**
 * Get current rotation stats
 */
export function getRotationStats(): { currentIndex: number; lastDate: string } {
    return {
        currentIndex: currentKeyIndex,
        lastDate: lastRotationDate
    };
}

/**
 * Convert legacy single-key format to multi-key format
 */
export function normalizeGeminiKeys(keys: AIApiKeys): GeminiKeyEntry[] {
    const geminiKeys = keys.gemini;

    // Already multi-key format
    if (Array.isArray(geminiKeys)) {
        return geminiKeys;
    }

    // Legacy single key - convert to array
    if (typeof geminiKeys === "string" && geminiKeys) {
        return [{ key: geminiKeys, label: "default", enabled: true }];
    }

    return [];
}

/**
 * Create multi-key structure with provided keys
 * (Helper for initial setup with 3 keys)
 */
export function createMultiKeyStructure(keyConfigs: { key: string; label: string }[]): GeminiKeyEntry[] {
    return keyConfigs.map(config => ({
        key: config.key,
        label: config.label,
        enabled: true
    }));
}

/**
 * Log key usage to database for tracking
 */
export async function logKeyUsage(
    keyLabel: string,
    keyIndex: number,
    region: string,
    inputTokens: number,
    outputTokens: number
): Promise<void> {
    try {
        const today = new Date().toISOString().split("T")[0];

        // Try RPC first, fallback to console log if not exists
        const { error } = await supabaseAdmin.rpc("increment_key_usage", {
            p_date: today,
            p_key_label: keyLabel,
            p_key_index: keyIndex,
            p_region: region,
            p_input_tokens: inputTokens,
            p_output_tokens: outputTokens
        });

        if (error) {
            // RPC might not exist yet, just log to console
            console.log(`[KeyRotation] Usage logged: ${keyLabel} (index: ${keyIndex}), tokens: ${inputTokens}+${outputTokens}`);
        }
    } catch (error) {
        console.error("[KeyRotation] Failed to log key usage:", error);
        // Non-blocking - continue even if logging fails
    }
}

/**
 * Estimate daily capacity with multiple keys
 *
 * Gemini API limits (as of 2025):
 * - Free tier: 60 requests/minute, 1500 requests/day per key
 * - With 3 keys: ~4500 requests/day
 *
 * Each article needs 1-2 API calls (1 for processing, +1 for double validation if Grade A)
 * So with 3 keys: ~2250-4500 articles/day capacity
 */
export function estimateCapacity(keyCount: number): {
    requestsPerDay: number;
    articlesPerDay: {
        minimum: number;  // All articles need double validation
        maximum: number;  // No articles need double validation
    };
} {
    const requestsPerKeyPerDay = 1500;  // Free tier limit
    const totalRequests = keyCount * requestsPerKeyPerDay;

    return {
        requestsPerDay: totalRequests,
        articlesPerDay: {
            minimum: Math.floor(totalRequests / 2),  // 2 calls per article (double validation)
            maximum: totalRequests                     // 1 call per article (no double validation)
        }
    };
}
