"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/ai-prompts";
import { ParsedArticle } from "@/lib/ai-output-parser";
import { AI_DEFAULT_DAILY_LIMIT, AI_DEFAULT_MONTHLY_TOKEN_LIMIT, AI_DEFAULT_MAX_INPUT_LENGTH } from "@/lib/ai-consts";

// Types
export type AIProvider = "gemini" | "claude" | "grok";

export interface SavedPrompt {
    id: string;
    name: string;
    content: string;
}

export interface SavedKeyProfile {
    id: string;
    name: string;
    apiKeys: {
        gemini: string;
        claude: string;
        grok: string;
    };
}

export interface GeminiKeyEntry {
    key: string;
    label: string;
    enabled?: boolean;
}

export interface AISettings {
    enabled: boolean;
    defaultProvider: AIProvider;
    apiKeys: {
        gemini: string;
        claude: string;
        grok: string;
    };
    geminiMultiKeys: GeminiKeyEntry[];
    systemPrompt: string;
    savedPrompts: SavedPrompt[];
    savedKeyProfiles: SavedKeyProfile[];
    enabledRegions: string[];
    dailyLimit: number;
    monthlyTokenLimit: number;
    maxInputLength: number;
}

// P2: any 타입 제거 - Real Test Result Interface
export interface RealTestResult {
    success: boolean;
    articleId?: string;
    message?: string;
    error?: string;
    parsed?: ParsedArticle;
    step?: string;
}

// Provider Info
export const providers = [
    {
        id: "gemini" as AIProvider,
        name: "Google Gemini",
        description: "Gemini 2.5 Flash - 빠른 응답",
        color: "bg-blue-100 text-blue-700",
        envKey: "GOOGLE_GENERATIVE_AI_API_KEY",
        link: "https://aistudio.google.com/apikey"
    },
    {
        id: "claude" as AIProvider,
        name: "Anthropic Claude",
        description: "Claude 3.5 Sonnet - 높은 품질",
        color: "bg-orange-100 text-orange-700",
        envKey: "ANTHROPIC_API_KEY",
        link: "https://console.anthropic.com/settings/keys"
    },
    {
        id: "grok" as AIProvider,
        name: "xAI Grok",
        description: "Grok - 실시간 정보",
        color: "bg-gray-100 text-gray-700",
        envKey: "XAI_API_KEY",
        link: "https://console.x.ai/"
    },
];

const defaultSettings: AISettings = {
    enabled: false,
    defaultProvider: "gemini",
    apiKeys: { gemini: "", claude: "", grok: "" },
    geminiMultiKeys: [],
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    savedPrompts: [],
    savedKeyProfiles: [],
    enabledRegions: [],
    dailyLimit: AI_DEFAULT_DAILY_LIMIT,
    monthlyTokenLimit: AI_DEFAULT_MONTHLY_TOKEN_LIMIT,
    maxInputLength: AI_DEFAULT_MAX_INPUT_LENGTH
};

