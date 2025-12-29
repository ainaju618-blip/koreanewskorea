/**
 * API Key Encryption Utilities
 * 
 * Provides AES-256-GCM encryption for sensitive data like API keys.
 * Requires ENCRYPTION_KEY environment variable to be set.
 * 
 * Last updated: 2025-12-22
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get encryption key from environment variable.
 * Falls back to a deterministic key derived from a seed for development.
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;

    if (key) {
        // If key is hex string (64 chars = 32 bytes)
        if (key.length === 64) {
            return Buffer.from(key, 'hex');
        }
        // Otherwise, derive key from passphrase
        return crypto.scryptSync(key, 'salt', 32);
    }

    // Development fallback - NOT SECURE FOR PRODUCTION
    console.warn('[Encryption] WARNING: Using fallback encryption key. Set ENCRYPTION_KEY in production!');
    return crypto.scryptSync('koreanews-dev-key-do-not-use-in-production', 'salt', 32);
}

/**
 * Encrypt a plaintext string.
 * Returns a base64-encoded string containing IV + ciphertext + auth tag.
 */
export function encryptApiKey(plaintext: string): string {
    if (!plaintext) return '';

    // Type validation - must be string
    if (typeof plaintext !== 'string') {
        console.error('[Encryption] Expected string but received:', typeof plaintext);
        return '';
    }

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine: IV (16 bytes) + encrypted + authTag (16 bytes)
    const combined = Buffer.concat([
        iv,
        Buffer.from(encrypted, 'hex'),
        authTag
    ]);

    return combined.toString('base64');
}

/**
 * Decrypt an encrypted string.
 * Expects a base64-encoded string containing IV + ciphertext + auth tag.
 */
export function decryptApiKey(encrypted: string): string {
    if (!encrypted) return '';

    try {
        const key = getEncryptionKey();
        const combined = Buffer.from(encrypted, 'base64');

        // Extract parts
        const iv = combined.subarray(0, IV_LENGTH);
        const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
        const ciphertext = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(ciphertext);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf8');
    } catch (error) {
        console.error('[Encryption] Decryption failed:', error);
        // Return empty string if decryption fails (key changed, corrupted data, etc.)
        return '';
    }
}

/**
 * Check if a string appears to be encrypted (base64 with minimum length).
 */
export function isEncrypted(value: string): boolean {
    if (!value || value.length < 44) return false; // Minimum: IV + 1 byte + authTag

    try {
        // Check if it's valid base64
        const decoded = Buffer.from(value, 'base64');
        return decoded.length >= IV_LENGTH + AUTH_TAG_LENGTH + 1;
    } catch {
        return false;
    }
}

/**
 * Encrypt an object containing API keys.
 * Only encrypts values that appear to be unencrypted API keys.
 */
export function encryptApiKeys(keys: Record<string, string>): Record<string, string> {
    // Validation - keys must be an object, not an array
    if (!keys || Array.isArray(keys) || typeof keys !== 'object') {
        console.error('[Encryption] Invalid keys format - expected object but received:',
            Array.isArray(keys) ? 'Array' : typeof keys);
        return {};
    }

    const encrypted: Record<string, string> = {};

    for (const [provider, key] of Object.entries(keys)) {
        // Skip if value is not a string
        if (key !== null && key !== undefined && typeof key !== 'string') {
            console.error(`[Encryption] Invalid value type for ${provider}:`, typeof key);
            encrypted[provider] = '';
            continue;
        }
        if (!key) {
            encrypted[provider] = '';
        } else if (isEncrypted(key)) {
            // Already encrypted, keep as is
            encrypted[provider] = key;
        } else {
            // Encrypt plaintext key
            encrypted[provider] = encryptApiKey(key);
        }
    }

    return encrypted;
}

/**
 * Decrypt an object containing encrypted API keys.
 */
export function decryptApiKeys(keys: Record<string, string>): Record<string, string> {
    const decrypted: Record<string, string> = {};

    for (const [provider, key] of Object.entries(keys)) {
        if (!key) {
            decrypted[provider] = '';
        } else if (isEncrypted(key)) {
            decrypted[provider] = decryptApiKey(key);
        } else {
            // Not encrypted, return as is (backwards compatibility)
            decrypted[provider] = key;
        }
    }

    return decrypted;
}
