/**
 * AI Output Parser - AI response parsing and validation
 *
 * Parses AI response JSON, validates it, and converts to DB-storable format
 *
 * v2.0 Changes:
 * - Added extracted_numbers and extracted_quotes fields
 * - Added fact validation logic (validateFactAccuracy)
 * - Added validation result in response
 */

export interface ParsedArticle {
    title: string;
    slug: string;
    content: string;
    summary: string;
    keywords: string[];
    tags: string[];
    extracted_numbers: string[];
    extracted_quotes: string[];
}

export interface ParseResult {
    success: boolean;
    data?: ParsedArticle;
    error?: string;
}

export interface ValidationResult {
    isValid: boolean;
    grade: "A" | "B" | "C" | "D";
    warnings: string[];
    numberCheck: {
        passed: boolean;
        originalCount: number;
        aiCount: number;
        missingNumbers: string[];
        extraNumbers: string[];
    };
    quoteCheck: {
        passed: boolean;
        originalCount: number;
        aiCount: number;
        missingQuotes: string[];
        extraQuotes: string[];
    };
}

/**
 * Extract and sanitize JSON from AI response
 * Handles: markdown blocks, unescaped quotes, newlines, special chars
 */
function extractJSON(text: string): string {
    // Remove code blocks (```json ... ``` or ``` ... ```)
    let cleaned = text.trim();

    // Remove ```json block
    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
        cleaned = jsonBlockMatch[1].trim();
    }

    // Find start/end braces
    const startIdx = cleaned.indexOf("{");
    const endIdx = cleaned.lastIndexOf("}");

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleaned = cleaned.substring(startIdx, endIdx + 1);
    }

    // Sanitize JSON string
    cleaned = sanitizeJSON(cleaned);

    return cleaned;
}

/**
 * Sanitize JSON string to fix common AI output issues
 */
function sanitizeJSON(jsonStr: string): string {
    let result = jsonStr;

    // 1. Normalize Unicode quotes to standard quotes
    result = result
        .replace(/[\u201C\u201D\u201E\u201F]/g, '"')  // Curly double quotes -> "
        .replace(/[\u2018\u2019\u201A\u201B]/g, "'"); // Curly single quotes -> '

    // 2. Fix unescaped newlines inside string values
    // This regex finds strings and escapes newlines within them
    result = result.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
        return match
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            .replace(/\t/g, "\\t");
    });

    // 3. Fix trailing commas before } or ]
    result = result.replace(/,\s*([\}\]])/g, "$1");

    // 4. Try to fix incomplete JSON (missing closing braces)
    const openBraces = (result.match(/\{/g) || []).length;
    const closeBraces = (result.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
        const missing = openBraces - closeBraces;
        result = result + "}".repeat(missing);
        console.log(`[sanitizeJSON] Added ${missing} missing closing brace(s)`);
    }

    // 5. Fix unescaped quotes inside string values (complex case)
    // Pattern: "key": "value with "nested" quotes"
    // This is tricky - we try a simple fix for common patterns
    result = fixNestedQuotes(result);

    return result;
}

/**
 * Attempt to fix unescaped nested quotes in JSON values
 * This handles cases like: "content": "He said "hello" to me"
 */
function fixNestedQuotes(jsonStr: string): string {
    // First, try to parse as-is
    try {
        JSON.parse(jsonStr);
        return jsonStr; // Already valid, no fix needed
    } catch {
        // Continue with fix attempts
    }

    // Strategy: Find string values and escape internal quotes
    // Look for pattern: "key": "value"
    // The challenge is distinguishing field-ending quotes from internal quotes

    let result = jsonStr;

    // Common fix: Replace ": " followed by quotes that don't end properly
    // This regex finds property values and tries to fix them
    const propertyPattern = /("[\w_]+"\s*:\s*")([^]*?)("(?:\s*[,\}]))/g;

    result = result.replace(propertyPattern, (match, prefix, value, suffix) => {
        // Escape any unescaped quotes in the value
        // But don't double-escape already escaped quotes
        const fixedValue = value.replace(/(?<!\\)"/g, '\\"');
        return prefix + fixedValue + suffix;
    });

    // Try parsing again
    try {
        JSON.parse(result);
        console.log("[fixNestedQuotes] Successfully fixed nested quotes");
        return result;
    } catch {
        // Return original if fix didn't work
        console.log("[fixNestedQuotes] Could not fix nested quotes, returning original");
        return jsonStr;
    }
}

