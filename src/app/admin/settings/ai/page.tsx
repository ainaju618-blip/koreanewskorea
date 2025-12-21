"use client";

import React, { useState, useEffect } from "react";
import {
    Sparkles,
    Save,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Eye,
    EyeOff,
    TestTube,
    ArrowLeft,
    FileText,
    Trash2,
    Plus,
    RotateCcw
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/ai-prompts";

// AI Provider Types
type AIProvider = "gemini" | "claude" | "grok";

interface AISettings {
    enabled: boolean;
    defaultProvider: AIProvider;
    apiKeys: {
        gemini: string;
        claude: string;
        grok: string;
    };
    systemPrompt?: string;
    savedPrompts?: SavedPrompt[];
}

interface SavedPrompt {
    id: string;
    name: string;
    content: string;
}

// Provider Info
const providers = [
    {
        id: "gemini" as AIProvider,
        name: "Google Gemini",
        description: "Gemini 2.5 Flash - 빠른 응답",
        color: "bg-blue-100 text-blue-700",
        envKey: "GOOGLE_GENERATIVE_AI_API_KEY"
    },
    {
        id: "claude" as AIProvider,
        name: "Anthropic Claude",
        description: "Claude 3.5 Sonnet - 높은 품질",
        color: "bg-orange-100 text-orange-700",
        envKey: "ANTHROPIC_API_KEY"
    },
    {
        id: "grok" as AIProvider,
        name: "xAI Grok",
        description: "Grok - 실시간 정보",
        color: "bg-gray-100 text-gray-700",
        envKey: "XAI_API_KEY"
    },
];

export default function AISettingsPage() {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState<AIProvider | null>(null);
    const [testResults, setTestResults] = useState<Record<AIProvider, boolean | null>>({
        gemini: null,
        claude: null,
        grok: null,
    });
    const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({
        gemini: false,
        claude: false,
        grok: false,
    });

    const [settings, setSettings] = useState<AISettings>({
        enabled: false,
        defaultProvider: "gemini",
        apiKeys: {
            gemini: "",
            claude: "",
            grok: "",
        },
        systemPrompt: "",
    });

    // Load settings on mount
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
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
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await fetch("/api/admin/ai-settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                showSuccess("AI 설정이 저장되었습니다.");
            } else {
                const data = await res.json();
                showError(data.error || "저장에 실패했습니다.");
            }
        } catch (error) {
            showError("저장 중 오류가 발생했습니다.");
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async (provider: AIProvider) => {
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
        } catch (error) {
            setTestResults(prev => ({ ...prev, [provider]: false }));
            showError("테스트 중 오류가 발생했습니다.");
        } finally {
            setTesting(null);
        }
    };

    const toggleShowKey = (provider: AIProvider) => {
        setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link
                            href="/admin/settings"
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-500" />
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <Sparkles className="w-7 h-7 text-purple-600" />
                            AI 기사 재가공 설정
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500 ml-12">
                        AI를 활용한 기사 자동 재가공 기능을 설정합니다.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                    {saving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    저장
                </button>
            </header>

            {/* Enable Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">AI 재가공 기능 활성화</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            활성화하면 지정된 수집처의 기사에 AI 재가공이 적용됩니다.
                        </p>
                    </div>
                    <button
                        onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                        className={`relative w-14 h-7 rounded-full transition-colors ${settings.enabled ? "bg-blue-600" : "bg-gray-300"
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.enabled ? "translate-x-7" : ""
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Default Provider Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">기본 AI 제공자 선택</h3>
                <div className="grid grid-cols-3 gap-4">
                    {providers.map(provider => (
                        <button
                            key={provider.id}
                            onClick={() => setSettings(prev => ({ ...prev, defaultProvider: provider.id }))}
                            className={`p-4 rounded-xl border-2 transition text-left ${settings.defaultProvider === provider.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${provider.color}`}>
                                {provider.name}
                            </div>
                            <p className="text-sm text-gray-600">{provider.description}</p>
                            {settings.defaultProvider === provider.id && (
                                <div className="mt-2 flex items-center gap-1 text-blue-600 text-xs font-medium">
                                    <CheckCircle className="w-3 h-3" />
                                    기본값
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* API Keys */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold text-gray-900">API 키 설정</h3>
                    <span className="text-xs text-gray-500">(전역 설정 - 기자 개인 키가 없을 때 사용)</span>
                </div>

                <div className="space-y-4">
                    {providers.map(provider => (
                        <div key={provider.id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">
                                    {provider.name}
                                </label>
                                <code className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                                    {provider.envKey}
                                </code>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type={showKeys[provider.id] ? "text" : "password"}
                                        value={settings.apiKeys[provider.id]}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            apiKeys: { ...prev.apiKeys, [provider.id]: e.target.value }
                                        }))}
                                        placeholder="API 키 입력..."
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleShowKey(provider.id)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showKeys[provider.id] ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleTest(provider.id)}
                                    disabled={testing === provider.id || !settings.apiKeys[provider.id]}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
                                >
                                    {testing === provider.id ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <TestTube className="w-4 h-4" />
                                    )}
                                    테스트
                                </button>
                                {testResults[provider.id] === true && (
                                    <div className="flex items-center text-green-600">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                )}
                                {testResults[provider.id] === false && (
                                    <div className="flex items-center text-red-600">
                                        <XCircle className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* System Prompt Management */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold text-gray-900">시스템 프롬프트</h3>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, systemPrompt: DEFAULT_SYSTEM_PROMPT }))}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            <RotateCcw className="w-4 h-4" />
                            기본값 사용
                        </button>
                    </div>
                </div>

                {/* Saved Prompts */}
                {settings.savedPrompts && settings.savedPrompts.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">저장된 프롬프트</p>
                        <div className="flex flex-wrap gap-2">
                            {settings.savedPrompts.map((p) => (
                                <div key={p.id} className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setSettings(prev => ({ ...prev, systemPrompt: p.content }))}
                                        className="text-sm text-purple-700 hover:text-purple-900"
                                    >
                                        {p.name}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirm(`"${p.name}" 프롬프트를 삭제하시겠습니까?`)) {
                                                setSettings(prev => ({
                                                    ...prev,
                                                    savedPrompts: prev.savedPrompts?.filter((sp: SavedPrompt) => sp.id !== p.id) || []
                                                }));
                                            }
                                        }}
                                        className="p-0.5 text-purple-400 hover:text-red-500"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Prompt Editor */}
                <textarea
                    value={settings.systemPrompt || ""}
                    onChange={(e) => setSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    rows={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm resize-none"
                    placeholder="프롬프트를 입력하세요..."
                />

                {/* Save as New Prompt */}
                <div className="flex items-center gap-2 mt-3">
                    <input
                        type="text"
                        id="newPromptName"
                        placeholder="새 프롬프트 이름"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            const nameInput = document.getElementById("newPromptName") as HTMLInputElement;
                            const name = nameInput?.value.trim();
                            if (!name) {
                                showError("프롬프트 이름을 입력하세요.");
                                return;
                            }
                            if (!settings.systemPrompt?.trim()) {
                                showError("프롬프트 내용을 입력하세요.");
                                return;
                            }
                            const newPrompt: SavedPrompt = {
                                id: Date.now().toString(),
                                name,
                                content: settings.systemPrompt || ""
                            };
                            setSettings(prev => ({
                                ...prev,
                                savedPrompts: [...(prev.savedPrompts || []), newPrompt]
                            }));
                            nameInput.value = "";
                            showSuccess(`"${name}" 프롬프트가 저장되었습니다.`);
                        }}
                        className="flex items-center gap-1 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                        <Plus className="w-4 h-4" />
                        저장
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    * 프롬프트가 비어있으면 기본 내장 프롬프트가 사용됩니다. 상단 "저장" 버튼으로 전체 설정을 저장하세요.
                </p>
            </div>

            {/* Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                    <h4 className="font-bold text-yellow-800">기자 개인 API 키</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                        기자가 개인 API 키를 설정하면 해당 기자의 기사는 개인 키로 처리됩니다.
                        개인 키가 없는 경우 위의 전역 설정이 사용됩니다.
                    </p>
                </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">API 키 발급 바로가기</h3>
                <div className="grid grid-cols-3 gap-4">
                    <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition text-center"
                    >
                        <p className="font-medium text-blue-800">Google AI Studio</p>
                        <p className="text-xs text-blue-600 mt-1">Gemini API Key</p>
                    </a>
                    <a
                        href="https://console.anthropic.com/settings/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition text-center"
                    >
                        <p className="font-medium text-orange-800">Anthropic Console</p>
                        <p className="text-xs text-orange-600 mt-1">Claude API Key</p>
                    </a>
                    <a
                        href="https://console.x.ai/"
                        target="_blank"
                        rel="noreferrer"
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-center"
                    >
                        <p className="font-medium text-gray-800">xAI Console</p>
                        <p className="text-xs text-gray-600 mt-1">Grok API Key</p>
                    </a>
                </div>
            </div>
        </div>
    );
}
