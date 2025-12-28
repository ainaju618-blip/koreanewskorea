/**
 * Job Logger for Real-time Monitoring
 * - Logs detailed progress to Supabase
 * - Enables real-time monitoring via Supabase Realtime
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface LayerResults {
    layer1_2?: {
        original_facts: Record<string, unknown>;
        converted_facts: Record<string, unknown>;
        missing: string[];
        added: string[];
        passed: boolean;
    };
    layer3?: {
        hallucinations: string[];
        llm_response: string;
        passed: boolean;
    };
    layer4?: {
        accuracy: number;
        completeness: number;
        no_additions: number;
        total: number;
        issues: string[];
        passed: boolean;
    };
    layer5?: {
        original_length: number;
        converted_length: number;
        ratio: number;
        passed: boolean;
    };
}

export interface JobLogEntry {
    session_id: string;
    phase: 'scraping' | 'ai_processing' | 'system';
    region?: string;
    log_level: 'debug' | 'info' | 'warning' | 'error';
    log_type: string;
    message: string;
    article_id?: string;
    article_title?: string;
    article_count?: number;
    skip_reason?: string;
    ai_attempt?: number;
    ai_grade?: string;
    ai_score?: number;
    layer_results?: LayerResults;
    duration_ms?: number;
    metadata?: Record<string, unknown>;
}

export class JobLogger {
    private supabase: SupabaseClient;
    private sessionId: string | null = null;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    /**
     * Set the current session ID (passed from Python scraper)
     */
    setSessionId(sessionId: string) {
        this.sessionId = sessionId;
    }

    /**
     * Get the current session ID
     */
    getSessionId(): string | null {
        return this.sessionId;
    }

    /**
     * Try to find the current running session
     */
    async findRunningSession(): Promise<string | null> {
        try {
            const { data, error } = await this.supabase
                .from('job_sessions')
                .select('id')
                .eq('status', 'running')
                .order('started_at', { ascending: false })
                .limit(1);

            if (error) {
                console.error('[JobLogger] Failed to find session:', error);
                return null;
            }

            if (data && data.length > 0) {
                this.sessionId = data[0].id;
                return this.sessionId;
            }

            return null;
        } catch (e) {
            console.error('[JobLogger] Exception finding session:', e);
            return null;
        }
    }

    /**
     * Core logging method
     */
    private async log(entry: Omit<JobLogEntry, 'session_id'>): Promise<void> {
        if (!this.sessionId) {
            // Try to find a running session
            await this.findRunningSession();
        }

        if (!this.sessionId) {
            console.log(`[JobLogger] No session - ${entry.phase}/${entry.log_type}: ${entry.message}`);
            return;
        }

        try {
            const logEntry = {
                session_id: this.sessionId,
                phase: entry.phase,
                region: entry.region || null,
                log_level: entry.log_level,
                log_type: entry.log_type,
                message: entry.message,
                article_id: entry.article_id || null,
                article_title: entry.article_title || null,
                article_count: entry.article_count || null,
                skip_reason: entry.skip_reason || null,
                ai_attempt: entry.ai_attempt || null,
                ai_grade: entry.ai_grade || null,
                ai_score: entry.ai_score || null,
                layer_results: entry.layer_results || null,
                duration_ms: entry.duration_ms || null,
                metadata: entry.metadata || null,
                created_at: new Date().toISOString()
            };

            await this.supabase
                .from('job_logs')
                .insert(logEntry);
        } catch (e) {
            console.error('[JobLogger] Failed to log:', e);
        }
    }

    // =========================================================================
    // AI Processing Logs
    // =========================================================================

    /**
     * Log AI article processing start
     */
    async logAiArticleStart(
        region: string,
        articleId: string,
        title: string,
        index: number,
        total: number
    ): Promise<void> {
        await this.log({
            phase: 'ai_processing',
            region,
            log_level: 'info',
            log_type: 'ai_article_start',
            message: `[${index}/${total}] Processing: "${title.substring(0, 50)}..."`,
            article_id: articleId,
            article_title: title
        });
    }

    /**
     * Log Layer 1 & 2 results (fact extraction and comparison)
     */
    async logLayer1_2(
        region: string,
        articleId: string,
        originalFacts: Record<string, unknown>,
        convertedFacts: Record<string, unknown>,
        missing: string[],
        added: string[],
        passed: boolean
    ): Promise<void> {
        const status = passed ? 'pass' : 'fail';
        const numbersCount = (originalFacts.numbers as string[] || []).length;
        const datesCount = (originalFacts.dates as string[] || []).length;
        const namesCount = (originalFacts.names as string[] || []).length;

        const message = `Layer 1&2: Numbers ${numbersCount}, Dates ${datesCount}, Names ${namesCount} | Missing: ${missing.length}, Added: ${added.length}`;

        await this.log({
            phase: 'ai_processing',
            region,
            log_level: 'info',
            log_type: `layer1_2_${status}`,
            message,
            article_id: articleId,
            layer_results: {
                layer1_2: {
                    original_facts: originalFacts,
                    converted_facts: convertedFacts,
                    missing,
                    added,
                    passed
                }
            }
        });
    }

    /**
     * Log Layer 3 start (hallucination detection)
     */
    async logLayer3Start(region: string, articleId: string): Promise<void> {
        await this.log({
            phase: 'ai_processing',
            region,
            log_level: 'debug',
            log_type: 'layer3_start',
            message: 'Layer 3: Hallucination detection starting (Ollama)...',
            article_id: articleId
        });
    }

    /**
     * Log Layer 3 results
     */
    async logLayer3(
        region: string,
        articleId: string,
        hallucinations: string[],
        llmResponse: string,
        passed: boolean
    ): Promise<void> {
        const status = passed ? 'pass' : 'fail';
        const message = passed
            ? 'Layer 3: No hallucination detected'
            : `Layer 3: Hallucination detected - ${hallucinations.length} issues`;

        await this.log({
            phase: 'ai_processing',
            region,
            log_level: 'info',
            log_type: `layer3_${status}`,
            message,
            article_id: articleId,
            layer_results: {
                layer3: {
                    hallucinations,
                    llm_response: llmResponse.substring(0, 500),
                    passed
                }
            }
        });
    }

    /**
     * Log Layer 4 start (cross-validation)
     */
    async logLayer4Start(region: string, articleId: string): Promise<void> {
        await this.log({
            phase: 'ai_processing',
            region,
            log_level: 'debug',
            log_type: 'layer4_start',
            message: 'Layer 4: Cross-validation starting (Ollama)...',
            article_id: articleId
        });
    }

    /**
     * Log Layer 4 results
     */
    async logLayer4(
        region: string,
        articleId: string,
        accuracy: number,
        completeness: number,
        noAdditions: number,
        totalScore: number,
        issues: string[],
        passed: boolean
    ): Promise<void> {
        const status = passed ? 'pass' : 'fail';
        const message = `Layer 4: Score ${totalScore}/100 (Acc:${accuracy}/40, Comp:${completeness}/30, NoAdd:${noAdditions}/30)`;

        await this.log({
            phase: 'ai_processing',
            region,
            log_level: 'info',
            log_type: `layer4_${status}`,
            message,
            article_id: articleId,
            ai_score: totalScore,
            layer_results: {
                layer4: {
                    accuracy,
                    completeness,
                    no_additions: noAdditions,
                    total: totalScore,
                    issues,
                    passed
                }
            }
        });
    }

    /**
     * Log Layer 5 results (length verification)
     */
    async logLayer5(
        region: string,
        articleId: string,
        originalLength: number,
        convertedLength: number,
        ratio: number,
        passed: boolean
    ): Promise<void> {
        const status = passed ? 'pass' : 'fail';
        const percentage = Math.round(ratio * 100);
        const message = `Layer 5: Length ${percentage}% (${convertedLength}/${originalLength} chars)`;

        await this.log({
            phase: 'ai_processing',
            region,
            log_level: 'info',
            log_type: `layer5_${status}`,
            message,
            article_id: articleId,
            layer_results: {
                layer5: {
                    original_length: originalLength,
                    converted_length: convertedLength,
                    ratio,
                    passed
                }
            }
        });
    }

    /**
     * Log retry attempt
     */
    async logRetry(
        region: string,
        articleId: string,
        attempt: number,
        maxAttempts: number,
        reason: string
    ): Promise<void> {
        await this.log({
            phase: 'ai_processing',
            region,
            log_level: 'warning',
            log_type: 'ai_retry',
            message: `Retry ${attempt}/${maxAttempts}: ${reason}`,
            article_id: articleId,
            ai_attempt: attempt
        });
    }

    /**
     * Log final AI processing result
     */
    async logResult(
        region: string,
        articleId: string,
        title: string,
        grade: string,
        published: boolean,
        attempts: number,
        durationMs: number,
        reason?: string
    ): Promise<void> {
        const statusText = published ? 'Published' : 'Draft (manual review)';
        const logType = published ? 'ai_published' : 'ai_draft';

        let message = `Grade ${grade} -> ${statusText}`;
        if (reason) {
            message += ` (${reason})`;
        }
        message += ` [Attempts: ${attempts}, Time: ${durationMs}ms]`;

        await this.log({
            phase: 'ai_processing',
            region,
            log_level: 'info',
            log_type: logType,
            message,
            article_id: articleId,
            article_title: title,
            ai_grade: grade,
            ai_attempt: attempts,
            duration_ms: durationMs
        });
    }

    /**
     * Log AI processing error
     */
    async logError(
        region: string,
        articleId: string,
        errorType: string,
        message: string
    ): Promise<void> {
        await this.log({
            phase: 'ai_processing',
            region,
            log_level: 'error',
            log_type: `ai_error_${errorType}`,
            message: `Error: ${message}`,
            article_id: articleId
        });
    }
}

// Singleton instance
let loggerInstance: JobLogger | null = null;

export function getJobLogger(supabase: SupabaseClient): JobLogger {
    if (!loggerInstance) {
        loggerInstance = new JobLogger(supabase);
    }
    return loggerInstance;
}

export function resetJobLogger(): void {
    loggerInstance = null;
}
