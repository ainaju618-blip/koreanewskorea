"use client";

import React, { useEffect, useState } from "react";
import { Users, Key, Eye, EyeOff, TestTube, Save, Loader2, CheckCircle, XCircle, ChevronDown, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface ApiKeys {
    gemini: string;
    claude: string;
    grok: string;
}

interface ReporterItem {
    id: string;
    name: string;
    position: string;
    region: string;
    hasGemini: boolean;
    hasClaude: boolean;
    hasGrok: boolean;
    apiKeys: ApiKeys;
}

type AIProvider = "gemini" | "claude" | "grok";

const POSITION_LABELS: Record<string, string> = {
    editor_in_chief: "주필",
    branch_manager: "지사장",
    editor_chief: "편집국장",
    news_chief: "취재부장",
    senior_reporter: "수석기자",
    reporter: "기자",
    intern_reporter: "수습기자",
    citizen_reporter: "시민기자",
};

export function ReporterKeyManager() {
    const { showSuccess, showError } = useToast();
    const [reporters, setReporters] = useState<ReporterItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedReporter, setSelectedReporter] = useState<ReporterItem | null>(null);

    // 편집용 상태
    const [editingKeys, setEditingKeys] = useState<ApiKeys>({ gemini: "", claude: "", grok: "" });
    const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({ gemini: false, claude: false, grok: false });
    const [testing, setTesting] = useState<AIProvider | null>(null);
    const [testResults, setTestResults] = useState<Record<AIProvider, boolean | null>>({ gemini: null, claude: null, grok: null });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchReporters();
    }, []);

    const fetchReporters = async () => {
        try {
            // 모든 기자 목록 가져오기 (키 유무 상관없이)
            const res = await fetch("/api/users/reporters?simple=false");
            if (res.ok) {
                const data = await res.json();
                const mapped = data.map((r: { id: string; name: string; position: string; region: string; ai_settings?: { api_keys?: ApiKeys } }) => ({
                    id: r.id,
                    name: r.name,
                    position: r.position || "reporter",
                    region: r.region || "전체",
                    hasGemini: !!r.ai_settings?.api_keys?.gemini,
                    hasClaude: !!r.ai_settings?.api_keys?.claude,
                    hasGrok: !!r.ai_settings?.api_keys?.grok,
                    apiKeys: r.ai_settings?.api_keys || { gemini: "", claude: "", grok: "" },
                }));
                setReporters(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch reporters:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectReporter = (reporter: ReporterItem) => {
        setSelectedReporter(reporter);
        setEditingKeys({ ...reporter.apiKeys });
        setTestResults({ gemini: null, claude: null, grok: null });
        setIsOpen(false);
    };

    const handleTest = async (provider: AIProvider) => {
        const apiKey = editingKeys[provider];
        if (!apiKey) {
            showError("API 키를 먼저 입력해주세요.");
            return;
        }

        setTesting(provider);
        setTestResults(prev => ({ ...prev, [provider]: null }));

        try {
            const res = await fetch("/api/ai/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider, apiKey }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setTestResults(prev => ({ ...prev, [provider]: true }));
                showSuccess(`${provider} 연결 성공!`);
            } else {
                setTestResults(prev => ({ ...prev, [provider]: false }));
                showError(data.error || "연결 실패");
            }
        } catch {
            setTestResults(prev => ({ ...prev, [provider]: false }));
            showError("테스트 중 오류 발생");
        } finally {
            setTesting(null);
        }
    };

    const handleSaveKeys = async () => {
        if (!selectedReporter) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/users/reporters/${selectedReporter.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: selectedReporter.name,
                    position: selectedReporter.position,
                    region: selectedReporter.region,
                    ai_api_keys: editingKeys,
                }),
            });

            if (res.ok) {
                showSuccess(`${selectedReporter.name} 기자의 API 키가 저장되었습니다.`);
                // 목록 새로고침
                await fetchReporters();
                // 선택된 기자 정보 업데이트
                setSelectedReporter(prev => prev ? { ...prev, apiKeys: editingKeys } : null);
            } else {
                const err = await res.json();
                showError(err.message || "저장 실패");
            }
        } catch {
            showError("저장 중 오류 발생");
        } finally {
            setSaving(false);
        }
    };

    const getPositionLabel = (position: string) => POSITION_LABELS[position] || position;

    const providers: { id: AIProvider; name: string; placeholder: string; link: string }[] = [
        { id: "gemini", name: "Gemini", placeholder: "AIzaSy...", link: "https://aistudio.google.com/apikey" },
        { id: "claude", name: "Claude", placeholder: "sk-ant-...", link: "https://console.anthropic.com/settings/keys" },
        { id: "grok", name: "Grok", placeholder: "xai-...", link: "https://console.x.ai/team/default/api-keys" },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* 기자 선택 드롭다운 */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">기자 선택</span>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-left hover:bg-gray-100 transition"
                    >
                        <span className="text-sm">
                            {selectedReporter ? (
                                <span className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{selectedReporter.name}</span>
                                    <span className="text-gray-500">
                                        ({getPositionLabel(selectedReporter.position)} | {selectedReporter.region})
                                    </span>
                                    {(selectedReporter.hasGemini || selectedReporter.hasClaude || selectedReporter.hasGrok) && (
                                        <span className="flex gap-1 ml-2">
                                            {selectedReporter.hasGemini && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">G</span>}
                                            {selectedReporter.hasClaude && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">C</span>}
                                            {selectedReporter.hasGrok && <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">X</span>}
                                        </span>
                                    )}
                                </span>
                            ) : (
                                <span className="text-gray-400">기자를 선택하세요...</span>
                            )}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isOpen && (
                        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {reporters.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500">등록된 기자가 없습니다.</div>
                            ) : (
                                reporters.map((r) => (
                                    <button
                                        key={r.id}
                                        onClick={() => handleSelectReporter(r)}
                                        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition text-left border-b border-gray-100 last:border-b-0 ${selectedReporter?.id === r.id ? "bg-blue-50" : ""
                                            }`}
                                    >
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{r.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {getPositionLabel(r.position)} | {r.region}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {r.hasGemini && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">G</span>}
                                            {r.hasClaude && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">C</span>}
                                            {r.hasGrok && <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">X</span>}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 선택된 기자의 API 키 입력 */}
            {selectedReporter && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-700">
                            {selectedReporter.name} 기자 API 키
                        </span>
                    </div>

                    <div className="space-y-3">
                        {providers.map((p) => (
                            <div key={p.id} className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500 w-14">{p.name}</span>
                                <div className="relative flex-1">
                                    <input
                                        type={showKeys[p.id] ? "text" : "password"}
                                        value={editingKeys[p.id]}
                                        onChange={(e) => {
                                            setEditingKeys(prev => ({ ...prev, [p.id]: e.target.value }));
                                            setTestResults(prev => ({ ...prev, [p.id]: null }));
                                        }}
                                        placeholder={p.placeholder}
                                        className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKeys(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showKeys[p.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* 외부 링크 */}
                                <a
                                    href={p.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 text-gray-400 hover:text-blue-600 transition"
                                    title="API 키 발급"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>

                                {/* 테스트 버튼 */}
                                <button
                                    onClick={() => handleTest(p.id)}
                                    disabled={testing === p.id || !editingKeys[p.id]}
                                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
                                    title="연결 테스트"
                                >
                                    {testing === p.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <TestTube className="w-4 h-4" />
                                    )}
                                </button>

                                {/* 결과 아이콘 */}
                                {testResults[p.id] === true && <CheckCircle className="w-4 h-4 text-green-600" />}
                                {testResults[p.id] === false && <XCircle className="w-4 h-4 text-red-600" />}
                            </div>
                        ))}
                    </div>

                    {/* 저장 버튼 */}
                    <button
                        onClick={handleSaveKeys}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saving ? "저장 중..." : "API 키 저장"}
                    </button>
                </div>
            )}

            {!selectedReporter && (
                <div className="text-center py-8 text-gray-400 text-sm">
                    위에서 기자를 선택하면 API 키를 설정할 수 있습니다.
                </div>
            )}
        </div>
    );
}
