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

    console.log("========================================");
    console.log("[KeyRotation] DEBUG START");
    console.log("[KeyRotation] Input type:", typeof geminiKeys);
    console.log("[KeyRotation] Is Array:", Array.isArray(geminiKeys));
    console.log("[KeyRotation] Current Index BEFORE:", currentKeyIndex);
    console.log("[KeyRotation] Last Rotation Date:", lastRotationDate);

    // Legacy single key format
    if (typeof geminiKeys === "string") {
        console.log("[KeyRotation] MODE: Legacy single key");
        const isEnc = isEncrypted(geminiKeys);
        console.log("[KeyRotation] Is Encrypted:", isEnc);
        console.log("[KeyRotation] Key Preview (encrypted):", geminiKeys.substring(0, 20) + "...");
        const decryptedKey = isEnc ? decryptApiKey(geminiKeys) : geminiKeys;
        console.log("[KeyRotation] Decrypted Key Preview:", decryptedKey.substring(0, 12) + "..." + decryptedKey.substring(decryptedKey.length - 4));
        console.log("[KeyRotation] Decrypted Key Length:", decryptedKey.length);
        console.log("[KeyRotation] DEBUG END - Returning single key");
        console.log("========================================");
        return { key: decryptedKey, label: "default", index: 0 };
    }

    // Multi-key format
    if (!Array.isArray(geminiKeys) || geminiKeys.length === 0) {
        console.log("[KeyRotation] ERROR: Not an array or empty");
        console.log("[KeyRotation] DEBUG END - Returning null");
        console.log("========================================");
        return null;
    }

    console.log("[KeyRotation] MODE: Multi-key array");
    console.log("[KeyRotation] Total keys in array:", geminiKeys.length);

    // Log all keys info (masked)
    geminiKeys.forEach((k, i) => {
        const keyPreview = k.key ? (k.key.substring(0, 10) + "...") : "EMPTY";
        console.log(`[KeyRotation] Key[${i}]: label=${k.label}, enabled=${k.enabled !== false}, keyPreview=${keyPreview}`);
    });

    // Filter enabled keys
    const enabledKeys = geminiKeys.filter(k => k.enabled !== false && k.key);
    console.log("[KeyRotation] Enabled keys count:", enabledKeys.length);

    if (enabledKeys.length === 0) {
        console.log("[KeyRotation] ERROR: No enabled keys found!");
        console.log("[KeyRotation] DEBUG END - Returning null");
        console.log("========================================");
        return null;
    }

    // Reset index at start of new day (daily rotation reset)
    const today = new Date().toISOString().split("T")[0];
    console.log("[KeyRotation] Today:", today);
    if (lastRotationDate !== today) {
        console.log("[KeyRotation] NEW DAY detected! Resetting index from", currentKeyIndex, "to 0");
        currentKeyIndex = 0;
        lastRotationDate = today;
    }

    // Round-robin selection
    const index = currentKeyIndex % enabledKeys.length;
    const selectedEntry = enabledKeys[index];

    console.log("[KeyRotation] Current Index:", currentKeyIndex);
    console.log("[KeyRotation] Calculated index (mod):", index);
    console.log("[KeyRotation] Selected Entry Label:", selectedEntry.label);

    // Increment for next call
    currentKeyIndex++;
    console.log("[KeyRotation] Index AFTER increment:", currentKeyIndex);

    // Decrypt if needed
    const isEnc = isEncrypted(selectedEntry.key);
    console.log("[KeyRotation] Selected key is encrypted:", isEnc);
    const decryptedKey = isEnc
        ? decryptApiKey(selectedEntry.key)
        : selectedEntry.key;

    console.log("[KeyRotation] Final Key Preview:", decryptedKey.substring(0, 12) + "..." + decryptedKey.substring(decryptedKey.length - 4));
    console.log("[KeyRotation] Final Key Length:", decryptedKey.length);
    console.log("[KeyRotation] Final Key starts with 'AIza':", decryptedKey.startsWith("AIza"));
    console.log(`[KeyRotation] SELECTED: key #${index + 1}/${enabledKeys.length} (${selectedEntry.label})`);
    console.log("[KeyRotation] DEBUG END");
    console.log("========================================");

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
