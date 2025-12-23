"use client";

import React, { useState } from "react";
import {
    Eye,
    EyeOff,
    Zap,
    RefreshCw,
    CheckCircle,
    XCircle,
    ExternalLink,
    PlayCircle
} from "lucide-react";
import {
    AIProvider,
    AISettings,
    providers
} from "../hooks/useAISettings";

interface APIKeyManagerProps {
    settings: AISettings;
    testing: AIProvider | null;
    testResults: Record<AIProvider, boolean | null>;
    defaultProvider: AIProvider;
    onUpdateApiKey: (provider: AIProvider, value: string) => void;
    onTest: (provider: AIProvider) => void;
    onSetDefaultProvider: (provider: AIProvider) => void;
    onTestAll?: () => void;
    testingAll?: boolean;
}

export function APIKeyManager({
    settings,
    testing,
    testResults,
    defaultProvider,
    onUpdateApiKey,
    onTest,
    onSetDefaultProvider,
    onTestAll,
    testingAll
}: APIKeyManagerProps) {
    const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({
        gemini: false,
        claude: false,
        grok: false
    });

    const toggleShowKey = (provider: AIProvider) => {
        setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
    };

    const providerLabels: Record<AIProvider, string> = {
        gemini: "Gemini",
        claude: "Claude",
        grok: "Grok"
    };

    // Count how many keys have been tested successfully
    const successCount = Object.values(testResults).filter(r => r === true).length;
    const totalWithKeys = providers.filter(p => settings.apiKeys[p.id]).length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-700">API 키</h3>
                    {successCount > 0 && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                            {successCount}/{totalWithKeys} 연결됨
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                        기본: <span className="font-medium text-blue-600">{providerLabels[defaultProvider]}</span>
                    </span>
                    {onTestAll && totalWithKeys > 0 && (
                        <button
                            onClick={onTestAll}
                            disabled={testingAll || testing !== null}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            title="모든 API 키 연결 테스트"
                        >
                            {testingAll ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                                <PlayCircle className="w-3 h-3" />
                            )}
                            전체 테스트
                        </button>
                    )}
                </div>
            </div>

            {/* API Key inputs with radio buttons */}
            <div className="space-y-3">
                {providers.map(provider => (
                    <div key={provider.id} className="flex items-center gap-2">
                        {/* Radio button for default provider */}
                        <input
                            type="radio"
                            name="defaultProvider"
                            id={`provider-${provider.id}`}
                            checked={defaultProvider === provider.id}
                            onChange={() => onSetDefaultProvider(provider.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            title="기본 제공자로 설정"
                        />
                        <label
                            htmlFor={`provider-${provider.id}`}
                            className={`text-xs font-medium w-14 cursor-pointer ${defaultProvider === provider.id ? 'text-blue-600' : 'text-gray-500'
                                }`}
                        >
                            {providerLabels[provider.id]}
                        </label>
                        <div className="relative flex-1">
                            <input
                                type={showKeys[provider.id] ? "text" : "password"}
                                value={settings.apiKeys[provider.id]}
                                onChange={(e) => onUpdateApiKey(provider.id, e.target.value)}
                                placeholder="API 키 입력..."
                                className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => toggleShowKey(provider.id)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showKeys[provider.id] ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>

                        {/* External link */}
                        <a
                            href={provider.link}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-600 transition"
                            title="API 키 발급"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>

                        {/* Test button with result indicator */}
                        <button
                            onClick={() => onTest(provider.id)}
                            disabled={testing === provider.id || !settings.apiKeys[provider.id]}
                            className={`inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg transition ${
                                testResults[provider.id] === true
                                    ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                    : testResults[provider.id] === false
                                        ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title="API 연결 테스트"
                        >
                            {testing === provider.id ? (
                                <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    테스트중
                                </>
                            ) : testResults[provider.id] === true ? (
                                <>
                                    <CheckCircle className="w-3 h-3" />
                                    연결됨
                                </>
                            ) : testResults[provider.id] === false ? (
                                <>
                                    <XCircle className="w-3 h-3" />
                                    실패
                                </>
                            ) : (
                                <>
                                    <Zap className="w-3 h-3" />
                                    테스트
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            <p className="text-xs text-gray-400">
                라디오 버튼으로 기본 AI 제공자를 선택하세요. 선택된 제공자가 기사 재가공에 사용됩니다.
            </p>
        </div>
    );
}
