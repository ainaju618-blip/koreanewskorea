"use client";

import { useState } from 'react';
import {
    Settings,
    Save,
    Key,
    Clock,
    Globe,
    Zap,
    AlertCircle
} from 'lucide-react';

export default function IdeaSettingsPage() {
    const [settings, setSettings] = useState({
        openaiApiKey: '',
        autoCollectEnabled: false,
        collectInterval: 60,
        maxArticlesPerSource: 10,
        autoProcessEnabled: false,
        defaultLanguage: 'ko',
        contentMinLength: 500,
        contentMaxLength: 2000
    });

    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        // 실제로는 API 호출
        console.log('Settings saved:', settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
                        <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
                        <p className="text-gray-500">AI 아이디어 시스템 설정을 관리합니다</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    저장
                </button>
            </div>

            {saved && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-2 text-emerald-700">
                    <AlertCircle className="w-5 h-5" />
                    설정이 저장되었습니다.
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* API 설정 */}
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Key className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">API 설정</h2>
                            <p className="text-sm text-gray-500">외부 서비스 연동 설정</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                OpenAI API Key
                            </label>
                            <input
                                type="password"
                                value={settings.openaiApiKey}
                                onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                placeholder="sk-..."
                            />
                            <p className="text-xs text-gray-500 mt-1">AI 기사 재구성에 사용됩니다</p>
                        </div>
                    </div>
                </div>

                {/* 수집 설정 */}
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">수집 설정</h2>
                            <p className="text-sm text-gray-500">자동 수집 및 처리 설정</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.autoCollectEnabled}
                                onChange={(e) => setSettings({ ...settings, autoCollectEnabled: e.target.checked })}
                                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                            />
                            <span className="text-sm text-gray-700">자동 수집 활성화</span>
                        </label>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                수집 간격 (분)
                            </label>
                            <input
                                type="number"
                                min="15"
                                max="1440"
                                value={settings.collectInterval}
                                onChange={(e) => setSettings({ ...settings, collectInterval: parseInt(e.target.value) })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                disabled={!settings.autoCollectEnabled}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                소스당 최대 수집 개수
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={settings.maxArticlesPerSource}
                                onChange={(e) => setSettings({ ...settings, maxArticlesPerSource: parseInt(e.target.value) })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* AI 처리 설정 */}
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">AI 처리 설정</h2>
                            <p className="text-sm text-gray-500">기사 재구성 설정</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.autoProcessEnabled}
                                onChange={(e) => setSettings({ ...settings, autoProcessEnabled: e.target.checked })}
                                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                            />
                            <span className="text-sm text-gray-700">수집 후 자동 처리</span>
                        </label>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                최소 콘텐츠 길이 (자)
                            </label>
                            <input
                                type="number"
                                min="100"
                                max="5000"
                                value={settings.contentMinLength}
                                onChange={(e) => setSettings({ ...settings, contentMinLength: parseInt(e.target.value) })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                최대 콘텐츠 길이 (자)
                            </label>
                            <input
                                type="number"
                                min="500"
                                max="10000"
                                value={settings.contentMaxLength}
                                onChange={(e) => setSettings({ ...settings, contentMaxLength: parseInt(e.target.value) })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* 출력 설정 */}
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Globe className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">출력 설정</h2>
                            <p className="text-sm text-gray-500">기사 출력 형식 설정</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                기본 출력 언어
                            </label>
                            <select
                                value={settings.defaultLanguage}
                                onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="ko">한국어</option>
                                <option value="en">영어</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* 안내 */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h3 className="font-bold text-amber-800 mb-2">💡 설정 안내</h3>
                <ul className="text-sm text-amber-700 space-y-1">
                    <li>• OpenAI API Key는 GPT-4o 모델을 사용하여 기사를 재구성합니다.</li>
                    <li>• 자동 수집을 활성화하면 설정된 간격으로 RSS/스크래핑을 실행합니다.</li>
                    <li>• 자동 처리를 활성화하면 수집 즉시 AI 재구성을 시작합니다.</li>
                    <li>• 현재는 메모리 저장 방식으로, 서버 재시작 시 설정이 초기화됩니다.</li>
                </ul>
            </div>
        </div>
    );
}
