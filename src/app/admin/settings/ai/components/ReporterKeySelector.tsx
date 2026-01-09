"use client";

import React, { useEffect, useState } from "react";
import { Users, ChevronDown, Check, Key, Loader2 } from "lucide-react";

interface ApiKeys {
    gemini: string;
    claude: string;
    grok: string;
}

interface ReporterKey {
    id: string;
    name: string;
    position: string;
    region: string;
    hasGemini: boolean;
    hasClaude: boolean;
    hasGrok: boolean;
    maskedKeys: {
        gemini: string | null;
        claude: string | null;
        grok: string | null;
    };
    apiKeys: ApiKeys;
}

interface ReporterKeySelectorProps {
    onApplyKeys: (keys: ApiKeys) => void;
}

const POSITION_LABELS: Record<string, string> = {
    national_chief_director: "전국총괄본부장",
    chief_director: "총괄본부장",
    editor_in_chief: "주필",
    branch_manager: "지사장",
    gwangju_branch_director: "광주지역본부장",
    editor_chief: "편집국장",
    news_chief: "취재부장",
    senior_reporter: "수석기자",
    reporter: "기자",
    intern_reporter: "수습기자",
    citizen_reporter: "시민기자",
    opinion_writer: "오피니언",
    advisor: "고문",
    consultant: "자문위원",
    ambassador: "홍보대사",
    seoul_correspondent: "서울특파원",
    foreign_correspondent: "해외특파원",
};

export default function ReporterKeySelector({ onApplyKeys }: ReporterKeySelectorProps) {
    const [reporters, setReporters] = useState<ReporterKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedReporter, setSelectedReporter] = useState<ReporterKey | null>(null);

    useEffect(() => {
        fetchReporters();
    }, []);

    const fetchReporters = async () => {
        try {
            const res = await fetch("/api/admin/reporters-keys");
            if (res.ok) {
                const data = await res.json();
                // 키가 하나라도 있는 기자만 필터링
                const withKeys = data.reporters.filter(
                    (r: ReporterKey) => r.hasGemini || r.hasClaude || r.hasGrok
                );
                setReporters(withKeys);
            }
        } catch (error) {
            console.error("Failed to fetch reporters:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (reporter: ReporterKey) => {
        setSelectedReporter(reporter);
        setIsOpen(false);
    };

    const handleApply = () => {
        if (selectedReporter) {
            onApplyKeys(selectedReporter.apiKeys);
        }
    };

    const getPositionLabel = (position: string) => POSITION_LABELS[position] || position;

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">기자 목록 로딩...</span>
            </div>
        );
    }

    if (reporters.length === 0) {
        return (
            <div className="text-sm text-gray-500 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                API 키가 등록된 기자가 없습니다.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-gray-300">기자 키 불러오기</span>
            </div>

            {/* Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-left hover:border-gray-600 transition"
                >
                    <span className="text-sm text-gray-300">
                        {selectedReporter ? (
                            <span className="flex items-center gap-2">
                                <span className="font-medium">{selectedReporter.name}</span>
                                <span className="text-gray-500">
                                    ({getPositionLabel(selectedReporter.position)})
                                </span>
                            </span>
                        ) : (
                            "기자 선택..."
                        )}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {reporters.map((reporter) => (
                            <button
                                key={reporter.id}
                                onClick={() => handleSelect(reporter)}
                                className={`w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-700/50 transition text-left ${selectedReporter?.id === reporter.id ? "bg-purple-900/30" : ""
                                    }`}
                            >
                                <div>
                                    <div className="text-sm font-medium text-gray-200">{reporter.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {getPositionLabel(reporter.position)} | {reporter.region}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {reporter.hasGemini && (
                                        <span className="px-1.5 py-0.5 bg-blue-900/50 text-blue-400 text-xs rounded">G</span>
                                    )}
                                    {reporter.hasClaude && (
                                        <span className="px-1.5 py-0.5 bg-orange-900/50 text-orange-400 text-xs rounded">C</span>
                                    )}
                                    {reporter.hasGrok && (
                                        <span className="px-1.5 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">X</span>
                                    )}
                                    {selectedReporter?.id === reporter.id && (
                                        <Check className="w-4 h-4 text-purple-400 ml-2" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected reporter's keys preview */}
            {selectedReporter && (
                <div className="space-y-2">
                    <div className="text-xs text-gray-500">보유 키:</div>
                    <div className="flex flex-wrap gap-2">
                        {selectedReporter.maskedKeys.gemini && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-900/30 border border-blue-800/50 rounded text-xs">
                                <Key className="w-3 h-3 text-blue-400" />
                                <span className="text-blue-300">Gemini: {selectedReporter.maskedKeys.gemini}</span>
                            </div>
                        )}
                        {selectedReporter.maskedKeys.claude && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-900/30 border border-orange-800/50 rounded text-xs">
                                <Key className="w-3 h-3 text-orange-400" />
                                <span className="text-orange-300">Claude: {selectedReporter.maskedKeys.claude}</span>
                            </div>
                        )}
                        {selectedReporter.maskedKeys.grok && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs">
                                <Key className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-300">Grok: {selectedReporter.maskedKeys.grok}</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleApply}
                        className="w-full mt-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
                    >
                        <Key className="w-4 h-4" />
                        이 키 적용하기
                    </button>
                </div>
            )}
        </div>
    );
}