/**
 * Parse AI response
 */
export function parseAIOutput(aiResponse: string): ParseResult {
    try {
        // Log raw response info for debugging
        console.log("[ai-output-parser] Raw response length:", aiResponse?.length || 0);
        console.log("[ai-output-parser] Raw response preview:", aiResponse?.substring(0, 200));

        const jsonStr = extractJSON(aiResponse);
        console.log("[ai-output-parser] Extracted JSON length:", jsonStr?.length || 0);
        console.log("[ai-output-parser] Extracted JSON preview:", jsonStr?.substring(0, 300));

        let parsed;
        try {
            parsed = JSON.parse(jsonStr);
        } catch (parseErr) {
            // Log detailed error info for debugging
            const errMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
            console.error("[ai-output-parser] JSON.parse failed:", errMsg);
            console.error("[ai-output-parser] Problem JSON (first 500 chars):", jsonStr?.substring(0, 500));
            console.error("[ai-output-parser] Problem JSON (last 200 chars):", jsonStr?.substring(jsonStr.length - 200));

            // Try to identify the exact position of the error
            const posMatch = errMsg.match(/position (\d+)/i);
            if (posMatch) {
                const pos = parseInt(posMatch[1], 10);
                const context = jsonStr?.substring(Math.max(0, pos - 50), pos + 50);
                console.error(`[ai-output-parser] Error at position ${pos}, context: ...${context}...`);
            }

            throw parseErr;
        }

        // Validate required fields
        const validation = validateParsedArticle(parsed);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error
            };
        }

        // Normalize
        const normalized: ParsedArticle = {
            title: String(parsed.title || "").trim(),
            slug: generateSlug(parsed.slug || parsed.title || ""),
            content: normalizeContent(parsed.content || ""),
            summary: String(parsed.summary || "").trim().substring(0, 200),
            keywords: normalizeArray(parsed.keywords),
            tags: normalizeArray(parsed.tags),
            extracted_numbers: normalizeArray(parsed.extracted_numbers),
            extracted_quotes: normalizeQuotes(parsed.extracted_quotes)
        };

        console.log("[ai-output-parser] Parse successful, title:", normalized.title);
        return {
            success: true,
            data: normalized
        };
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : "JSON parsing failed";
        console.error("[ai-output-parser] Final parse error:", errMsg);
        return {
            success: false,
            error: errMsg
        };
    }
}

/**
 * Validate required fields
 */
function validateParsedArticle(parsed: unknown): { valid: boolean; error?: string } {
    if (!parsed || typeof parsed !== "object") {
        return { valid: false, error: "AI response is not an object" };
    }

    const obj = parsed as Record<string, unknown>;

    if (!obj.title || String(obj.title).trim() === "") {
        return { valid: false, error: "Missing title field" };
    }

    if (!obj.content || String(obj.content).trim() === "") {
        return { valid: false, error: "Missing content field" };
    }

    if (!obj.summary || String(obj.summary).trim() === "") {
        return { valid: false, error: "Missing summary field" };
    }

    return { valid: true };
}

/**
 * Generate/normalize slug
 */
function generateSlug(input: string): string {
    if (!input) return "";

    return input
        .toLowerCase()
        .replace(/[^\w\s가-힣-]/g, "") // Remove special chars (keep Korean, English, numbers, hyphen)
        .replace(/\s+/g, "-") // Spaces to hyphens
        .replace(/-+/g, "-") // Remove consecutive hyphens
        .substring(0, 100); // Max 100 chars
}

/**
 * Normalize array (convert to string array)
 */
