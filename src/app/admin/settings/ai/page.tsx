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
    Check,
    Trash2,
    Plus,
    X,
    RotateCcw,
    Play,
    Loader2,
    ArrowRight,
    Copy,
    List,
    Settings,
    LayoutGrid
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/ai-prompts";

// AI Provider Types
type AIProvider = "gemini" | "claude" | "grok";

interface SavedPrompt {
    id: string;
    name: string;
    content: string;
}

interface SavedKeyProfile {
    id: string;
    name: string;
    apiKeys: {
        gemini: string;
        claude: string;
        grok: string;
    };
}

interface AISettings {
    enabled: boolean;
    defaultProvider: AIProvider;
    apiKeys: {
        gemini: string;
        claude: string;
        grok: string;
    };
    systemPrompt: string;
    savedPrompts: SavedPrompt[];
    savedKeyProfiles: SavedKeyProfile[];
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

    const [testInput, setTestInput] = useState("");
    const [testOutput, setTestOutput] = useState("");
    const [isRewriting, setIsRewriting] = useState(false);
    const [newPromptName, setNewPromptName] = useState("");
    const [newProfileName, setNewProfileName] = useState("");

    const [settings, setSettings] = useState<AISettings>({
        enabled: false,
        defaultProvider: "gemini",
        apiKeys: {
            gemini: "",
            claude: "",
            grok: "",
        },
        systemPrompt: "",
        savedPrompts: [],
        savedKeyProfiles: []
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

    const saveSettings = async (dataToSave: AISettings) => {
        try {
            setSaving(true);
            const res = await fetch("/api/admin/ai-settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSave),
            });

            if (res.ok) {
                // If saved successfully, show generic expectation unless suppressed (we handle toasts in caller mostly or here)
                // Actually easier to just show success here if it was a manual full save, but for auto-save we might want silent or specific toast.
                // For simplicity, we'll let the caller handle toasts or show a generic one if triggered by button.
                return true;
            } else {
                const data = await res.json();
                showError(data.error || "저장에 실패했습니다.");
                return false;
            }
        } catch (error) {
            showError("저장 중 오류가 발생했습니다.");
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        // 1. 기본 저장 (전역 설정)
        const success = await saveSettings(settings);
        if (success) {
            showSuccess("AI 설정이 저장되었습니다.");

            // 2. 키 프로필 저장 제안 (User Request)
            // 키가 하나라도 있고, 아직 저장된 프로필이 아니거나 변경된 경우 물어봄
            const hasKeys = Object.values(settings.apiKeys).some(k => k.length > 0);
            if (hasKeys) {
                // Confirm + Prompt 단계를 하나로 통합
                const name = prompt("현재 API 키 설정을 '불러오기' 목록에 저장하려면 이름을 입력하세요.\n(저장하지 않으려면 [취소]를 누르세요)\n\n예: 홍길동 기자용, 운영팀 공용");

                if (name && name.trim()) {
                    const newProfile: SavedKeyProfile = {
                        id: Date.now().toString(),
                        name,
                        apiKeys: { ...settings.apiKeys }
                    };
                    const newProfiles = [...(settings.savedKeyProfiles || []), newProfile];
                    const newSettings = { ...settings, savedKeyProfiles: newProfiles };

                    setSettings(newSettings);
                    await saveSettings(newSettings);
                    showSuccess(`'${name}' 프로필이 추가로 저장되었습니다.`);
                }
            }
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

    const handleSimulation = async () => {
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
            setIsRewriting(true);
            setTestOutput(""); // Clear previous output

            const res = await fetch("/api/ai/rewrite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: testInput,
                    provider: currentProvider,
                    apiKey: currentKey,
                    systemPrompt: settings.systemPrompt // Use currently edited prompt from state
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setTestOutput(data.rewritten);
                showSuccess("재가공 완료!");
            } else {
                showError(data.error || "재가공 실패");
            }
        } catch (error) {
            showError("오류가 발생했습니다.");
        } finally {
            setIsRewriting(false);
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
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-4 border-b border-gray-200 pb-4 mb-6">
                <h1 className="text-2xl font-bold">AI 설정</h1>
                <div className="flex-1" />
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <Link
                        href="/admin/sources"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md transition"
                    >
                        <List className="w-4 h-4" />
                        수집처 관리
                    </Link>
                    <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-blue-600 shadow-sm rounded-md">
                        <Settings className="w-4 h-4" />
                        AI 설정
                    </div>
                </div>
            </div>

            {/* Header Status */}
            <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
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
            </div>

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

            {/* Middle Save Button (User Request) */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                >
                    {saving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    설정 저장
                </button>
            </div>

            {/* API Keys */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-yellow-50 rounded-lg">
                            <span className="text-xl">🔑</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">API 키 설정</h2>
                            <p className="text-sm text-gray-500">전역 설정 - 기자 개인 키가 없을 때 사용</p>
                        </div>
                    </div>

                    {/* Key Profiles */}
                    <div className="flex items-center gap-2">
                        {/* Load Profile Dropdown */}
                        <div className="flex flex-wrap gap-2 mr-2">
                            {(!settings.savedKeyProfiles || settings.savedKeyProfiles.length === 0) ? (
                                <span className="px-3 py-1 text-xs bg-gray-100 text-gray-400 rounded-full border border-gray-200 cursor-not-allowed">
                                    저장된 프로필 없음 (비활성)
                                </span>
                            ) : (
                                settings.savedKeyProfiles.map(profile => (
                                    <div key={profile.id} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs border border-gray-200 hover:bg-gray-200 transition">
                                        <button
                                            onClick={() => {
                                                if (confirm(`'${profile.name}' 키 설정을 불러오시겠습니까? 현재 입력된 키가 덮어씌워집니다.`)) {
                                                    setSettings(prev => ({ ...prev, apiKeys: { ...profile.apiKeys } }));
                                                    showSuccess(`'${profile.name}' 키 설정을 불러왔습니다. (저장 버튼을 눌러 확정하세요)`);
                                                }
                                            }}
                                            className="hover:text-blue-600 mr-2 font-medium"
                                        >
                                            {profile.name}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(`'${profile.name}' 프로필을 삭제하시겠습니까?`)) {
                                                    const newProfiles = settings.savedKeyProfiles.filter(p => p.id !== profile.id);
                                                    const newSettings = { ...settings, savedKeyProfiles: newProfiles };
                                                    setSettings(newSettings);
                                                    saveSettings(newSettings).then(success => {
                                                        if (success) showSuccess("프로필이 삭제되었습니다.");
                                                    });
                                                }
                                            }}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Save Profile Input */}
                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                            <input
                                type="text"
                                value={newProfileName}
                                onChange={(e) => setNewProfileName(e.target.value)}
                                placeholder="예: 홍길동 기자용"
                                className="w-32 px-2 py-1 text-xs bg-transparent border-none focus:ring-0"
                            />
                            <button
                                onClick={() => {
                                    const name = newProfileName.trim();
                                    if (!name) return;

                                    const newProfile: SavedKeyProfile = {
                                        id: Date.now().toString(),
                                        name,
                                        apiKeys: { ...settings.apiKeys }
                                    };

                                    const newProfiles = [...(settings.savedKeyProfiles || []), newProfile];
                                    const newSettings = { ...settings, savedKeyProfiles: newProfiles };

                                    setSettings(newSettings);
                                    saveSettings(newSettings).then(success => {
                                        if (success) {
                                            showSuccess(`'${name}' 키 프로필이 저장되었습니다.`);
                                            setNewProfileName("");
                                        }
                                    });
                                }}
                                disabled={!newProfileName.trim()}
                                className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
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



            {/* System Prompt & Simulation Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Prompt Editor */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            <h3 className="font-semibold text-gray-900">시스템 프롬프트 에디터</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, systemPrompt: DEFAULT_SYSTEM_PROMPT }))}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            <RotateCcw className="w-3 h-3" />
                            초기화
                        </button>
                    </div>

                    {/* Saved Prompts Chips */}
                    {settings.savedPrompts && settings.savedPrompts.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                            {settings.savedPrompts.map((p) => (
                                <div key={p.id} className="flex items-center gap-1 px-2 py-1 bg-purple-50 border border-purple-200 rounded text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setSettings(prev => ({ ...prev, systemPrompt: p.content }))}
                                        className="text-purple-700 hover:text-purple-900 font-medium"
                                    >
                                        {p.name}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirm(`"${p.name}" 프롬프트를 삭제하시겠습니까?`)) {
                                                const newSavedPrompts = settings.savedPrompts?.filter((sp: SavedPrompt) => sp.id !== p.id) || [];
                                                const newSettings = { ...settings, savedPrompts: newSavedPrompts };
                                                setSettings(newSettings);
                                                saveSettings(newSettings).then((success) => {
                                                    if (success) showSuccess("프롬프트가 삭제되었습니다.");
                                                });
                                            }
                                        }}
                                        className="ml-1 text-purple-400 hover:text-red-500"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <textarea
                        value={settings.systemPrompt || ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
                        className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm resize-none mb-3 min-h-[400px]"
                        placeholder="프롬프트를 입력하세요..."
                    />

                    {/* Quick Save */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newPromptName}
                            onChange={(e) => setNewPromptName(e.target.value)}
                            placeholder="새 프롬프트 이름으로 저장"
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                            type="button"
                            disabled={!newPromptName.trim() || !settings.systemPrompt?.trim()}
                            onClick={() => {
                                const name = newPromptName.trim();
                                if (!name) return;

                                const newPrompt: SavedPrompt = {
                                    id: Date.now().toString(),
                                    name,
                                    content: settings.systemPrompt || ""
                                };

                                const newSavedPrompts = [...(settings.savedPrompts || []), newPrompt];
                                const newSettings = { ...settings, savedPrompts: newSavedPrompts };

                                setSettings(newSettings);
                                saveSettings(newSettings).then((success) => {
                                    if (success) {
                                        showSuccess(`"${name}" 프롬프트가 저장되었습니다.`);
                                        setNewPromptName("");
                                    }
                                });
                            }}
                            className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Right: Simulation Playground */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4">
                        <TestTube className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">실시간 AI 시뮬레이션</h3>
                    </div>

                    <div className="flex-1 flex flex-col gap-4">
                        <div className="flex-1 flex flex-col">
                            <label className="text-xs font-medium text-gray-500 mb-1">입력 (보도자료 원문)</label>
                            <textarea
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                                className="w-full flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none min-h-[150px]"
                                placeholder="테스트할 보도자료 내용을 여기에 붙여넣으세요..."
                            />
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={handleSimulation}
                                disabled={isRewriting || !testInput}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                            >
                                {isRewriting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        재가공 중...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 fill-current" />
                                        AI 재가공 실행
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-medium text-gray-500">결과 (AI 출력)</label>
                                {testOutput && (
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(testOutput);
                                            showSuccess("클립보드에 복사되었습니다.");
                                        }}
                                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition"
                                    >
                                        <Copy className="w-3 h-3" />
                                        복사하기
                                    </button>
                                )}
                            </div>
                            <textarea
                                value={testOutput}
                                onChange={(e) => setTestOutput(e.target.value)}
                                className="w-full flex-1 p-3 bg-white border border-gray-300 rounded-lg text-sm resize-none min-h-[200px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="실행 버튼을 누르면 여기에 결과가 표시됩니다. (왼쪽 에디터의 프롬프트가 즉시 적용됩니다)"
                            />
                        </div>
                    </div>
                </div>
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
        </div >
    );
}