export function useAISettings() {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<AISettings>(defaultSettings);

    // Test states
    const [testing, setTesting] = useState<AIProvider | null>(null);
    const [testingAll, setTestingAll] = useState(false);
    const [testResults, setTestResults] = useState<Record<AIProvider, boolean | null>>({
        gemini: null, claude: null, grok: null
    });

    // Simulation states
    const [testInput, setTestInput] = useState("");
    const [testOutput, setTestOutput] = useState("");
    const [parsedOutput, setParsedOutput] = useState<ParsedArticle | null>(null);
    const [isRewriting, setIsRewriting] = useState(false);
    const [realTestResult, setRealTestResult] = useState<RealTestResult | null>(null);

    // Fetch settings
    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/ai-settings");
            if (res.ok) {
                const data = await res.json();
                if (data.settings) {
                    setSettings(data.settings);
                }
            }
        } catch (error) {
            console.error("Failed to load AI settings:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Save settings
    const saveSettings = useCallback(async (dataToSave: AISettings): Promise<boolean> => {
        try {
            setSaving(true);
            const res = await fetch("/api/admin/ai-settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSave),
            });

            if (res.ok) {
                return true;
            } else {
                const data = await res.json();
                showError(data.error || "저장에 실패했습니다.");
                return false;
            }
        } catch {
            showError("저장 중 오류가 발생했습니다.");
            return false;
        } finally {
            setSaving(false);
        }
    }, [showError]);

    // Handle save with profile prompt
    const handleSave = useCallback(async () => {
        const success = await saveSettings(settings);
        if (success) {
            showSuccess("AI 설정이 저장되었습니다.");
        }
    }, [settings, saveSettings, showSuccess]);

    // Test API connection
    const handleTest = useCallback(async (provider: AIProvider) => {
        const apiKey = settings.apiKeys[provider];
        if (!apiKey) {
            showError("API 키를 먼저 입력해주세요.");
            return;
        }

        try {
            setTesting(provider);
            setTestResults(prev => ({ ...prev, [provider]: null }));

            const res = await fetch("/api/ai/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider, apiKey }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setTestResults(prev => ({ ...prev, [provider]: true }));
                showSuccess(`${provider} API 연결 성공!`);
            } else {
                setTestResults(prev => ({ ...prev, [provider]: false }));
                showError(data.error || "연결 테스트 실패");
            }
        } catch {
            setTestResults(prev => ({ ...prev, [provider]: false }));
            showError("테스트 중 오류가 발생했습니다.");
        } finally {
            setTesting(null);
        }
    }, [settings.apiKeys, showSuccess, showError]);

    // Test all API connections
    const handleTestAll = useCallback(async () => {
        // Get providers with API keys
        const providersWithKeys = providers.filter(p => settings.apiKeys[p.id]);

        if (providersWithKeys.length === 0) {
            showError("테스트할 API 키가 없습니다.");
            return;
        }

        try {
            setTestingAll(true);
            // Reset all test results
            setTestResults({ gemini: null, claude: null, grok: null });

            let successCount = 0;
            let failCount = 0;

            // Test each provider sequentially
            for (const provider of providersWithKeys) {
                setTesting(provider.id);

                try {
                    const res = await fetch("/api/ai/test", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            provider: provider.id,
                            apiKey: settings.apiKeys[provider.id]
                        }),
                    });

                    const data = await res.json();
                    if (res.ok && data.success) {
                        setTestResults(prev => ({ ...prev, [provider.id]: true }));
                        successCount++;
                    } else {
                        setTestResults(prev => ({ ...prev, [provider.id]: false }));
                        failCount++;
                    }
                } catch {
                    setTestResults(prev => ({ ...prev, [provider.id]: false }));
                    failCount++;
                }
            }

            // Show summary
            if (failCount === 0) {
                showSuccess(`모든 API 연결 성공! (${successCount}/${providersWithKeys.length})`);
            } else if (successCount === 0) {
                showError(`모든 API 연결 실패 (${failCount}/${providersWithKeys.length})`);
            } else {
                showSuccess(`${successCount}개 성공, ${failCount}개 실패`);
            }
        } finally {
            setTesting(null);
            setTestingAll(false);
        }
    }, [settings.apiKeys, showSuccess, showError]);

    // Run simulation
    const handleSimulation = useCallback(async () => {
        if (!testInput.trim()) {
            showError("테스트할 텍스트를 입력하세요.");
            return;
        }

        const currentProvider = settings.defaultProvider;
        const currentKey = settings.apiKeys[currentProvider];

        if (!currentKey) {
            showError(`${currentProvider} API 키가 설정되지 않았습니다.`);
            return;
        }

        try {
            setTestOutput("");
            setParsedOutput(null);

            const res = await fetch("/api/ai/rewrite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: testInput,
                    provider: currentProvider,
                    apiKey: currentKey,
                    systemPrompt: settings.systemPrompt,
                    parseJson: true // JSON 파싱 모드 활성화
                }),
            });

            const data = await res.json();
            if (res.ok) {
                if (data.parsed) {
                    setParsedOutput(data.parsed);
                    setTestOutput(JSON.stringify(data.parsed, null, 2));
                } else {
                    setTestOutput(data.rewritten);
                }
                showSuccess("재가공 완료!");
            } else {
                showError(data.error || "재가공 실패");
                if (data.rawResponse) {
                    setTestOutput(data.rawResponse); // 파싱 실패 시 원본 표시
                }
            }
        } catch {
            showError("오류가 발생했습니다.");
        } finally {
            setIsRewriting(false);
        }
    }, [testInput, settings, showSuccess, showError]);

    // Real DB Test (Create Draft -> AI Rewrite -> Update Pubilshed)
    const handleRealTest = useCallback(async () => {
        if (!testInput.trim()) {
            showError("테스트할 보도자료 내용을 입력하세요.");
            return;
        }

        const currentProvider = settings.defaultProvider;
        const currentKey = settings.apiKeys[currentProvider];

        if (!currentKey) {
            showError(`${currentProvider} API 키가 없습니다.`);
            return;
        }

        try {
            setIsRewriting(true);
            setRealTestResult(null);
            setParsedOutput(null);

            // 1. Create Draft Post
            const createRes = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: "[AI 테스트] 임시 보도자료",
                    content: testInput, // 원본 내용
                    status: "draft",
                    category: "general", // 임시 카테고리
                    source: "manual_test"
                }),
            });

            if (!createRes.ok) {
                throw new Error("임시 기사 생성 실패");
            }

            const newPost = await createRes.json();
            const articleId = newPost.id;

            // 2. Call AI Rewrite with articleId
            const rewriteRes = await fetch("/api/ai/rewrite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: testInput,
                    provider: currentProvider,
                    apiKey: currentKey,
                    systemPrompt: settings.systemPrompt,
                    parseJson: true,
                    articleId: articleId // ★ DB 업데이트 트리거
                }),
            });

            const rewriteData = await rewriteRes.json();

            if (!rewriteRes.ok) {
                setRealTestResult({ success: false, step: "rewrite", error: rewriteData.error });
                showError("AI 재가공 실패: " + rewriteData.error);
            } else {
                setRealTestResult({
                    success: true,
                    articleId,
                    parsed: rewriteData.parsed,
                    message: "기사가 성공적으로 생성되고 AI로 재가공되어 발행되었습니다!"
                });
                setParsedOutput(rewriteData.parsed);
                showSuccess("실전 테스트 성공! 기사가 발행되었습니다.");
            }

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(error);
            setRealTestResult({ success: false, step: "create", error: errorMessage });
            showError("테스트 중 오류: " + errorMessage);
        } finally {
            setIsRewriting(false);
        }
    }, [testInput, settings, showSuccess, showError]);

    // Update settings
    const updateSettings = useCallback((updates: Partial<AISettings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
    }, []);

    // Update API key
    const updateApiKey = useCallback((provider: AIProvider, value: string) => {
        setSettings(prev => ({
            ...prev,
            apiKeys: { ...prev.apiKeys, [provider]: value }
        }));
    }, []);

    // Set default provider
    const setDefaultProvider = useCallback((provider: AIProvider) => {
        setSettings(prev => ({
            ...prev,
            defaultProvider: provider
        }));
    }, []);

    return {
        // States
        settings,
        loading,
        saving,
        testing,
        testingAll,
        testResults,
        testInput,
        testOutput,
        parsedOutput,
        isRewriting,
        realTestResult,

        // Actions
        setSettings,
        updateSettings,
        updateApiKey,
        setDefaultProvider,
        setTestInput,
        setTestOutput,
        setParsedOutput,
        handleSave,
        handleTest,
        handleTestAll,
        handleSimulation,
        handleRealTest,
        saveSettings,
        showSuccess,
        showError,
    };
}
