"use client";

import React, { useState, useEffect } from 'react';

interface Feed {
    key: string;
    name: string;
    category: string;
}

interface LogEntry {
    id: number;
    region: string;
    status: string;
    log_message: string;
    articles_count: number;
    created_at: string;
    ended_at: string | null;
}

// GROQ_API_KEY is now in .env.local (server-side only)

export default function AiNewsPage() {
    const [feeds, setFeeds] = useState<Feed[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [selectedFeed, setSelectedFeed] = useState('techcrunch');
    const [maxArticles, setMaxArticles] = useState(3);
    const [isRunning, setIsRunning] = useState(false);
    const [message, setMessage] = useState('');

    // 데이터 로드
    const loadData = async () => {
        try {
            const res = await fetch('/api/bot/ai-news');
            const data = await res.json();
            setFeeds(data.feeds || []);
            setLogs(data.logs || []);
        } catch (error) {
            console.error('데이터 로드 실패:', error);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000); // 5초마다 새로고침
        return () => clearInterval(interval);
    }, []);

    // 스크래핑 실행
    const handleRun = async () => {
        setIsRunning(true);
        setMessage('');

        try {
            const res = await fetch('/api/bot/ai-news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feed: selectedFeed,
                    maxArticles: maxArticles
                })
            });

            const data = await res.json();

            if (data.success) {
                setMessage(`✅ ${data.feed} 수집 시작됨 (Log ID: ${data.logId})`);
            } else {
                setMessage(`❌ 에러: ${data.error}`);
            }
        } catch (error) {
            setMessage(`❌ 요청 실패: ${error}`);
        }

        setIsRunning(false);
        loadData();
    };

    // 상태 배지 색상
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'bg-green-100 text-green-800';
            case 'failed': return 'bg-red-100 text-red-800';
            case 'running': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">🤖 AI 뉴스 스크래퍼</h1>

            {/* 실행 패널 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">수집 실행</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* 피드 선택 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            뉴스 소스
                        </label>
                        <select
                            value={selectedFeed}
                            onChange={(e) => setSelectedFeed(e.target.value)}
                            className="w-full border rounded-md px-3 py-2"
                        >
                            {feeds.map(feed => (
                                <option key={feed.key} value={feed.key}>
                                    {feed.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 기사 수 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            수집 기사 수
                        </label>
                        <input
                            type="number"
                            value={maxArticles}
                            onChange={(e) => setMaxArticles(parseInt(e.target.value) || 1)}
                            min={1}
                            max={10}
                            className="w-full border rounded-md px-3 py-2"
                        />
                    </div>

                    {/* 실행 버튼 */}
                    <div className="flex items-end">
                        <button
                            onClick={handleRun}
                            disabled={isRunning}
                            className={`w-full py-2 px-4 rounded-md text-white font-medium ${isRunning
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {isRunning ? '실행 중...' : '🚀 수집 시작'}
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`p-3 rounded-md ${message.includes('✅') ? 'bg-green-50' : 'bg-red-50'}`}>
                        {message}
                    </div>
                )}
            </div>

            {/* 최근 로그 */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">최근 실행 로그</h2>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">소스</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">기사수</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">메시지</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">시간</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        아직 실행 로그가 없습니다
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id}>
                                        <td className="px-4 py-3 text-sm">
                                            {log.region.replace('ai_news_', '')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(log.status)}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {log.articles_count || 0}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {log.log_message}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {new Date(log.created_at).toLocaleString('ko-KR')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 안내 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">ℹ️ 사용 안내</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• RSS 피드에서 해외 AI 뉴스를 수집합니다</li>
                    <li>• Groq API (llama-3.3-70b)를 사용하여 한국어로 번역합니다</li>
                    <li>• 수집된 기사는 자동으로 DB에 저장됩니다</li>
                </ul>
            </div>
        </div>
    );
}