function normalizeArray(arr: unknown): string[] {
    if (!arr) return [];
    if (typeof arr === "string") {
        // Handle "#tag1 #tag2" format
        return arr
            .split(/[\s,]+/)
            .filter(Boolean)
            .map((s) => s.replace(/^#/, ""));
    }
    if (Array.isArray(arr)) {
        return arr
            .map((item) => String(item).trim().replace(/^#/, ""))
            .filter(Boolean);
    }
    return [];
}

/**
 * Normalize quotes array
 */
function normalizeQuotes(arr: unknown): string[] {
    if (!arr) return [];
    if (typeof arr === "string") {
        // Handle single quote as string
        return [arr.trim()].filter(Boolean);
    }
    if (Array.isArray(arr)) {
        return arr.map((item) => String(item).trim()).filter(Boolean);
    }
    return [];
}

/**
 * Normalize content HTML
 */
function normalizeContent(content: string): string {
    let normalized = String(content).trim();

    // Convert markdown to HTML (simple processing)
    // #### subtitle -> <h4>
    normalized = normalized.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
    normalized = normalized.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
    normalized = normalized.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");

    // - list -> <li>
    normalized = normalized.replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>");

    // Wrap consecutive <li> with <ul>
    normalized = normalized.replace(/(<li>[\s\S]*?<\/li>)+/g, "<ul>$&</ul>");

    // Wrap paragraphs separated by blank lines with <p>
    const paragraphs = normalized.split(/\n\n+/);
    normalized = paragraphs
        .map((p) => {
            p = p.trim();
            // If already starts with HTML tag, keep as is
            if (p.startsWith("<")) return p;
            // If empty, ignore
            if (!p) return "";
            // Otherwise wrap with <p>
            return `<p>${p.replace(/\n/g, "<br>")}</p>`;
        })
        .filter(Boolean)
        .join("\n");

    return normalized;
}

/**
 * Extract numbers from text (for validation)
 */
export function extractNumbersFromText(text: string): string[] {
    const patterns = [
        // Korean currency: 500만원, 15조원, 1억원
        /\d+(?:,\d{3})*(?:조|억|만|천)?원/g,
        // Dates: 12월 2일, 2024년
        /\d{1,4}년|\d{1,2}월\s*\d{1,2}일|\d{1,2}월/g,
        // Percentages: 8.5%
        /\d+(?:\.\d+)?%/g,
        // Phone numbers: 061-339-8765
        /\d{2,4}-\d{3,4}-\d{4}/g,
        // Age: 18세, 39세
        /\d+세/g,
        // Period: 3년, 5일
        /\d+(?:년|개월|일|주|시간)/g,
        // Quantity: 100명, 50개
        /\d+(?:,\d{3})*(?:명|개|건|회|차|km|m|kg)/g,
        // General numbers with units
        /\d+(?:,\d{3})*(?:\.\d+)?/g
    ];

    const numbers = new Set<string>();

    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach((m) => numbers.add(m.trim()));
        }
    }

    return Array.from(numbers);
}

/**
 * Extract quotes from text (for validation)
 */
export function extractQuotesFromText(text: string): string[] {
    const quotes: string[] = [];

    // Match Korean/English quotes
    const patterns = [
        /"([^"]+)"/g, // "quote"
        /'([^']+)'/g, // 'quote'
        /"([^"]+)"/g, // "quote" (curly)
        /「([^」]+)」/g, // Japanese brackets
        /『([^』]+)』/g // Japanese double brackets
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const quote = match[1].trim();
            if (quote.length > 5) {
                // Ignore very short quotes
                quotes.push(quote);
            }
        }
    }

    return quotes;
}

/**
 * Validate fact accuracy (compare AI output with original)
 */
export function validateFactAccuracy(
    originalText: string,
    parsedArticle: ParsedArticle
): ValidationResult {
    const warnings: string[] = [];

    // Extract numbers and quotes from original
    const originalNumbers = extractNumbersFromText(originalText);
    const originalQuotes = extractQuotesFromText(originalText);

    // Get AI extracted data
    const aiNumbers = parsedArticle.extracted_numbers;
    const aiQuotes = parsedArticle.extracted_quotes;

    // Number validation
    const extraNumbers: string[] = [];
    const missingNumbers: string[] = [];

    // Check if AI numbers exist in original
    for (const num of aiNumbers) {
        const found = originalNumbers.some(
            (on) => on.includes(num) || num.includes(on) || on === num
        );
        if (!found) {
            extraNumbers.push(num);
            warnings.push(`Original does not contain number: ${num}`);
        }
    }

    // Check if original numbers exist in AI output (optional - for completeness)
    for (const num of originalNumbers) {
        const found = aiNumbers.some(
            (an) => an.includes(num) || num.includes(an) || an === num
        );
        if (!found) {
            missingNumbers.push(num);
        }
    }

    const numberCheckPassed = extraNumbers.length === 0;

    // Quote validation - more flexible matching
    const extraQuotes: string[] = [];
    const missingQuotes: string[] = [];

    // Normalize text for comparison (remove extra whitespace, normalize quotes)
    const normalizeForComparison = (text: string): string => {
        return text
            .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036"]/g, '"') // Normalize curly quotes
            .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035']/g, "'") // Normalize curly apostrophes
            .replace(/\s+/g, " ") // Normalize whitespace
            .trim()
            .toLowerCase();
    };

    const normalizedOriginal = normalizeForComparison(originalText);

    // Check if AI quotes exist in original
    for (const quote of aiQuotes) {
        const normalizedQuote = normalizeForComparison(quote);

        // Check if quote exists in original text (direct inclusion)
        const foundInText = normalizedOriginal.includes(normalizedQuote);

        // Also check partial match (at least 80% of quote should be in original)
        const partialMatch = normalizedQuote.length > 20
            ? normalizedOriginal.includes(normalizedQuote.substring(0, Math.floor(normalizedQuote.length * 0.8)))
            : false;

        if (!foundInText && !partialMatch) {
            extraQuotes.push(quote);
            warnings.push(`Original does not contain quote: "${quote.substring(0, 50)}..."`);
        }
    }

    // Check if original quotes exist in AI output (informational only, not a warning)
    for (const quote of originalQuotes) {
        const normalizedQuote = normalizeForComparison(quote);
        const found = aiQuotes.some((aq) => {
            const normalizedAQ = normalizeForComparison(aq);
            return normalizedAQ.includes(normalizedQuote) || normalizedQuote.includes(normalizedAQ);
        });
        if (!found) {
            missingQuotes.push(quote);
        }
    }

    const quoteCheckPassed = extraQuotes.length === 0;

    // Determine grade based on warnings count
    let grade: "A" | "B" | "C" | "D";
    if (warnings.length === 0) {
        grade = "A";
    } else if (warnings.length === 1) {
        grade = "B";
    } else if (warnings.length <= 3) {
        grade = "C";
    } else {
        grade = "D";
    }

    return {
        isValid: warnings.length === 0,
        grade,
        warnings,
        numberCheck: {
            passed: numberCheckPassed,
            originalCount: originalNumbers.length,
            aiCount: aiNumbers.length,
            missingNumbers,
            extraNumbers
        },
        quoteCheck: {
            passed: quoteCheckPassed,
            originalCount: originalQuotes.length,
            aiCount: aiQuotes.length,
            missingQuotes,
            extraQuotes
        }
    };
}

/**
 * Create DB update object
 * Add summary as styled box at top of content
 */
export function toDBUpdate(parsed: ParsedArticle): Record<string, unknown> {
    // Add summary at top of content (styled summary box)
    const summaryBox = parsed.summary
        ? `<div class="article-summary" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #0284c7; padding: 16px 20px; margin-bottom: 24px; border-radius: 0 8px 8px 0; font-size: 1.05em; line-height: 1.6; color: #0c4a6e;"><strong>요약</strong> | ${parsed.summary}</div>\n\n`
        : "";

    const contentWithSummary = summaryBox + parsed.content;

    return {
        title: parsed.title,
        slug: parsed.slug,
        content: contentWithSummary,
        ai_summary: parsed.summary,
        keywords: parsed.keywords,
        tags: parsed.tags,
        ai_processed: true,
        ai_processed_at: new Date().toISOString()
    };
}
